// ═══ GSAP + ScrollTrigger Animations ═══

gsap.registerPlugin(ScrollTrigger);

// ─── Hero animations (on load) ───
gsap.timeline({ delay: 0.3 })
  .to('[data-anim="line"]', {
    y: 0,
    clipPath: 'inset(0 0 0% 0)',
    duration: 1,
    stagger: 0.2,
    ease: 'power3.out'
  })
  .to('.hero-sub, .hero-author', {
    opacity: 1,
    duration: 0.8,
    stagger: 0.15,
    ease: 'power2.out'
  }, '-=0.4')
  .to('.scroll-hint', {
    opacity: 1,
    duration: 0.6,
    ease: 'power2.out'
  }, '-=0.2');

// ─── Scroll-triggered animations ───
const sections = document.querySelectorAll('.section');

sections.forEach(section => {
  const elements = section.querySelectorAll('[data-anim]');

  elements.forEach((el, i) => {
    const anim = el.dataset.anim;
    const props = { opacity: 1, duration: 0.8, ease: 'power2.out' };

    if (anim === 'slide-up') {
      props.y = 0;
    } else if (anim === 'slide-right') {
      props.x = 0;
    } else if (anim === 'scale') {
      props.scale = 1;
    }

    gsap.to(el, {
      ...props,
      scrollTrigger: {
        trigger: el,
        start: 'top 85%',
        toggleActions: 'play none none none'
      },
      delay: i * 0.1
    });
  });
});

// ─── Animated number counters ───
document.querySelectorAll('[data-count]').forEach(el => {
  const target = parseInt(el.dataset.count);

  ScrollTrigger.create({
    trigger: el,
    start: 'top 80%',
    onEnter: () => {
      gsap.to({ val: 0 }, {
        val: target,
        duration: 2,
        ease: 'power2.out',
        onUpdate: function () {
          el.textContent = Math.round(this.targets()[0].val);
        }
      });
    },
    once: true
  });
});

// ─── GPU cores visualization ───
const gpuCoresContainer = document.querySelector('.gpu-cores');
if (gpuCoresContainer) {
  for (let i = 0; i < 120; i++) {
    const core = document.createElement('div');
    core.className = 'core';
    gpuCoresContainer.appendChild(core);
  }
}

// ─── Timeline line animation ───
const timelineLine = document.querySelector('.timeline-line');
if (timelineLine) {
  gsap.fromTo(timelineLine,
    { scaleY: 0, transformOrigin: 'top center' },
    {
      scaleY: 1,
      duration: 1.5,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: '.timeline',
        start: 'top 70%',
        toggleActions: 'play none none none'
      }
    }
  );
}

// ─── Parameter bars animation ───
document.querySelectorAll('.param-bar').forEach(bar => {
  const width = bar.style.getPropertyValue('--width');
  bar.style.width = '0%';

  ScrollTrigger.create({
    trigger: bar,
    start: 'top 85%',
    onEnter: () => {
      gsap.to(bar, { width: width, duration: 1.5, ease: 'power2.out' });
    },
    once: true
  });
});

// ─── Parallax on hero background ───
gsap.to('.hero-bg', {
  yPercent: 30,
  ease: 'none',
  scrollTrigger: {
    trigger: '.hero',
    start: 'top top',
    end: 'bottom top',
    scrub: true
  }
});

// ─── Chip cards stagger ───
ScrollTrigger.create({
  trigger: '.chip-grid',
  start: 'top 80%',
  onEnter: () => {
    gsap.to('.chip-card', {
      opacity: 1,
      y: 0,
      duration: 0.6,
      stagger: 0.15,
      ease: 'power2.out'
    });
  },
  once: true
});

// Set initial state for chip cards
gsap.set('.chip-card', { opacity: 0, y: 30 });
