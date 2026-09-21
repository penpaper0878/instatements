/* =============================================================================
   feedback.js — where readers write back.

   A static site has nowhere to receive a message, so there are two routes and
   the form uses whichever is configured:

     1. A form endpoint (Web3Forms, Formspree, Getform, a Google Apps Script).
        The message is POSTed and lands in your inbox. Their free tiers are
        generous, and if one ever disappears you change one field.

     2. No endpoint: the Send button opens the reader's own email app with the
        whole message already written. Nothing to sign up for, nothing to pay,
        and it cannot break.
   ========================================================================== */
(function (global) {
  'use strict';

  var el = UI.el, icon = UI.icon, t = function () { return I18n.t.apply(I18n, arguments); };

  function data() { return Store.state.data; }

  function targetEmail() {
    var f = data().feedback;
    return (f.email || data().site.email || '').trim();
  }

  /* Feedback is only offered when a message has somewhere to go. Linking to a
     form that cannot send anything wastes a reader's goodwill, so the link is
     hidden from visitors until either a form endpoint or an email is set. The
     admin still sees it, with a prompt to finish setting it up. */
  function isReachable() {
    var f = data().feedback;
    return !!(f.enabled && (String(f.endpoint || '').trim() || targetEmail()));
  }

  function isOffered() {
    return isReachable() || (data().feedback.enabled && Store.state.isAdmin);
  }

  function composeBody(fields) {
    var lines = [];
    if (fields.about) lines.push('About: ' + fields.about);
    if (fields.name) lines.push('From: ' + fields.name);
    if (fields.email) lines.push('Reply to: ' + fields.email);
    if (lines.length) lines.push('');
    lines.push(fields.message);
    lines.push('');
    lines.push('— sent from ' + Views.siteName());
    return lines.join('\n');
  }

  function mailtoUrl(fields) {
    var subject = 'Feedback on ' + Views.siteName() +
      (fields.about ? ' — ' + fields.about : '');
    return 'mailto:' + encodeURIComponent(targetEmail()) +
      '?subject=' + encodeURIComponent(subject) +
      '&body=' + encodeURIComponent(composeBody(fields));
  }

  function postToEndpoint(fields) {
    var f = data().feedback;
    var payload = {
      name: fields.name || 'Anonymous',
      email: fields.email || '',
      subject: 'Feedback on ' + Views.siteName() + (fields.about ? ' — ' + fields.about : ''),
      message: composeBody(fields),
      about: fields.about || '',
      site: Views.siteName(),
      page: global.location.href
    };
    // Web3Forms identifies the destination by this key; the other services
    // encode it in the URL and simply ignore an extra field.
    if (f.endpointKey) payload.access_key = f.endpointKey.trim();

    return fetch(f.endpoint.trim(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(payload)
    }).then(function (res) {
      return res.json().catch(function () { return {}; }).then(function (body) {
        // Services disagree on the success shape; a 2xx plus no explicit
        // failure flag is the common ground.
        var ok = res.ok && body.success !== false && body.ok !== false && !body.error;
        if (!ok) {
          throw new Error(body.message || body.error || ('The form service returned ' + res.status + '.'));
        }
        return body;
      });
    });
  }

  /* ------------------------------------------------------------------ view */

  function render() {
    var main = UI.$('#main');
    UI.clear(main);

    var f = data().feedback;
    var wrap = el('div', { class: 'feedback-wrap' });

    wrap.appendChild(el('button', {
      class: 'btn btn-sm btn-ghost',
      style: { marginBottom: '18px', paddingLeft: '0' },
      onclick: function () { Router.go('/'); }
    }, [icon('arrowLeft'), el('span', { text: t('nav.home') })]));

    wrap.appendChild(el('h1', {
      class: 'hero-title',
      style: { fontSize: 'clamp(26px,5vw,38px)', marginBottom: '12px' },
      text: t('feedback.title')
    }));
    wrap.appendChild(el('p', {
      class: 'hero-sub',
      style: { marginBottom: '28px' },
      text: f.intro || t('feedback.intro')
    }));

    if (!isReachable()) {
      wrap.appendChild(el('div', {
        class: 'feedback-note',
        text: Store.state.isAdmin
          ? 'Readers cannot send anything yet, so this page is hidden from them. Add a contact email or a form ' +
            'endpoint and the link appears everywhere automatically.'
          : t('feedback.noChannel')
      }));
      if (Store.state.isAdmin) {
        wrap.appendChild(el('button', {
          class: 'btn btn-sm',
          onclick: function () { Editor.openSettings('feedback'); }
        }, [icon('settings'), el('span', { text: 'Set it up' })]));
      }
      main.appendChild(wrap);
      main.appendChild(Views.renderFooter());
      return;
    }

    var fields = { name: '', email: '', about: '', message: '' };
    var form = el('form', { novalidate: true });

    if (f.askName) {
      form.appendChild(UI.field(t('feedback.nameOptional'), el('input', {
        class: 'input', autocomplete: 'name',
        oninput: function (e) { fields.name = e.target.value; }
      })));
    }
    if (f.askEmail) {
      form.appendChild(UI.field(t('feedback.email'), el('input', {
        class: 'input', type: 'email', autocomplete: 'email',
        oninput: function (e) { fields.email = e.target.value; }
      })));
    }
    if (f.askAbout) {
      var pieces = Store.select({});
      var sel = el('select', {
        class: 'select',
        onchange: function () { fields.about = sel.value; }
      });
      sel.appendChild(el('option', { value: '', text: t('feedback.aboutSite') }));
      pieces.slice(0, 200).forEach(function (entry) {
        var label = (entry.title || Views.preview(entry, 1)).replace(/\s+/g, ' ').slice(0, 70);
        sel.appendChild(el('option', { value: label, text: label }));
      });
      form.appendChild(UI.field(t('feedback.about'), sel));
    }

    var message = el('textarea', {
      class: 'textarea',
      style: { minHeight: '160px' },
      placeholder: t('feedback.messagePlaceholder'),
      oninput: function () { fields.message = message.value; }
    });
    form.appendChild(UI.field(t('feedback.message'), message));

    /* Honeypot: real people never see it, scripts fill everything. */
    var honey = el('input', {
      type: 'text', name: 'website', tabindex: '-1', autocomplete: 'off',
      'aria-hidden': 'true',
      style: { position: 'absolute', left: '-9999px', opacity: '0', height: '0', width: '0' }
    });
    form.appendChild(honey);

    var error = el('div', {
      class: 'field-hint',
      style: { color: '#E5484D', display: 'none', marginBottom: '12px' }
    });
    form.appendChild(error);

    var sendBtn = el('button', {
      class: 'btn btn-primary btn-block',
      type: 'submit'
    }, [icon('send'), el('span', { text: t('feedback.send') })]);
    form.appendChild(sendBtn);

    if (!f.endpoint) {
      form.appendChild(el('div', {
        class: 'field-hint',
        style: { marginTop: '12px', textAlign: 'center' },
        text: 'This opens your email app with the message ready to send.'
      }));
    }

    function showThanks(viaMail) {
      UI.clear(wrap);
      wrap.appendChild(el('div', { class: 'feedback-ok' }, [
        el('div', { class: 'feedback-ok-icon' }, icon(viaMail ? 'send' : 'check')),
        el('h2', {
          style: { fontSize: '21px', fontWeight: '620', marginBottom: '10px' },
          text: viaMail ? t('feedback.thanksMail') : t('feedback.thanks')
        }),
        el('button', {
          class: 'btn',
          style: { marginTop: '18px' },
          text: t('nav.home'),
          onclick: function () { Router.go('/'); }
        })
      ]));
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      error.style.display = 'none';

      if (honey.value) { showThanks(false); return; }   // bot: absorb silently

      if (!String(fields.message).trim()) {
        error.textContent = t('feedback.needMessage');
        error.style.display = 'block';
        message.focus();
        return;
      }

      if (!f.endpoint) {
        global.location.href = mailtoUrl(fields);
        showThanks(true);
        return;
      }

      sendBtn.disabled = true;
      UI.clear(sendBtn);
      sendBtn.appendChild(el('span', { text: t('feedback.sending') }));

      postToEndpoint(fields)
        .then(function () { showThanks(false); })
        .catch(function (err) {
          console.error('[feedback]', err);
          sendBtn.disabled = false;
          UI.clear(sendBtn);
          sendBtn.appendChild(icon('send'));
          sendBtn.appendChild(el('span', { text: t('feedback.send') }));

          error.style.display = 'block';
          UI.clear(error);
          error.appendChild(el('div', { text: t('feedback.failed') + ' ' + (err.message || '') }));

          if (targetEmail()) {
            error.appendChild(el('a', {
              class: 'btn btn-sm',
              style: { marginTop: '10px' },
              href: mailtoUrl(fields),
              text: t('feedback.failedHint')
            }));
          }
        });
    });

    wrap.appendChild(form);
    main.appendChild(wrap);
    main.appendChild(Views.renderFooter());
  }

  global.Feedback = {
    render: render,
    mailtoUrl: mailtoUrl,
    targetEmail: targetEmail,
    isReachable: isReachable,
    isOffered: isOffered
  };
})(window);
