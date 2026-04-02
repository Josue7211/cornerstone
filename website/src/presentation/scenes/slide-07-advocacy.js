export function createSlide07AdvocacyScene({ scene }) {
  const teardown = [];
  return {
    mount() {
      const inner = scene.querySelector('.pfs-slide-inner');
      if (!inner) return;
      const items = Array.from(inner.querySelectorAll('.advocacy-point'));
      items.forEach((item) => {
        const onEnter = () => item.classList.add('is-focus');
        const onLeave = () => item.classList.remove('is-focus');
        item.addEventListener('mouseenter', onEnter);
        item.addEventListener('mouseleave', onLeave);
        teardown.push(() => item.removeEventListener('mouseenter', onEnter));
        teardown.push(() => item.removeEventListener('mouseleave', onLeave));
      });
    },
    enter() {},
    exit() {},
    destroy() {
      teardown.forEach((fn) => fn());
    }
  };
}

