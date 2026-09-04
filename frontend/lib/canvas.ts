export const MAX_CANVAS_DPR = 2;

export interface PreparedCanvas {
  context: CanvasRenderingContext2D;
  devicePixelRatio: number;
  backingWidth: number;
  backingHeight: number;
}

export function prepareHiDpiCanvas(
  canvas: HTMLCanvasElement,
  logicalWidth: number,
  logicalHeight: number,
  requestedDpr: number = window.devicePixelRatio,
): PreparedCanvas | null {
  const context = canvas.getContext('2d');
  if (!context) return null;
  const bounds = canvas.getBoundingClientRect();
  const cssWidth = bounds.width || logicalWidth;
  const cssHeight = bounds.height || logicalHeight;
  const devicePixelRatio = Math.max(1, Math.min(MAX_CANVAS_DPR, requestedDpr || 1));
  const backingWidth = Math.max(1, Math.round(cssWidth * devicePixelRatio));
  const backingHeight = Math.max(1, Math.round(cssHeight * devicePixelRatio));
  if (canvas.width !== backingWidth || canvas.height !== backingHeight) {
    canvas.width = backingWidth;
    canvas.height = backingHeight;
  }
  context.setTransform(backingWidth / logicalWidth, 0, 0, backingHeight / logicalHeight, 0, 0);
  canvas.dataset.dpr = devicePixelRatio.toString();
  return { context, devicePixelRatio, backingWidth, backingHeight };
}
