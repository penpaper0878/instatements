/* =============================================================================
   share.js — getting a piece of writing out of the site: as a picture, a PDF,
   plain text, or a link.

   Two deliberate choices worth knowing about:

   * The image is drawn on a <canvas> by hand rather than with a screenshot
     library. That keeps the site dependency-free and, more importantly, lets
     the browser's own text engine shape Gujarati and Devanagari — matras,
     conjuncts and all.

   * "Save as PDF" goes through the browser's print dialog instead of a
     JavaScript PDF library. Those libraries need an embedded font with full
     Indic shaping tables to render કવિતા or कविता correctly, and mostly get it
     wrong. Print-to-PDF uses the same renderer as the screen, so it is always
     right — and it is free.
   ========================================================================== */
(function (global) {
  'use strict';

  var el = UI.el, icon = UI.icon, t = function () { return I18n.t.apply(I18n, arguments); };

  var SIZES = [
    { id: 'square',   label: 'Square',    w: 1080, h: 1080, note: 'Instagram post' },
    { id: 'portrait', label: 'Portrait',  w: 1080, h: 1350, note: 'Instagram / Facebook' },
    { id: 'story',    label: 'Story',     w: 1080, h: 1920, note: 'Status / Reels' },
    { id: 'wide',     label: 'Wide',      w: 1600, h: 900,  note: 'Twitter / X' }
  ];

  function data() { return Store.state.data; }

  /* ------------------------------------------------------------- plain text */

  function asText(entry, opts) {
    opts = opts || {};
    var out = [];
    if (entry.title) out.push(entry.title, '');
    out.push(String(entry.body || '').trim());
    if (entry.credit) out.push('', entry.credit);

    if (opts.signature !== false) {
      var s = data().site;
      var who = s.author || s.name;
      if (who) out.push('', '— ' + who);
      if (opts.link !== false) out.push(entryUrl(entry));
    }
    return out.join('\n');
  }

  function entryUrl(entry) {
    var base = global.location.origin + global.location.pathname;
    return base + '#/e/' + entry.id;
  }

  function safeFilename(entry) {
    var name = (entry.title || Views.typeLabel(entry.type) || 'writing')
      .replace(/[\\/:*?"<>|]+/g, '')
      .replace(/\s+/g, '-')
      .slice(0, 60);
    return (name || 'writing') + '-' + entry.date;
  }

  /* ------------------------------------------------------------ canvas image */

  /* Split text into lines that fit `maxWidth`, honouring the author's own line
     breaks first — in a poem those breaks are the poem. */
  function layoutLines(ctx, text, maxWidth) {
    var lines = [];
    String(text).split('\n').forEach(function (paragraph) {
      if (!paragraph.trim()) { lines.push(''); return; }
      var words = paragraph.split(/(\s+)/);
      var line = '';
      words.forEach(function (chunk) {
        var next = line + chunk;
        if (ctx.measureText(next).width <= maxWidth || !line.trim()) {
          line = next;
        } else {
          lines.push(line.replace(/\s+$/, ''));
          line = chunk.replace(/^\s+/, '');
        }
      });
      lines.push(line.replace(/\s+$/, ''));
    });
    return lines;
  }

  /* Ask the browser to have the webfont ready before we measure anything.
     Measuring against a fallback and then drawing with the real face is what
     makes hand-rolled canvas text overflow. */
  function waitForFont(family, weights) {
    if (!document.fonts || !document.fonts.load) return Promise.resolve();
    var jobs = (weights || [400, 600]).map(function (w) {
      return document.fonts.load(w + ' 64px ' + family, 'કવિતા कविता Writing');
    });
    return Promise.all(jobs).catch(function () { /* fallback face is fine */ });
  }

  function loadImage(src) {
    return new Promise(function (resolve, reject) {
      var img = new Image();
      // Only needed for remote images; data: URLs are same-origin already.
      if (!/^data:/i.test(src)) img.crossOrigin = 'anonymous';
      img.onload = function () { resolve(img); };
      img.onerror = function () { reject(new Error('image-load-failed')); };
      img.src = src;
    });
  }

  /* Cover-fit an image into the canvas, like CSS background-size: cover. */
  function drawCover(ctx, img, w, h) {
    var scale = Math.max(w / img.width, h / img.height);
    var dw = img.width * scale, dh = img.height * scale;
    ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
  }

  function resolveImageStyle(entry) {
    var st = entry.style || {};
    var theme = data().theme;
    var mode = Theme.resolveMode(theme);
    var preset = Theme.PRESET_BY_ID[theme.preset] || Theme.PRESET_BY_ID.ink;
    var palette = preset[mode];

    var custom = Theme.backgroundCSS(st);
    if (custom) {
      return {
        kind: st.bgType,
        color: st.bgColor,
        from: st.gradFrom, to: st.gradTo, angle: Number(st.gradAngle) || 160,
        image: UI.safeUrl(st.bgImage), dim: Number(st.bgDim) || 0.35,
        fg: st.textColor || (custom.dark ? '#FFFFFF' : '#14110D'),
        accent: theme.accent || palette.accent
      };
    }
    // No per-entry background: use the theme's own colours.
    return {
      kind: 'gradient',
      from: palette.surface,
      to: palette.bg,
      angle: 160,
      fg: st.textColor || palette.text,
      accent: theme.accent || palette.accent
    };
  }

  function renderImage(entry, sizeId) {
    var size = SIZES.filter(function (s) { return s.id === sizeId; })[0] || SIZES[1];
    var W = size.w, H = size.h;
    var st = entry.style || {};
    var look = resolveImageStyle(entry);

    var familyName = st.font || (
      entry.lang === 'gu' ? data().theme.fontGu :
      entry.lang === 'hi' ? data().theme.fontHi : data().theme.fontEn
    );
    var family = '"' + familyName + '"';
    if (familyName) Theme.ensureFont(familyName);

    var canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    var ctx = canvas.getContext('2d');

    var bgReady = (look.kind === 'image' && look.image)
      ? loadImage(look.image).then(function (img) {
          drawCover(ctx, img, W, H);
          ctx.fillStyle = 'rgba(0,0,0,' + look.dim + ')';
          ctx.fillRect(0, 0, W, H);
        }).catch(function () {
          ctx.fillStyle = '#1A1A1A';
          ctx.fillRect(0, 0, W, H);
        })
      : Promise.resolve().then(function () {
          if (look.kind === 'solid') {
            ctx.fillStyle = look.color || '#111111';
          } else {
            // Approximate the CSS gradient angle across the canvas diagonal.
            var rad = (Number(look.angle) - 90) * Math.PI / 180;
            var cx = W / 2, cy = H / 2;
            var len = Math.abs(W * Math.cos(rad)) + Math.abs(H * Math.sin(rad));
            var g = ctx.createLinearGradient(
              cx - Math.cos(rad) * len / 2, cy - Math.sin(rad) * len / 2,
              cx + Math.cos(rad) * len / 2, cy + Math.sin(rad) * len / 2
            );
            g.addColorStop(0, look.from || '#222222');
            g.addColorStop(1, look.to || '#000000');
            ctx.fillStyle = g;
          }
          ctx.fillRect(0, 0, W, H);
        });

    return bgReady
      .then(function () { return waitForFont(family, [400, 600, 700]); })
      .then(function () {
        var pad = Math.round(W * 0.105);
        var maxW = W - pad * 2;
        var align = st.align === 'center' ? 'center' : st.align === 'right' ? 'right' : 'left';
        var anchorX = align === 'center' ? W / 2 : align === 'right' ? W - pad : pad;

        ctx.textAlign = align;
        ctx.textBaseline = 'alphabetic';

        var sigSize = Math.round(W * 0.028);
        var footerRoom = sigSize * 3.2;

        /* Shrink the body until the whole piece fits on the canvas. Poems vary
           enormously in length and a fixed size would either clip a long one or
           strand a short one in the corner. The author's own size setting sets
           the starting point; the loop below brings it back down if it has to. */
        var bodySize = Math.round(W * 0.052 * Math.max(0.6, Math.min(2, Number(st.size) || 1)));
        var minSize = Math.round(W * 0.019);
        var lineRatio = Number(st.lineHeight) || (entry.lang === 'en' ? 1.6 : 1.85);
        var titleSize, titleLines, bodyLines, total, lineH, titleH;

        while (bodySize > minSize) {
          titleSize = Math.round(bodySize * 1.22);
          lineH = Math.round(bodySize * lineRatio);
          titleH = Math.round(titleSize * 1.28);

          ctx.font = '600 ' + titleSize + 'px ' + family;
          titleLines = entry.title ? layoutLines(ctx, entry.title, maxW) : [];

          ctx.font = '400 ' + bodySize + 'px ' + family;
          bodyLines = layoutLines(ctx, String(entry.body || '').trim(), maxW);

          total = titleLines.length * titleH +
                  (titleLines.length ? Math.round(bodySize * 0.9) : 0) +
                  bodyLines.length * lineH;

          if (total <= H - pad * 2 - footerRoom) break;
          bodySize -= 2;
        }

        /* Centre the block in the space above the signature. `total` measures
           baseline to baseline, so the first baseline has to drop by roughly
           one ascender or the text reads as sitting too high. */
        var regionTop = pad;
        var regionBottom = H - footerRoom;
        var firstAscent = titleLines.length ? titleSize : bodySize;
        var y = (regionTop + regionBottom) / 2 - total / 2 + firstAscent * 0.78;
        y = Math.max(regionTop + firstAscent, y);

        if (st.textShadow) {
          ctx.shadowColor = 'rgba(0,0,0,.5)';
          ctx.shadowBlur = Math.round(W * 0.02);
          ctx.shadowOffsetY = Math.round(W * 0.004);
        }

        ctx.fillStyle = look.fg;
        if (titleLines.length) {
          ctx.font = '600 ' + titleSize + 'px ' + family;
          titleLines.forEach(function (line) {
            ctx.fillText(line, anchorX, y);
            y += titleH;
          });
          y += Math.round(bodySize * 0.9);
        }

        ctx.font = '400 ' + bodySize + 'px ' + family;
        bodyLines.forEach(function (line) {
          ctx.fillText(line, anchorX, y);
          y += lineH;
        });

        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetY = 0;

        /* Signature block: a short accent rule and the author's name. */
        var site = data().site;
        var who = site.author || site.name || '';
        if (who) {
          var sigY = H - pad + Math.round(sigSize * 0.2);
          ctx.globalAlpha = 0.85;

          var ruleW = Math.round(W * 0.07);
          var ruleY = sigY - Math.round(sigSize * 1.5);
          var ruleX = align === 'center' ? W / 2 - ruleW / 2
                    : align === 'right' ? W - pad - ruleW
                    : pad;
          ctx.fillStyle = look.accent;
          ctx.fillRect(ruleX, ruleY, ruleW, Math.max(2, Math.round(W * 0.0028)));

          ctx.fillStyle = look.fg;
          ctx.font = '600 ' + sigSize + 'px "Inter", system-ui, sans-serif';
          ctx.fillText(who, anchorX, sigY);
          ctx.globalAlpha = 1;
        }

        return canvas;
      });
  }

  function canvasToBlob(canvas) {
    return new Promise(function (resolve, reject) {
      if (canvas.toBlob) {
        canvas.toBlob(function (blob) {
          blob ? resolve(blob) : reject(new Error('blob-failed'));
        }, 'image/png');
      } else {
        try {
          var parts = canvas.toDataURL('image/png').split(',');
          var bin = atob(parts[1]);
          var arr = new Uint8Array(bin.length);
          for (var i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
          resolve(new Blob([arr], { type: 'image/png' }));
        } catch (err) { reject(err); }
      }
    });
  }

  /* --------------------------------------------------------- image preview  */

  function openImageMaker(entry) {
    var chosen = 'portrait';
    var currentBlob = null;

    var preview = el('div', {
      style: {
        display: 'grid', placeItems: 'center', minHeight: '260px',
        background: 'var(--surface-2)', borderRadius: 'var(--radius-sm)',
        padding: '16px', marginBottom: '16px', overflow: 'hidden'
      }
    }, el('div', { class: 'empty-hint', text: t('state.loading') }));

    var downloadBtn = el('button', { class: 'btn btn-primary', disabled: true },
      [icon('download'), el('span', { text: t('action.download') })]);
    var shareBtn = null;

    function refresh() {
      UI.clear(preview);
      preview.appendChild(el('div', { class: 'empty-hint', text: t('state.loading') }));
      downloadBtn.disabled = true;
      if (shareBtn) shareBtn.disabled = true;

      renderImage(entry, chosen).then(function (canvas) {
        return canvasToBlob(canvas).then(function (blob) {
          currentBlob = blob;
          var url = URL.createObjectURL(blob);
          UI.clear(preview);
          preview.appendChild(el('img', {
            src: url,
            alt: '',
            style: {
              maxWidth: '100%', maxHeight: '340px', width: 'auto',
              borderRadius: '10px', boxShadow: 'var(--shadow-2)'
            },
            onload: function () { setTimeout(function () { URL.revokeObjectURL(url); }, 1000); }
          }));
          downloadBtn.disabled = false;
          if (shareBtn) shareBtn.disabled = false;
        });
      }).catch(function (err) {
        UI.clear(preview);
        preview.appendChild(el('div', { class: 'empty-hint', text: 'Could not draw the image.' }));
        console.error('[share] image', err);
      });
    }

    var sizeGrid = UI.optGrid(SIZES.map(function (s) {
      return {
        id: s.id,
        label: s.label,
        swatchHtml: '<div class="opt-swatch" style="height:34px;display:grid;place-items:center;' +
          'font-size:10px;color:var(--text-faint)">' + s.w + '×' + s.h + '</div>'
      };
    }), chosen, function (id) {
      chosen = id;
      var host = body.querySelector('.opt-grid');
      UI.$$('.opt', host).forEach(function (n, i) {
        n.classList.toggle('is-active', SIZES[i].id === id);
      });
      refresh();
    });

    downloadBtn.addEventListener('click', function () {
      if (!currentBlob) return;
      UI.downloadBlob(currentBlob, safeFilename(entry) + '.png');
      UI.toast(t('toast.exported'), 'ok');
    });

    var foot = [downloadBtn];
    if (global.navigator.canShare) {
      shareBtn = el('button', { class: 'btn', disabled: true, onclick: function () {
        if (!currentBlob) return;
        var file = new File([currentBlob], safeFilename(entry) + '.png', { type: 'image/png' });
        if (!global.navigator.canShare({ files: [file] })) {
          UI.toast('This browser cannot share images directly.', 'error');
          return;
        }
        global.navigator.share({ files: [file], title: entry.title || '' })
          .catch(function (err) {
            if (err && err.name !== 'AbortError') UI.toast('Sharing was cancelled.', 'error');
          });
      } }, [icon('share'), el('span', { text: t('share.native') })]);
      foot.unshift(shareBtn);
    }

    var body = el('div', {}, [
      preview,
      el('div', { class: 'field-label', text: 'Size' }),
      sizeGrid,
      el('div', { class: 'share-hint', text: t('share.imageHint') })
    ]);

    UI.openSheet({ title: t('share.image'), body: body, foot: foot, variant: 'center' });
    refresh();
  }

  /* ------------------------------------------------------------------ print */

  /* Builds a clean, print-only copy of the entry outside the app shell, so the
     output never depends on what happens to be open on screen. */
  function printEntry(entry) {
    var host = document.getElementById('print-root');
    if (!host) {
      host = el('div', { id: 'print-root' });
      document.body.appendChild(host);
    }
    UI.clear(host);

    var st = entry.style || {};
    var s = Views.styleFor(entry);
    var site = data().site;

    var article = el('article', { class: 'reader', lang: entry.lang });
    var inner = el('div', { class: 'reader-inner' });

    inner.appendChild(el('div', { class: 'reader-kind', text: Views.typeLabel(entry.type) }));
    if (entry.title) inner.appendChild(el('h1', { class: 'reader-title', text: entry.title }));
    inner.appendChild(el('div', { class: 'reader-meta' }, [
      el('span', { text: I18n.formatDate(entry.date) }),
      site.author ? el('span', { class: 'card-dot' }) : null,
      site.author ? el('span', { text: site.author }) : null
    ]));

    var body = el('div', {
      class: 'reader-body' + (st.frame && st.frame !== 'none' ? ' frame-' + st.frame : ''),
      text: entry.body
    });
    // Keep the chosen typeface and alignment; drop colours and backgrounds,
    // which only waste ink and hurt legibility on paper.
    body.style.fontFamily = s.css.fontFamily;
    if (st.align && st.align !== 'left') body.style.textAlign = st.align;
    inner.appendChild(body);

    if (entry.credit) inner.appendChild(el('div', { class: 'reader-credit', text: entry.credit }));
    article.appendChild(inner);
    host.appendChild(article);

    document.body.classList.add('is-printing');

    var cleanup = function () {
      document.body.classList.remove('is-printing');
      UI.clear(host);
      global.removeEventListener('afterprint', cleanup);
    };
    global.addEventListener('afterprint', cleanup);

    // Give the layout a frame to settle, and the webfont a moment to arrive.
    var family = '"' + (st.font || (
      entry.lang === 'gu' ? data().theme.fontGu :
      entry.lang === 'hi' ? data().theme.fontHi : data().theme.fontEn)) + '"';

    waitForFont(family, [400, 600]).then(function () {
      setTimeout(function () {
        global.print();
        // Safari on iOS never fires afterprint; clean up regardless.
        setTimeout(function () {
          if (document.body.classList.contains('is-printing')) cleanup();
        }, 1500);
      }, 120);
    });
  }

  /* ------------------------------------------------------------ share sheet */

  function openShareSheet(entry) {
    var url = entryUrl(entry);

    function opt(iconName, label, onClick) {
      return el('button', { class: 'share-opt', type: 'button', onclick: onClick },
        [icon(iconName), el('span', { text: label })]);
    }

    var options = [
      opt('image', t('share.image'), function () { openImageMaker(entry); }),
      opt('printer', t('share.pdf'), function () { UI.closeSheet(); printEntry(entry); }),
      opt('copy', t('share.text'), function () {
        UI.copyText(asText(entry))
          .then(function () { UI.toast(t('action.copied'), 'ok'); UI.closeSheet(); })
          .catch(function () { UI.toast('Could not copy.', 'error'); });
      }),
      opt('fileText', t('share.txtFile'), function () {
        UI.downloadBlob(
          new Blob([asText(entry)], { type: 'text/plain;charset=utf-8' }),
          safeFilename(entry) + '.txt'
        );
        UI.toast(t('toast.exported'), 'ok');
        UI.closeSheet();
      }),
      opt('link', t('share.link'), function () {
        UI.copyText(url)
          .then(function () { UI.toast(t('action.copied'), 'ok'); UI.closeSheet(); })
          .catch(function () { UI.toast('Could not copy.', 'error'); });
      }),
      opt('whatsapp', t('share.whatsapp'), function () {
        var text = asText(entry, { link: false }) + '\n\n' + url;
        global.open('https://wa.me/?text=' + encodeURIComponent(text), '_blank', 'noopener');
        UI.closeSheet();
      })
    ];

    if (global.navigator.share) {
      options.push(opt('share', t('share.native'), function () {
        global.navigator.share({
          title: entry.title || Views.typeLabel(entry.type),
          text: asText(entry, { signature: false, link: false }),
          url: url
        }).then(function () { UI.closeSheet(); })
          .catch(function (err) { if (err && err.name !== 'AbortError') console.warn(err); });
      }));
    }

    UI.openSheet({
      title: t('share.title'),
      variant: 'center',
      body: el('div', {}, [el('div', { class: 'share-grid' }, options)])
    });
  }

  /* ------------------------------------------------------- whole-site export */

  function exportAll() {
    var payload = Store.exportData();
    // The passphrase hash and the publish target are this device's business,
    // not something to scatter through backup files.
    delete payload.admin;
    var stamp = new Date().toISOString().slice(0, 10);
    UI.downloadBlob(
      new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }),
      'writings-backup-' + stamp + '.json'
    );
    UI.toast(t('toast.exported'), 'ok');
  }

  function exportAllText() {
    var list = Store.select({});
    var out = list.map(function (entry) {
      return [
        '── ' + (entry.title || Views.typeLabel(entry.type)) + ' ──',
        Views.typeLabel(entry.type) + ' · ' + entry.lang.toUpperCase() + ' · ' + entry.date,
        '',
        String(entry.body || '').trim(),
        entry.credit ? '\n' + entry.credit : ''
      ].join('\n');
    }).join('\n\n\n');

    var stamp = new Date().toISOString().slice(0, 10);
    UI.downloadBlob(
      new Blob([out], { type: 'text/plain;charset=utf-8' }),
      'writings-' + stamp + '.txt'
    );
    UI.toast(t('toast.exported'), 'ok');
  }

  function importFile() {
    UI.pickFile('application/json,.json', function (text) {
      var parsed;
      try {
        parsed = JSON.parse(text);
      } catch (err) {
        UI.toast('That file is not valid JSON.', 'error');
        return;
      }
      if (!parsed || typeof parsed !== 'object') {
        UI.toast('That file does not look like a backup.', 'error');
        return;
      }
      var incoming = Array.isArray(parsed.entries) ? parsed.entries.length : 0;

      UI.openSheet({
        title: 'Import ' + incoming + ' ' + (incoming === 1 ? 'piece' : 'pieces'),
        variant: 'center',
        body: el('p', {
          style: { fontSize: '14.5px', lineHeight: '1.7', color: 'var(--text-dim)' },
          text: 'Add these to what is already here, or replace everything with this file?'
        }),
        foot: [
          el('button', {
            class: 'btn',
            text: 'Replace all',
            onclick: function () {
              Store.importData(parsed, 'replace');
              UI.closeSheet();
              UI.toast(t('toast.imported'), 'ok');
              App.rerender();
            }
          }),
          el('button', {
            class: 'btn btn-primary',
            text: 'Add to existing',
            onclick: function () {
              Store.importData(parsed, 'merge');
              UI.closeSheet();
              UI.toast(t('toast.imported'), 'ok');
              App.rerender();
            }
          })
        ]
      });
    });
  }

  /* Bring in a folder of .txt files as separate pieces — the usual way years of
     writing already exist on someone's laptop. */
  function importTextFiles(onDone) {
    var input = el('input', {
      type: 'file', accept: '.txt,text/plain', multiple: true, style: { display: 'none' }
    });
    document.body.appendChild(input);
    input.addEventListener('change', function () {
      var files = Array.prototype.slice.call(input.files || []);
      document.body.removeChild(input);
      if (!files.length) return;

      Promise.all(files.map(function (file) {
        return new Promise(function (resolve) {
          var reader = new FileReader();
          reader.onload = function () {
            var raw = String(reader.result || '').replace(/\r\n/g, '\n');
            var title = file.name.replace(/\.txt$/i, '').replace(/[-_]+/g, ' ').trim();
            resolve({ title: title, body: raw.trim(), lang: detectLang(raw) });
          };
          reader.onerror = function () { resolve(null); };
          reader.readAsText(file);
        });
      })).then(function (results) {
        var added = 0;
        results.filter(Boolean).forEach(function (r) {
          if (!r.body) return;
          Store.addEntry({
            title: r.title, body: r.body, lang: r.lang,
            type: r.body.split('\n').length > 14 ? 'blog' : 'poem',
            draft: true
          });
          added++;
        });
        UI.toast(added + ' imported as drafts', 'ok');
        if (onDone) onDone();
      });
    });
    input.click();
  }

  /* Unicode blocks are unambiguous here: Gujarati is U+0A80–0AFF, Devanagari
     U+0900–097F. Whichever script dominates wins. */
  function detectLang(text) {
    var gu = (text.match(/[઀-૿]/g) || []).length;
    var hi = (text.match(/[ऀ-ॿ]/g) || []).length;
    if (gu > hi && gu > 3) return 'gu';
    if (hi > gu && hi > 3) return 'hi';
    return 'en';
  }

  global.Share = {
    SIZES: SIZES,
    asText: asText,
    entryUrl: entryUrl,
    renderImage: renderImage,
    openImageMaker: openImageMaker,
    openShareSheet: openShareSheet,
    printEntry: printEntry,
    exportAll: exportAll,
    exportAllText: exportAllText,
    importFile: importFile,
    importTextFiles: importTextFiles,
    detectLang: detectLang
  };
})(window);
