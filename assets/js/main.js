{
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const root = document.documentElement;
  root.classList.add('js');

  /* Mobile menu */
  const toggle = document.querySelector('.nav__toggle');
  const menu = document.getElementById('menu');
  toggle.addEventListener('click', () => {
    const open = menu.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
  menu.addEventListener('click', (e) => {
    if (e.target.tagName === 'A') { menu.classList.remove('is-open'); toggle.setAttribute('aria-expanded', 'false'); }
  });

  /* Hero entrance */
  requestAnimationFrame(() => root.classList.add('is-loaded'));

  /* Scroll reveal, staggered among siblings */
  const revealObs = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      const el = en.target;
      const sibs = [...el.parentElement.children].filter((c) => c.hasAttribute('data-reveal'));
      el.style.transitionDelay = (Math.max(0, sibs.indexOf(el)) * 90) + 'ms';
      el.classList.add('is-in');
      revealObs.unobserve(el);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  document.querySelectorAll('[data-reveal]').forEach((el) => {
    if (reduce) el.classList.add('is-in'); else revealObs.observe(el);
  });

  /* Count-up for the rating */
  const countObs = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      const el = en.target;
      const target = parseFloat(el.dataset.count);
      countObs.unobserve(el);
      if (reduce) return;
      const t0 = performance.now();
      const dur = 1400;
      const step = (t) => {
        const p = Math.min(1, (t - t0) / dur);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = (target * eased).toFixed(1);
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  }, { threshold: 0.6 });
  document.querySelectorAll('[data-count]').forEach((el) => countObs.observe(el));

  /* Scroll-linked: progress bar, nav state, porthole opening, parallax */
  const progress = document.querySelector('.progress');
  const nav = document.querySelector('.nav');
  const porthole = document.querySelector('.porthole');
  const parallaxImgs = [...document.querySelectorAll('[data-parallax-img], [data-parallax] img')];
  let ticking = false;

  const onScroll = () => {
    ticking = false;
    const y = window.scrollY;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.transform = 'scaleX(' + (max > 0 ? y / max : 0) + ')';
    nav.classList.toggle('is-scrolled', y > 24);
    if (reduce) return;

    const heroMedia = document.querySelector('.hero__media');
    if (heroMedia && y < window.innerHeight * 1.2) heroMedia.style.transform = 'translateY(' + (y * 0.25).toFixed(1) + 'px)';
    if (porthole) {
      const r = porthole.getBoundingClientRect();
      const p = Math.min(1, Math.max(0, 1 - (r.top + r.height * 0.35) / window.innerHeight));
      porthole.style.setProperty('--open', p.toFixed(3));
    }
    const vh = window.innerHeight;
    parallaxImgs.forEach((img) => {
      const r = img.parentElement.getBoundingClientRect();
      if (r.bottom < 0 || r.top > vh) return;
      const mid = (r.top + r.height / 2 - vh / 2) / vh;
      img.style.transform = 'translateY(' + (mid * -36).toFixed(1) + 'px) scale(1.12)';
    });
  };
  window.addEventListener('scroll', () => {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();

  /* Magnetic primary buttons (pointer devices only) */
  if (!reduce && window.matchMedia('(hover: hover)').matches) {
    document.querySelectorAll('.btn--solid, .btn--light').forEach((b) => {
      b.addEventListener('pointermove', (e) => {
        const r = b.getBoundingClientRect();
        const x = (e.clientX - r.left - r.width / 2) * 0.18;
        const y = (e.clientY - r.top - r.height / 2) * 0.28;
        b.style.transform = 'translate(' + x + 'px,' + y + 'px)';
      });
      b.addEventListener('pointerleave', () => { b.style.transform = ''; });
    });
  }

  /* Booking dialog: 3 quick steps, then hand off to the real booking page */
  const dlg = document.getElementById('book');
  const steps = [...dlg.querySelectorAll('.book__step')];
  const dots = [...dlg.querySelectorAll('.book__steps span')];
  const choice = { reason: '', patient: '' };
  let current = 1;

  const show = (n) => {
    current = n;
    steps.forEach((s) => s.classList.toggle('is-active', Number(s.dataset.step) === n));
    dots.forEach((d, i) => d.classList.toggle('is-on', i < n));
    if (n === 3) {
      document.getElementById('book-summary').textContent = choice.reason + ' · ' + choice.patient;
      const urgent = choice.reason.indexOf('emergency') > -1;
      document.getElementById('book-note').textContent = urgent
        ? 'In pain right now? Call us. We fit emergencies in the same day whenever possible.'
        : (choice.patient === 'New patient'
          ? 'Your first visit includes digital X-rays, a full exam and a personal treatment plan. You can fill in your forms online beforehand.'
          : 'Welcome back. Pick a time that suits you and we will have your history ready.');
    }
    const first = dlg.querySelector('.book__step.is-active button, .book__step.is-active a');
    if (first) first.focus({ preventScroll: true });
  };

  document.querySelectorAll('[data-book]').forEach((a) => {
    a.addEventListener('click', (e) => {
      if (typeof dlg.showModal !== 'function') return; // fall back to the real link
      e.preventDefault();
      choice.reason = ''; choice.patient = '';
      dlg.querySelectorAll('[data-pick]').forEach((b) => b.classList.remove('is-picked'));
      show(1);
      dlg.showModal();
    });
  });
  dlg.addEventListener('click', (e) => {
    const pick = e.target.closest('[data-pick]');
    if (pick) {
      choice[pick.dataset.pick] = pick.dataset.value;
      pick.parentElement.querySelectorAll('[data-pick]').forEach((b) => b.classList.toggle('is-picked', b === pick));
      setTimeout(() => show(current + 1), reduce ? 0 : 220);
      return;
    }
    if (e.target.closest('[data-back]')) { show(Math.max(1, current - 1)); return; }
    if (e.target === dlg) dlg.close(); // click on backdrop
  });

  /* ---------- Round 3: mouse-driven imagery ---------- */
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const lerp = (a, b, t) => a + (b - a) * t;
  const mouse = { x: innerWidth / 2, y: innerHeight / 2 };
  window.addEventListener('pointermove', (e) => { mouse.x = e.clientX; mouse.y = e.clientY; }, { passive: true });

  /* Cursor ring with contextual label */
  const cursor = document.querySelector('.cursor');
  const cursorLabel = cursor.querySelector('.cursor__label');
  if (finePointer && !reduce) {
    root.classList.add('has-cursor');
    const c = { x: mouse.x, y: mouse.y };
    const loopCursor = () => {
      c.x = lerp(c.x, mouse.x, 0.22); c.y = lerp(c.y, mouse.y, 0.22);
      cursor.style.translate = c.x + 'px ' + c.y + 'px';
      requestAnimationFrame(loopCursor);
    };
    loopCursor();
    document.addEventListener('pointerover', (e) => {
      const t = e.target.closest('[data-cursor]');
      cursor.classList.toggle('is-big', !!t);
      cursorLabel.textContent = t ? t.dataset.cursor : '';
    });
    document.addEventListener('pointerdown', () => cursor.classList.add('is-down'));
    document.addEventListener('pointerup', () => cursor.classList.remove('is-down'));
    document.addEventListener('pointerleave', () => cursor.classList.remove('is-big'));
  }

  /* Floating image preview over the care list */
  const preview = document.querySelector('.hover-preview');
  const previewImg = preview.querySelector('img');
  if (finePointer && !reduce) {
    const pv = { x: mouse.x, y: mouse.y, vx: 0 };
    let previewOn = false;
    const loopPreview = () => {
      const nx = lerp(pv.x, mouse.x + 200, 0.12);
      pv.vx = nx - pv.x; pv.x = nx; pv.y = lerp(pv.y, mouse.y, 0.12);
      preview.style.translate = pv.x + 'px ' + pv.y + 'px';
      preview.style.rotate = Math.max(-12, Math.min(12, pv.vx * 0.6)) + 'deg';
      if (previewOn) requestAnimationFrame(loopPreview);
    };
    document.querySelectorAll('[data-preview]').forEach((li) => {
      li.addEventListener('pointerenter', () => {
        if (previewImg.getAttribute('src') !== li.dataset.preview) previewImg.src = li.dataset.preview;
        preview.classList.add('is-on');
        if (!previewOn) { previewOn = true; pv.x = mouse.x + 200; pv.y = mouse.y; loopPreview(); }
      });
      li.addEventListener('pointerleave', () => { preview.classList.remove('is-on'); previewOn = false; });
    });
    // preload preview images
    [...new Set([...document.querySelectorAll('[data-preview]')].map((l) => l.dataset.preview))].forEach((src) => { const i = new Image(); i.src = src; });
  }

  /* Tilt + glare on cards and photos */
  if (finePointer && !reduce) {
    document.querySelectorAll('[data-tilt]').forEach((el) => {
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
        el.classList.add('is-tilting');
        el.style.setProperty('--ry', ((px - 0.5) * 10).toFixed(2) + 'deg');
        el.style.setProperty('--rx', ((0.5 - py) * 8).toFixed(2) + 'deg');
        el.style.setProperty('--gx', (px * 100).toFixed(1) + '%');
        el.style.setProperty('--gy', (py * 100).toFixed(1) + '%');
      });
      el.addEventListener('pointerleave', () => {
        el.classList.remove('is-tilting');
        el.style.setProperty('--rx', '0deg'); el.style.setProperty('--ry', '0deg');
      });
    });
  }

  /* Tooth render: the whole stage turns toward the mouse, chips float at different depths */
  const render = document.querySelector('[data-render]');
  if (render && !reduce) {
    const stage = render.querySelector('.render__stage');
    const turn = (px, py) => {
      stage.style.setProperty('--ry', ((px - 0.5) * 16).toFixed(2) + 'deg');
      stage.style.setProperty('--rx', ((0.5 - py) * 12).toFixed(2) + 'deg');
      stage.style.setProperty('--gx', (px * 100).toFixed(1) + '%');
      stage.style.setProperty('--gy', (py * 100).toFixed(1) + '%');
    };
    render.addEventListener('pointermove', (e) => {
      const r = render.getBoundingClientRect();
      render.classList.add('is-live');
      turn((e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height);
    });
    render.addEventListener('pointerleave', () => { render.classList.remove('is-live'); turn(0.5, 0.5); });
    if (!finePointer) {
      // touch screens: gently follow scroll instead
      window.addEventListener('scroll', () => {
        const r = render.getBoundingClientRect();
        const p = Math.min(1, Math.max(0, 1 - r.bottom / (innerHeight + r.height)));
        turn(0.3 + p * 0.4, 0.5);
      }, { passive: true });
    }
  }

  /* Mouse parallax on the Flatiron photo */
  const mp = document.querySelector('[data-mouse-parallax] img');
  if (mp && finePointer && !reduce) {
    const box = mp.closest('[data-mouse-parallax]');
    box.addEventListener('pointermove', (e) => {
      const r = box.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5, py = (e.clientY - r.top) / r.height - 0.5;
      mp.style.translate = (px * -24).toFixed(1) + 'px ' + (py * -24).toFixed(1) + 'px';
    });
    box.addEventListener('pointerleave', () => { mp.style.translate = '0 0'; });
  }

  /* Smile strip: drifts on its own, drag to fling, skews with speed */
  const strip = document.querySelector('.strip');
  if (strip) {
    const track = strip.querySelector('.strip__track');
    const items = [...track.children];
    items.forEach((it) => { const c = it.cloneNode(true); c.setAttribute('aria-hidden', 'true'); track.appendChild(c); });
    const all = [...track.children];
    let x = 0, v = 0, dragging = false, lastX = 0, half = 0, hovering = false;
    const measure = () => { half = track.scrollWidth / 2; };
    measure(); window.addEventListener('resize', measure);
    window.addEventListener('load', measure);
    const auto = reduce ? 0 : -0.45;
    const tick = () => {
      if (!dragging) { v = lerp(v, hovering ? 0 : auto, 0.04); x += v; }
      if (half > 0) { if (x <= -half) x += half; if (x > 0) x -= half; }
      track.style.transform = 'translate3d(' + x.toFixed(2) + 'px,0,0)';
      const skew = reduce ? 0 : Math.max(-8, Math.min(8, v * 0.6));
      all.forEach((it) => it.style.setProperty('--skew', skew.toFixed(2) + 'deg'));
      requestAnimationFrame(tick);
    };
    tick();
    strip.addEventListener('pointerenter', () => { hovering = true; });
    strip.addEventListener('pointerleave', () => { hovering = false; dragging = false; strip.classList.remove('is-dragging'); });
    strip.addEventListener('pointerdown', (e) => { dragging = true; lastX = e.clientX; v = 0; strip.classList.add('is-dragging'); strip.setPointerCapture(e.pointerId); });
    strip.addEventListener('pointermove', (e) => { if (!dragging) return; const dx = e.clientX - lastX; lastX = e.clientX; x += dx; v = dx; });
    const end = () => { dragging = false; strip.classList.remove('is-dragging'); };
    strip.addEventListener('pointerup', end); strip.addEventListener('pointercancel', end);
    strip.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') { v = -18; e.preventDefault(); }
      if (e.key === 'ArrowLeft') { v = 18; e.preventDefault(); }
    });
  }
}
