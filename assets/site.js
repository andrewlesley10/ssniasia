/* SSNI Asia — shared behaviour
   One IIFE, every block feature-detected so a page only runs what it has.
   Single light theme: no theme switching. */
(function () {
  'use strict';

  var root = document.documentElement;
  var prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasIO = 'IntersectionObserver' in window;
  var each = function (list, fn) { Array.prototype.forEach.call(list, fn); };

  /* ---------- preloader ----------
     Only present when <head> added .preload (cold open or reload). Hidden
     once the page has loaded, with a safety net so it can never stick. */
  var preloader = document.getElementById('preloader');
  if (preloader && root.classList.contains('preload')) {
    var hidden = false;
    var hidePreloader = function () {
      if (hidden) return;
      hidden = true;
      setTimeout(function () {
        preloader.classList.add('is-hidden');
        setTimeout(function () {
          root.classList.remove('preload');
          if (preloader.parentNode) preloader.parentNode.removeChild(preloader);
        }, prefersReduced ? 0 : 550);
      }, prefersReduced ? 0 : 700);
    };
    var loaded = document.readyState === 'complete'
      ? Promise.resolve()
      : new Promise(function (resolve) { window.addEventListener('load', resolve, { once: true }); });
    var safetyNet = new Promise(function (resolve) { setTimeout(resolve, 4000); });
    Promise.race([loaded, safetyNet]).then(hidePreloader);
  } else if (preloader && preloader.parentNode) {
    preloader.parentNode.removeChild(preloader);
  }

  /* ---------- soft in-page scrolling (respects reduced motion) ---------- */
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href^="#"]');
    if (!a) return;
    var id = a.getAttribute('href').slice(1);
    var target = id && document.getElementById(id);
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({ behavior: prefersReduced ? 'auto' : 'smooth', block: 'start' });
    if (history.replaceState) history.replaceState(null, '', '#' + id);
  });

  /* ---------- mobile nav ---------- */
  var toggle = document.querySelector('.nav-toggle');
  var menu = document.getElementById('site-menu');
  if (toggle && menu) {
    var setOpen = function (open) {
      menu.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    };
    toggle.addEventListener('click', function () { setOpen(!menu.classList.contains('is-open')); });
    menu.addEventListener('click', function (e) { if (e.target.closest('a')) setOpen(false); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && menu.classList.contains('is-open')) { setOpen(false); toggle.focus(); }
    });
  }

  /* ---------- nav: condense on scroll; FAB hides near the footer ---------- */
  var nav = document.querySelector('.site-nav');
  var fab = document.querySelector('.fab');
  var footer = document.querySelector('.site-footer');
  var ticking = false;
  var onScroll = function () {
    ticking = false;
    var y = window.scrollY || window.pageYOffset;
    if (nav) nav.classList.toggle('is-condensed', y > 24);
    if (fab) {
      var nearFooter = footer && footer.getBoundingClientRect().top < window.innerHeight - 40;
      fab.classList.toggle('is-hidden', y < 320 || nearFooter);
    }
  };
  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });
  onScroll();

  /* ---------- home hero carousel ---------- */
  var carousel = document.querySelector('[data-carousel]');
  if (carousel) {
    var slides = Array.prototype.slice.call(carousel.querySelectorAll('.hero__slides > .plate'));
    var dots = Array.prototype.slice.call(carousel.querySelectorAll('.hero__dot'));
    var counter = carousel.querySelector('[data-carousel-current]');
    var idx = 0, timer = null;
    var show = function (n) {
      idx = (n + slides.length) % slides.length;
      slides.forEach(function (s, i) { s.classList.toggle('is-active', i === idx); });
      dots.forEach(function (d, i) {
        d.classList.toggle('is-active', i === idx);
        d.setAttribute('aria-current', i === idx ? 'true' : 'false');
      });
      if (counter) counter.textContent = (idx < 9 ? '0' : '') + (idx + 1);
    };
    var stop = function () { if (timer) clearInterval(timer); timer = null; };
    var start = function () {
      stop();
      if (!prefersReduced) timer = setInterval(function () { show(idx + 1); }, 6000);
    };
    dots.forEach(function (d, i) { d.addEventListener('click', function () { show(i); start(); }); });
    var prev = carousel.querySelector('[data-carousel-prev]');
    var next = carousel.querySelector('[data-carousel-next]');
    if (prev) prev.addEventListener('click', function () { show(idx - 1); start(); });
    if (next) next.addEventListener('click', function () { show(idx + 1); start(); });
    carousel.addEventListener('mouseenter', stop);
    carousel.addEventListener('mouseleave', start);
    carousel.addEventListener('focusin', stop);
    document.addEventListener('visibilitychange', function () { if (document.hidden) stop(); else start(); });
    show(0);
    start();
  }

  /* ---------- count-up figures ([data-stats] > [data-count]) ---------- */
  var fmt = function (el, n) {
    var plain = el.hasAttribute('data-count-plain');
    el.textContent = (plain ? String(n) : n.toLocaleString('en-GB')) + (el.getAttribute('data-suffix') || '');
  };
  var animateCount = function (el) {
    var end = parseInt(el.getAttribute('data-count'), 10);
    if (isNaN(end)) return;
    if (prefersReduced) { fmt(el, end); return; }
    /* years count up from a decade back; small numbers from zero */
    var from = el.hasAttribute('data-count-plain') ? end - 10 : 0;
    var t0 = null, dur = 1400;
    var step = function (ts) {
      if (t0 === null) t0 = ts;
      var p = Math.min(1, (ts - t0) / dur);
      var eased = 1 - Math.pow(1 - p, 3);
      fmt(el, Math.round(from + (end - from) * eased));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  each(document.querySelectorAll('[data-stats]'), function (band) {
    var nums = band.querySelectorAll('[data-count]');
    var ran = false;
    var run = function () { if (ran) return; ran = true; each(nums, animateCount); };
    if (!hasIO) { run(); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { run(); io.disconnect(); } });
    }, { threshold: 0.35 });
    io.observe(band);
  });

  /* ---------- scroll reveal ---------- */
  var revealTargets = document.querySelectorAll(
    'main .section-head, main .kicker + h2, main .card, main .tile, main .dest-card, main .exp-item, ' +
    'main .point, main .services li, main .cta-band, main .co-facts > div, main .faq details, [data-share]'
  );
  if (hasIO && !prefersReduced) {
    var rio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('is-visible'); rio.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    each(revealTargets, function (el, i) {
      if (el.closest('.hero')) return;
      el.classList.add('reveal');
      /* small stagger for siblings in the same grid */
      var sib = el.parentNode ? Array.prototype.indexOf.call(el.parentNode.children, el) : 0;
      el.style.transitionDelay = Math.min(sib, 5) * 60 + 'ms';
      rio.observe(el);
    });
  } else {
    each(document.querySelectorAll('[data-share]'), function (el) { el.classList.add('is-visible'); });
  }

  /* ---------- destinations: category chips filter the groups ---------- */
  var filterRow = document.querySelector('[data-dest-filter]');
  if (filterRow) {
    var groups = document.querySelectorAll('[data-dest-group]');
    var countEl = document.getElementById('dest-count');
    var chips = filterRow.querySelectorAll('[data-filter]');
    var valid = { all: true };
    each(groups, function (g) { valid[g.getAttribute('data-dest-group')] = true; });

    var apply = function (key, push) {
      if (!valid[key]) key = 'all';
      var shown = 0;
      each(groups, function (g) {
        var on = key === 'all' || g.getAttribute('data-dest-group') === key;
        g.hidden = !on;
        if (on) shown += g.querySelectorAll('.dest-card').length;
      });
      each(chips, function (c) { c.setAttribute('aria-pressed', c.getAttribute('data-filter') === key ? 'true' : 'false'); });
      if (countEl) {
        countEl.textContent = key === 'all'
          ? 'Showing all ' + shown + ' destinations'
          : 'Showing ' + shown + ' of ' + document.querySelectorAll('.dest-card').length + ' destinations';
      }
      /* revealed cards inside a just-unhidden group should not stay invisible */
      each(document.querySelectorAll('[data-dest-group]:not([hidden]) .reveal'), function (el) { el.classList.add('is-visible'); });
      if (push && history.replaceState) {
        var url = new URL(window.location.href);
        if (key === 'all') url.searchParams.delete('category'); else url.searchParams.set('category', key);
        url.hash = '';
        history.replaceState(null, '', url.pathname + url.search);
      }
    };
    filterRow.addEventListener('click', function (e) {
      var chip = e.target.closest('[data-filter]');
      if (chip) apply(chip.getAttribute('data-filter'), true);
    });
    var initial = 'all';
    try { initial = new URLSearchParams(window.location.search).get('category') || 'all'; } catch (err) {}
    apply(initial, false);
  }

  /* ---------- FAQ: one panel open at a time ---------- */
  var faq = document.querySelector('[data-faq]');
  if (faq) {
    faq.addEventListener('toggle', function (e) {
      if (!e.target.open) return;
      each(faq.querySelectorAll('details[open]'), function (d) { if (d !== e.target) d.open = false; });
    }, true);
  }
})();
