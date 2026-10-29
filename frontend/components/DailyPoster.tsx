import { useEffect, useRef } from 'react';
import type { DailyGameConfig } from '@shared/game';
import { prepareHiDpiCanvas } from '@frontend/lib/canvas';
import { pigeon, samosa } from '@frontend/lib/scene-art';

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

function panel(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  fill: string | CanvasGradient | CanvasPattern,
  stroke = 'rgba(255,255,255,0.18)',
): void {
  context.beginPath();
  context.roundRect(x, y, width, height, radius);
  context.fillStyle = fill;
  context.fill();
  context.strokeStyle = stroke;
  context.lineWidth = 3;
  context.stroke();
}

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

function atmosphere(context: CanvasRenderingContext2D, accent: string): void {
  const wash = context.createLinearGradient(0, 0, 900, 700);
  wash.addColorStop(0, '#132f4a');
  wash.addColorStop(0.6, '#07192c');
  wash.addColorStop(1, '#040d19');
  context.fillStyle = wash;
  context.fillRect(0, 0, 900, 700);

  const glow = context.createRadialGradient(700, 90, 10, 700, 90, 480);
  glow.addColorStop(0, `${accent}b8`);
  glow.addColorStop(0.34, `${accent}32`);
  glow.addColorStop(1, 'rgba(0,0,0,0)');
  context.fillStyle = glow;
  context.fillRect(0, 0, 900, 700);

  context.save();
  context.globalAlpha = 0.14;
  context.strokeStyle = COLORS.cream;
  context.lineWidth = 1;
  for (let x = 32; x < 900; x += 56) {
    context.beginPath();
    context.moveTo(x, 0);
    context.lineTo(x, 700);
    context.stroke();
  }
  for (let y = 28; y < 700; y += 56) {
    context.beginPath();
    context.moveTo(0, y);
    context.lineTo(900, y);
    context.stroke();
  }
  context.restore();

  context.fillStyle = 'rgba(255,255,255,0.7)';
  for (let index = 0; index < 42; index += 1) {
    const x = (index * 137 + 31) % 900;
    const y = (index * 83 + 17) % 700;
    context.globalAlpha = 0.08 + (index % 4) * 0.025;
    context.fillRect(x, y, index % 3 === 0 ? 2 : 1, 1);
  }
  context.globalAlpha = 1;
}

function drawSamosa(context: CanvasRenderingContext2D): void {
  const sunset = context.createLinearGradient(0, 0, 0, 440);
  sunset.addColorStop(0, '#673c67');
  sunset.addColorStop(0.55, '#ef8064');
  sunset.addColorStop(1, '#ffc76e');
  context.fillStyle = sunset;
  context.fillRect(0, 0, 900, 440);
  context.fillStyle = '#1c3450';
  for (let x = 0; x < 940; x += 72) {
    const height = 90 + ((x * 19) % 150);
    context.fillRect(x, 440 - height, 54, height);
    context.fillStyle = '#ffd16c';
    for (let y = 420 - height; y < 420; y += 30) context.fillRect(x + 13, y, 7, 10);
    context.fillStyle = '#1c3450';
  }
  context.fillStyle = '#31585b';
  context.fillRect(0, 440, 900, 260);
  context.strokeStyle = 'rgba(255,255,255,0.12)';
  context.lineWidth = 4;
  for (let x = -160; x < 1_000; x += 90)
    line(
      context,
      [
        [x, 440],
        [x + 150, 700],
      ],
      context.strokeStyle,
      4,
    );
  context.shadowColor = 'rgba(0,0,0,0.4)';
  context.shadowBlur = 24;
  context.fillStyle = COLORS.cream;
  context.beginPath();
  context.ellipse(450, 535, 190, 76, 0, 0, Math.PI * 2);
  context.fill();
  context.shadowColor = 'transparent';
  context.strokeStyle = 'rgba(11,29,49,0.22)';
  context.lineWidth = 8;
  context.stroke();
  samosa(context, 450, 475, 0.9);
  pigeon(context, 185, 210, 0.72);
  pigeon(context, 730, 258, 0.82, -1);
  line(
    context,
    [
      [215, 320],
      [257, 348],
      [286, 337],
    ],
    'rgba(255,245,223,0.6)',
    6,
  );
  for (const [x, y] of [
    [560, 565],
    [590, 590],
    [330, 580],
  ] as const) {
    context.fillStyle = '#e89e39';
    context.beginPath();
    context.arc(x, y, 7, 0, Math.PI * 2);
    context.fill();
  }
}

