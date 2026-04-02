export function createSlide07AdvocacyScene({ mode, scene }) {
  const teardown = [];
  let items = [];
  let nodes = [];

  const setActiveItem = (index, announce = false) => {
    if (!items.length) return;
    const safeIndex = Math.max(0, Math.min(items.length - 1, index));
    items.forEach((item, itemIndex) => {
      item.classList.toggle('is-focus', itemIndex === safeIndex);
    });
    if (!announce || !mode || typeof mode._setBonziBubble !== 'function') return;
    mode._setBonziBubble('Advocacy', `Priority ${safeIndex + 1} in focus.`);
  };

  return {
    mount() {
      const inner = scene.querySelector('.pfs-slide-inner');
      if (!inner) return;
      nodes = [
        scene.querySelector('h2'),
        ...scene.querySelectorAll('.slide-body'),
        ...inner.querySelectorAll('.advocacy-point')
      ].filter(Boolean);
      items = Array.from(inner.querySelectorAll('.advocacy-point'));
      items.forEach((item, itemIndex) => {
        item.setAttribute('tabindex', '0');
        const onEnter = () => setActiveItem(itemIndex, false);
        const onLeave = () => item.classList.remove('is-focus');
        const onClick = () => setActiveItem(itemIndex, true);
        const onKeydown = (event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            setActiveItem(itemIndex, true);
            return;
          }
          if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
            event.preventDefault();
            const next = (itemIndex + 1) % items.length;
            items[next].focus();
            setActiveItem(next, true);
            return;
          }
          if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
            event.preventDefault();
            const prev = (itemIndex - 1 + items.length) % items.length;
            items[prev].focus();
            setActiveItem(prev, true);
          }
        };
        item.addEventListener('mouseenter', onEnter);
        item.addEventListener('mouseleave', onLeave);
        item.addEventListener('click', onClick);
        item.addEventListener('keydown', onKeydown);
        teardown.push(() => item.removeEventListener('mouseenter', onEnter));
        teardown.push(() => item.removeEventListener('mouseleave', onLeave));
        teardown.push(() => item.removeEventListener('click', onClick));
        teardown.push(() => item.removeEventListener('keydown', onKeydown));
      });
    },
    reset() {
      items.forEach((item) => item.classList.remove('is-focus'));
    },
    enter() {
      if (window.gsap && nodes.length) {
        gsap.killTweensOf(nodes);
        gsap.fromTo(
          nodes,
          { opacity: 0, x: -24, y: 8, force3D: true },
          {
            opacity: 1,
            x: 0,
            y: 0,
            duration: 0.52,
            ease: 'power3.out',
            stagger: 0.055,
            force3D: true,
            clearProps: 'transform,opacity'
          }
        );
      }
      if (items.length) setActiveItem(0, false);
    },
    beforeSpeak({ token = 0 } = {}) {
      if (!items.length) return;
      setActiveItem(token % items.length, false);
    },
    afterSpeak() {
      if (!items.length) return;
      setActiveItem(items.length - 1, false);
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
