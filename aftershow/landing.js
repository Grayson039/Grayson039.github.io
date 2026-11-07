// Landing page behaviour: theme, sticky header, live product tour (auto-cycling, pausable), reveals, hero parallax.
(function () {
  var root = document.documentElement;
  var reduced = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  root.classList.add('js');
  document.getElementById('yr').textContent = new Date().getFullYear();

  /* theme: toggles dark <-> light, persisted; the tour iframe picks it up through the storage event */
  var KEY = 'aftershow-theme';
  function setTheme(t) {
    root.dataset.theme = t; document.body.dataset.theme = t;
    try { localStorage.setItem(KEY, t); } catch (e) {}
    var m = document.querySelector('meta[name=theme-color]'); if (m) m.setAttribute('content', t === 'dark' ? '#0C0C0C' : '#EDE6D3');
  }
  document.body.dataset.theme = root.dataset.theme;
  document.getElementById('themeToggle').addEventListener('click', function () { setTheme(root.dataset.theme === 'dark' ? 'light' : 'dark'); });

  /* header gets a hairline once you scroll */
  var header = document.querySelector('.lp-header');
  function onScroll() { header.classList.toggle('scrolled', window.scrollY > 8); }
  onScroll(); window.addEventListener('scroll', onScroll, { passive: true });

  /* live product tour */
  var frame = document.getElementById('tourFrame'), screen = document.getElementById('screen');
  var tabs = [].slice.call(document.querySelectorAll('.lp-tab')), caption = document.getElementById('tourCaption'), pauseBtn = document.getElementById('tourPause');
  frame.addEventListener('load', function () { setTimeout(function () { screen.classList.add('ready'); }, 250); });
  function fit() { var s = screen.clientWidth / 1440; frame.style.transform = 'scale(' + s + ')'; }
  fit(); window.addEventListener('resize', fit);
  if (window.ResizeObserver) new ResizeObserver(fit).observe(screen);

  var idx = 0, timer = null, paused = reduced, userPaused = reduced;
  function show(i) {
    idx = i;
    tabs.forEach(function (t, n) { var on = n === i; t.classList.toggle('on', on); t.setAttribute('aria-selected', on); });
    caption.textContent = tabs[i].dataset.cap;
    try { frame.contentWindow.location.hash = tabs[i].dataset.route; } catch (e) { frame.src = 'app.html?tour=1' + tabs[i].dataset.route; }
  }
  function schedule() { clearTimeout(timer); if (!paused) timer = setTimeout(function () { show((idx + 1) % tabs.length); schedule(); }, 6500); }
  function setPaused(p, byUser) { paused = p; if (byUser) userPaused = p; pauseBtn.setAttribute('aria-pressed', userPaused); pauseBtn.textContent = userPaused ? 'Play' : 'Pause'; pauseBtn.setAttribute('aria-label', userPaused ? 'Resume automatic tour' : 'Pause automatic tour'); schedule(); }
  tabs.forEach(function (t, n) { t.addEventListener('click', function () { show(n); setPaused(true, true); }); });
  pauseBtn.addEventListener('click', function () { setPaused(!userPaused, true); });
  var device = document.getElementById('device');
  device.addEventListener('mouseenter', function () { if (!userPaused) setPaused(true, false); });
  device.addEventListener('mouseleave', function () { if (!userPaused) setPaused(false, false); });
  pauseBtn.textContent = userPaused ? 'Play' : 'Pause'; pauseBtn.setAttribute('aria-pressed', userPaused);
  // only start cycling once the tour is on screen
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { if (!userPaused) { paused = false; schedule(); } } else { clearTimeout(timer); } }); }, { threshold: 0.35 }).observe(device);
  } else if (!userPaused) schedule();

  /* mini dot matrix in the stats tile */
  var dots = document.getElementById('miniDots');
  if (dots) { var on = [0, 3, 4, 7, 9, 12, 14, 15, 18, 19, 22, 26, 27, 30, 33, 35, 38, 41, 43, 46, 47]; for (var i = 0; i < 48; i++) { var d = document.createElement('i'); if (on.indexOf(i) > -1) d.className = 'on'; dots.appendChild(d); } }

  /* reveals */
  var targets = [].slice.call(document.querySelectorAll('.lp-intro, .bt, .cmp, .lp-quote, .lp-faq details, .lp-admit, .lp-device, .lp-tabs'));
  targets.forEach(function (el) { el.classList.add('rv'); });
  if (reduced || !('IntersectionObserver' in window)) targets.forEach(function (el) { el.classList.add('in'); });
  else {
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }); }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    targets.forEach(function (el, n) { el.style.transitionDelay = (el.classList.contains('bt') ? (n % 3) * 70 : 0) + 'ms'; io.observe(el); });
  }

  /* gentle pointer parallax on the hero tickets (desktop only, never with reduced motion) */
  var collage = document.getElementById('collage');
  if (collage && !reduced && window.matchMedia('(hover:hover) and (min-width:1081px)').matches) {
    var cards = [].slice.call(collage.querySelectorAll('.ticket')), raf = 0, mx = 0, my = 0;
    window.addEventListener('pointermove', function (e) {
      mx = e.clientX / window.innerWidth - 0.5; my = e.clientY / window.innerHeight - 0.5;
      if (!raf) raf = requestAnimationFrame(function () {
        raf = 0;
        cards.forEach(function (c, n) { var depth = (n + 1) * 6; c.style.transform = 'rotate(' + getComputedStyle(c).getPropertyValue('--r') + ') translate3d(' + (mx * depth).toFixed(1) + 'px,' + (my * depth).toFixed(1) + 'px,0)'; });
      });
    }, { passive: true });
  }
})();
