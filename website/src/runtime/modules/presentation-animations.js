export function animatePresSlides(panel) {
  if (typeof gsap === 'undefined') return;
  const scrollContainer = panel.querySelector('.panel-scroll');
  if (!scrollContainer) return;

  // Header entrance
  const header = panel.querySelector('.pres-header');
  if (header) {
    gsap.fromTo(header, { opacity: 0, y: -40, scale: 0.95 },
      { opacity: 1, y: 0, scale: 1, duration: 0.8, ease: 'power3.out' });
  }

  // Each slide gets a unique entrance animation on scroll
  const slides = panel.querySelectorAll('.pres-slide');
  const animations = [
    // Slide 1: Title — fade up with scale
    (el) => { gsap.fromTo(el, { opacity: 0, y: 60, scale: 0.9 }, { opacity: 1, y: 0, scale: 1, duration: 0.7, ease: 'back.out(1.4)' }); },
    // Slide 2: Intro — slide from left
    (el) => { gsap.fromTo(el, { opacity: 0, x: -80 }, { opacity: 1, x: 0, duration: 0.6, ease: 'power3.out' }); },
    // Slide 3: RQs — stagger children
    (el) => {
      gsap.fromTo(el, { opacity: 0 }, { opacity: 1, duration: 0.3 });
      const items = el.querySelectorAll('.rq-item, .slide-methods');
      gsap.fromTo(items, { opacity: 0, y: 30, rotateX: -15 }, { opacity: 1, y: 0, rotateX: 0, duration: 0.5, stagger: 0.12, ease: 'power2.out', delay: 0.2 });
    },
    // Slide 4: Perspective — slide from right
    (el) => {
      gsap.fromTo(el, { opacity: 0 }, { opacity: 1, duration: 0.3 });
      const items = el.querySelectorAll('.persp-item');
      gsap.fromTo(items, { opacity: 0, x: 60 }, { opacity: 1, x: 0, duration: 0.5, stagger: 0.15, ease: 'power3.out', delay: 0.1 });
    },
    // Slide 5: Transdisciplinary — tags pop in, connections slide up
    (el) => {
      gsap.fromTo(el, { opacity: 0 }, { opacity: 1, duration: 0.3 });
      const tags = el.querySelectorAll('.discipline-tag');
      gsap.fromTo(tags, { opacity: 0, scale: 0, rotation: -10 }, { opacity: 1, scale: 1, rotation: 0, duration: 0.4, stagger: 0.06, ease: 'back.out(2)', delay: 0.1 });
      const conns = el.querySelectorAll('.connection-item');
      gsap.fromTo(conns, { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.5, stagger: 0.1, ease: 'power2.out', delay: 0.5 });
    },
    // Slide 6: Implications — cards flip in
    (el) => {
      gsap.fromTo(el, { opacity: 0 }, { opacity: 1, duration: 0.3 });
      const items = el.querySelectorAll('.impl-item');
      gsap.fromTo(items, { opacity: 0, rotateY: -30, x: -30 }, { opacity: 1, rotateY: 0, x: 0, duration: 0.6, stagger: 0.12, ease: 'power3.out', delay: 0.15 });
      const thesis = el.querySelector('.slide-thesis');
      if (thesis) gsap.fromTo(thesis, { opacity: 0, scale: 0.8 }, { opacity: 1, scale: 1, duration: 0.8, ease: 'elastic.out(1, 0.5)', delay: 0.8 });
    },
    // Slide 7: Advocacy — points count up
    (el) => {
      gsap.fromTo(el, { opacity: 0 }, { opacity: 1, duration: 0.3 });
      const points = el.querySelectorAll('.advocacy-point');
      gsap.fromTo(points, { opacity: 0, x: -40 }, { opacity: 1, x: 0, duration: 0.5, stagger: 0.15, ease: 'power2.out', delay: 0.15 });
    },
    // Slide 8: Preparing — cards cascade down
    (el) => {
      gsap.fromTo(el, { opacity: 0 }, { opacity: 1, duration: 0.3 });
      const items = el.querySelectorAll('.prep-item');
      gsap.fromTo(items, { opacity: 0, y: -30, scale: 0.95 }, { opacity: 1, y: 0, scale: 1, duration: 0.5, stagger: 0.12, ease: 'power2.out', delay: 0.1 });
    },
    // Slide 9: Reflection — thesis pulses, reflections fade in
    (el) => {
      gsap.fromTo(el, { opacity: 0 }, { opacity: 1, duration: 0.3 });
      const thesis = el.querySelector('.slide-thesis');
      if (thesis) {
        gsap.fromTo(thesis, { opacity: 0, scale: 0.7, filter: 'blur(10px)' },
          { opacity: 1, scale: 1, filter: 'blur(0px)', duration: 1, ease: 'power3.out', delay: 0.1 });
      }
      const refs = el.querySelectorAll('.reflection-item');
      gsap.fromTo(refs, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5, stagger: 0.15, ease: 'power2.out', delay: 0.6 });
      const qa = el.querySelector('.slide-qa');
      if (qa) gsap.fromTo(qa, { opacity: 0, scale: 0.9 }, { opacity: 1, scale: 1, duration: 0.6, ease: 'back.out(1.4)', delay: 1.2 });
    },
  ];

  // Set all slides to invisible initially
  slides.forEach(s => { s.style.opacity = '0'; });

  // Use IntersectionObserver to trigger animations on scroll
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const slide = entry.target;
      const idx = Array.from(slides).indexOf(slide);
      if (idx >= 0 && idx < animations.length) {
        animations[idx](slide);
      } else {
        gsap.fromTo(slide, { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' });
      }
      observer.unobserve(slide);
    });
  }, { root: scrollContainer, threshold: 0.15 });

  slides.forEach(s => observer.observe(s));

  // Trigger first slide immediately (it's already in view)
  if (slides[0]) {
    setTimeout(() => animations[0](slides[0]), 100);
    observer.unobserve(slides[0]);
  }
}
