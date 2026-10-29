const COLORS = {
  navy: '#061526',
  ink: '#0b1d31',
  cream: '#fff5df',
  cyan: '#66e4e8',
  coral: '#ff735f',
  yellow: '#f8dc58',
  violet: '#ad94ff',
  green: '#70dda0',
} as const;

function line(
  context: CanvasRenderingContext2D,
  points: readonly (readonly [number, number])[],
  color: string,
  width: number,
): void {
  const first = points[0];
  if (!first) return;
  context.beginPath();
  context.moveTo(first[0], first[1]);
  for (const point of points.slice(1)) context.lineTo(point[0], point[1]);
  context.strokeStyle = color;
  context.lineWidth = width;
  context.lineCap = 'round';
  context.lineJoin = 'round';
  context.stroke();
}

export function pigeon(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale: number,
  flip = 1,
): void {
  context.save();
  context.translate(x, y);
  context.scale(scale * flip, scale);
  context.shadowColor = 'rgba(0,0,0,0.35)';
  context.shadowBlur = 18;
  context.shadowOffsetY = 12;
  context.fillStyle = '#55708a';
  context.strokeStyle = COLORS.ink;
  context.lineWidth = 8;
  context.beginPath();
  context.ellipse(0, 10, 54, 39, -0.08, 0, Math.PI * 2);
  context.fill();
  context.stroke();
  context.shadowColor = 'transparent';
  context.fillStyle = '#718ba2';
  context.beginPath();
  context.moveTo(-18, 3);
  context.quadraticCurveTo(-68, -66, -97, -12);
  context.quadraticCurveTo(-66, -8, -18, 27);
  context.closePath();
  context.fill();
  context.stroke();
  context.fillStyle = '#67b9a4';
  context.beginPath();
  context.ellipse(42, -23, 28, 32, 0.15, 0, Math.PI * 2);
  context.fill();
  context.stroke();
  context.fillStyle = COLORS.coral;
  context.beginPath();
  context.moveTo(65, -25);
  context.lineTo(93, -14);
  context.lineTo(65, -6);
  context.closePath();
  context.fill();
  context.fillStyle = COLORS.cream;
  context.beginPath();
  context.arc(50, -32, 7, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = COLORS.ink;
  context.beginPath();
  context.arc(52, -33, 3, 0, Math.PI * 2);
  context.fill();
  line(
    context,
    [
      [-12, 43],
      [-18, 60],
    ],
    COLORS.ink,
    5,
  );
  line(
    context,
    [
      [14, 44],
      [10, 62],
    ],
    COLORS.ink,
    5,
  );
  context.restore();
}

export function samosa(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale: number,
): void {
  context.save();
  context.translate(x, y);
  context.scale(scale, scale);
  const transform = context.getTransform();
  context.scale(1, Math.min(1, Math.abs(transform.a / transform.d)));
  context.shadowColor = 'rgba(0,0,0,0.42)';
  context.shadowBlur = 28;
  context.shadowOffsetY = 18;
  const crust = context.createLinearGradient(-80, -90, 70, 90);
  crust.addColorStop(0, '#fff29a');
  crust.addColorStop(0.46, '#f3b53f');
  crust.addColorStop(1, '#c96c28');
  context.fillStyle = crust;
  context.strokeStyle = COLORS.ink;
  context.lineWidth = 10;
  context.beginPath();
  context.moveTo(0, -118);
  context.quadraticCurveTo(18, -94, 105, 98);
  context.quadraticCurveTo(0, 127, -105, 98);
  context.quadraticCurveTo(-29, -70, 0, -118);
  context.closePath();
  context.fill();
  context.stroke();
  context.shadowColor = 'transparent';
  line(
    context,
    [
      [-78, 88],
      [0, -84],
      [78, 88],
    ],
    'rgba(255,248,184,0.65)',
    8,
  );
  // Toasted bubbles and crimped pastry edge, instead of decorative green dots.
  for (let i = 0; i < 23; i++) {
    const y = -40 + ((i * 31) % 130);
    const width = (y + 118) * 0.42;
    const x = (((i * 47) % 100) / 100 - 0.5) * width * 1.5;
    context.fillStyle = i % 3 ? 'rgba(151,75,33,.34)' : 'rgba(255,243,169,.7)';
    context.beginPath();
    context.ellipse(x, y, 3 + (i % 3), 2 + (i % 2), i, 0, Math.PI * 2);
    context.fill();
  }
  context.strokeStyle = '#cf872d';
  context.lineWidth = 3;
  for (let i = 0; i < 13; i++) {
    const x = -78 + i * 13;
    context.beginPath();
    context.moveTo(x, 97);
    context.lineTo(x + 4, 108);
    context.stroke();
  }
  context.restore();
}
