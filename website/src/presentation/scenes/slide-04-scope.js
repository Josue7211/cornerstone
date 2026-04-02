export function createSlide04ScopeScene({ mode, scene }) {
  let cards = [];
  let title = null;
  let activeIndex = -1;
  const teardown = [];

  const setActiveCard = (index, announce = false) => {
    if (!cards.length) return;
    const safeIndex = Math.max(0, Math.min(cards.length - 1, index));
    cards.forEach((card, cardIndex) => {
      card.classList.toggle('is-focus', cardIndex === safeIndex);
    });
    activeIndex = safeIndex;
    if (!announce || !mode || typeof mode._setBonziBubble !== 'function') return;
    const label = cards[safeIndex].querySelector('.persp-label');
    const text = label ? String(label.textContent || '').trim() : `Section ${safeIndex + 1}`;
    mode._setBonziBubble('Scope', `Highlighting ${text.toLowerCase()}.`);
  };

  const onCardClick = (event) => {
    const card = event.currentTarget;
    const idx = cards.indexOf(card);
    if (idx < 0) return;
    setActiveCard(idx, true);
  };

  const onCardKeydown = (event) => {
    const card = event.currentTarget;
    const idx = cards.indexOf(card);
    if (idx < 0) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      setActiveCard(idx, true);
      return;
    }
    if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
      event.preventDefault();
      const next = (idx + 1) % cards.length;
      cards[next].focus();
      setActiveCard(next, true);
      return;
    }
    if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
      event.preventDefault();
      const prev = (idx - 1 + cards.length) % cards.length;
      cards[prev].focus();
      setActiveCard(prev, true);
    }
  };

  return {
    mount() {
      title = scene.querySelector('h2');
      cards = Array.from(scene.querySelectorAll('.persp-item'));
      cards.forEach((card) => {
        card.setAttribute('tabindex', '0');
        card.addEventListener('click', onCardClick);
        card.addEventListener('keydown', onCardKeydown);
        teardown.push(() => card.removeEventListener('click', onCardClick));
        teardown.push(() => card.removeEventListener('keydown', onCardKeydown));
      });
    },
    reset() {
      cards.forEach((card) => card.classList.remove('is-focus'));
      activeIndex = -1;
    },
    enter() {
      const animateNodes = [title, ...cards].filter(Boolean);
      if (window.gsap && animateNodes.length) {
        gsap.killTweensOf(animateNodes);
        gsap.fromTo(
          animateNodes,
          { opacity: 0, x: 26, y: 8, force3D: true },
          {
            opacity: 1,
            x: 0,
            y: 0,
            duration: 0.56,
            ease: 'power3.out',
            stagger: 0.07,
            force3D: true,
            clearProps: 'transform,opacity'
          }
        );
      }
      if (cards.length) setActiveCard(0, false);
    },
    beforeSpeak({ token = 0 } = {}) {
      if (!cards.length) return;
      setActiveCard(token % cards.length, false);
    },
    afterSpeak() {
      if (cards.length) setActiveCard(cards.length - 1, false);
    },
    exit() {
      cards.forEach((card) => card.classList.remove('is-focus'));
      activeIndex = -1;
    },
    destroy() {
      teardown.forEach((fn) => fn());
      cards = [];
      title = null;
      activeIndex = -1;
    }
  };
}
