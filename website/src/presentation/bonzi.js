export function speakBonzi(text) {
  if (!window.Win95Speech || typeof window.Win95Speech.speak !== 'function') return;
  window.Win95Speech.speak(String(text || ''), { character: 'bonzi', prefer: 'kokoro' }).catch(() => {});
}

export function setBonziBubble(mode, label, text) {
  if (!mode.refs || !mode.refs.bonziLabel || !mode.refs.bonziText) return;
  mode.refs.bonziLabel.textContent = label;
  mode.refs.bonziText.textContent = text;
  if (mode.autoPlayEnabled) speakBonzi(text);
}

export function playBonziIntro(mode, index, profiles, labels, lines) {
  if (!mode.refs || !mode.refs.bonzi) return;
  const profile = profiles[index] || profiles[0];
  const introStyle = profile.introStyle || 'peek';

  mode.refs.bonzi.dataset.side = profile.stage.side || 'right';
  mode.refs.bonzi.dataset.face = profile.stage.face || 'normal';
  mode.refs.bonzi.classList.add('is-visible');
  setBonziBubble(mode, labels[index] || 'Note', lines[index] || lines[0]);

  if (!window.gsap) return;
  gsap.killTweensOf(mode.refs.bonzi);
  const from = { x: 0, y: 0, scale: 1 };
  if (introStyle === 'peek') from.x = profile.stage.side === 'left' ? -40 : 40;
  if (introStyle === 'jump') { from.y = 44; from.scale = 0.94; }
  if (introStyle === 'drop') { from.y = -46; from.scale = 1.05; }
  if (introStyle === 'ascend') { from.y = 62; from.scale = 0.92; }
  if (introStyle === 'spark') { from.y = -18; from.x = profile.stage.side === 'left' ? -26 : 26; }

  gsap.fromTo(
    mode.refs.bonzi,
    { opacity: 0, x: from.x, y: from.y, scale: from.scale },
    { opacity: 1, x: 0, y: 0, scale: 1, duration: 0.58, ease: 'power3.out' }
  );
}
