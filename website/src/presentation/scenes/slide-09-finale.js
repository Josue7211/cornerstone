export function createSlide09FinaleScene({ mode, scene }) {
  const teardown = [];
  const thesis = scene.querySelector('.slide-thesis');
  const qa = scene.querySelector('.slide-qa');

  return {
    mount() {
      if (!qa) return;
      const onClick = () => {
        qa.classList.toggle('is-focus');
        mode._setBonziBubble('Finale', qa.classList.contains('is-focus') ? 'Q&A spotlight on.' : 'Q&A spotlight off.');
      };
      qa.addEventListener('click', onClick);
      teardown.push(() => qa.removeEventListener('click', onClick));
    },
    enter() {
      if (!window.gsap) return;
      const nodes = [thesis, qa].filter(Boolean);
      if (!nodes.length) return;
      gsap.killTweensOf(nodes);
      gsap.fromTo(
        nodes,
        { opacity: 0, y: 20, scale: 0.985, force3D: true },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.66,
          ease: 'power3.out',
          stagger: 0.08,
          force3D: true,
          clearProps: 'transform,opacity'
        }
      );
    },
    exit() {},
    destroy() {
      teardown.forEach((fn) => fn());
    }
  };
}
