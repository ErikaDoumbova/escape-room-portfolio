import { describe, expect, it } from 'vitest';

import { computeCameraTransform, desktopPanelSpace } from '../../src/lib/camera.ts';

const base = {
  sceneW: 1600,
  sceneH: 900,
  offsetX: 0,
  offsetY: 0,
  viewportW: 1440,
  viewportH: 900,
  focusX: 0.5,
  focusY: 0.5,
  scale: 2,
  naturalW: 3200,
};

describe('computeCameraTransform', () => {
  it('lands the focus point in the middle of the area left of the desktop panel', () => {
    const t = computeCameraTransform(base);
    const tx = (1440 - desktopPanelSpace(1440)) / 2;
    expect(t.scale).toBe(2);
    expect(t.x + t.scale * 0.5 * 1600).toBeCloseTo(tx);
    expect(t.y + t.scale * 0.5 * 900).toBeCloseTo(450);
  });

  it('accounts for how far the room is panned', () => {
    const panned = computeCameraTransform({ ...base, offsetX: -200 });
    const still = computeCameraTransform(base);
    expect(panned.x).toBeCloseTo(still.x + 200);
  });

  it('on phones aims above the bottom sheet (27% down, centred)', () => {
    const t = computeCameraTransform({
      ...base,
      viewportW: 390,
      viewportH: 844,
      sceneW: 1500,
      sceneH: 844,
      offsetX: -500,
    });
    // Focus point in viewport coordinates: offset + translate + scaled position.
    expect(-500 + t.x + t.scale * 0.5 * 1500).toBeCloseTo(195);
    expect(t.y + t.scale * 0.5 * 844).toBeCloseTo(844 * 0.27);
  });

  it('never upscales the source image by more than 15%', () => {
    const t = computeCameraTransform({ ...base, scale: 3, naturalW: 2400 });
    expect(t.scale).toBeCloseTo((1.15 * 2400) / 1600);
  });

  it('keeps the scale at least 1.2 when the image allows it', () => {
    expect(computeCameraTransform({ ...base, scale: 1 }).scale).toBe(1.2);
  });

  it('never zooms out below 1 for very small images', () => {
    expect(computeCameraTransform({ ...base, naturalW: 1000 }).scale).toBe(1);
  });
});
