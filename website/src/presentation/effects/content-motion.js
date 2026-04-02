export function buildContentMotion(style, direction) {
  const fromVars = { opacity: 0, y: 20, force3D: true };
  const toVars = {
    opacity: 1,
    y: 0,
    duration: 0.66,
    ease: 'power3.out',
    stagger: { each: 0.032, from: 'start' },
    force3D: true,
    clearProps: 'x,y,scale,rotation,rotationX,rotationY,filter,transform'
  };

  if (style === 'warp') {
    Object.assign(fromVars, { y: 24, scale: 1.015 });
    toVars.duration = 0.78;
    toVars.ease = 'expo.out';
  } else if (style === 'katana') {
    Object.assign(fromVars, { x: 22 * direction, skewX: 6 * direction });
    toVars.duration = 0.5;
    toVars.ease = 'power4.out';
  } else if (style === 'shard') {
    Object.assign(fromVars, { x: 26 * direction, rotationY: 10 * direction, scale: 0.995 });
    toVars.duration = 0.6;
  } else if (style === 'parallax') {
    Object.assign(fromVars, { y: 28, scale: 0.99 });
    toVars.duration = 0.72;
    toVars.stagger = { each: 0.04, from: 'start' };
  } else if (style === 'pulse') {
    Object.assign(fromVars, { scale: 0.95 });
    toVars.duration = 0.6;
    toVars.ease = 'back.out(1.2)';
  } else if (style === 'scanline') {
    Object.assign(fromVars, { y: 16, x: 8 * direction });
    toVars.duration = 0.58;
    toVars.ease = 'power2.out';
  } else if (style === 'finale') {
    Object.assign(fromVars, { y: 38, scale: 0.975 });
    toVars.duration = 0.88;
    toVars.ease = 'expo.out';
    toVars.stagger = { each: 0.045, from: 'start' };
  }

  return { fromVars, toVars };
}
