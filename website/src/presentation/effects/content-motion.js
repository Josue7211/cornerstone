export function buildContentMotion(style, direction) {
  const fromVars = { opacity: 0, y: 14, force3D: true };
  const toVars = {
    opacity: 1,
    y: 0,
    duration: 0.52,
    ease: 'power2.out',
    stagger: { each: 0.024, from: 'start' },
    force3D: true,
    clearProps: 'x,y,scale,rotation,rotationX,rotationY,filter,transform'
  };

  if (style === 'warp') {
    Object.assign(fromVars, { y: 18, scale: 1.01 });
    toVars.duration = 0.62;
    toVars.ease = 'power3.out';
  } else if (style === 'katana') {
    Object.assign(fromVars, { x: 16 * direction, skewX: 4 * direction });
    toVars.duration = 0.42;
    toVars.ease = 'power4.out';
  } else if (style === 'shard') {
    Object.assign(fromVars, { x: 18 * direction, rotationY: 6 * direction, scale: 0.997 });
    toVars.duration = 0.5;
  } else if (style === 'parallax') {
    Object.assign(fromVars, { y: 20, scale: 0.994 });
    toVars.duration = 0.56;
    toVars.stagger = { each: 0.028, from: 'start' };
  } else if (style === 'pulse') {
    Object.assign(fromVars, { scale: 0.97 });
    toVars.duration = 0.48;
    toVars.ease = 'power2.out';
  } else if (style === 'scanline') {
    Object.assign(fromVars, { y: 12, x: 6 * direction });
    toVars.duration = 0.46;
    toVars.ease = 'power2.out';
  } else if (style === 'finale') {
    Object.assign(fromVars, { y: 26, scale: 0.985 });
    toVars.duration = 0.66;
    toVars.ease = 'power3.out';
    toVars.stagger = { each: 0.03, from: 'start' };
  }

  return { fromVars, toVars };
}
