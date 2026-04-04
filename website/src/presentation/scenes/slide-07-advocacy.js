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
        const title = scene.querySelector('h2');
        const body = Array.from(scene.querySelectorAll('.slide-body'));
        const items = Array.from(scene.querySelectorAll('.advocacy-point'));
        const motionNodes = [title, ...body, ...items].filter(Boolean);
        gsap.killTweensOf(motionNodes);
        if (title) {
          gsap.fromTo(
            title,
            { opacity: 0, y: 14, filter: 'blur(1px)', force3D: true },
            { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.38, ease: 'power3.out', force3D: true, clearProps: 'transform,opacity,filter' }
          );
        }
        if (body.length) {
          gsap.fromTo(
            body,
            { opacity: 0, x: -14, y: 8, scale: 0.99, filter: 'blur(0.9px)', force3D: true },
            { opacity: 1, x: 0, y: 0, scale: 1, filter: 'blur(0px)', duration: 0.42, ease: 'power2.out', stagger: 0.04, force3D: true, clearProps: 'transform,opacity,filter' }
          );
        }
        if (items.length) {
          items.forEach((item, index) => {
            const drift = index % 2 === 0 ? 1 : -1;
            gsap.fromTo(
              item,
              { opacity: 0, x: drift * 18, y: 12, scale: 0.975, filter: 'blur(1px)', force3D: true },
              {
                opacity: 1,
                x: 0,
                y: 0,
                scale: 1,
                filter: 'blur(0px)',
                duration: 0.44,
                delay: 0.06 + (index * 0.04),
                ease: 'power3.out',
                force3D: true,
                clearProps: 'transform,opacity,filter'
              }
            );
          });
        }
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
