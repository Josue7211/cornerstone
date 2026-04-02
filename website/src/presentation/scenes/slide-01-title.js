export function createSlide01TitleScene({ scene, mode }) {
  let nodes = [];

  return {
    mount() {
      nodes = [
        ...scene.querySelectorAll('.slide-num, .slide-tag'),
        scene.querySelector('h2'),
        scene.querySelector('.slide-body'),
        scene.querySelector('.slide-meta-info'),
        scene.querySelector('.slide-preview')
      ].filter(Boolean);
    },
    enter() {
      if (!window.gsap || !nodes.length) return;
      gsap.killTweensOf(nodes);
      gsap.fromTo(
        nodes,
        { opacity: 0, y: 18, force3D: true },
        {
          opacity: 1,
          y: 0,
          duration: 0.62,
          ease: 'power3.out',
          stagger: 0.045,
          force3D: true,
          clearProps: 'transform,opacity'
        }
      );
      if (mode && mode.refs && mode.refs.veil) {
        gsap.fromTo(mode.refs.veil, { opacity: 0 }, { opacity: 0.1, duration: 0.18, yoyo: true, repeat: 1, ease: 'power2.out' });
      }
    },
    exit() {},
    destroy() {}
  };
}
