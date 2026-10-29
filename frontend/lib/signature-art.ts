// Original local vector assets. Parts share ink, reflected light and warm contact shadows.
const ink = '#172733';
const cream = '#fff3d7';
type Context = CanvasRenderingContext2D;
export function ellipse(c: Context, x: number, y: number, rx: number, ry: number, fill: string) {
  c.fillStyle = fill;
  c.beginPath();
  c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  c.fill();
}
export function panel(
  c: Context,
  x: number,
  y: number,
  w: number,
  h: number,
  fill: string | CanvasGradient,
  radius = 12,
) {
  c.fillStyle = fill;
  c.beginPath();
  c.roundRect(x, y, w, h, radius);
  c.fill();
}
export function material(
  c: Context,
  x: number,
  y: number,
  w: number,
  h: number,
  colors: readonly [string, string, string],
) {
  const gradient = c.createLinearGradient(x, y, x + w, y + h);
  gradient.addColorStop(0, colors[0]);
  gradient.addColorStop(0.45, colors[1]);
  gradient.addColorStop(1, colors[2]);
  return gradient;
}
function stroke(c: Context, points: number[], color: string, width: number) {
  c.beginPath();
  c.moveTo(points[0]!, points[1]!);
  for (let i = 2; i < points.length; i += 2) c.lineTo(points[i]!, points[i + 1]!);
  c.strokeStyle = color;
  c.lineWidth = width;
  c.lineCap = 'round';
  c.lineJoin = 'round';
  c.stroke();
}

export function pigeonActor(c: Context, phase: number, alarm = false) {
  c.save();
  c.lineJoin = 'round';
  c.lineCap = 'round';
  ellipse(c, -7, 45, 53, 10, 'rgba(20,32,38,.2)');
  // Tail, feet, body, articulated far/near wings, iridescent collar, head.
  c.fillStyle = '#435a70';
  c.beginPath();
  c.moveTo(-34, 6);
  c.lineTo(-86, -16);
  c.lineTo(-70, 30);
  c.lineTo(-28, 30);
  c.fill();
  stroke(c, [-15, 31, -22, 49, -34, 52], '#d99a78', 4);
  stroke(c, [13, 32, 9, 50, 23, 52], '#d99a78', 4);
  c.fillStyle = material(c, -40, -28, 90, 70, ['#bac5cd', '#7796a3', '#405c76']);
  c.beginPath();
  c.ellipse(0, 6, 47, 34, -0.12, 0, Math.PI * 2);
  c.fill();
  c.strokeStyle = ink;
  c.lineWidth = 4;
  c.stroke();
  const flap = Math.sin(phase) * 0.65;
  c.save();
  c.translate(-6, -5);
  c.rotate(flap - (alarm ? 0.8 : 0.3));
  c.fillStyle = material(c, -78, -55, 86, 65, ['#d0d5d5', '#718aa2', '#40506d']);
  c.beginPath();
  c.moveTo(15, 12);
  c.bezierCurveTo(-7, -48, -50, -75, -84, -35);
  c.quadraticCurveTo(-58, -34, -68, -14);
  c.quadraticCurveTo(-40, -20, -51, 2);
  c.quadraticCurveTo(-25, -3, -28, 19);
  c.closePath();
  c.fill();
  c.stroke();
  for (let f = 0; f < 4; f++)
    stroke(c, [-6 - f * 12, -11 - f * 7, -34 - f * 9, -29 - f * 2], '#d8dce0', 2);
  c.restore();
  ellipse(c, 31, -15, 23, 28, '#387e7a');
  stroke(c, [18, -7, 33, 1, 49, -6], '#a2c5a1', 5);
  ellipse(c, 42, -31, 23, 22, '#829cad');
  c.fillStyle = '#dda176';
  c.beginPath();
  c.moveTo(61, -31);
  c.lineTo(84, -22);
  c.lineTo(61, -18);
  c.closePath();
  c.fill();
  ellipse(c, 49, -35, 7, 8, cream);
  ellipse(c, 51, -34, 3, 5, ink);
  ellipse(c, 52, -37, 1.4, 1.4, 'white');
  c.restore();
}

export function mosquitoActor(c: Context, phase: number) {
  c.save();
  c.rotate(Math.sin(phase * 0.12) * 0.12);
  for (const side of [-1, 1]) {
    for (let leg = 0; leg < 3; leg++)
      stroke(
        c,
        [side * 8, -6 + leg * 12, side * (30 + leg * 3), -15 + leg * 19, side * 48, -25 + leg * 28],
        '#d8b99e',
        3,
      );
    c.save();
    c.rotate(side * (0.6 + Math.sin(phase) * 0.28));
    ellipse(c, side * 21, -18, 14, 32, 'rgba(223,244,245,.72)');
    stroke(c, [side * 13, 7, side * 24, -44], 'rgba(255,255,255,.8)', 1.4);
    c.restore();
  }
  ellipse(c, 0, 10, 13, 31, '#bf695e');
  for (let y = 0; y < 35; y += 10) stroke(c, [-9, y, 9, y], '#502e43', 3);
  ellipse(c, 0, -19, 15, 15, '#4c344b');
  ellipse(c, -8, -23, 6, 7, '#efa672');
  ellipse(c, 8, -23, 6, 7, '#efa672');
  stroke(c, [0, -30, 0, -57], '#f4ded0', 3);
  c.restore();
}

