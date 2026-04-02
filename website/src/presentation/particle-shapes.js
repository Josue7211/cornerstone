export function buildParticleShapeBuffers(count) {
  const make = (factory) => {
    const out = new Float32Array(count * 3);
    for (let i = 0; i < count; i += 1) {
      const p = factory(i / count, i);
      out[i * 3] = p.x;
      out[i * 3 + 1] = p.y;
      out[i * 3 + 2] = p.z;
    }
    return out;
  };

  const portal = make((t) => {
    const a = t * Math.PI * 2 * 9;
    const r = 0.6 + ((t * 17) % 1) * 1.45;
    return { x: Math.cos(a) * r, y: Math.sin(a) * r * 0.75, z: -4.9 + Math.sin(a * 0.35) * 0.45 };
  });

  const sphere = make(() => {
    const u = Math.random();
    const v = Math.random();
    const theta = 2 * Math.PI * u;
    const phi = Math.acos(2 * v - 1);
    const radius = 1.35 + (Math.random() - 0.5) * 0.28;
    return {
      x: radius * Math.sin(phi) * Math.cos(theta),
      y: radius * Math.sin(phi) * Math.sin(theta),
      z: -4.9 + radius * Math.cos(phi)
    };
  });

  const helix = make((t) => {
    const a = t * Math.PI * 2 * 11;
    const r = 1.05 + Math.sin(t * Math.PI * 10) * 0.2;
    return { x: Math.cos(a) * r, y: (t - 0.5) * 3.8, z: -4.9 + Math.sin(a) * 0.75 };
  });

  const cube = make(() => ({
    x: (Math.random() - 0.5) * 2.8,
    y: (Math.random() - 0.5) * 2.8,
    z: -4.9 + (Math.random() - 0.5) * 2.8
  }));

  const torus = make((t) => {
    const a = t * Math.PI * 2 * 12;
    const b = ((t * 37) % 1) * Math.PI * 2;
    const R = 1.45;
    const r = 0.42;
    return {
      x: (R + r * Math.cos(b)) * Math.cos(a),
      y: (R + r * Math.cos(b)) * Math.sin(a) * 0.7,
      z: -4.9 + r * Math.sin(b)
    };
  });

  const wave = make((t, i) => {
    const cols = 80;
    const x = ((i % cols) / cols - 0.5) * 4.4;
    const y = (Math.floor(i / cols) / (count / cols) - 0.5) * 2.4;
    const z = -4.9 + Math.sin(x * 2.2 + y * 4.3) * 0.45;
    return { x, y, z };
  });

  const burst = make((t) => {
    const a = t * Math.PI * 2 * 31;
    const r = 0.25 + (((t * 113) % 1) ** 0.55) * 2.7;
    return { x: Math.cos(a) * r, y: Math.sin(a * 0.91) * r * 0.8, z: -4.9 + Math.sin(a * 1.27) * r * 0.25 };
  });

  const disc = make((t) => {
    const a = t * Math.PI * 2 * 17;
    const r = (((t * 79) % 1) ** 0.6) * 2.15;
    return { x: Math.cos(a) * r, y: Math.sin(a) * r * 0.35, z: -4.9 + (Math.random() - 0.5) * 0.2 };
  });

  const vortex = make((t) => {
    const a = t * Math.PI * 2 * 15;
    const r = 0.25 + t * 2.1;
    return { x: Math.cos(a) * r, y: (t - 0.5) * 2.4, z: -4.9 + Math.sin(a * 1.7) * 0.75 };
  });

  return { portal, sphere, helix, cube, torus, wave, burst, disc, vortex };
}
