export function buildContentMotion(style, direction) {
  const fromVars = { opacity: 0, y: 4, filter: 'blur(0.8px)', force3D: true };
  const toVars = {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    duration: 0.48,
    ease: 'power2.out',
    stagger: { each: 0.022, from: 'start' },
    force3D: true,
    clearProps: 'x,y,z,scale,rotation,rotationX,rotationY,filter,transform,transformPerspective'
  };

  if (style === 'push') {
    // Content arrives as if approaching from depth — slight Z-settle with stagger
    Object.assign(fromVars, { y: 10, z: 18, rotationX: 1.4, filter: 'blur(1.2px)', transformPerspective: 900 });
    toVars.duration = 0.52;
    toVars.ease = 'expo.out';
    toVars.stagger = { each: 0.028, from: 'start' };
  } else if (style === 'trace') {
    // Content snaps in from the direction the trace is coming from
    Object.assign(fromVars, { x: 14 * direction, y: 0, filter: 'blur(0.6px)', skewX: 0.8 * direction });
    toVars.duration = 0.32;
    toVars.ease = 'power3.out';
    toVars.stagger = { each: 0.016, from: direction > 0 ? 'start' : 'end' };
  } else if (style === 'warp') {
    Object.assign(fromVars, { y: 6, scale: 1.003, filter: 'blur(1px)' });
    toVars.duration = 0.54;
    toVars.ease = 'power2.out';
  } else if (style === 'katana') {
    Object.assign(fromVars, { x: 6 * direction, skewX: 1.2 * direction, filter: 'blur(0.9px)' });
    toVars.duration = 0.38;
    toVars.ease = 'power3.out';
  } else if (style === 'shard') {
    Object.assign(fromVars, { x: 3 * direction, rotationY: 0.8 * direction, scale: 0.999, filter: 'blur(0.9px)' });
    toVars.duration = 0.44;
  } else if (style === 'parallax') {
    Object.assign(fromVars, { x: 5 * direction, y: 6, scale: 0.994, filter: 'blur(1px)' });
    toVars.duration = 0.5;
    toVars.stagger = { each: 0.018, from: 'start' };
  } else if (style === 'pulse') {
    Object.assign(fromVars, { y: 5, scale: 0.988, rotationZ: -0.2 * direction, filter: 'blur(0.8px)' });
    toVars.duration = 0.44;
    toVars.ease = 'power2.out';
  } else if (style === 'scanline') {
    Object.assign(fromVars, { y: -3, x: 0.25 * direction, scaleY: 0.992, filter: 'blur(0.45px)' });
    toVars.duration = 0.34;
    toVars.ease = 'power2.out';
  } else if (style === 'finale') {
    Object.assign(fromVars, { y: 6, scale: 0.998, filter: 'blur(1px)' });
    toVars.duration = 0.56;
    toVars.ease = 'power2.out';
    toVars.stagger = { each: 0.018, from: 'start' };
  }

  return { fromVars, toVars };
}
