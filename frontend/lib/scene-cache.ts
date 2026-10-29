type Layer = { surface: HTMLCanvasElement; width: number; height: number };
const layers = new WeakMap<CanvasRenderingContext2D, Map<string, Layer>>();

/** Cache static vectors at native backing resolution. Lifetime follows the owning game canvas. */
export function staticLayer(
  context: CanvasRenderingContext2D,
  key: string,
  paint: (c: CanvasRenderingContext2D) => void,
): void {
  // Test/non-DOM contexts can render directly. No OffscreenCanvas or worker dependency is required.
  if (!context.canvas || typeof document === 'undefined') {
    paint(context);
    return;
  }
  let owned = layers.get(context);
  if (!owned) {
    owned = new Map();
    layers.set(context, owned);
  }
  const { width, height } = context.canvas;
  let layer = owned.get(key);
  if (!layer || layer.width !== width || layer.height !== height) {
    const surface = document.createElement('canvas');
    surface.width = width;
    surface.height = height;
    const c = surface.getContext('2d');
    if (!c) {
      paint(context);
      return;
    }
    c.setTransform(width / 1000, 0, 0, height / 1000, 0, 0);
    paint(c);
    layer = { surface, width, height };
    owned.set(key, layer);
  }
  context.drawImage(layer.surface, 0, 0, 1000, 1000);
}
