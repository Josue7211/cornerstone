export function createSlide06ImplicationsScene({ mode, scene }) {
  const teardown = [];
  let items = [];
  let nodes = [];

  const setActiveItem = (index, shouldFlip = false, announce = false) => {
    if (!items.length) return;
    const safeIndex = Math.max(0, Math.min(items.length - 1, index));
    items.forEach((item, itemIndex) => {
      item.classList.toggle('is-focus', itemIndex === safeIndex);
      if (itemIndex !== safeIndex && shouldFlip) item.classList.remove('is-flipped');
    });
    if (shouldFlip) items[safeIndex].classList.toggle('is-flipped');
    if (!announce || !mode || typeof mode._setBonziBubble !== 'function') return;
    mode._setBonziBubble('Implications', `Spotlighting implication ${safeIndex + 1}.`);
  };

  return {
    mount() {
      const inner = scene.querySelector('.pfs-slide-inner');
      if (!inner) return;
      nodes = [
        scene.querySelector('h2'),
        ...inner.querySelectorAll('.impl-item')
      ].filter(Boolean);
      items = Array.from(inner.querySelectorAll('.impl-item'));
      items.forEach((item, itemIndex) => {
        item.setAttribute('tabindex', '0');
        const onClick = () => {
          setActiveItem(itemIndex, true, true);
        };
        const onKeydown = (event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            setActiveItem(itemIndex, true, true);
            return;
          }
          if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
            event.preventDefault();
            const next = (itemIndex + 1) % items.length;
            items[next].focus();
            setActiveItem(next, false, false);
            return;
          }
          if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
            event.preventDefault();
            const prev = (itemIndex - 1 + items.length) % items.length;
            items[prev].focus();
            setActiveItem(prev, false, false);
          }
        };
        item.addEventListener('click', onClick);
        item.addEventListener('keydown', onKeydown);
        teardown.push(() => item.removeEventListener('click', onClick));
        teardown.push(() => item.removeEventListener('keydown', onKeydown));
      });
    },
    reset() {
      items.forEach((item) => {
        item.classList.remove('is-focus');
        item.classList.remove('is-flipped');
      });
    },
    enter() {
      if (window.gsap && nodes.length) {
        gsap.killTweensOf(nodes);
        gsap.fromTo(
          nodes,
          { opacity: 0, y: 16, scale: 0.965, rotateX: -12, force3D: true, transformPerspective: 900 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            rotateX: 0,
            duration: 0.54,
            ease: 'power3.out',
            stagger: 0.06,
            force3D: true,
            clearProps: 'transform,opacity'
          }
        );
      }
      if (items.length) setActiveItem(0, false, false);
    },
    beforeSpeak({ token = 0 } = {}) {
      if (!items.length) return;
      setActiveItem(token % items.length, false, false);
    },
    afterSpeak() {
      if (!items.length) return;
      setActiveItem(items.length - 1, false, false);
    },
    exit() {
      items.forEach((item) => item.classList.remove('is-focus'));
    },
    destroy() {
      teardown.forEach((fn) => fn());
      items = [];
      nodes = [];
    }
  };
}
