// theme.js — load before other scripts; no dependencies
(function () {
  const KEY = 'seabirdle-theme';
  const btn = document.getElementById('theme-toggle');

  function apply(dark) {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    if (btn) btn.textContent = dark ? '☀️' : '🌙';
  }

  // Restore saved preference, fall back to OS preference
  const saved = localStorage.getItem(KEY);
  const prefersDark = saved !== null
    ? saved === 'dark'
    : window.matchMedia('(prefers-color-scheme: dark)').matches;

  apply(prefersDark);

  if (btn) {
    btn.addEventListener('click', function () {
      const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      apply(!isDark);
      localStorage.setItem(KEY, isDark ? 'light' : 'dark');
    });
  }
})();