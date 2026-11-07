// Theme toggle for long-form pages (same storage key as the app).
(function () {
  var root = document.documentElement;
  document.body.dataset.theme = root.dataset.theme;
  var btn = document.getElementById('themeToggle');
  if (btn) btn.addEventListener('click', function () {
    var t = root.dataset.theme === 'dark' ? 'light' : 'dark';
    root.dataset.theme = t; document.body.dataset.theme = t;
    try { localStorage.setItem('aftershow-theme', t); } catch (e) {}
  });
})();

(function () { var y = document.getElementById('yr'); if (y) y.textContent = new Date().getFullYear(); })();
