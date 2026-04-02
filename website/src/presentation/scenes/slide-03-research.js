export function createSlide03ResearchScene({ mode, scene }) {
  const teardown = [];

  return {
    mount() {
      const inner = scene.querySelector('.pfs-slide-inner');
      if (!inner) return;
      const cards = Array.from(inner.querySelectorAll('.rq-item'));
      cards.forEach((card, cardIndex) => {
        const onClick = () => {
          const isFlipped = card.classList.toggle('is-flipped');
          cards.forEach((other) => other.classList.remove('is-focus'));
          card.classList.add('is-focus');
          const text = isFlipped ? `RQ${cardIndex + 1} flipped.` : `RQ${cardIndex + 1} reset.`;
          mode._setBonziBubble('Interact', text);
        };
        card.addEventListener('click', onClick);
        teardown.push(() => card.removeEventListener('click', onClick));
      });
    },
    enter() {},
    exit() {},
    destroy() {
      teardown.forEach((fn) => fn());
    }
  };
}

