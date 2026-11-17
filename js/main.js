/* ==========================================================================
   590 Craft Studio — main script
   - Applies business details from js/config.js (WhatsApp, phone, email)
   - gsap.matchMedia(): desktop 3D journey vs lightweight journey
   - ScrollTrigger: pinned + scrubbed 3D journey with snap-to-step, reveals
   - Quote form → WhatsApp prefill + Netlify Forms background submit
   GSAP core + ScrollTrigger only (no Club plugins).
   ========================================================================== */
import { BUSINESS, waLink } from './config.js';
import { WORK_PHOTOS, WORK_CATEGORIES } from './photos.js';
import { initLiteJourney } from './mobile-scene.js';

const root = document.documentElement;
const { gsap, ScrollTrigger } = window;

/* ---------------- business details ---------------- */
function applyBusinessDetails() {
  document.querySelectorAll('[data-wa]').forEach((a) => {
    a.href = waLink(a.dataset.waText || BUSINESS.defaultWhatsAppMessage);
  });
  document.querySelectorAll('[data-phone]').forEach((a) => { a.href = `tel:${BUSINESS.phoneHref}`; a.textContent = BUSINESS.phoneDisplay; });
  document.querySelectorAll('[data-email]').forEach((a) => { a.href = `mailto:${BUSINESS.email}`; a.textContent = BUSINESS.email; });
  document.querySelectorAll('[data-instagram]').forEach((a) => { a.href = BUSINESS.instagramUrl; });
  document.querySelectorAll('[data-year]').forEach((el) => { el.textContent = new Date().getFullYear(); });
}

/* ---------------- project photos + gallery + lightbox ---------------- */
function loadProjectPhotos() {
  const on = BUSINESS.useProjectPhotos;
  document.querySelectorAll('.photo-row, #work').forEach((el) => { el.hidden = !on; });
  if (on) initWorkGallery();
}

function initWorkGallery() {
  const grid = document.getElementById('work-grid');
  const filters = document.querySelector('.work__filters');
  if (!grid || !filters) {
    initLightbox();
    return;
  }

  filters.innerHTML = '';
  WORK_CATEGORIES.forEach((cat, i) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'work__filter';
    btn.dataset.cat = cat.id;
    btn.textContent = cat.label;
    btn.setAttribute('aria-pressed', i === 0 ? 'true' : 'false');
    filters.appendChild(btn);
  });

  const render = (cat) => {
    const items = cat === 'all' ? WORK_PHOTOS : WORK_PHOTOS.filter((p) => p.cat === cat);
    grid.replaceChildren();
    items.forEach((p) => {
      const a = document.createElement('a');
      a.className = 'work__item js-work-photo';
      a.href = p.src;
      a.dataset.workId = p.id;
      a.setAttribute('aria-label', `${p.caption}: ${p.alt}`);
      const img = document.createElement('img');
      img.src = p.thumb;
      img.alt = p.alt;
      img.width = p.tw;
      img.height = p.th;
      img.loading = 'lazy';
      img.decoding = 'async';
      const cap = document.createElement('span');
      cap.className = 'work__caption';
      cap.textContent = p.caption;
      a.append(img, cap);
      grid.appendChild(a);
    });
  };

  filters.addEventListener('click', (e) => {
    const btn = e.target.closest('.work__filter');
    if (!btn) return;
    filters.querySelectorAll('.work__filter').forEach((b) => b.setAttribute('aria-pressed', b === btn ? 'true' : 'false'));
    render(btn.dataset.cat);
  });

  render('all');
  initLightbox();
}

