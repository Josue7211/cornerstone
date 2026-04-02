export function buildContentMotion(style, direction) {
  const fromVars = { opacity: 0, y: 10, filter: 'blur(4px)', force3D: true };
  const toVars = {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    duration: 0.48,
    ease: 'power2.out',
    stagger: { each: 0.022, from: 'start' },
    force3D: true,
    clearProps: 'x,y,scale,rotation,rotationX,rotationY,filter,transform'
  };

  if (style === 'warp') {
    Object.assign(fromVars, { y: 14, scale: 1.008, filter: 'blur(5px)' });
    toVars.duration = 0.56;
    toVars.ease = 'power3.out';
  } else if (style === 'katana') {
    Object.assign(fromVars, { x: 12 * direction, skewX: 3 * direction, filter: 'blur(3px)' });
    toVars.duration = 0.38;
    toVars.ease = 'power4.out';
  } else if (style === 'shard') {
    Object.assign(fromVars, { x: 14 * direction, rotationY: 4 * direction, scale: 0.998, filter: 'blur(4px)' });
    toVars.duration = 0.46;
  } else if (style === 'parallax') {
    Object.assign(fromVars, { y: 14, scale: 0.996, filter: 'blur(4px)' });
    toVars.duration = 0.5;
    toVars.stagger = { each: 0.024, from: 'start' };
  } else if (style === 'pulse') {
    Object.assign(fromVars, { scale: 0.982, filter: 'blur(3px)' });
    toVars.duration = 0.42;
    toVars.ease = 'power2.out';
  } else if (style === 'scanline') {
    Object.assign(fromVars, { y: 8, x: 4 * direction, filter: 'blur(2px)' });
    toVars.duration = 0.4;
    toVars.ease = 'power2.out';
  } else if (style === 'finale') {
    Object.assign(fromVars, { y: 18, scale: 0.99, filter: 'blur(6px)' });
    toVars.duration = 0.58;
    toVars.ease = 'power3.out';
    toVars.stagger = { each: 0.026, from: 'start' };
  }

  return { fromVars, toVars };
}
