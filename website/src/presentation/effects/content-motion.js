export function buildContentMotion(style, direction) {
  const fromVars = { opacity: 0, y: 24, force3D: true };
  const toVars = {
    opacity: 1,
    y: 0,
    duration: 0.46,
    ease: 'power2.out',
    stagger: { each: 0.036, from: 'start' },
    force3D: true,
    clearProps: 'x,y,z,scale,rotation,rotationX,rotationY,filter,transform,transformPerspective'
  };

  if (style === 'push') {
    Object.assign(fromVars, { y: 28, scale: 0.97, rotationX: 6, transformPerspective: 900 });
    toVars.duration = 0.48;
    toVars.ease = 'expo.out';
    toVars.stagger = { each: 0.032, from: 'start' };
  } else if (style === 'trace') {
    Object.assign(fromVars, { x: 44 * direction, y: 4, opacity: 0 });
    toVars.duration = 0.32;
    toVars.ease = 'power3.out';
    toVars.stagger = { each: 0.02, from: direction > 0 ? 'start' : 'end' };
  } else if (style === 'warp') {
    Object.assign(fromVars, { y: 30, scale: 0.94, filter: 'blur(5px)' });
    toVars.duration = 0.5;
    toVars.ease = 'expo.out';
  } else if (style === 'katana') {
    Object.assign(fromVars, { x: 28 * direction, skewX: 2 * direction, opacity: 0 });
    toVars.duration = 0.34;
    toVars.ease = 'power3.out';
  } else if (style === 'shard') {
    Object.assign(fromVars, { x: 24 * direction, rotationY: 3 * direction, scale: 0.96 });
    toVars.duration = 0.4;
  } else if (style === 'parallax') {
    Object.assign(fromVars, { x: 26 * direction, y: 16, scale: 0.97 });
    toVars.duration = 0.46;
    toVars.stagger = { each: 0.024, from: 'start' };
  } else if (style === 'pulse') {
    Object.assign(fromVars, { y: 22, scale: 0.95, rotationZ: -0.7 * direction });
    toVars.duration = 0.4;
    toVars.ease = 'power2.out';
  } else if (style === 'scanline') {
    Object.assign(fromVars, { y: -20, x: 8 * direction, scaleY: 0.96 });
    toVars.duration = 0.3;
    toVars.ease = 'power2.out';
  } else if (style === 'finale') {
    Object.assign(fromVars, { y: 28, scale: 0.95, filter: 'blur(5px)' });
    toVars.duration = 0.52;
    toVars.ease = 'expo.out';
    toVars.stagger = { each: 0.028, from: 'start' };
  }

  return { fromVars, toVars };
}