function mosquito(context: CanvasRenderingContext2D, x: number, y: number, scale: number): void {
  context.save();
  context.translate(x, y);
  context.scale(scale, scale);
  context.fillStyle = COLORS.coral;
  context.beginPath();
  context.ellipse(0, 6, 13, 32, 0.2, 0, Math.PI * 2);
  context.fill();
  context.strokeStyle = COLORS.navy;
  context.lineWidth = 5;
  context.stroke();
  context.fillStyle = 'rgba(194,231,255,0.38)';
  context.beginPath();
  context.ellipse(-30, -15, 34, 16, -0.42, 0, Math.PI * 2);
  context.ellipse(30, -15, 34, 16, 0.42, 0, Math.PI * 2);
  context.fill();
  context.strokeStyle = 'rgba(216,232,255,0.72)';
  context.stroke();
  line(
    context,
    [
      [-8, 20],
      [-48, 48],
    ],
    COLORS.navy,
    5,
  );
  line(
    context,
    [
      [8, 20],
      [48, 48],
    ],
    COLORS.navy,
    5,
  );
  line(
    context,
    [
      [4, -23],
      [26, -60],
    ],
    COLORS.navy,
    4,
  );
  context.restore();
}

function drawMosquito(context: CanvasRenderingContext2D): void {
  const room = context.createLinearGradient(0, 0, 900, 700);
  room.addColorStop(0, '#241a4c');
  room.addColorStop(0.62, '#111a37');
  room.addColorStop(1, '#071421');
  context.fillStyle = room;
  context.fillRect(0, 0, 900, 700);
  const lamp = context.createRadialGradient(720, 120, 18, 720, 120, 310);
  lamp.addColorStop(0, 'rgba(248,220,88,0.85)');
  lamp.addColorStop(0.2, 'rgba(248,220,88,0.25)');
  lamp.addColorStop(1, 'rgba(248,220,88,0)');
  context.fillStyle = lamp;
  context.fillRect(380, 0, 520, 520);
  context.fillStyle = '#b7c2dc';
  context.beginPath();
  context.arc(725, 105, 58, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = '#251c4e';
  context.beginPath();
  context.arc(752, 86, 58, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = '#3d2b2b';
  context.fillRect(0, 485, 900, 215);
  context.fillStyle = '#5e4033';
  context.fillRect(0, 485, 900, 20);
  panel(context, 80, 320, 350, 220, 20, '#0a1425', '#4a6d85');
  context.fillStyle = '#8deaf0';
  context.globalAlpha = 0.24;
  context.fillRect(105, 345, 300, 145);
  context.globalAlpha = 1;
  line(
    context,
    [
      [135, 400],
      [365, 400],
    ],
    '#66e4e8',
    6,
  );
  line(
    context,
    [
      [160, 438],
      [335, 438],
    ],
    '#ad94ff',
    6,
  );
  panel(context, 654, 500, 110, 105, 18, COLORS.cream, COLORS.ink);
  context.fillStyle = '#8c5037';
  context.beginPath();
  context.ellipse(708, 535, 35, 18, 0, 0, Math.PI * 2);
  context.fill();
  line(
    context,
    [
      [680, 477],
      [668, 437],
      [690, 410],
    ],
    'rgba(255,245,223,0.45)',
    5,
  );
  panel(context, 490, 525, 105, 150, 18, '#16243a', '#6b88a3');
  context.fillStyle = COLORS.coral;
  context.beginPath();
  context.arc(570, 542, 15, 0, Math.PI * 2);
  context.fill();
  mosquito(context, 270, 180, 1.05);
  mosquito(context, 565, 280, 1.3);
  mosquito(context, 790, 390, 0.78);
  line(
    context,
    [
      [205, 218],
      [155, 250],
      [120, 244],
    ],
    'rgba(173,148,255,0.55)',
    5,
  );
  line(
    context,
    [
      [494, 300],
      [458, 345],
      [420, 333],
    ],
    'rgba(173,148,255,0.55)',
    5,
  );
}

function drawMicrowave(context: CanvasRenderingContext2D): void {
  const wall = context.createLinearGradient(0, 0, 0, 700);
  wall.addColorStop(0, '#efeadf');
  wall.addColorStop(0.68, '#cbd8d7');
  wall.addColorStop(0.681, '#264052');
  wall.addColorStop(1, '#132739');
  context.fillStyle = wall;
  context.fillRect(0, 0, 900, 700);
  context.strokeStyle = 'rgba(11,29,49,0.13)';
  context.lineWidth = 3;
  for (let x = 0; x < 900; x += 120)
    line(
      context,
      [
        [x, 0],
        [x, 475],
      ],
      context.strokeStyle,
      3,
    );
  for (let y = 0; y < 475; y += 94)
    line(
      context,
      [
        [0, y],
        [900, y],
      ],
      context.strokeStyle,
      3,
    );
  context.save();
  context.shadowColor = 'rgba(0,0,0,0.42)';
  context.shadowBlur = 35;
  context.shadowOffsetY = 22;
  panel(context, 92, 116, 716, 452, 38, '#d9d7cd', '#071523');
  context.restore();
  const metal = context.createLinearGradient(120, 130, 780, 550);
  metal.addColorStop(0, '#f4f1e8');
  metal.addColorStop(0.48, '#b9c1c1');
  metal.addColorStop(1, '#7c8c91');
  context.fillStyle = metal;
  context.beginPath();
  context.roundRect(118, 142, 664, 394, 26);
  context.fill();
  panel(context, 150, 174, 438, 320, 20, '#07131f', '#42596a');
  const glass = context.createLinearGradient(160, 180, 570, 480);
  glass.addColorStop(0, 'rgba(102,228,232,0.2)');
  glass.addColorStop(0.45, 'rgba(255,255,255,0.03)');
  glass.addColorStop(1, 'rgba(248,220,88,0.16)');
  context.fillStyle = glass;
  context.fillRect(169, 193, 400, 282);
  context.fillStyle = '#d88a4f';
  context.beginPath();
  context.ellipse(370, 365, 130, 60, 0, 0, Math.PI * 2);
  context.fill();
  context.strokeStyle = COLORS.cream;
  context.lineWidth = 7;
  context.stroke();
  for (let angle = 0; angle < 6; angle += 1) {
    const radians = (angle / 6) * Math.PI * 2;
    line(
      context,
      [
        [370, 365],
        [370 + Math.cos(radians) * 106, 365 + Math.sin(radians) * 45],
      ],
      'rgba(255,245,223,0.55)',
      5,
    );
  }
  panel(context, 620, 175, 128, 102, 14, '#07131f', '#142b3d');
  context.fillStyle = COLORS.green;
  context.font = '800 39px ui-monospace, monospace';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText('00:01', 684, 226);
  for (const y of [333, 423]) {
    const knob = context.createRadialGradient(665, y - 10, 4, 684, y, 40);
    knob.addColorStop(0, '#ffffff');
    knob.addColorStop(0.55, '#c6cece');
    knob.addColorStop(1, '#75858b');
    context.fillStyle = knob;
    context.beginPath();
    context.arc(684, y, 35, 0, Math.PI * 2);
    context.fill();
    context.strokeStyle = COLORS.ink;
    context.lineWidth = 7;
    context.stroke();
    line(
      context,
      [
        [684, y],
        [701, y - 18],
      ],
      COLORS.ink,
      5,
    );
  }
  line(
    context,
    [
      [365, 126],
      [345, 86],
      [365, 52],
    ],
    'rgba(255,255,255,0.6)',
    7,
  );
  line(
    context,
    [
      [415, 126],
      [436, 83],
      [422, 48],
    ],
    'rgba(255,255,255,0.45)',
    7,
  );
}

function basket(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  color: string,
): void {
  context.save();
  context.shadowColor = 'rgba(0,0,0,0.35)';
  context.shadowBlur = 20;
  context.shadowOffsetY = 14;
  context.fillStyle = color;
  context.strokeStyle = COLORS.ink;
  context.lineWidth = 9;
  context.beginPath();
  context.moveTo(x, y);
  context.lineTo(x + width, y);
  context.lineTo(x + width - 24, y + 155);
  context.lineTo(x + 24, y + 155);
  context.closePath();
  context.fill();
  context.stroke();
  context.shadowColor = 'transparent';
  for (let row = 0; row < 4; row += 1) {
    for (let column = 0; column < 5; column += 1) {
      context.fillStyle = 'rgba(11,29,49,0.18)';
      context.beginPath();
      context.roundRect(x + 35 + column * 31, y + 28 + row * 27, 18, 11, 5);
      context.fill();
    }
  }
  context.restore();
}

function drawLaundry(context: CanvasRenderingContext2D): void {
  const wall = context.createLinearGradient(0, 0, 0, 700);
  wall.addColorStop(0, '#dceef0');
  wall.addColorStop(0.7, '#b9d8d7');
  wall.addColorStop(0.701, '#709584');
  wall.addColorStop(1, '#436b5c');
  context.fillStyle = wall;
  context.fillRect(0, 0, 900, 700);
  context.strokeStyle = 'rgba(29,67,76,0.12)';
  for (let x = 0; x < 900; x += 110)
    line(
      context,
      [
        [x, 0],
        [x, 490],
      ],
      context.strokeStyle,
      3,
    );
  for (let y = 0; y < 490; y += 95)
    line(
      context,
      [
        [0, y],
        [900, y],
      ],
      context.strokeStyle,
      3,
    );
  panel(context, 72, 145, 286, 372, 28, '#f5efe1', COLORS.ink);
  const door = context.createRadialGradient(188, 300, 15, 215, 324, 116);
  door.addColorStop(0, '#70e4e8');
  door.addColorStop(0.65, '#315b70');
  door.addColorStop(1, '#122438');
  context.fillStyle = door;
  context.beginPath();
  context.arc(215, 330, 102, 0, Math.PI * 2);
  context.fill();
  context.strokeStyle = '#83979b';
  context.lineWidth = 17;
  context.stroke();
  context.fillStyle = '#17283b';
  context.beginPath();
  context.roundRect(120, 177, 190, 45, 10);
  context.fill();
  context.fillStyle = COLORS.green;
  context.beginPath();
  context.arc(285, 199, 8, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = '#d7c08c';
  context.fillRect(450, 108, 365, 18);
  panel(context, 486, 44, 57, 64, 8, '#89c6ff', COLORS.ink);
  panel(context, 600, 56, 46, 52, 8, COLORS.coral, COLORS.ink);
  panel(context, 685, 38, 62, 70, 8, COLORS.yellow, COLORS.ink);
  line(
    context,
    [
      [395, 235],
      [832, 187],
    ],
    '#526d72',
    6,
  );
  context.fillStyle = COLORS.cream;
  context.beginPath();
  context.moveTo(515, 218);
  context.lineTo(550, 200);
  context.lineTo(586, 217);
  context.lineTo(574, 292);
  context.lineTo(526, 292);
  context.closePath();
  context.fill();
  context.strokeStyle = COLORS.ink;
  context.lineWidth = 7;
  context.stroke();
  context.fillStyle = '#243b62';
  context.beginPath();
  context.moveTo(690, 199);
  context.lineTo(735, 194);
  context.lineTo(750, 282);
  context.quadraticCurveTo(722, 310, 670, 284);
  context.closePath();
  context.fill();
  context.stroke();
  basket(context, 390, 445, 190, '#f5ead5');
  basket(context, 626, 445, 190, '#354459');
  context.fillStyle = COLORS.coral;
  context.beginPath();
  context.moveTo(665, 438);
  context.lineTo(704, 395);
  context.lineTo(754, 439);
  context.closePath();
  context.fill();
  context.strokeStyle = COLORS.ink;
  context.lineWidth = 7;
  context.stroke();
}

function drawPothole(context: CanvasRenderingContext2D): void {
  const sky = context.createLinearGradient(0, 0, 0, 700);
  sky.addColorStop(0, '#78d4df');
  sky.addColorStop(0.42, '#f1c179');
  sky.addColorStop(0.421, '#414953');
  sky.addColorStop(1, '#181f28');
  context.fillStyle = sky;
  context.fillRect(0, 0, 900, 700);
  context.fillStyle = '#214056';
  for (let x = -10; x < 920; x += 82) {
    const height = 70 + ((x * 11) % 110);
    context.fillRect(x, 295 - height, 62, height);
  }
  context.fillStyle = '#343d47';
  context.beginPath();
  context.moveTo(328, 292);
  context.lineTo(572, 292);
  context.lineTo(895, 700);
  context.lineTo(5, 700);
  context.closePath();
  context.fill();
  line(
    context,
    [
      [408, 300],
      [280, 700],
    ],
    COLORS.yellow,
    10,
  );
  line(
    context,
    [
      [492, 300],
      [620, 700],
    ],
    COLORS.yellow,
    10,
  );
  context.setLineDash([38, 34]);
  line(
    context,
    [
      [450, 305],
      [450, 700],
    ],
    'rgba(255,245,223,0.75)',
    7,
  );
  context.setLineDash([]);
  for (const [x, y, sx, sy] of [
    [370, 385, 52, 18],
    [560, 506, 76, 28],
    [260, 610, 100, 37],
  ] as const) {
    context.fillStyle = '#090f17';
    context.beginPath();
    context.ellipse(x, y, sx, sy, -0.1, 0, Math.PI * 2);
    context.fill();
    context.strokeStyle = '#616b72';
    context.lineWidth = 4;
    context.stroke();
  }
  context.save();
  context.translate(510, 535);
  context.shadowColor = 'rgba(0,0,0,0.5)';
  context.shadowBlur = 25;
  context.shadowOffsetY = 18;
  const paint = context.createLinearGradient(-90, -80, 90, 80);
  paint.addColorStop(0, '#ff967d');
  paint.addColorStop(0.45, COLORS.coral);
  paint.addColorStop(1, '#bc433a');
  context.fillStyle = paint;
  context.strokeStyle = COLORS.ink;
  context.lineWidth = 9;
  context.beginPath();
  context.roundRect(-82, -75, 164, 142, 32);
  context.fill();
  context.stroke();
  context.shadowColor = 'transparent';
  context.fillStyle = '#b8eff4';
  context.beginPath();
  context.roundRect(-58, -50, 116, 47, 12);
  context.fill();
  line(
    context,
    [
      [-34, -43],
      [-45, -8],
    ],
    'rgba(255,255,255,0.65)',
    7,
  );
  context.fillStyle = COLORS.yellow;
  for (const wheelX of [-50, 50]) {
    context.beginPath();
    context.arc(wheelX, 67, 23, 0, Math.PI * 2);
    context.fill();
    context.stroke();
  }
  context.restore();
  panel(context, 78, 102, 130, 106, 16, '#f6dd57', COLORS.ink);
  line(
    context,
    [
      [143, 208],
      [143, 282],
    ],
    COLORS.ink,
    8,
  );
  context.fillStyle = COLORS.ink;
  context.font = '900 21px system-ui';
  context.textAlign = 'center';
  context.fillText('ROAD', 143, 140);
  context.fillText('MOOD', 143, 171);
}

function envelope(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  rotation: number,
  color: string,
): void {
  context.save();
  context.translate(x, y);
  context.rotate(rotation);
  context.shadowColor = 'rgba(0,0,0,0.3)';
  context.shadowBlur = 20;
  context.shadowOffsetY = 12;
  panel(context, -86, -58, 172, 116, 15, color, COLORS.ink);
  context.shadowColor = 'transparent';
  line(
    context,
    [
      [-76, -48],
      [0, 18],
      [76, -48],
    ],
    'rgba(11,29,49,0.5)',
    6,
  );
  context.restore();
}

function drawInbox(context: CanvasRenderingContext2D): void {
  const backdrop = context.createLinearGradient(0, 0, 900, 700);
  backdrop.addColorStop(0, '#1c2d48');
  backdrop.addColorStop(1, '#071421');
  context.fillStyle = backdrop;
  context.fillRect(0, 0, 900, 700);
  const halo = context.createRadialGradient(420, 285, 20, 420, 285, 420);
  halo.addColorStop(0, 'rgba(255,115,95,0.35)');
  halo.addColorStop(1, 'rgba(255,115,95,0)');
  context.fillStyle = halo;
  context.fillRect(0, 0, 900, 620);
  context.fillStyle = '#4d342e';
  context.fillRect(0, 515, 900, 185);
  context.fillStyle = '#765447';
  context.fillRect(0, 515, 900, 16);
  context.save();
  context.shadowColor = 'rgba(0,0,0,0.48)';
  context.shadowBlur = 28;
  context.shadowOffsetY = 18;
  panel(context, 190, 120, 520, 410, 24, '#dbe3e1', COLORS.ink);
  context.restore();
  panel(context, 218, 148, 464, 304, 16, '#0c1a2c', '#4a6578');
  context.fillStyle = '#17324c';
  context.fillRect(238, 174, 424, 52);
  context.fillStyle = COLORS.cyan;
  context.font = '800 17px system-ui';
  context.textAlign = 'left';
  context.textBaseline = 'middle';
  context.fillText('INBOX / 99+', 263, 200);
  for (let row = 0; row < 3; row += 1) {
    panel(
      context,
      246,
      248 + row * 61,
      407,
      47,
      9,
      row === 0 ? '#fff5df' : '#dfe7e6',
      'transparent',
    );
    context.fillStyle = row === 0 ? COLORS.coral : row === 1 ? COLORS.cyan : COLORS.violet;
    context.beginPath();
    context.arc(273, 271 + row * 61, 12, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = '#66717c';
    context.fillRect(300, 261 + row * 61, 210 - row * 20, 8);
    context.fillRect(300, 277 + row * 61, 125 + row * 25, 6);
  }
  context.fillStyle = '#9ba9a8';
  context.beginPath();
  context.moveTo(280, 530);
  context.lineTo(620, 530);
  context.lineTo(685, 574);
  context.lineTo(215, 574);
  context.closePath();
  context.fill();
  context.strokeStyle = COLORS.ink;
  context.lineWidth = 8;
  context.stroke();
  envelope(context, 126, 315, -0.22, COLORS.cream);
  envelope(context, 757, 277, 0.2, COLORS.yellow);
  envelope(context, 720, 470, -0.1, COLORS.cyan);
  context.fillStyle = COLORS.coral;
  context.beginPath();
  context.arc(742, 118, 65, 0, Math.PI * 2);
  context.fill();
  context.strokeStyle = COLORS.ink;
  context.lineWidth = 8;
  context.stroke();
  context.fillStyle = COLORS.cream;
  context.font = '900 31px system-ui';
  context.textAlign = 'center';
  context.fillText('99+', 742, 121);
}

function drawElevator(context: CanvasRenderingContext2D): void {
  const wall = context.createLinearGradient(0, 0, 900, 700);
  wall.addColorStop(0, '#244458');
  wall.addColorStop(1, '#081624');
  context.fillStyle = wall;
  context.fillRect(0, 0, 900, 700);
  context.strokeStyle = 'rgba(255,255,255,0.08)';
  for (let x = 0; x < 900; x += 92)
    line(
      context,
      [
        [x, 0],
        [x, 700],
      ],
      context.strokeStyle,
      3,
    );
  const brass = context.createLinearGradient(115, 80, 680, 630);
  brass.addColorStop(0, '#f7e8ad');
  brass.addColorStop(0.3, '#b99548');
  brass.addColorStop(0.6, '#f3db8c');
  brass.addColorStop(1, '#7f602c');
  context.save();
  context.shadowColor = 'rgba(0,0,0,0.45)';
  context.shadowBlur = 32;
  context.shadowOffsetY = 18;
  panel(context, 92, 74, 568, 566, 30, brass, COLORS.ink);
  context.restore();
  panel(context, 126, 110, 500, 495, 18, '#1b2a33', '#f2dc91');
  const doorLight = context.createLinearGradient(150, 130, 600, 570);
  doorLight.addColorStop(0, '#8099a2');
  doorLight.addColorStop(0.5, '#3c5662');
  doorLight.addColorStop(1, '#172c37');
  context.fillStyle = doorLight;
  context.fillRect(148, 132, 228, 451);
  context.fillRect(385, 132, 218, 451);
  line(
    context,
    [
      [380, 132],
      [380, 583],
    ],
    '#d9ca9a',
    7,
  );
  for (let y = 165; y < 570; y += 48) {
    line(
      context,
      [
        [162, y],
        [362, y],
      ],
      'rgba(255,255,255,0.09)',
      3,
    );
    line(
      context,
      [
        [400, y],
        [589, y],
      ],
      'rgba(255,255,255,0.09)',
      3,
    );
  }
  panel(context, 704, 102, 132, 165, 20, '#050c13', '#d5b762');
  context.fillStyle = COLORS.cyan;
  context.font = '900 86px ui-monospace, monospace';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText('7', 770, 184);
  context.fillStyle = COLORS.yellow;
  context.beginPath();
  context.moveTo(770, 118);
  context.lineTo(748, 142);
  context.lineTo(792, 142);
  context.closePath();
  context.fill();
  panel(context, 714, 310, 112, 235, 28, '#152536', '#637a87');
  for (let row = 0; row < 3; row += 1) {
    for (let column = 0; column < 2; column += 1) {
      const x = 746 + column * 48;
      const y = 352 + row * 70;
      const active = row === 1 && column === 0;
      context.fillStyle = active ? COLORS.yellow : '#9aabad';
      context.beginPath();
      context.arc(x, y, 18, 0, Math.PI * 2);
      context.fill();
      context.strokeStyle = active ? '#fff6bd' : COLORS.ink;
      context.lineWidth = active ? 8 : 5;
      context.stroke();
    }
  }
  context.fillStyle = COLORS.coral;
  context.font = '900 64px system-ui';
  context.fillText('♪', 102, 196);
  context.fillStyle = COLORS.cyan;
  context.fillText('♫', 672, 620);
  context.fillStyle = COLORS.yellow;
  context.fillText('♪', 812, 622);
  line(
    context,
    [
      [74, 251],
      [129, 231],
      [165, 259],
    ],
    'rgba(255,245,223,0.32)',
    5,
  );
}

function drawPoster(canvas: HTMLCanvasElement, config: DailyGameConfig): void {
  const prepared = prepareHiDpiCanvas(canvas, 900, 700);
  if (!prepared) return;
  const { context } = prepared;
  const accent = COLORS[config.palette];
  context.clearRect(0, 0, 900, 700);
  atmosphere(context, accent);

  if (config.poster === 'samosa-pigeons') drawSamosa(context);
  else if (config.poster === 'mosquito-night') drawMosquito(context);
  else if (config.poster === 'microwave-timer') drawMicrowave(context);
  else if (config.poster === 'laundry-piles') drawLaundry(context);
  else if (config.poster === 'pothole-street') drawPothole(context);
  else if (config.poster === 'inbox-storm') drawInbox(context);
  else drawElevator(context);

  const edge = context.createLinearGradient(0, 0, 0, 700);
  edge.addColorStop(0, 'rgba(255,255,255,0.09)');
  edge.addColorStop(0.65, 'rgba(255,255,255,0)');
  edge.addColorStop(1, 'rgba(0,0,0,0.28)');
  context.fillStyle = edge;
  context.fillRect(0, 0, 900, 700);
}

export function DailyPoster({ config }: { config: DailyGameConfig }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (canvasRef.current) drawPoster(canvasRef.current, config);
  }, [config]);
  return (
    <canvas ref={canvasRef} className="daily-poster" role="img" aria-label="Today’s game artwork" />
  );
}
