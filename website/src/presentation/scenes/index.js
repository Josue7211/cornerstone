import { createSlide01TitleScene } from './slide-01-title.js';
import { createSlide02IntroScene } from './slide-02-intro.js';
import { createSlide03ResearchScene } from './slide-03-research.js';
import { createSlide04ScopeScene } from './slide-04-scope.js';
import { createSlide05ConnectionsScene } from './slide-05-connections.js';
import { createSlide06ImplicationsScene } from './slide-06-implications.js';
import { createSlide07AdvocacyScene } from './slide-07-advocacy.js';
import { createSlide08PrepScene } from './slide-08-prep.js';
import { createSlide09FinaleScene } from './slide-09-finale.js';

const FACTORIES = [
  createSlide01TitleScene,
  createSlide02IntroScene,
  createSlide03ResearchScene,
  createSlide04ScopeScene,
  createSlide05ConnectionsScene,
  createSlide06ImplicationsScene,
  createSlide07AdvocacyScene,
  createSlide08PrepScene,
  createSlide09FinaleScene
];

export function createSceneController(index, ctx) {
  const factory = FACTORIES[index];
  if (!factory) return null;
  const controller = factory(ctx) || {};
  return {
    mount: typeof controller.mount === 'function' ? controller.mount.bind(controller) : () => {},
    reset: typeof controller.reset === 'function' ? controller.reset.bind(controller) : () => {},
    enter: typeof controller.enter === 'function' ? controller.enter.bind(controller) : () => {},
    exit: typeof controller.exit === 'function' ? controller.exit.bind(controller) : () => {},
    beforeSpeak: typeof controller.beforeSpeak === 'function' ? controller.beforeSpeak.bind(controller) : () => {},
    afterSpeak: typeof controller.afterSpeak === 'function' ? controller.afterSpeak.bind(controller) : () => {},
    destroy: typeof controller.destroy === 'function' ? controller.destroy.bind(controller) : () => {}
  };
}
