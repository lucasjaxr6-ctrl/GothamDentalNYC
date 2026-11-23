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
}
