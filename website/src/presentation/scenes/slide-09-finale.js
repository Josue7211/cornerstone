export function createSlide09FinaleScene({ mode, scene }) {
  const teardown = [];
  const thesis = scene.querySelector('.slide-thesis');
  const qa = scene.querySelector('.slide-qa');
  const reflections = Array.from(scene.querySelectorAll('.reflection-item'));
  const endingNote = scene.querySelector('.slide-ending-note');

  return {
    mount() {
      if (qa) {
        qa.setAttribute('tabindex', '0');
        const onClick = () => {
          qa.classList.toggle('is-focus');
          mode._setBonziBubble('Finale', qa.classList.contains('is-focus') ? 'Q&A spotlight on.' : 'Q&A spotlight off.');
        };
        const onKeydown = (event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onClick();
          }
        };
        qa.addEventListener('click', onClick);
        qa.addEventListener('keydown', onKeydown);
        teardown.push(() => qa.removeEventListener('click', onClick));
        teardown.push(() => qa.removeEventListener('keydown', onKeydown));
      }
      reflections.forEach((item, index) => {
        item.setAttribute('tabindex', '0');
        const onFocus = () => item.classList.add('is-focus');
        const onBlur = () => item.classList.remove('is-focus');
        const onClick = () => {
          item.classList.toggle('is-focus');
          mode._setBonziBubble('Finale', `Reflection ${index + 1} spotlighted.`);
        };
        const onKeydown = (event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onClick();
          }
        };
        item.addEventListener('focus', onFocus);
        item.addEventListener('blur', onBlur);
        item.addEventListener('click', onClick);
        item.addEventListener('keydown', onKeydown);
        teardown.push(() => item.removeEventListener('focus', onFocus));
        teardown.push(() => item.removeEventListener('blur', onBlur));
        teardown.push(() => item.removeEventListener('click', onClick));
        teardown.push(() => item.removeEventListener('keydown', onKeydown));
      });
    },
    enter() {
      if (!window.gsap) return;
      const nodes = [thesis, ...reflections, qa, endingNote].filter(Boolean);
      if (!nodes.length) return;
      gsap.killTweensOf(nodes);
      const thesisTl = gsap.timeline();
      if (thesis) {
        thesisTl.fromTo(
          thesis,
          { opacity: 0, y: 30, scale: 0.96, rotateX: -12, filter: 'blur(9px)', force3D: true },
          { opacity: 1, y: 0, scale: 1, rotateX: 0, filter: 'blur(0px)', duration: 0.9, ease: 'power3.out', force3D: true, clearProps: 'transform,opacity,filter' },
          0
        );
      }
      if (reflections.length) {
        reflections.forEach((item, index) => {
          const drift = index % 2 === 0 ? -1 : 1;
          thesisTl.fromTo(
            item,
            { opacity: 0, x: drift * 16, y: 18, scale: 0.98, filter: 'blur(4px)', force3D: true },
            {
              opacity: 1,
              x: 0,
              y: 0,
              scale: 1,
              filter: 'blur(0px)',
              duration: 0.54,
              ease: 'power2.out',
              force3D: true,
              clearProps: 'transform,opacity,filter'
            },
            thesis ? 0.2 + (index * 0.08) : (index * 0.08)
          );
        });
      }
      if (qa) {
        thesisTl.fromTo(
          qa,
          { opacity: 0, y: 22, scale: 0.97, rotateX: 8, filter: 'blur(6px)', force3D: true },
          { opacity: 1, y: 0, scale: 1, rotateX: 0, filter: 'blur(0px)', duration: 0.8, ease: 'power3.out', force3D: true, clearProps: 'transform,opacity,filter' },
          reflections.length ? 0.56 : 0.3
        );
      }
      if (endingNote) {
        thesisTl.fromTo(
          endingNote,
          { opacity: 0, y: 12, scale: 0.99 },
          { opacity: 1, y: 0, scale: 1, duration: 0.46, ease: 'power2.out', clearProps: 'transform,opacity' },
          0.96
        );
      }
      if (mode && mode.refs && mode.refs.veil) {
        gsap.fromTo(mode.refs.veil, { opacity: 0 }, { opacity: 0.2, duration: 0.2, yoyo: true, repeat: 1, ease: 'power2.out' });
      }
    },
    exit() {},
    destroy() {
      teardown.forEach((fn) => fn());
    }
  };
}
