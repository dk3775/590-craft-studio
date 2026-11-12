/* ==========================================================================
   590 Craft Studio — lightweight building journey (mobile / reduced motion / no WebGL)
   Uses the inline SVG building in index.html (#lite-svg). No WebGL is created.
   Each .step card has a ScrollTrigger; when it becomes active the SVG pans and
   zooms to that product's hotspot.
   ========================================================================== */

const CENTER = { x: 210, y: 200 };   // where the active hotspot is brought to (viewBox units)
const ZOOM = 1.9;

export function initLiteJourney({ gsap, ScrollTrigger, reduceMotion }) {
  const world = document.getElementById('lite-world');
  const steps = [...document.querySelectorAll('.journey .step')];
  if (!world || !steps.length) return () => {};

  const spots = {};
  document.querySelectorAll('#lite-svg .lite-hs').forEach((g) => {
    const dot = g.querySelector('.lite-hs__dot');
    spots[g.dataset.hs] = { g, x: +dot.getAttribute('cx'), y: +dot.getAttribute('cy') };
  });

  let current = null;
  function setActive(id) {
    if (id === current) return;
    current = id;
    Object.entries(spots).forEach(([k, s]) => s.g.classList.toggle('is-active', k === id));
    const s = spots[id];
    const vars = s
      ? { x: CENTER.x - s.x * ZOOM, y: CENTER.y - s.y * ZOOM, scale: ZOOM }
      : { x: 0, y: 0, scale: 1 };
    if (reduceMotion) gsap.set(world, { ...vars, svgOrigin: '0 0' });
    else gsap.to(world, { ...vars, svgOrigin: '0 0', duration: 0.9, ease: 'power2.inOut', overwrite: 'auto' });
  }
  setActive('intro');

  steps.forEach((step) => {
    const id = step.dataset.step;
    ScrollTrigger.create({
      trigger: step,
      start: 'top 65%',
      end: 'bottom 65%',
      onToggle: (self) => { if (self.isActive) setActive(id); },
      onLeaveBack: () => { if (step === steps[1]) setActive('intro'); },
    });
    const card = step.querySelector('.step__card');
    if (!reduceMotion && id !== 'intro') {
      gsap.from(card, {
        y: 46, autoAlpha: 0, duration: 0.8, ease: 'power3.out',
        scrollTrigger: { trigger: step, start: 'top 85%', toggleActions: 'play none none reverse' },
      });
      gsap.from(card.querySelectorAll('.chips li'), {
        y: 10, autoAlpha: 0, duration: 0.5, ease: 'power2.out', stagger: 0.04,
        scrollTrigger: { trigger: step, start: 'top 75%', toggleActions: 'play none none reverse' },
      });
    }
  });

  return () => {
    gsap.set(world, { clearProps: 'transform' });
    world.removeAttribute('transform');
    Object.values(spots).forEach((s) => s.g.classList.remove('is-active'));
  };
}
