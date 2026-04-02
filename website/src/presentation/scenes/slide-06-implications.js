export function createSlide06ImplicationsScene({ mode, scene }) {
  const teardown = [];

  return {
    mount() {
      const inner = scene.querySelector('.pfs-slide-inner');
      if (!inner) return;
      const items = Array.from(inner.querySelectorAll('.impl-item'));
      items.forEach((item, itemIndex) => {
        const onClick = () => {
          items.forEach((other) => other.classList.remove('is-focus'));
          item.classList.add('is-focus');
          item.classList.toggle('is-flipped');
          mode._setBonziBubble('Implications', `Spotlighting implication ${itemIndex + 1}.`);
        };
        item.addEventListener('click', onClick);
        teardown.push(() => item.removeEventListener('click', onClick));
      });
    },
    enter() {},
    exit() {},
    destroy() {
      teardown.forEach((fn) => fn());
    }
  };
}

