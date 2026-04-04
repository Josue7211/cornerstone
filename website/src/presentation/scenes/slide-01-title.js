export function createSlide01TitleScene({ scene, mode }) {
  let headline = [];
  let support = [];

  return {
    mount() {
      headline = [
        ...scene.querySelectorAll('.slide-num, .slide-tag'),
        scene.querySelector('h2'),
      ].filter(Boolean);
      support = [
        scene.querySelector('.slide-body'),
        scene.querySelector('.slide-meta-info'),
        scene.querySelector('.slide-preview')
      ].filter(Boolean);
    },
    enter() {
      if (!window.gsap) return;
      const nodes = [...headline, ...support].filter(Boolean);
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
      if (mode && mode.refs && mode.refs.veil) {
        gsap.fromTo(mode.refs.veil, { opacity: 0 }, { opacity: 0.06, duration: 0.14, yoyo: true, repeat: 1, ease: 'power2.out' });
      }
    },
    exit() {},
    destroy() {}
  };
}
