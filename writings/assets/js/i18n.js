/* =============================================================================
   i18n.js — interface strings in Gujarati, Hindi and English.

   This translates the *chrome* (buttons, labels, empty states). The writing
   itself is whatever language you wrote it in, and is never touched.

   Adding a language: copy the `en` block, translate the values, and add the
   code to LANGS. Missing keys fall back to English automatically.
   ========================================================================== */
(function (global) {
  'use strict';

  var LANGS = [
    { code: 'gu', label: 'ગુજરાતી', short: 'ગુ' },
    { code: 'hi', label: 'हिन्दी',  short: 'हि' },
    { code: 'en', label: 'English', short: 'EN' }
  ];

  var STRINGS = {
    en: {
      'tab.all': 'All',
      'tab.poems': 'Poems',
      'tab.blogs': 'Blogs',
      'tab.quotes': 'Quotes',
      'tab.collections': 'Collections',
      'nav.feedback': 'Feedback',
      'nav.about': 'About',
      'nav.home': 'Home',

      'type.poem': 'Poem',
      'type.blog': 'Blog',
      'type.quote': 'Quote',

      'lang.all': 'All languages',
      'lang.gu': 'Gujarati',
      'lang.hi': 'Hindi',
      'lang.en': 'English',

      'action.search': 'Search',
      'action.searchPlaceholder': 'Search writings…',
      'action.seeMore': 'See more',
      'action.seeLess': 'Show less',
      'action.readMore': 'Read',
      'action.share': 'Share',
      'action.copy': 'Copy',
      'action.copied': 'Copied',
      'action.download': 'Download',
      'action.print': 'Print',
      'action.close': 'Close',
      'action.back': 'Back',
      'action.save': 'Save',
      'action.cancel': 'Cancel',
      'action.delete': 'Delete',
      'action.edit': 'Edit',
      'action.new': 'New',
      'action.send': 'Send',
      'action.retry': 'Try again',
      'action.clear': 'Clear',
      'action.apply': 'Apply',

      'share.title': 'Share this',
      'share.image': 'Save as image',
      'share.pdf': 'Save as PDF',
      'share.text': 'Copy as text',
      'share.txtFile': 'Download .txt',
      'share.link': 'Copy link',
      'share.native': 'Share…',
      'share.whatsapp': 'WhatsApp',
      'share.imageHint': 'Creates a picture you can post anywhere.',

      'state.empty': 'Nothing here yet.',
      'state.emptyHint': 'New writing will appear here.',
      'state.noResults': 'No writings matched.',
      'state.noResultsHint': 'Try a different word, or clear the filters.',
      'state.loading': 'Loading…',

      'feedback.title': 'Feedback & suggestions',
      'feedback.intro': 'Tell me what you thought — about one piece, or the site as a whole.',
      'feedback.name': 'Your name',
      'feedback.nameOptional': 'Your name (optional)',
      'feedback.email': 'Your email (optional)',
      'feedback.about': 'About',
      'feedback.aboutSite': 'The site in general',
      'feedback.message': 'Your message',
      'feedback.messagePlaceholder': 'Write freely — in any language.',
      'feedback.send': 'Send feedback',
      'feedback.sending': 'Sending…',
      'feedback.thanks': 'Thank you — your message reached me.',
      'feedback.thanksMail': 'Your mail app is opening with the message ready to send.',
      'feedback.failed': 'That did not go through.',
      'feedback.failedHint': 'You can send it by email instead.',
      'feedback.needMessage': 'Please write a message first.',
      'feedback.noChannel': 'Feedback is not set up yet.',

      'meta.words': 'words',
      'meta.minRead': 'min read',
      'meta.on': 'on',
      'meta.in': 'in',
      'meta.pieces': 'pieces',
      'meta.piece': 'piece',

      'admin.badge': 'Admin',
      'admin.unlock': 'Unlock admin',
      'admin.passphrase': 'Passphrase',
      'admin.wrongPass': 'That passphrase is not right.',
      'admin.setPass': 'Set an admin passphrase',
      'admin.setPassHint': 'Choose something only you know. You will need it on every device you edit from.',
      'admin.lock': 'Lock',
      'admin.settings': 'Settings',
      'admin.publish': 'Publish',
      'admin.publishing': 'Publishing…',
      'admin.published': 'Published — live in about a minute.',
      'admin.unsaved': 'unpublished changes',
      'admin.discard': 'Discard changes',

      'toast.saved': 'Saved',
      'toast.deleted': 'Deleted',
      'toast.imported': 'Imported',
      'toast.exported': 'Exported'
    },

    gu: {
      'tab.all': 'બધું',
      'tab.poems': 'કવિતાઓ',
      'tab.blogs': 'બ્લોગ',
      'tab.quotes': 'સુવિચાર',
      'tab.collections': 'સંગ્રહ',
      'nav.feedback': 'પ્રતિભાવ',
      'nav.about': 'પરિચય',
      'nav.home': 'મુખપૃષ્ઠ',

      'type.poem': 'કવિતા',
      'type.blog': 'બ્લોગ',
      'type.quote': 'સુવિચાર',

      'lang.all': 'બધી ભાષાઓ',
      'lang.gu': 'ગુજરાતી',
      'lang.hi': 'હિન્દી',
      'lang.en': 'અંગ્રેજી',

      'action.search': 'શોધો',
      'action.searchPlaceholder': 'લખાણ શોધો…',
      'action.seeMore': 'વધુ જુઓ',
      'action.seeLess': 'ઓછું બતાવો',
      'action.readMore': 'વાંચો',
      'action.share': 'શેર કરો',
      'action.copy': 'કૉપિ કરો',
      'action.copied': 'કૉપિ થયું',
      'action.download': 'ડાઉનલોડ',
      'action.print': 'પ્રિન્ટ',
      'action.close': 'બંધ કરો',
      'action.back': 'પાછળ',
      'action.save': 'સાચવો',
      'action.cancel': 'રદ કરો',
      'action.delete': 'કાઢી નાખો',
      'action.edit': 'સંપાદિત કરો',
      'action.new': 'નવું',
      'action.send': 'મોકલો',
      'action.retry': 'ફરી પ્રયાસ કરો',
      'action.clear': 'સાફ કરો',
      'action.apply': 'લાગુ કરો',

      'share.title': 'આ શેર કરો',
      'share.image': 'છબી તરીકે સાચવો',
      'share.pdf': 'PDF તરીકે સાચવો',
      'share.text': 'લખાણ કૉપિ કરો',
      'share.txtFile': '.txt ડાઉનલોડ કરો',
      'share.link': 'લિંક કૉપિ કરો',
      'share.native': 'શેર કરો…',
      'share.whatsapp': 'વૉટ્સએપ',
      'share.imageHint': 'એવી છબી બને છે જે તમે ગમે ત્યાં મૂકી શકો.',

      'state.empty': 'અહીં હજી કંઈ નથી.',
      'state.emptyHint': 'નવું લખાણ અહીં દેખાશે.',
      'state.noResults': 'કોઈ લખાણ મળ્યું નહીં.',
      'state.noResultsHint': 'બીજો શબ્દ અજમાવો, અથવા ફિલ્ટર સાફ કરો.',
      'state.loading': 'લોડ થઈ રહ્યું છે…',

      'feedback.title': 'પ્રતિભાવ અને સૂચનો',
      'feedback.intro': 'તમને કેવું લાગ્યું તે જણાવો — કોઈ એક રચના વિશે, કે આખી સાઇટ વિશે.',
      'feedback.name': 'તમારું નામ',
      'feedback.nameOptional': 'તમારું નામ (વૈકલ્પિક)',
      'feedback.email': 'તમારું ઈમેલ (વૈકલ્પિક)',
      'feedback.about': 'વિશે',
      'feedback.aboutSite': 'સામાન્ય રીતે સાઇટ વિશે',
      'feedback.message': 'તમારો સંદેશ',
      'feedback.messagePlaceholder': 'મન ખોલીને લખો — કોઈ પણ ભાષામાં.',
      'feedback.send': 'પ્રતિભાવ મોકલો',
      'feedback.sending': 'મોકલાઈ રહ્યું છે…',
      'feedback.thanks': 'આભાર — તમારો સંદેશ મને મળી ગયો.',
      'feedback.thanksMail': 'તમારી ઈમેલ એપ સંદેશ સાથે ખૂલી રહી છે.',
      'feedback.failed': 'સંદેશ મોકલી શકાયો નહીં.',
      'feedback.failedHint': 'તમે તેને ઈમેલ દ્વારા મોકલી શકો છો.',
      'feedback.needMessage': 'પહેલાં સંદેશ લખો.',
      'feedback.noChannel': 'પ્રતિભાવની સુવિધા હજી ગોઠવાઈ નથી.',

      'meta.words': 'શબ્દો',
      'meta.minRead': 'મિનિટ વાંચન',
      'meta.on': 'તારીખે',
      'meta.in': 'માં',
      'meta.pieces': 'રચનાઓ',
      'meta.piece': 'રચના',

      'admin.badge': 'એડમિન',
      'admin.unlock': 'એડમિન ખોલો',
      'admin.passphrase': 'પાસફ્રેઝ',
      'admin.wrongPass': 'આ પાસફ્રેઝ બરાબર નથી.',
      'admin.setPass': 'એડમિન પાસફ્રેઝ સેટ કરો',
      'admin.setPassHint': 'એવું કંઈક પસંદ કરો જે ફક્ત તમે જાણતા હો.',
      'admin.lock': 'લૉક કરો',
      'admin.settings': 'સેટિંગ્સ',
      'admin.publish': 'પ્રકાશિત કરો',
      'admin.publishing': 'પ્રકાશિત થઈ રહ્યું છે…',
      'admin.published': 'પ્રકાશિત થયું — એકાદ મિનિટમાં જીવંત.',
      'admin.unsaved': 'અપ્રકાશિત ફેરફારો',
      'admin.discard': 'ફેરફારો રદ કરો',

      'toast.saved': 'સચવાઈ ગયું',
      'toast.deleted': 'કાઢી નાખ્યું',
      'toast.imported': 'આયાત થયું',
      'toast.exported': 'નિકાસ થયું'
    },

    hi: {
      'tab.all': 'सभी',
      'tab.poems': 'कविताएँ',
      'tab.blogs': 'ब्लॉग',
      'tab.quotes': 'सुविचार',
      'tab.collections': 'संग्रह',
      'nav.feedback': 'प्रतिक्रिया',
      'nav.about': 'परिचय',
      'nav.home': 'मुखपृष्ठ',

      'type.poem': 'कविता',
      'type.blog': 'ब्लॉग',
      'type.quote': 'सुविचार',

      'lang.all': 'सभी भाषाएँ',
      'lang.gu': 'गुजराती',
      'lang.hi': 'हिन्दी',
      'lang.en': 'अंग्रेज़ी',

      'action.search': 'खोजें',
      'action.searchPlaceholder': 'रचनाएँ खोजें…',
      'action.seeMore': 'और देखें',
      'action.seeLess': 'कम दिखाएँ',
      'action.readMore': 'पढ़ें',
      'action.share': 'साझा करें',
      'action.copy': 'कॉपी करें',
      'action.copied': 'कॉपी हो गया',
      'action.download': 'डाउनलोड',
      'action.print': 'प्रिंट',
      'action.close': 'बंद करें',
      'action.back': 'पीछे',
      'action.save': 'सहेजें',
      'action.cancel': 'रद्द करें',
      'action.delete': 'हटाएँ',
      'action.edit': 'संपादित करें',
      'action.new': 'नया',
      'action.send': 'भेजें',
      'action.retry': 'फिर कोशिश करें',
      'action.clear': 'साफ़ करें',
      'action.apply': 'लागू करें',

      'share.title': 'इसे साझा करें',
      'share.image': 'छवि के रूप में सहेजें',
      'share.pdf': 'PDF के रूप में सहेजें',
      'share.text': 'पाठ कॉपी करें',
      'share.txtFile': '.txt डाउनलोड करें',
      'share.link': 'लिंक कॉपी करें',
      'share.native': 'साझा करें…',
      'share.whatsapp': 'व्हाट्सऐप',
      'share.imageHint': 'ऐसी तस्वीर बनती है जिसे आप कहीं भी पोस्ट कर सकते हैं।',

      'state.empty': 'यहाँ अभी कुछ नहीं है।',
      'state.emptyHint': 'नई रचनाएँ यहाँ दिखेंगी।',
      'state.noResults': 'कोई रचना नहीं मिली।',
      'state.noResultsHint': 'कोई और शब्द आज़माएँ, या फ़िल्टर हटाएँ।',
      'state.loading': 'लोड हो रहा है…',

      'feedback.title': 'प्रतिक्रिया और सुझाव',
      'feedback.intro': 'बताइए आपको कैसा लगा — किसी एक रचना पर, या पूरी साइट पर।',
      'feedback.name': 'आपका नाम',
      'feedback.nameOptional': 'आपका नाम (वैकल्पिक)',
      'feedback.email': 'आपका ईमेल (वैकल्पिक)',
      'feedback.about': 'किस बारे में',
      'feedback.aboutSite': 'सामान्य रूप से साइट',
      'feedback.message': 'आपका संदेश',
      'feedback.messagePlaceholder': 'खुलकर लिखिए — किसी भी भाषा में।',
      'feedback.send': 'प्रतिक्रिया भेजें',
      'feedback.sending': 'भेजा जा रहा है…',
      'feedback.thanks': 'धन्यवाद — आपका संदेश मुझ तक पहुँच गया।',
      'feedback.thanksMail': 'आपका मेल ऐप संदेश के साथ खुल रहा है।',
      'feedback.failed': 'संदेश भेजा नहीं जा सका।',
      'feedback.failedHint': 'आप इसे ईमेल से भेज सकते हैं।',
      'feedback.needMessage': 'पहले संदेश लिखिए।',
      'feedback.noChannel': 'प्रतिक्रिया की सुविधा अभी तैयार नहीं है।',

      'meta.words': 'शब्द',
      'meta.minRead': 'मिनट पढ़ना',
      'meta.on': 'को',
      'meta.in': 'में',
      'meta.pieces': 'रचनाएँ',
      'meta.piece': 'रचना',

      'admin.badge': 'एडमिन',
      'admin.unlock': 'एडमिन खोलें',
      'admin.passphrase': 'पासफ़्रेज़',
      'admin.wrongPass': 'यह पासफ़्रेज़ सही नहीं है।',
      'admin.setPass': 'एडमिन पासफ़्रेज़ सेट करें',
      'admin.setPassHint': 'कुछ ऐसा चुनें जो सिर्फ़ आप जानते हों।',
      'admin.lock': 'लॉक करें',
      'admin.settings': 'सेटिंग्स',
      'admin.publish': 'प्रकाशित करें',
      'admin.publishing': 'प्रकाशित हो रहा है…',
      'admin.published': 'प्रकाशित — लगभग एक मिनट में लाइव।',
      'admin.unsaved': 'अप्रकाशित बदलाव',
      'admin.discard': 'बदलाव रद्द करें',

      'toast.saved': 'सहेजा गया',
      'toast.deleted': 'हटा दिया',
      'toast.imported': 'आयात हुआ',
      'toast.exported': 'निर्यात हुआ'
    }
  };

  var current = 'en';

  /* Pick a starting language: the visitor's saved choice, else their browser,
     else English. */
  function detect() {
    var saved = (global.Store && Store.prefs().uiLang) || '';
    if (saved && STRINGS[saved]) return saved;
    var nav = (global.navigator.languages || [global.navigator.language || 'en']);
    for (var i = 0; i < nav.length; i++) {
      var code = String(nav[i]).slice(0, 2).toLowerCase();
      if (STRINGS[code]) return code;
    }
    return 'en';
  }

  function setLang(code) {
    current = STRINGS[code] ? code : 'en';
    if (global.Store) Store.setPref('uiLang', current);
    document.documentElement.setAttribute('data-uilang', current);
    return current;
  }

  function getLang() { return current; }

  function t(key, fallback) {
    var table = STRINGS[current] || STRINGS.en;
    if (key in table) return table[key];
    if (key in STRINGS.en) return STRINGS.en[key];
    return fallback !== undefined ? fallback : key;
  }

  /* Dates in the reader's own script, which matters a lot for Gujarati. */
  function formatDate(iso) {
    if (!iso) return '';
    var d = new Date(iso + (iso.length === 10 ? 'T12:00:00' : ''));
    if (isNaN(d.getTime())) return iso;
    var locale = current === 'gu' ? 'gu-IN' : current === 'hi' ? 'hi-IN' : 'en-IN';
    try {
      return d.toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' });
    } catch (err) {
      return iso;
    }
  }

  global.I18n = {
    LANGS: LANGS,
    STRINGS: STRINGS,
    detect: detect,
    setLang: setLang,
    getLang: getLang,
    t: t,
    formatDate: formatDate
  };
})(window);