function initLightbox() {
  const root = document.getElementById('lightbox');
  if (!root) return;
  const imgEl = root.querySelector('.lightbox__img');
  const capEl = root.querySelector('.lightbox__caption');
  const dialog = root.querySelector('.lightbox__dialog');
  let index = 0;
  let lastFocus = null;

  const list = () => WORK_PHOTOS;

  const show = (i) => {
    const photos = list();
    if (!photos.length) return;
    index = (i + photos.length) % photos.length;
    const p = photos[index];
    imgEl.src = p.src;
    imgEl.alt = p.alt;
    imgEl.width = p.width;
    imgEl.height = p.height;
    capEl.textContent = p.caption;
  };

  const open = (id) => {
    const photos = list();
    const found = photos.findIndex((p) => p.id === id);
    lastFocus = document.activeElement;
    root.hidden = false;
    document.body.classList.add('is-lightbox');
    show(found >= 0 ? found : 0);
    root.querySelector('[data-lightbox-close]')?.focus();
  };

  const close = () => {
    if (root.hidden) return;
    root.hidden = true;
    imgEl.removeAttribute('src');
    document.body.classList.remove('is-lightbox');
    if (lastFocus && typeof lastFocus.focus === 'function') lastFocus.focus();
  };

  document.addEventListener('click', (e) => {
    const link = e.target.closest('.js-work-photo');
    if (!link) return;
    const id = link.dataset.workId;
    if (!id) return;
    e.preventDefault();
    open(id);
  });

  root.addEventListener('click', (e) => {
    if (e.target === root || e.target.closest('[data-lightbox-close]')) close();
  });
  root.querySelector('[data-lightbox-prev]')?.addEventListener('click', (e) => { e.stopPropagation(); show(index - 1); });
  root.querySelector('[data-lightbox-next]')?.addEventListener('click', (e) => { e.stopPropagation(); show(index + 1); });

  document.addEventListener('keydown', (e) => {
    if (root.hidden) return;
    if (e.key === 'Escape') close();
    else if (e.key === 'ArrowLeft') show(index - 1);
    else if (e.key === 'ArrowRight') show(index + 1);
    else if (e.key === 'Tab' && dialog) {
      const focusable = [...dialog.querySelectorAll('button')];
      if (!focusable.length) return;
      const first = focusable[0], last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
}

/* ---------------- mobile nav ---------------- */
function initNav() {
  const btn = document.querySelector('.nav-toggle');
  const nav = document.getElementById('site-nav');
  if (!btn || !nav) return;
  const set = (open) => { btn.setAttribute('aria-expanded', String(open)); nav.classList.toggle('is-open', open); };
  btn.addEventListener('click', () => set(btn.getAttribute('aria-expanded') !== 'true'));
  nav.addEventListener('click', (e) => { if (e.target.closest('a')) set(false); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && nav.classList.contains('is-open')) { set(false); btn.focus(); } });
}

/* ---------------- quote form ---------------- */
function initForm() {
  const form = document.getElementById('quote-form');
  if (!form) return;
  const status = document.getElementById('form-status');
  const name = form.elements.name, phone = form.elements.phone;

  const setErr = (input, msg) => {
    const err = document.getElementById(`${input.id}-err`);
    input.setAttribute('aria-invalid', msg ? 'true' : 'false');
    if (err) err.textContent = msg || '';
  };
  const validate = () => {
    let ok = true;
    if (!name.value.trim()) { setErr(name, 'Please enter your name.'); ok = false; } else setErr(name, '');
    const digits = phone.value.replace(/\D/g, '');
    if (digits.length < 10 || digits.length > 13) { setErr(phone, 'Please enter a valid 10-digit mobile number.'); ok = false; } else setErr(phone, '');
    return ok;
  };
  [name, phone].forEach((el) => el.addEventListener('blur', () => { if (el.value) validate(); }));

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (form.elements['bot-field']?.value) return;
    if (!validate()) { form.querySelector('[aria-invalid="true"]')?.focus(); return; }

    const d = new FormData(form);
    const lines = [
      `Hi ${BUSINESS.name}, I'd like a quote.`,
      `Name: ${d.get('name').trim()}`,
      `Phone: ${d.get('phone').trim()}`,
      `City: ${d.get('city')}`,
      `Interested in: ${d.get('product')}`,
    ];
    const msg = (d.get('message') || '').trim();
    if (msg) lines.push(`Message: ${msg}`);
    const url = waLink(lines.join('\n'));

    // 1) open WhatsApp synchronously (inside the click) so pop-up blockers allow it
    const win = window.open(url, '_blank');
    if (win) win.opener = null; else window.location.href = url;

    // 2) send a copy to Netlify Forms in the background (only on a deployed site)
    const local = /^(localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\])$/.test(location.hostname) || location.protocol === 'file:';
    if (!local) {
      fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(d).toString(),
        keepalive: true,
      }).catch(() => {});
    }
    status.textContent = 'WhatsApp opened with your details — just press send. Thank you!';
  });
}

