import { setupConnectionsScene } from '../scene-interactions.js';

export function createSlide05ConnectionsScene({ mode, scene }) {
  let controls = { reset() {}, destroy() {} };
  return {
    mount() {
      controls = setupConnectionsScene(mode, scene);
    },
    reset() {
      if (controls && typeof controls.reset === 'function') controls.reset();
    },
    enter() {
      if (controls && typeof controls.reset === 'function') controls.reset();
      if (!window.gsap || !scene) return;
      const inner = scene.querySelector('.pfs-slide-inner');
      if (!inner) return;
      const title = scene.querySelector('h2');
      const tags = Array.from(inner.querySelectorAll('.discipline-tag'));
      const cards = Array.from(inner.querySelectorAll('.connection-item')).filter((item) => {
        if (!(item instanceof HTMLElement)) return false;
        return item.style.display !== 'none' && getComputedStyle(item).display !== 'none';
      });
      const pager = scene.querySelector('.pfs-connections-pager');
      const motionNodes = [title, ...tags, ...cards, pager].filter(Boolean);
      gsap.killTweensOf(motionNodes);

      if (title) {
        gsap.fromTo(
          title,
          { opacity: 0, x: -18, y: 8, filter: 'blur(1.4px)', force3D: true },
          { opacity: 1, x: 0, y: 0, filter: 'blur(0px)', duration: 0.44, ease: 'power3.out', force3D: true, clearProps: 'transform,opacity,filter' }
        );
      }
      if (tags.length) {
        gsap.fromTo(
          tags,
          { opacity: 0, y: 8, scale: 0.98, force3D: true },
          { opacity: 1, y: 0, scale: 1, duration: 0.4, ease: 'power2.out', stagger: 0.045, force3D: true, clearProps: 'transform,opacity' }
        );
      }
      if (cards.length) {
        cards.forEach((card, index) => {
          const drift = index % 2 === 0 ? -1 : 1;
          gsap.fromTo(
            card,
            { opacity: 0, x: drift * 20, y: 14, rotateY: drift * 18, scale: 0.97, filter: 'blur(1.2px)', force3D: true },
            {
              opacity: 1,
              x: 0,
              y: 0,
              rotateY: 0,
              scale: 1,
              filter: 'blur(0px)',
              duration: 0.52,
              delay: 0.06 + (index * 0.03),
              ease: 'power3.out',
              force3D: true,
              clearProps: 'transform,opacity,filter'
            }
          );
        });
      }
      if (pager) {
        gsap.fromTo(
          pager,
          { opacity: 0, y: 10, scale: 0.98, force3D: true },
          { opacity: 1, y: 0, scale: 1, duration: 0.3, ease: 'power2.out', delay: 0.14, force3D: true, clearProps: 'transform,opacity' }
        );
      }
    },
    exit() {},
    destroy() {
      if (controls && typeof controls.destroy === 'function') controls.destroy();
      controls = { reset() {}, destroy() {} };
    }
  };
}
