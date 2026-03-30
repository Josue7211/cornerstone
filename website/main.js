// ═══════════════════════════════════════════
// FROM PIXELS TO INTELLIGENCE
// GSAP ScrollTrigger Animations
// ═══════════════════════════════════════════

gsap.registerPlugin(ScrollTrigger);

// ─── GPU Core Visualization ───
(function buildGpuCores() {
  const viz = document.getElementById('gpuViz');
  if (!viz) return;
  for (let i = 0; i < 256; i++) {
    const core = document.createElement('div');
    core.className = 'core core--tiny';
    viz.appendChild(core);
  }
})();

// ─── Scroll Progress Bar ───
gsap.to('#progressBar', {
  width: '100%',
  ease: 'none',
  scrollTrigger: {
    trigger: 'body',
    start: 'top top',
    end: 'bottom bottom',
    scrub: 0.3
  }
});

// ─── Nav Reveal on Scroll ───
ScrollTrigger.create({
  trigger: '#hook',
  start: 'top 80%',
  onEnter: () => document.getElementById('nav').classList.add('visible'),
  onLeaveBack: () => document.getElementById('nav').classList.remove('visible')
});

// ─── Hero Entrance ───
const heroTl = gsap.timeline({ delay: 0.3 });
heroTl
  .fromTo('.hero-tag', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' })
  .fromTo('.title-line', { opacity: 0, y: 60 }, { opacity: 1, y: 0, duration: 1, stagger: 0.15, ease: 'power3.out' }, '-=0.4')
  .fromTo('.hero-sub', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' }, '-=0.5')
  .fromTo('.hero-author', { opacity: 0 }, { opacity: 1, duration: 0.6 }, '-=0.3')
  .fromTo('.scroll-cta', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.8 }, '-=0.2');

// ─── Scroll-Triggered Reveals ───
document.querySelectorAll('[data-reveal]').forEach(el => {
  gsap.fromTo(el,
    { opacity: 0, y: 30 },
    {
      opacity: 1,
      y: 0,
      duration: 0.9,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: el,
        start: 'top 85%',
        once: true
      }
    }
  );
});

// ─── Stat Counter Animation ───
document.querySelectorAll('[data-count]').forEach(counter => {
  const target = parseInt(counter.dataset.count, 10);
  gsap.fromTo(counter, { innerText: 0 }, {
    innerText: target,
    duration: 2,
    ease: 'power2.out',
    snap: { innerText: 1 },
    scrollTrigger: {
      trigger: counter,
      start: 'top 80%',
      once: true
    }
  });
});

// ─── GPU Cores Cascade Animation ───
ScrollTrigger.create({
  trigger: '#gpuViz',
  start: 'top 75%',
  once: true,
  onEnter: () => {
    const cores = document.querySelectorAll('.core--tiny');
    cores.forEach((core, i) => {
      setTimeout(() => {
        core.style.opacity = '0.7';
      }, i * 8);
    });
  }
});

// ─── CPU Core Pulse ───
ScrollTrigger.create({
  trigger: '.cpu-viz',
  start: 'top 75%',
  once: true,
  onEnter: () => {
    gsap.from('.core--big', {
      scale: 0,
      opacity: 0,
      duration: 0.5,
      stagger: 0.08,
      ease: 'back.out(1.7)'
    });
  }
});

// ─── Timeline Items Stagger ───
gsap.utils.toArray('.timeline-item').forEach((item, i) => {
  gsap.from(item, {
    opacity: 0,
    x: -30,
    duration: 0.8,
    ease: 'power3.out',
    scrollTrigger: {
      trigger: item,
      start: 'top 80%',
      once: true
    }
  });
});

// ─── Thesis Block Glow Pulse ───
ScrollTrigger.create({
  trigger: '.thesis-block',
  start: 'top 70%',
  once: true,
  onEnter: () => {
    gsap.from('.thesis-block', {
      scale: 0.95,
      opacity: 0,
      duration: 1.2,
      ease: 'power3.out'
    });
    gsap.from('.thesis-final', {
      opacity: 0,
      y: 20,
      duration: 1,
      delay: 0.5,
      ease: 'power3.out'
    });
  }
});

// ─── Figure Cards Stagger ───
ScrollTrigger.create({
  trigger: '.figures-grid',
  start: 'top 75%',
  once: true,
  onEnter: () => {
    gsap.from('.figure-card', {
      opacity: 0,
      y: 40,
      duration: 0.7,
      stagger: 0.1,
      ease: 'power3.out'
    });
  }
});

// ─── Chip Cards Hover Tilt (subtle) ───
document.querySelectorAll('.chip-card, .figure-card').forEach(card => {
  card.addEventListener('mousemove', e => {
    const rect = card.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    card.style.transform = `translateY(-4px) rotateX(${y * -5}deg) rotateY(${x * 5}deg)`;
  });
  card.addEventListener('mouseleave', () => {
    card.style.transform = '';
  });
});

// ─── Smooth Anchor Scrolling ───
document.querySelectorAll('.nav-links a').forEach(link => {
  link.addEventListener('click', e => {
    e.preventDefault();
    const target = document.querySelector(link.getAttribute('href'));
    if (target) {
      gsap.to(window, { scrollTo: { y: target, offsetY: 60 }, duration: 1, ease: 'power3.inOut' });
    }
  });
});
