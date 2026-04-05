export function createSlide01TitleScene({ scene, mode }) {
  let headline = [];
  let support = [];
  let featureCards = [];

  return {
    mount() {
      headline = [
        ...scene.querySelectorAll('.slide-num, .slide-tag'),
        scene.querySelector('h2'),
      ].filter(Boolean);
      support = [
        scene.querySelector('.slide-subtitle-big'),
        scene.querySelector('.slide-body'),
        scene.querySelector('.slide-meta-info'),
        scene.querySelector('.slide-preview')
      ].filter(Boolean);
      featureCards = [...scene.querySelectorAll('.slide-kicker-card')].filter(Boolean);
    },
    enter() {
      if (!window.gsap) return;
      const nodes = [...headline, ...support, ...featureCards].filter(Boolean);
      if (!nodes.length) return;
      gsap.killTweensOf(nodes);
      if (headline.length) {
        gsap.fromTo(
          headline,
          { opacity: 0, y: 10, scale: 0.988, force3D: true },
          { opacity: 1, y: 0, scale: 1, duration: 0.42, ease: 'power3.out', stagger: 0.02, force3D: true, clearProps: 'transform,opacity' }
        );
      }
      if (support.length) {
        gsap.fromTo(
          support,
          { opacity: 0, y: 14, scale: 0.992, force3D: true },
          { opacity: 1, y: 0, scale: 1, duration: 0.5, ease: 'power2.out', stagger: 0.04, delay: 0.08, force3D: true, clearProps: 'transform,opacity' }
        );
      }
      if (featureCards.length) {
        gsap.fromTo(
          featureCards,
          { opacity: 0, y: 18, scale: 0.985, rotateX: -8, filter: 'blur(4px)', force3D: true },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            rotateX: 0,
            filter: 'blur(0px)',
            duration: 0.56,
            ease: 'power3.out',
            stagger: 0.06,
            delay: 0.16,
            force3D: true,
            clearProps: 'transform,opacity,filter'
          }
        );
      }
      if (mode && mode.refs && mode.refs.veil) {
        gsap.fromTo(mode.refs.veil, { opacity: 0 }, { opacity: 0.06, duration: 0.14, yoyo: true, repeat: 1, ease: 'power2.out' });
      }
    },
    exit() {},
    destroy() {}
  };
}