/* ---------------- reveals + active nav ---------------- */
function initReveals(reduce) {
  const items = gsap.utils.toArray('.reveal');
  if (reduce) return;
  gsap.set(items, { autoAlpha: 0, y: 36 });
  ScrollTrigger.batch(items, {
    start: 'top 88%',
    once: true,
    onEnter: (batch) => gsap.to(batch, { autoAlpha: 1, y: 0, duration: 0.9, ease: 'power3.out', stagger: 0.1, overwrite: true }),
  });
}
function initActiveNav() {
  const links = [...document.querySelectorAll('.site-nav a[href^="#"]')];
  links.forEach((a) => {
    const sec = document.querySelector(a.getAttribute('href'));
    if (!sec) return;
    ScrollTrigger.create({
      trigger: sec, start: 'top 50%', end: 'bottom 50%',
      onToggle: (self) => (self.isActive ? a.setAttribute('aria-current', 'true') : a.removeAttribute('aria-current')),
    });
  });
}

/* ---------------- desktop 3D journey ---------------- */
async function init3D(ctx, state) {
  const journey = document.getElementById('journey');
  const sceneRoot = document.getElementById('scene-root');
  const hotspotLayer = document.getElementById('hotspots');
  const rail = document.getElementById('journey-rail');
  const steps = gsap.utils.toArray('.journey .step');
  const ids = steps.map((s) => s.dataset.step);

  // fonts first so canvas-drawn sign text uses the right typeface
  await Promise.race([document.fonts?.ready, new Promise((r) => setTimeout(r, 1500))]);
  const mod = await import('./building-scene.js');
  if (state.cancelled) return;

  // hotspot buttons (keyboard accessible; click scrolls to the step)
  const hotspotEls = {};
  steps.forEach((step) => {
    const id = step.dataset.step;
    if (id === 'intro') return;
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'hotspot'; b.tabIndex = -1;
    b.innerHTML = `<span class="hotspot__dot" aria-hidden="true"></span><span class="hotspot__label">${step.dataset.label}</span>`;
    b.setAttribute('aria-label', `Show ${step.dataset.label}`);
    hotspotLayer.appendChild(b);
    hotspotEls[id] = b;
  });
  rail.innerHTML = ids.map(() => '<li></li>').join('');
  const dots = [...rail.children];

  const scene = await mod.createBuildingScene(sceneRoot, { hotspotEls });
  if (state.cancelled) { scene.dispose(); return; }
  state.scene = scene;
  sceneRoot.classList.add('is-ready');

  ctx.add(() => {
    // intro dolly-in
    gsap.to(scene.intro, { k: 0, duration: 2.6, ease: 'power3.out' });
    gsap.from('.step--intro .step__card > *', { y: 30, autoAlpha: 0, duration: 1, ease: 'power3.out', stagger: 0.08, delay: 0.2 });

    gsap.set(steps.slice(1), { autoAlpha: 0 });
    let activeIdx = -1;
    const setIdx = (i) => {
      if (i === activeIdx) return;
      activeIdx = i;
      scene.setActive(ids[i]);
      dots.forEach((d, k) => d.classList.toggle('is-active', k === i));
      steps.forEach((s, k) => s.setAttribute('aria-hidden', String(k !== i)));
    };
    setIdx(0);

    const tl = gsap.timeline({
      defaults: { ease: 'power2.inOut' },
      onUpdate: () => setIdx(Math.round(tl.time())),   // timeline time (after scrub smoothing)
      scrollTrigger: {
        trigger: journey,
        start: 'top top',
        end: () => `+=${Math.round(window.innerHeight * 0.85 * (ids.length - 1))}`,
        pin: true,
        scrub: 0.7,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        snap: { snapTo: 'labels', duration: { min: 0.25, max: 0.8 }, delay: 0.08, ease: 'power1.inOut', inertia: false },
      },
    });
    tl.addLabel(ids[0], 0);
    for (let i = 1; i < ids.length; i++) {
      const t0 = i - 1;
      tl.to(scene.cam, { ...mod.VIEWS[ids[i]], duration: 1 }, t0);
      tl.to(steps[i - 1], { autoAlpha: 0, y: -24, duration: 0.3, ease: 'power1.in' }, t0 + 0.02);
      tl.fromTo(steps[i], { autoAlpha: 0, y: 28 }, { autoAlpha: 1, y: 0, duration: 0.35, ease: 'power2.out', immediateRender: false }, t0 + 0.6);
      tl.addLabel(ids[i], i);
    }

    // hotspot click → scroll to that step
    Object.entries(hotspotEls).forEach(([id, el]) => {
      el.addEventListener('click', () => window.scrollTo({ top: tl.scrollTrigger.labelToScroll(id), behavior: 'smooth' }));
    });

    // render only while the journey is on screen
    ScrollTrigger.create({
      trigger: journey,
      start: 'top bottom',
      end: () => tl.scrollTrigger.end + window.innerHeight,
      refreshPriority: -1,
      onToggle: (self) => (self.isActive ? scene.start() : scene.stop()),
    });
    if (window.scrollY < tl.scrollTrigger.end + window.innerHeight) scene.start();
  });
  ScrollTrigger.refresh();
}

