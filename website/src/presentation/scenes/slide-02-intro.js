export function createSlide02IntroScene({ mode, scene }) {
  let nodes = [];
  let bodyNodes = [];
  let statCard = null;
  let statValue = null;
  let targetPercent = 0;
  let originalPercentText = '';
  let numberTween = null;
  let counterDelayCall = null;
  const teardown = [];

  const clearBodyFocus = () => {
    bodyNodes.forEach((node) => node.classList.remove('is-focus'));
  };

  const focusBody = (index) => {
    if (!bodyNodes.length) return;
    const safeIndex = Math.max(0, Math.min(bodyNodes.length - 1, index));
    clearBodyFocus();
    bodyNodes[safeIndex].classList.add('is-focus');
  };

  const pulseStatCard = () => {
    if (!window.gsap || !statCard) return;
    gsap.fromTo(
      statCard,
      { scale: 1, borderColor: 'rgba(0, 240, 255, 0.35)', boxShadow: '0 0 0 rgba(0, 0, 0, 0)' },
      {
        scale: 1.015,
        borderColor: 'rgba(0, 240, 255, 0.7)',
        boxShadow: '0 0 28px rgba(0, 240, 255, 0.2)',
        duration: 0.2,
        yoyo: true,
        repeat: 1,
        ease: 'power2.out',
        clearProps: 'scale,borderColor,boxShadow'
      }
    );
  };

  const animateCounter = () => {
    if (!statValue) return;
    if (numberTween && typeof numberTween.kill === 'function') numberTween.kill();
    statValue.textContent = '0%';
    if (!window.gsap) {
      statValue.textContent = originalPercentText || `${targetPercent}%`;
      return;
    }
    const counter = { value: 0 };
    numberTween = gsap.to(counter, {
      value: targetPercent,
      duration: 0.8,
      ease: 'power2.out',
      onUpdate: () => {
        statValue.textContent = `${Math.round(counter.value)}%`;
      },
      onComplete: () => {
        statValue.textContent = originalPercentText || `${targetPercent}%`;
        numberTween = null;
      }
    });
  };

  const scheduleCounter = () => {
    if (counterDelayCall && typeof counterDelayCall.kill === 'function') {
      counterDelayCall.kill();
      counterDelayCall = null;
    }
    if (!window.gsap) {
      animateCounter();
      return;
    }
    // Run after scene transition settles so users can actually see the count-up.
    counterDelayCall = gsap.delayedCall(0.42, () => {
      animateCounter();
      counterDelayCall = null;
    });
  };

  const onStatActivate = () => {
    if (statCard) statCard.classList.toggle('is-focus');
    pulseStatCard();
    if (mode && typeof mode._setBonziBubble === 'function') {
      mode._setBonziBubble('Context', 'Consumer GPU economics changed AI access.');
    }
  };

  const onStatKeydown = (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    onStatActivate();
  };

  return {
    mount() {
      nodes = [
        ...scene.querySelectorAll('.slide-num, .slide-tag'),
        scene.querySelector('h2'),
        ...scene.querySelectorAll('.slide-body'),
        scene.querySelector('.slide-stat-inline')
      ].filter(Boolean);
      bodyNodes = Array.from(scene.querySelectorAll('.slide-body'));
      statCard = scene.querySelector('.slide-stat-inline');
      statValue = scene.querySelector('.inline-num');

      originalPercentText = statValue ? String(statValue.textContent || '').trim() : '';
      const parsed = originalPercentText.match(/(\d+)/);
      targetPercent = parsed ? Number(parsed[1]) : 0;

      if (statCard) {
        statCard.setAttribute('tabindex', '0');
        statCard.addEventListener('click', onStatActivate);
        statCard.addEventListener('keydown', onStatKeydown);
        teardown.push(() => statCard.removeEventListener('click', onStatActivate));
        teardown.push(() => statCard.removeEventListener('keydown', onStatKeydown));
      }
    },
    reset() {
      clearBodyFocus();
      if (statCard) statCard.classList.remove('is-focus');
      if (statValue) statValue.textContent = originalPercentText || `${targetPercent}%`;
    },
    enter() {
      if (window.gsap && nodes.length) {
        gsap.killTweensOf(nodes);
        gsap.fromTo(
          nodes,
          { opacity: 0, x: -28, y: 10, force3D: true },
          {
            opacity: 1,
            x: 0,
            y: 0,
            duration: 0.54,
            ease: 'power3.out',
            stagger: 0.045,
            force3D: true,
            clearProps: 'transform,opacity'
          }
        );
      }
      scheduleCounter();
      focusBody(0);
    },
    beforeSpeak({ token = 0 } = {}) {
      if (!bodyNodes.length) return;
      focusBody(token % bodyNodes.length);
    },
    afterSpeak() {
      focusBody(bodyNodes.length - 1);
      pulseStatCard();
    },
    exit() {
      if (counterDelayCall && typeof counterDelayCall.kill === 'function') {
        counterDelayCall.kill();
        counterDelayCall = null;
      }
      clearBodyFocus();
      if (statCard) statCard.classList.remove('is-focus');
    },
    destroy() {
      if (counterDelayCall && typeof counterDelayCall.kill === 'function') {
        counterDelayCall.kill();
        counterDelayCall = null;
      }
      if (numberTween && typeof numberTween.kill === 'function') {
        numberTween.kill();
        numberTween = null;
      }
      teardown.forEach((fn) => fn());
    }
  };
}
