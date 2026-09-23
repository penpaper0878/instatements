/* =============================================================================
   store.js — the single source of truth.

   Three layers, in priority order when the app boots:
     1. data/content.json   the PUBLISHED site. Everyone sees this.
     2. localStorage draft  the admin's unpublished working copy. Only on the
                            admin's own device; "Publish" pushes it to layer 1.
     3. DEFAULTS            used the very first time, before anything exists.

   Visitors never read layer 2. They physically cannot write to layer 1 either,
   because writing requires a GitHub token that only the admin holds.
   ========================================================================== */
(function (global) {
  'use strict';

  var LS = {
    draft:  'pp.draft.v1',   // admin working copy of the whole site
    admin:  'pp.admin.v1',   // { unlocked, token, owner, repo, branch, path }
    prefs:  'pp.prefs.v1',   // per-visitor: ui language, forced light/dark
    inbox:  'pp.inbox.v1'    // feedback drafts queued while offline
  };

  var SCHEMA_VERSION = 1;

  /* ---------------------------------------------------------------- helpers */

  function uid(prefix) {
    return (prefix || 'e') + '_' +
      Date.now().toString(36) +
      Math.random().toString(36).slice(2, 7);
  }

  function isPlainObject(v) {
    return v !== null && typeof v === 'object' && !Array.isArray(v);
  }

  /* Recursively fill in anything the stored data is missing. Arrays are taken
     wholesale from the source — merging them element-wise would resurrect
     entries the author deleted. */
  function deepDefaults(target, defaults) {
    var out = isPlainObject(target) ? target : {};
    Object.keys(defaults).forEach(function (key) {
      var dv = defaults[key];
      if (!(key in out) || out[key] === undefined || out[key] === null) {
        out[key] = isPlainObject(dv) ? deepDefaults({}, dv)
                 : Array.isArray(dv) ? dv.slice()
                 : dv;
      } else if (isPlainObject(dv)) {
        out[key] = deepDefaults(out[key], dv);
      }
    });
    return out;
  }

  function clone(v) {
    return JSON.parse(JSON.stringify(v));
  }

  function readLS(key, fallback) {
    try {
      var raw = global.localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (err) {
      return fallback;
    }
  }

  function writeLS(key, value) {
    try {
      global.localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (err) {
      // Quota exceeded, or storage blocked in private mode. The app keeps
      // working from memory; only persistence across reloads is lost.
      return false;
    }
  }

  function today() {
    var d = new Date();
    return d.getFullYear() + '-' +
      String(d.getMonth() + 1).padStart(2, '0') + '-' +
      String(d.getDate()).padStart(2, '0');
  }

  /* ---------------------------------------------------------------- defaults */

  var DEFAULT_STYLE = {
    preset: 'inherit',   // 'inherit' = follow the site theme
    font: '',            // '' = follow the language default
    size: 1,             // multiplier on the base reading size
    lineHeight: 1.85,
    letterSpacing: 0,
    align: 'left',       // left | center | right | justify
    textColor: '',
    bgType: 'inherit',   // inherit | solid | gradient | image
    bgColor: '#101418',
    gradFrom: '#1b2735',
    gradTo: '#090a0f',
    gradAngle: 160,
    bgImage: '',
    bgDim: 0.35,
    bgBlur: 0,
    textShadow: false,
    frame: 'none'        // none | rule | box | quotes
  };

  var DEFAULTS = {
    version: SCHEMA_VERSION,
    updatedAt: '',

    site: {
      name: 'My Writings',
      nameGu: '',
      nameHi: '',
      tagline: 'Poems, blogs and quotes',
      taglineGu: '',
      taglineHi: '',
      author: '',
      avatar: '',
      about: '',
      email: '',
      footer: '',
      links: []            // [{ label, url }]
    },

    theme: {
      preset: 'ink',
      mode: 'auto',        // auto | light | dark
      accent: '#B4763C',
      bgType: 'preset',    // preset | solid | gradient | image
      bgColor: '',
      gradFrom: '',
      gradTo: '',
      gradAngle: 160,
      bgImage: '',
      bgDim: 0.45,
      bgBlur: 0,
      fontEn: 'Fraunces',
      fontGu: 'Hind Vadodara',
      fontHi: 'Hind',
      fontUi: 'Inter',
      baseSize: 17,
      radius: 18,
      cardStyle: 'paper',  // paper | glass | solid | outline | minimal
      density: 'comfortable'
    },

    home: {
      layout: 'grid',      // grid | masonry | list | magazine
      perPage: 9,
      hero: {
        enabled: true,
        title: '',
        subtitle: '',
        showAvatar: true,
        align: 'center',
        featuredId: ''
      },
      tabs: ['all', 'poems', 'blogs', 'quotes', 'collections'],
      showCounts: true,
      showSearch: true,
      showLangFilter: true,
      sortBy: 'date-desc'  // date-desc | date-asc | title | manual
    },

    entries: [],
    collections: [],

    feedback: {
      enabled: true,
      endpoint: '',        // Web3Forms / Formspree / Apps Script URL
      endpointKey: '',     // Web3Forms access_key, if that's the service
      email: '',           // mailto: fallback
      intro: '',
      askName: true,
      askEmail: true,
      askAbout: true       // let a reader point at a specific piece
    },

    admin: {
      passSalt: '',
      passHash: '',
      iterations: 250000
    },

    publish: {
      owner: '',
      repo: '',
      branch: 'main',
      path: 'writings/data/content.json'
    }
  };

  /* ------------------------------------------------------------------- state */

  var state = {
    data: null,          // the live, in-memory site
    published: null,     // what data/content.json held at boot
    isAdmin: false,      // has the admin unlocked this device?
    dirty: false,        // draft differs from published?
    loadError: ''
  };

  /* ---------------------------------------------------------------- normalise */

  function normaliseEntry(raw) {
    var e = deepDefaults(raw || {}, {
      id: '',
      type: 'poem',        // poem | blog | quote
      lang: 'gu',          // gu | hi | en
      title: '',
      body: '',
      excerpt: '',
      tags: [],
      collections: [],
      date: today(),
      pinned: false,
      draft: false,
      cover: '',
      credit: '',
      style: clone(DEFAULT_STYLE)
    });
    if (!e.id) e.id = uid('e');
    if (!Array.isArray(e.tags)) e.tags = [];
    if (!Array.isArray(e.collections)) e.collections = [];
    e.style = deepDefaults(e.style, DEFAULT_STYLE);
    return e;
  }

  function normalise(raw) {
    var data = deepDefaults(clone(raw || {}), DEFAULTS);
    data.version = SCHEMA_VERSION;
    data.entries = (Array.isArray(data.entries) ? data.entries : []).map(normaliseEntry);
    data.collections = (Array.isArray(data.collections) ? data.collections : [])
      .map(function (c) {
        var col = deepDefaults(c || {}, {
          id: '', name: '', desc: '', cover: '', accent: '', order: 0
        });
        if (!col.id) col.id = uid('c');
        return col;
      });
    if (!Array.isArray(data.site.links)) data.site.links = [];
    return data;
  }

  /* -------------------------------------------------------------- admin gate */

  function bufToHex(buf) {
    return Array.prototype.map.call(new Uint8Array(buf), function (b) {
      return b.toString(16).padStart(2, '0');
    }).join('');
  }

  function randomSaltHex() {
    var bytes = new Uint8Array(16);
    (global.crypto || global.msCrypto).getRandomValues(bytes);
    return bufToHex(bytes.buffer);
  }

  /* PBKDF2-SHA256. The hash lives in a public file, so we make guessing slow
     rather than pretending it's secret. The real barrier to publishing is the
     GitHub token, which is never in any file. */
  function derive(passphrase, saltHex, iterations) {
    var subtle = (global.crypto || {}).subtle;
    if (!subtle) return Promise.reject(new Error('no-webcrypto'));
    var enc = new TextEncoder();
    var salt = new Uint8Array((saltHex.match(/.{1,2}/g) || []).map(function (h) {
      return parseInt(h, 16);
    }));
    return subtle.importKey('raw', enc.encode(passphrase), 'PBKDF2', false, ['deriveBits'])
      .then(function (key) {
        return subtle.deriveBits({
          name: 'PBKDF2', salt: salt, iterations: iterations, hash: 'SHA-256'
        }, key, 256);
      })
      .then(bufToHex);
  }

  function hasPassphrase() {
    return !!(state.data && state.data.admin && state.data.admin.passHash);
  }

  function setPassphrase(passphrase) {
    var salt = randomSaltHex();
    var iters = DEFAULTS.admin.iterations;
    return derive(passphrase, salt, iters).then(function (hash) {
      state.data.admin.passSalt = salt;
      state.data.admin.passHash = hash;
      state.data.admin.iterations = iters;
      markDirty();
      return true;
    });
  }

  function checkPassphrase(passphrase) {
    var a = state.data.admin;
    if (!a.passHash) return Promise.resolve(false);
    return derive(passphrase, a.passSalt, a.iterations || DEFAULTS.admin.iterations)
      .then(function (hash) {
        // Constant-time-ish compare. Both strings are the same length here.
        if (hash.length !== a.passHash.length) return false;
        var diff = 0;
        for (var i = 0; i < hash.length; i++) {
          diff |= hash.charCodeAt(i) ^ a.passHash.charCodeAt(i);
        }
        return diff === 0;
      });
  }

  function adminSession() {
    return readLS(LS.admin, { unlocked: false, token: '' });
  }

  function saveAdminSession(patch) {
    var s = deepDefaults(patch || {}, adminSession());
    writeLS(LS.admin, s);
    state.isAdmin = !!s.unlocked;
    return s;
  }

  function unlock() {
    saveAdminSession({ unlocked: true });
    state.isAdmin = true;
  }

  function lock() {
    // Forget the token too — locking should mean locking.
    writeLS(LS.admin, { unlocked: false, token: '' });
    state.isAdmin = false;
  }

  /* --------------------------------------------------------------- lifecycle */

  function markDirty() {
    state.data.updatedAt = new Date().toISOString();
    state.dirty = true;
    writeLS(LS.draft, state.data);
    emit('change');
  }

  function markPublished(data) {
    state.published = clone(data);
    state.dirty = false;
    try { global.localStorage.removeItem(LS.draft); } catch (err) { /* ignore */ }
    emit('change');
  }

  function discardDraft() {
    try { global.localStorage.removeItem(LS.draft); } catch (err) { /* ignore */ }
    state.data = normalise(state.published || DEFAULTS);
    state.dirty = false;
    emit('change');
  }

  function load() {
    var url = 'data/content.json?v=' + Date.now();
    return fetch(url, { cache: 'no-store' })
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      })
      .catch(function (err) {
        // file:// or a missing file. Not fatal: the draft or defaults carry on.
        state.loadError = String(err && err.message || err);
        return null;
      })
      .then(function (published) {
        state.published = published ? normalise(published) : null;

        var draft = readLS(LS.draft, null);
        var session = adminSession();
        state.isAdmin = !!session.unlocked;

        if (draft && state.isAdmin) {
          var draftData = normalise(draft);
          // The published file may already match this draft — the author
          // uploaded it by hand, or published from another device. Without
          // this check the site would claim unpublished changes forever.
          if (state.published && sameContent(draftData, state.published)) {
            try { global.localStorage.removeItem(LS.draft); } catch (err) { /* ignore */ }
            state.data = clone(state.published);
            state.dirty = false;
          } else {
            state.data = draftData;
            state.dirty = true;
          }
        } else {
          state.data = clone(state.published || normalise(DEFAULTS));
          state.dirty = false;
        }
        emit('change');
        return state.data;
      });
  }

  /* Two versions hold the same site when everything but the timestamp matches;
     the timestamp changes on every keystroke and would never compare equal. */
  function sameContent(a, b) {
    var strip = function (data) {
      var copy = clone(data);
      copy.updatedAt = '';
      return JSON.stringify(copy);
    };
    try {
      return strip(a) === strip(b);
    } catch (err) {
      return false;
    }
  }

  /* ------------------------------------------------------------------ events */

  var listeners = {};

  function on(name, fn) {
    (listeners[name] = listeners[name] || []).push(fn);
    return function off() {
      listeners[name] = (listeners[name] || []).filter(function (f) { return f !== fn; });
    };
  }

  function emit(name, payload) {
    (listeners[name] || []).forEach(function (fn) {
      try { fn(payload); } catch (err) { console.error('[store]', name, err); }
    });
  }

  /* ------------------------------------------------------------ entry CRUD  */

  function entries() {
    return state.data ? state.data.entries : [];
  }

  function visibleEntries() {
    // Drafts are the author's private work-in-progress until published.
    return entries().filter(function (e) { return state.isAdmin || !e.draft; });
  }

  function getEntry(id) {
    return entries().filter(function (e) { return e.id === id; })[0] || null;
  }

  function addEntry(partial) {
    var e = normaliseEntry(partial);
    state.data.entries.unshift(e);
    markDirty();
    return e;
  }

  function updateEntry(id, patch) {
    var e = getEntry(id);
    if (!e) return null;
    Object.keys(patch).forEach(function (k) { e[k] = patch[k]; });
    markDirty();
    return e;
  }

  function removeEntry(id) {
    state.data.entries = entries().filter(function (e) { return e.id !== id; });
    markDirty();
  }

  function getCollection(id) {
    return (state.data.collections || []).filter(function (c) { return c.id === id; })[0] || null;
  }

  function addCollection(partial) {
    var c = deepDefaults(partial || {}, { id: uid('c'), name: '', desc: '', cover: '', accent: '', order: 0 });
    if (!c.id) c.id = uid('c');
    state.data.collections.push(c);
    markDirty();
    return c;
  }

  function removeCollection(id) {
    state.data.collections = state.data.collections.filter(function (c) { return c.id !== id; });
    entries().forEach(function (e) {
      e.collections = (e.collections || []).filter(function (cid) { return cid !== id; });
    });
    markDirty();
  }

  /* --------------------------------------------------------------- selectors */

  var TYPE_OF_TAB = { poems: 'poem', blogs: 'blog', quotes: 'quote' };

  function select(opts) {
    opts = opts || {};
    var list = visibleEntries();

    if (opts.type) list = list.filter(function (e) { return e.type === opts.type; });
    if (opts.lang && opts.lang !== 'all') list = list.filter(function (e) { return e.lang === opts.lang; });
    if (opts.collection) {
      list = list.filter(function (e) {
        return (e.collections || []).indexOf(opts.collection) !== -1;
      });
    }
    if (opts.tag) {
      list = list.filter(function (e) { return (e.tags || []).indexOf(opts.tag) !== -1; });
    }
    if (opts.query) {
      var q = opts.query.trim().toLowerCase();
      if (q) {
        list = list.filter(function (e) {
          return (e.title + ' ' + e.body + ' ' + (e.tags || []).join(' '))
            .toLowerCase().indexOf(q) !== -1;
        });
      }
    }

    var sortBy = opts.sortBy || (state.data.home && state.data.home.sortBy) || 'date-desc';
    if (sortBy !== 'manual') {
      list = list.slice().sort(function (a, b) {
        if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
        if (sortBy === 'title') return String(a.title).localeCompare(String(b.title));
        if (sortBy === 'date-asc') return String(a.date).localeCompare(String(b.date));
        return String(b.date).localeCompare(String(a.date));
      });
    }
    return list;
  }

  function allTags() {
    var seen = {};
    visibleEntries().forEach(function (e) {
      (e.tags || []).forEach(function (t) { seen[t] = (seen[t] || 0) + 1; });
    });
    return Object.keys(seen).sort(function (a, b) { return seen[b] - seen[a]; })
      .map(function (t) { return { tag: t, count: seen[t] }; });
  }

  function counts() {
    var c = { all: 0, poems: 0, blogs: 0, quotes: 0, collections: 0, gu: 0, hi: 0, en: 0 };
    visibleEntries().forEach(function (e) {
      c.all++;
      if (e.type === 'poem') c.poems++;
      else if (e.type === 'blog') c.blogs++;
      else if (e.type === 'quote') c.quotes++;
      if (c[e.lang] !== undefined) c[e.lang]++;
    });
    c.collections = (state.data.collections || []).length;
    return c;
  }

  /* ------------------------------------------------------------------ prefs */

  function prefs() {
    return readLS(LS.prefs, { uiLang: '', mode: '' });
  }

  function setPref(key, value) {
    var p = prefs();
    p[key] = value;
    writeLS(LS.prefs, p);
    emit('prefs');
    return p;
  }

  /* ------------------------------------------------------------------ export */

  function exportData() {
    return clone(state.data);
  }

  function importData(raw, mode) {
    var incoming = normalise(raw);
    if (mode === 'merge') {
      var byId = {};
      entries().forEach(function (e) { byId[e.id] = true; });
      incoming.entries.forEach(function (e) {
        if (byId[e.id]) e.id = uid('e');           // keep both copies
        state.data.entries.push(e);
      });
      var colById = {};
      (state.data.collections || []).forEach(function (c) { colById[c.id] = true; });
      incoming.collections.forEach(function (c) {
        if (!colById[c.id]) state.data.collections.push(c);
      });
    } else {
      // Replacing everything must not lock the admin out of their own site.
      var keptAdmin = state.data.admin;
      var keptPublish = state.data.publish;
      state.data = incoming;
      if (!state.data.admin.passHash) state.data.admin = keptAdmin;
      if (!state.data.publish.owner) state.data.publish = keptPublish;
    }
    markDirty();
    return state.data;
  }

  global.Store = {
    LS: LS,
    DEFAULTS: DEFAULTS,
    DEFAULT_STYLE: DEFAULT_STYLE,
    TYPE_OF_TAB: TYPE_OF_TAB,
    state: state,
    uid: uid,
    clone: clone,
    today: today,
    deepDefaults: deepDefaults,
    readLS: readLS,
    writeLS: writeLS,

    load: load,
    on: on,
    emit: emit,
    markDirty: markDirty,
    markPublished: markPublished,
    discardDraft: discardDraft,
    sameContent: sameContent,

    hasPassphrase: hasPassphrase,
    setPassphrase: setPassphrase,
    checkPassphrase: checkPassphrase,
    adminSession: adminSession,
    saveAdminSession: saveAdminSession,
    unlock: unlock,
    lock: lock,

    entries: entries,
    visibleEntries: visibleEntries,
    getEntry: getEntry,
    addEntry: addEntry,
    updateEntry: updateEntry,
    removeEntry: removeEntry,
    normaliseEntry: normaliseEntry,

    getCollection: getCollection,
    addCollection: addCollection,
    removeCollection: removeCollection,

    select: select,
    allTags: allTags,
    counts: counts,

    prefs: prefs,
    setPref: setPref,

    exportData: exportData,
    importData: importData
  };
})(window);