function cleanup3D(state) {
  state.cancelled = true;
  state.scene?.dispose();
  document.getElementById('hotspots').innerHTML = '';
  document.getElementById('journey-rail').innerHTML = '';
  document.getElementById('scene-root').classList.remove('is-ready');
  document.querySelectorAll('.journey .step').forEach((s) => s.removeAttribute('aria-hidden'));
}

/* ---------------- boot ---------------- */
function boot() {
  applyBusinessDetails();
  loadProjectPhotos();
  initNav();
  initForm();

  if (!gsap || !ScrollTrigger) {           // CDN blocked: page still fully usable (lite layout, static)
    root.setAttribute('data-mode', 'lite');
    return;
  }
  gsap.registerPlugin(ScrollTrigger);
  ScrollTrigger.config({ ignoreMobileResize: true });

  const mm = gsap.matchMedia();
  mm.add(
    {
      wide: '(min-width: 900px) and (min-height: 560px)',
      narrow: '(max-width: 899px), (max-height: 559px)',
      reduce: '(prefers-reduced-motion: reduce)',
      motionOK: '(prefers-reduced-motion: no-preference)',
    },
    (ctx) => {
      const { wide, reduce } = ctx.conditions;
      const use3d = window.__ALU_CAN_3D && wide && !reduce;
      root.setAttribute('data-mode', use3d ? '3d' : 'lite');
      const state = { cancelled: false, scene: null };
      let liteCleanup = null;

      if (use3d) {
        init3D(ctx, state).catch((err) => {
          console.warn('[590 Craft Studio] 3D scene unavailable, using lightweight version.', err);
          if (state.cancelled) return;
          cleanup3D(state);
          state.cancelled = false;
          root.setAttribute('data-mode', 'lite');
          ctx.add(() => { liteCleanup = initLiteJourney({ gsap, ScrollTrigger, reduceMotion: reduce }); });
          ScrollTrigger.refresh();
        });
      } else {
        liteCleanup = initLiteJourney({ gsap, ScrollTrigger, reduceMotion: reduce });
      }
      initReveals(reduce);
      initActiveNav();

      return () => { cleanup3D(state); liteCleanup && liteCleanup(); };
    }
  );

  // fonts / late layout changes shift trigger positions
  document.fonts?.ready.then(() => ScrollTrigger.refresh());
  window.addEventListener('load', () => ScrollTrigger.refresh(), { once: true });
}

boot();
