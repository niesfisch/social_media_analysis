(function () {
  const STORAGE_KEY = 'spotify-analyzer-locale';
  const LANGS = ['DE', 'EN'];

  function normalizeLang(lang) {
    if (lang === 'de' || lang === 'DE') return 'DE';
    if (lang === 'en' || lang === 'EN') return 'EN';
    return 'DE';
  }

  function getLang() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (LANGS.includes(saved)) {
      return saved === 'DE' ? 'de' : 'en';
    }
    return 'de';
  }

  function applyLang(lang) {
    const storageVal = lang === 'de' ? 'DE' : 'EN';
    localStorage.setItem(STORAGE_KEY, storageVal);
    document.documentElement.lang = lang;

    document.querySelectorAll('[data-lang]').forEach(el => {
      el.style.display = el.dataset.lang === lang ? '' : 'none';
    });

    document.querySelectorAll('.lang-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.lang === lang);
    });
  }

  function init() {
    const lang = getLang();
    applyLang(lang);

    document.querySelectorAll('.lang-btn').forEach(btn => {
      btn.addEventListener('click', () => applyLang(btn.dataset.lang));
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
