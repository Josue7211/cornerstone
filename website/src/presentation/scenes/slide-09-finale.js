export function createSlide09FinaleScene({ mode, scene }) {
  const teardown = [];

  return {
    mount() {
      const qa = scene.querySelector('.slide-qa');
      if (!qa) return;
      const onClick = () => {
        qa.classList.toggle('is-focus');
        mode._setBonziBubble('Finale', qa.classList.contains('is-focus') ? 'Q&A spotlight on.' : 'Q&A spotlight off.');
      };
      qa.addEventListener('click', onClick);
      teardown.push(() => qa.removeEventListener('click', onClick));
    },
    enter() {},
    exit() {},
    destroy() {
      teardown.forEach((fn) => fn());
    }
  };
}

