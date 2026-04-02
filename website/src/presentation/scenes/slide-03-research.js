export function createSlide03ResearchScene({ mode, scene }) {
  const teardown = [];
  let cards = [];
  let nodes = [];

  const setActiveCard = (index, shouldFlip = false, announce = false) => {
    if (!cards.length) return;
    const safeIndex = Math.max(0, Math.min(cards.length - 1, index));
    cards.forEach((card, cardIndex) => {
      card.classList.toggle('is-focus', cardIndex === safeIndex);
      if (cardIndex !== safeIndex && shouldFlip) card.classList.remove('is-flipped');
    });
    if (shouldFlip) cards[safeIndex].classList.toggle('is-flipped');
    if (!announce || !mode || typeof mode._setBonziBubble !== 'function') return;
    const isFlipped = cards[safeIndex].classList.contains('is-flipped');
    mode._setBonziBubble('Interact', isFlipped ? `RQ${safeIndex + 1} flipped.` : `RQ${safeIndex + 1} reset.`);
  };

  return {
    mount() {
      const inner = scene.querySelector('.pfs-slide-inner');
      if (!inner) return;
      nodes = [
        scene.querySelector('h2'),
        ...inner.querySelectorAll('.rq-item'),
        ...inner.querySelectorAll('.method-card')
      ].filter(Boolean);
      cards = Array.from(inner.querySelectorAll('.rq-item'));
      cards.forEach((card, cardIndex) => {
        card.setAttribute('tabindex', '0');
        const onClick = () => {
          setActiveCard(cardIndex, true, true);
        };
        const onKeydown = (event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            setActiveCard(cardIndex, true, true);
            return;
          }
          if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
            event.preventDefault();
            const next = (cardIndex + 1) % cards.length;
            cards[next].focus();
            setActiveCard(next, false, false);
            return;
          }
          if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
            event.preventDefault();
            const prev = (cardIndex - 1 + cards.length) % cards.length;
            cards[prev].focus();
            setActiveCard(prev, false, false);
          }
        };
        card.addEventListener('click', onClick);
        card.addEventListener('keydown', onKeydown);
        teardown.push(() => card.removeEventListener('click', onClick));
        teardown.push(() => card.removeEventListener('keydown', onKeydown));
      });
    },
    reset() {
      cards.forEach((card) => {
        card.classList.remove('is-focus');
        card.classList.remove('is-flipped');
      });
    },
    enter() {
      if (window.gsap && nodes.length) {
        gsap.killTweensOf(nodes);
        gsap.fromTo(
          nodes,
          { opacity: 0, y: 20, rotateX: -10, force3D: true },
          {
            opacity: 1,
            y: 0,
            rotateX: 0,
            duration: 0.56,
            ease: 'power3.out',
            stagger: 0.05,
            force3D: true,
            clearProps: 'transform,opacity'
          }
        );
      }
      if (cards.length) setActiveCard(0, false, false);
    },
    beforeSpeak({ token = 0 } = {}) {
      if (!cards.length) return;
      setActiveCard(token % cards.length, false, false);
    },
    afterSpeak() {
      if (!cards.length) return;
      setActiveCard(cards.length - 1, false, false);
    },
    exit() {
      cards.forEach((card) => card.classList.remove('is-focus'));
    },
    destroy() {
      teardown.forEach((fn) => fn());
      cards = [];
      nodes = [];
    }
  };
}