export function carActor(c: Context, tick: number, lean: number, bump: number) {
  c.save();
  ellipse(c, 0, 75, 96, 22, 'rgba(0,0,0,.32)');
  for (const x of [-70, 70]) {
    panel(c, x - 13, -37, 26, 68, '#121e29', 8);
    panel(c, x - 13, 44, 26, 52, '#121e29', 8);
    for (let y = 0; y < 4; y++) stroke(c, [x - 8, 48 + y * 10, x + 8, 48 + y * 10], '#5e6870', 3);
  }
  c.translate(0, bump + Math.sin(tick * 0.25) * 1.3);
  c.rotate(lean);
  c.fillStyle = material(c, -68, -95, 136, 180, ['#ffbf8c', '#ef7560', '#ae3547']);
  c.strokeStyle = ink;
  c.lineWidth = 5;
  c.beginPath();
  c.roundRect(-68, -95, 136, 181, [40, 40, 25, 25]);
  c.fill();
  c.stroke();
  panel(
    c,
    -54,
    -58,
    108,
    53,
    material(c, -54, -58, 108, 53, ['#bde7df', '#406e83', '#284957']),
    16,
  );
  stroke(c, [-39, -49, -20, -13], '#e8f7ed', 8);
  stroke(c, [-17, -49, 0, -13], 'rgba(232,247,237,.5)', 3);
  panel(c, -49, 19, 98, 39, '#cd5b51', 8);
  stroke(c, [-42, 27, 42, 27], '#ffa58b', 3);
  panel(c, -60, 61, 30, 13, '#ffe9a8', 4);
  panel(c, 30, 61, 30, 13, '#ffe9a8', 4);
  panel(c, -26, 68, 52, 14, '#293d4b', 4);
  panel(c, -17, 87, 34, 8, '#f0dbbd', 2);
  stroke(c, [-59, -62, -59, 45], '#ffcb9b', 3);
  stroke(c, [60, -60, 60, 47], '#b3454c', 3);
  c.restore();
}

export function paperFlight(c: Context, progress: number, side: number, good: boolean) {
  c.save();
  c.translate(500 + side * progress * 330, 470 - progress * 120 + progress * progress * 340);
  const transform = c.getTransform();
  c.scale(
    1,
    Math.min(1, Math.hypot(transform.a, transform.b) / Math.hypot(transform.c, transform.d)),
  );
  c.rotate(side * progress * 0.65);
  panel(c, -140, -95, 280, 190, 'rgba(20,28,39,.2)', 18);
  panel(c, -145, -110, 280, 190, '#fff3d7', 18);
  for (let y = 0; y < 3; y++)
    stroke(c, [-110, -65 + y * 25, 50 - y * 10, -65 + y * 25], '#b8b5a5', 5);
  c.strokeStyle = good ? '#297d67' : '#ac4038';
  c.lineWidth = 7;
  c.strokeRect(-66, -18, 175, 65);
  c.fillStyle = c.strokeStyle;
  c.font = '900 28px system-ui';
  c.textAlign = 'center';
  c.fillText(good ? 'FILED' : 'MISFILED', 20, 25);
  c.restore();
}

export function brassCab(c: Context) {
  panel(c, 38, 50, 658, 890, material(c, 38, 50, 658, 890, ['#7e6240', '#f3dba0', '#8c734d']), 28);
  panel(c, 62, 74, 610, 845, '#112d39', 16);
  panel(
    c,
    92,
    130,
    550,
    725,
    material(c, 92, 130, 550, 725, ['#172832', '#5f7376', '#132833']),
    10,
  );
  // A warm cab glimpsed between the doors, ceiling lamp and tiled floor.
  panel(c, 260, 160, 215, 600, '#dfb36f', 0);
  panel(c, 286, 170, 165, 20, '#fff0b7', 5);
  for (let y = 590; y < 845; y += 38) stroke(c, [110, y, 630, y], '#a49c7d', 2);
  for (let x = 100; x < 650; x += 35) stroke(c, [370, 590, x, 845], 'rgba(222,216,190,.3)', 2);
  for (let y = 96; y < 130; y += 6) stroke(c, [280, y, 452, y], '#b8945c', 2);
  panel(c, 225, 81, 285, 50, '#19343b', 10);
  ellipse(c, 85, 113, 5, 5, '#fff2bc');
  ellipse(c, 650, 113, 5, 5, '#fff2bc');
  panel(c, 55, 900, 625, 14, '#ecd49c', 3);
}

export function elevatorDoors(c: Context, amount: number, sides: readonly number[] = [-1, 1]) {
  for (const side of sides) {
    const x = side === -1 ? 106 - amount : 372 + amount;
    panel(c, x, 150, 258, 708, material(c, x, 150, 258, 708, ['#526f78', '#b7c5c0', '#4b6b76']), 3);
    for (let i = 0; i < 90; i++)
      stroke(
        c,
        [x + 3, 157 + i * 7.7, x + 255, 157 + i * 7.7],
        i % 3 === 0 ? 'rgba(255,255,236,.09)' : 'rgba(25,50,63,.06)',
        1,
      );
    stroke(c, [x + 34, 170, x + 70, 832], 'rgba(255,255,231,.2)', 24);
    stroke(c, [side < 0 ? x + 253 : x + 5, 155, side < 0 ? x + 253 : x + 5, 852], '#23404c', 4);
  }
}
