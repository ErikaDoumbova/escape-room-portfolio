// Camera math for zooming into an object (handoff §5.2). Pure, so it's unit-tested.

export const DESKTOP_MIN_WIDTH = 900;

export interface CameraInput {
  /** Rendered (unzoomed) scene size in px. */
  sceneW: number;
  sceneH: number;
  /** Scene's current offset from the viewport's top-left corner (after panning). */
  offsetX: number;
  offsetY: number;
  viewportW: number;
  viewportH: number;
  /** Zoom focus, normalized 0–1. */
  focusX: number;
  focusY: number;
  /** Requested scale (object.zoom.scale, default 1.8). */
  scale: number;
  /** Width of the source image, to avoid upscaling it by more than 15%. */
  naturalW: number;
}

export interface CameraTransform {
  x: number;
  y: number;
  scale: number;
}

/** Space the desktop close-up panel takes from the right, margins included (§5.3). */
export function desktopPanelSpace(viewportW: number): number {
  return Math.min(520, Math.max(380, viewportW * 0.36)) + 32;
}

export function computeCameraTransform(input: CameraInput): CameraTransform {
  const { sceneW, sceneH, offsetX, offsetY, viewportW, viewportH, focusX, focusY, naturalW } =
    input;
  const desktop = viewportW >= DESKTOP_MIN_WIDTH;
  // Where the focus point should land: centre of the area the panel doesn't cover.
  const tx = desktop ? (viewportW - desktopPanelSpace(viewportW)) / 2 : viewportW / 2;
  const ty = desktop ? viewportH / 2 : viewportH * 0.27;

  const maxScale = (1.15 * naturalW) / sceneW;
  const scale = Math.max(1, Math.min(Math.max(input.scale, 1.2), maxScale));

  return {
    x: tx - offsetX - scale * focusX * sceneW,
    y: ty - offsetY - scale * focusY * sceneH,
    scale,
  };
}
