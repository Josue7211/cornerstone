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
    },
    exit() {},
    destroy() {
      if (controls && typeof controls.destroy === 'function') controls.destroy();
      controls = { reset() {}, destroy() {} };
    }
  };
}
