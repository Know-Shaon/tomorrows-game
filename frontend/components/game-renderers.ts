import {
  WORLD_HEIGHT,
  WORLD_WIDTH,
  getDefenseThreatPosition,
  type ClassifyConfig,
  type ClassifyState,
  type DailyGameConfig,
  type DailyGameState,
  type DefenseConfig,
  type DefenseState,
  type DodgeConfig,
  type DodgeState,
  type MessageIcon,
  type SequenceConfig,
  type SequenceState,
  type SortConfig,
  type SortState,
  type SortToken,
  type TapConfig,
  type TapState,
  type TapToken,
  type TimingConfig,
  type TimingState,
} from '@shared/game';

export type RendererId =
  | 'samosa-defense'
  | 'pothole-lanes'
  | 'mosquito-hunt'
  | 'inbox-cards'
  | 'microwave-timer'
  | 'elevator-sequence'
  | 'laundry-sort';

const COLORS = {
  navy: '#07172b',
  cream: '#f7efdc',
  cyan: '#56e7ed',
  coral: '#ff755f',
  yellow: '#f6df49',
  violet: '#b9a0ff',
  green: '#7de3a1',
};

function fillBackground(context: CanvasRenderingContext2D, top: string, bottom: string): void {
  const gradient = context.createLinearGradient(0, 0, 0, WORLD_HEIGHT);
  gradient.addColorStop(0, top);
  gradient.addColorStop(1, bottom);
  context.fillStyle = gradient;
  context.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
}

function label(
  context: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  size: number,
  color = COLORS.cream,
): void {
  context.fillStyle = color;
  context.font = `900 ${size}px system-ui`;
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText(text, x, y);
}

function drawPigeon(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale: number,
  angle: number,
): void {
  context.save();
  context.translate(x, y);
  context.rotate(angle + Math.PI);
  context.scale(scale, scale);
  context.fillStyle = '#43566e';
  context.strokeStyle = COLORS.navy;
  context.lineWidth = 8;
  context.beginPath();
  context.ellipse(0, 0, 42, 29, 0, 0, Math.PI * 2);
  context.fill();
  context.stroke();
  context.fillStyle = '#6f849b';
  context.beginPath();
  context.moveTo(-8, -5);
  context.quadraticCurveTo(-65, -65, -84, 0);
  context.quadraticCurveTo(-42, -20, -5, 13);
  context.fill();
  context.stroke();
  context.fillStyle = '#b9e75d';
  context.beginPath();
  context.arc(35, -21, 21, 0, Math.PI * 2);
  context.fill();
  context.stroke();
  context.fillStyle = COLORS.coral;
  context.beginPath();
  context.moveTo(52, -22);
  context.lineTo(76, -15);
  context.lineTo(53, -8);
  context.closePath();
  context.fill();
  context.fillStyle = COLORS.cream;
  context.beginPath();
  context.arc(40, -27, 5, 0, Math.PI * 2);
  context.fill();
  context.restore();
}

function feedbackEffects(
  context: CanvasRenderingContext2D,
  state: DailyGameState,
  reducedMotion: boolean,
): void {
  if (!state.feedback || state.feedbackTicks <= 0) return;
  const color = state.feedback === 'good' ? COLORS.green : COLORS.coral;
  context.save();
  context.globalAlpha = Math.min(0.72, state.feedbackTicks / 20);
  context.strokeStyle = color;
  context.lineWidth = 20;
  context.strokeRect(12, 12, WORLD_WIDTH - 24, WORLD_HEIGHT - 24);
  if (!reducedMotion) {
    for (let index = 0; index < 12; index += 1) {
      const angle = (index / 12) * Math.PI * 2;
      const radius = 55 + (20 - state.feedbackTicks) * 5;
      context.fillStyle = index % 2 ? color : COLORS.yellow;
      context.beginPath();
      context.arc(
        500 + Math.cos(angle) * radius,
        120 + Math.sin(angle) * radius,
        8,
        0,
        Math.PI * 2,
      );
      context.fill();
    }
  }
  label(context, state.feedback === 'good' ? 'NICE!' : 'OOPS!', 500, 115, 52, color);
  context.restore();
}

function drawDefense(
  context: CanvasRenderingContext2D,
  config: DefenseConfig,
  state: DefenseState,
): void {
  fillBackground(context, '#f2a86f', '#ffd07a');
  context.fillStyle = '#d9674b';
  context.fillRect(0, 150, 1_000, 210);
  context.fillStyle = '#754d45';
  for (let x = 25; x < 1_000; x += 115) {
    context.fillRect(x, 185 + ((x / 115) % 2) * 30, 80, 120);
  }
  context.fillStyle = '#2e6d6a';
  context.fillRect(0, 360, 1_000, 640);
  context.strokeStyle = '#285f5d';
  context.lineWidth = 5;
  for (let x = -200; x < 1_200; x += 110) {
    context.beginPath();
    context.moveTo(x, 360);
    context.lineTo(x + 250, 1_000);
    context.stroke();
  }
  context.fillStyle = COLORS.cream;
  context.strokeStyle = COLORS.navy;
  context.lineWidth = 15;
  context.beginPath();
  context.ellipse(500, 550, 155, 95, 0, 0, Math.PI * 2);
  context.fill();
  context.stroke();
  context.fillStyle = COLORS.yellow;
  context.beginPath();
  context.moveTo(500, 420);
  context.lineTo(620, 635);
  context.lineTo(380, 635);
  context.closePath();
  context.fill();
  context.stroke();
  context.fillStyle = '#529447';
  for (const [x, y] of [
    [476, 540],
    [530, 575],
    [500, 500],
  ] as const) {
    context.beginPath();
    context.arc(x, y, 9, 0, Math.PI * 2);
    context.fill();
  }
  for (const threat of state.threats) {
    const position = getDefenseThreatPosition(threat, state.tick);
    const scale = 0.55 + (650 - threat.distance) / 850;
    drawPigeon(context, position.x, position.y, scale, threat.angle);
  }
  context.fillStyle = 'rgba(7,23,43,0.86)';
  context.fillRect(24, 24, 300, 74);
  label(context, `SHOOED ${state.shooed}`, 174, 61, 28);
  for (let index = 0; index < config.maxHealth; index += 1) {
    context.fillStyle = index < state.health ? COLORS.yellow : 'rgba(7,23,43,0.25)';
    context.beginPath();
    context.moveTo(820 + index * 55, 30);
    context.lineTo(850 + index * 55, 85);
    context.lineTo(790 + index * 55, 85);
    context.closePath();
    context.fill();
  }
}

function roadLaneX(lane: number, progress: number): number {
  const horizon = 430 + lane * 70;
  const near = 225 + lane * 275;
  return horizon + (near - horizon) * progress;
}

function drawDodge(
  context: CanvasRenderingContext2D,
  config: DodgeConfig,
  state: DodgeState,
): void {
  fillBackground(context, '#67c8d8', '#efc57e');
  context.fillStyle = '#21485a';
  for (let x = 0; x < 1_000; x += 90) {
    const height = 90 + ((x * 17) % 150);
    context.fillRect(x, 250 - height, 72, height);
  }
  context.fillStyle = '#39424b';
  context.beginPath();
  context.moveTo(390, 250);
  context.lineTo(610, 250);
  context.lineTo(970, 1_000);
  context.lineTo(30, 1_000);
  context.closePath();
  context.fill();
  context.strokeStyle = COLORS.yellow;
  context.lineWidth = 14;
  context.setLineDash([58, 45]);
  for (const boundary of [1, 2]) {
    context.beginPath();
    context.moveTo(390 + boundary * 73, 250);
    context.lineTo(30 + boundary * 313, 1_000);
    context.stroke();
  }
  context.setLineDash([]);
  for (const wave of state.waves) {
    const y = 250 + wave.progress * 710;
    const scale = 0.34 + wave.progress * 0.95;
    for (const lane of [0, 1, 2] as const) {
      const x = roadLaneX(lane, wave.progress);
      if (wave.hazards[lane]) {
        context.fillStyle = COLORS.navy;
        context.beginPath();
        context.ellipse(x, y, 72 * scale, 31 * scale, 0, 0, Math.PI * 2);
        context.fill();
        context.fillStyle = '#151b22';
        context.beginPath();
        context.arc(x - 15 * scale, y, 10 * scale, 0, Math.PI * 2);
        context.arc(x + 23 * scale, y - 5 * scale, 7 * scale, 0, Math.PI * 2);
        context.fill();
      } else if (wave.bonusLane === lane && !wave.resolved) {
        context.fillStyle = COLORS.yellow;
        context.strokeStyle = COLORS.navy;
        context.lineWidth = 8 * scale;
        context.beginPath();
        context.arc(x, y, 30 * scale, 0, Math.PI * 2);
        context.fill();
        context.stroke();
        label(context, '★', x, y, 34 * scale, COLORS.navy);
      }
    }
  }
  const playerX = roadLaneX(state.playerLanePosition, 0.82);
  context.save();
  context.translate(playerX, 830);
  context.rotate(Math.sin(state.tick * 0.18) * 0.018);
  context.fillStyle = COLORS.coral;
  context.strokeStyle = COLORS.navy;
  context.lineWidth = 12;
  context.beginPath();
  context.roundRect(-70, -80, 140, 145, 32);
  context.fill();
  context.stroke();
  context.fillStyle = COLORS.cyan;
  context.fillRect(-48, -54, 96, 47);
  context.fillStyle = COLORS.yellow;
  context.beginPath();
  context.arc(-44, 67, 22, 0, Math.PI * 2);
  context.arc(44, 67, 22, 0, Math.PI * 2);
  context.fill();
  context.restore();
  context.fillStyle = 'rgba(7,23,43,0.85)';
  context.fillRect(20, 20, 320, 82);
  label(context, `${state.distanceMeters} m`, 100, 61, 28);
  label(context, `★ ${state.coins}`, 255, 61, 28, COLORS.yellow);
  label(context, `ROAD ${'●'.repeat(state.health)}${'○'.repeat(3 - state.health)}`, 800, 61, 24);
  void config;
}

function drawTapToken(
  context: CanvasRenderingContext2D,
  token: TapToken,
  x: number,
  y: number,
  radius: number,
): void {
  context.save();
  context.translate(x, y);
  context.strokeStyle = COLORS.navy;
  context.lineWidth = 9;
  if (token === 'mosquito') {
    context.fillStyle = COLORS.coral;
    context.beginPath();
    context.ellipse(0, 0, 15, 32, 0, 0, Math.PI * 2);
    context.fill();
    context.stroke();
    context.strokeStyle = COLORS.cream;
    context.beginPath();
    context.moveTo(-8, -8);
    context.lineTo(-46, -34);
    context.moveTo(8, -8);
    context.lineTo(46, -34);
    context.moveTo(-8, 8);
    context.lineTo(-48, 38);
    context.moveTo(8, 8);
    context.lineTo(48, 38);
    context.stroke();
  } else if (token === 'coffee') {
    context.fillStyle = COLORS.cream;
    context.beginPath();
    context.roundRect(-37, -35, 74, 70, 10);
    context.fill();
    context.stroke();
    context.beginPath();
    context.arc(48, 0, 19, -Math.PI / 2, Math.PI / 2);
    context.stroke();
  } else if (token === 'notification') {
    context.fillStyle = COLORS.cream;
    context.beginPath();
    context.roundRect(-31, -47, 62, 94, 12);
    context.fill();
    context.stroke();
    context.fillStyle = COLORS.coral;
    context.beginPath();
    context.arc(25, -38, 17, 0, Math.PI * 2);
    context.fill();
  } else {
    context.strokeStyle = COLORS.cream;
    context.lineWidth = 10;
    context.beginPath();
    context.moveTo(-30, -40);
    context.lineTo(38, 4);
    context.lineTo(5, 12);
    context.lineTo(-5, 47);
    context.closePath();
    context.stroke();
  }
  context.strokeStyle = token === 'mosquito' ? COLORS.yellow : 'rgba(247,239,220,0.35)';
  context.lineWidth = 6;
  context.beginPath();
  context.arc(0, 0, radius, 0, Math.PI * 2);
  context.stroke();
  context.restore();
}

function drawTap(context: CanvasRenderingContext2D, config: TapConfig, state: TapState): void {
  fillBackground(context, '#19123e', '#392458');
  const lamp = context.createRadialGradient(760, 170, 20, 760, 170, 330);
  lamp.addColorStop(0, 'rgba(246,223,73,0.65)');
  lamp.addColorStop(1, 'rgba(246,223,73,0)');
  context.fillStyle = lamp;
  context.fillRect(400, 0, 600, 650);
  context.fillStyle = '#633f35';
  context.fillRect(0, 730, 1_000, 270);
  context.fillStyle = '#20172a';
  context.fillRect(75, 760, 360, 170);
  context.strokeStyle = COLORS.cyan;
  context.lineWidth = 8;
  context.strokeRect(75, 760, 360, 170);
  context.fillStyle = COLORS.cream;
  context.beginPath();
  context.roundRect(700, 770, 120, 120, 16);
  context.fill();
  context.strokeStyle = COLORS.navy;
  context.stroke();
  if (state.target) {
    context.strokeStyle = 'rgba(185,160,255,0.35)';
    context.lineWidth = 5;
    context.beginPath();
    context.moveTo(state.target.x - 80, state.target.y + 30);
    context.quadraticCurveTo(
      state.target.x + 20,
      state.target.y - 90,
      state.target.x + 70,
      state.target.y + 12,
    );
    context.stroke();
    drawTapToken(context, state.target.token, state.target.x, state.target.y, state.target.radius);
  }
  context.fillStyle = 'rgba(7,23,43,0.82)';
  context.fillRect(25, 22, 420, 82);
  label(context, `HITS ${state.hits}   COMBO ×${state.combo}`, 235, 63, 27);
  label(context, 'MOSQUITO MEETING', 775, 64, 23, COLORS.violet);
  void config;
}

function iconGlyph(icon: MessageIcon): string {
  if (icon === 'calendar') return '31';
  if (icon === 'friend') return '☺';
  if (icon === 'receipt') return '₹';
  if (icon === 'prize') return '★';
  if (icon === 'robot') return '🤖';
  return 'NEWS';
}

function drawClassify(
  context: CanvasRenderingContext2D,
  config: ClassifyConfig,
  state: ClassifyState,
): void {
  fillBackground(context, '#ff8f78', '#ffc463');
  context.fillStyle = COLORS.cream;
  context.strokeStyle = COLORS.navy;
  context.lineWidth = 14;
  context.beginPath();
  context.roundRect(70, 110, 860, 770, 26);
  context.fill();
  context.stroke();
  context.fillStyle = COLORS.navy;
  context.fillRect(70, 110, 860, 92);
  label(context, 'INBOX ZERO HERO', 250, 156, 28);
  label(context, `${state.correct} KEPT RIGHT  ·  ×${state.combo}`, 720, 156, 23, COLORS.yellow);
  if (state.currentCardIndex === null) {
    label(context, 'NEXT MESSAGE…', 500, 510, 52, COLORS.navy);
  } else {
    const card = config.cards[state.currentCardIndex];
    if (card) {
      const remaining = Math.max(0, state.cardExpiresAtTick - state.tick);
      const total = config.decisionSeconds * 60;
      context.fillStyle = '#e6dcc8';
      context.beginPath();
      context.roundRect(130, 265, 740, 420, 26);
      context.fill();
      context.stroke();
      context.fillStyle = card.correctChoice === 'keep' ? COLORS.cyan : COLORS.coral;
      context.beginPath();
      context.arc(250, 420, 78, 0, Math.PI * 2);
      context.fill();
      context.stroke();
      label(
        context,
        iconGlyph(card.icon),
        250,
        420,
        card.icon === 'newsletter' ? 24 : 46,
        COLORS.navy,
      );
      context.textAlign = 'left';
      context.fillStyle = '#5c6470';
      context.font = '800 26px system-ui';
      context.fillText('FROM', 375, 342);
      context.fillStyle = COLORS.navy;
      context.font = '900 42px system-ui';
      context.fillText(card.sender, 375, 396);
      context.font = '800 30px system-ui';
      context.fillText(card.subject, 190, 560);
      context.fillStyle = '#d8cdb6';
      context.fillRect(150, 625, 700, 20);
      context.fillStyle = remaining / total > 0.3 ? COLORS.cyan : COLORS.coral;
      context.fillRect(150, 625, 700 * Math.min(1, remaining / total), 20);
    }
  }
  label(context, 'KEEP', 280, 786, 32, '#11645d');
  label(context, 'TRASH', 720, 786, 32, '#a9352b');
}

function formatTimer(seconds: number): string {
  const whole = Math.floor(seconds);
  const hundredths = Math.floor((seconds - whole) * 100);
  return `00:${whole.toString().padStart(2, '0')}.${hundredths.toString().padStart(2, '0')}`;
}

function drawTiming(
  context: CanvasRenderingContext2D,
  config: TimingConfig,
  state: TimingState,
): void {
  fillBackground(context, '#111720', '#202936');
  context.fillStyle = '#313b45';
  context.strokeStyle = '#05090e';
  context.lineWidth = 18;
  context.beginPath();
  context.roundRect(75, 100, 850, 780, 42);
  context.fill();
  context.stroke();
  context.fillStyle = '#111820';
  context.beginPath();
  context.roundRect(125, 170, 560, 500, 25);
  context.fill();
  context.stroke();
  const glow = context.createRadialGradient(405, 430, 10, 405, 430, 260);
  glow.addColorStop(0, 'rgba(246,223,73,0.45)');
  glow.addColorStop(1, 'rgba(246,223,73,0)');
  context.fillStyle = glow;
  context.fillRect(135, 180, 540, 480);
  context.save();
  context.translate(405, 465);
  context.rotate(state.timerSeconds * 0.9);
  context.fillStyle = '#d9854e';
  context.strokeStyle = COLORS.cream;
  context.lineWidth = 9;
  context.beginPath();
  context.ellipse(0, 0, 145, 82, 0, 0, Math.PI * 2);
  context.fill();
  context.stroke();
  for (let slice = 0; slice < 6; slice += 1) {
    context.rotate(Math.PI / 3);
    context.beginPath();
    context.moveTo(0, 0);
    context.lineTo(125, 0);
    context.stroke();
  }
  context.restore();
  context.fillStyle = '#07120c';
  context.beginPath();
  context.roundRect(720, 185, 155, 150, 14);
  context.fill();
  label(context, `TARGET`, 797, 220, 20, COLORS.green);
  label(context, formatTimer(state.targetSeconds), 797, 280, 27, COLORS.green);
  context.fillStyle = '#07120c';
  context.beginPath();
  context.roundRect(190, 720, 620, 100, 16);
  context.fill();
  label(context, formatTimer(state.timerSeconds), 500, 770, 56, COLORS.yellow);
  label(
    context,
    `ROUND ${Math.min(state.round, config.targetsSeconds.length)} / ${config.targetsSeconds.length}`,
    790,
    410,
    25,
  );
  if (state.lastOffsetMilliseconds !== null && state.waitingTicks > 0) {
    label(
      context,
      `${state.lastOffsetMilliseconds >= 0 ? '+' : ''}${state.lastOffsetMilliseconds} ms`,
      790,
      500,
      34,
      COLORS.cyan,
    );
    label(context, state.lastRating?.toUpperCase() ?? '', 790, 555, 25, COLORS.yellow);
  }
}

function drawSequence(
  context: CanvasRenderingContext2D,
  config: SequenceConfig,
  state: SequenceState,
): void {
  fillBackground(context, '#0b3344', '#07172b');
  context.fillStyle = '#bdc6c7';
  context.strokeStyle = COLORS.navy;
  context.lineWidth = 14;
  context.fillRect(60, 90, 620, 820);
  context.strokeRect(60, 90, 620, 820);
  context.fillStyle = '#33434c';
  context.fillRect(110, 150, 520, 700);
  context.strokeRect(110, 150, 520, 700);
  const doorGap = 10 + Math.abs(Math.sin(state.currentFloor * 0.25)) * 8;
  context.fillStyle = '#71838c';
  context.fillRect(120, 160, 245 - doorGap, 680);
  context.fillRect(375 + doorGap, 160, 245 - doorGap, 680);
  context.strokeStyle = '#b8c8cf';
  context.lineWidth = 5;
  for (let y = 200; y < 840; y += 65) {
    context.beginPath();
    context.moveTo(130, y);
    context.lineTo(610, y);
    context.stroke();
  }
  context.fillStyle = '#091015';
  context.beginPath();
  context.roundRect(720, 105, 220, 250, 22);
  context.fill();
  context.strokeStyle = COLORS.cyan;
  context.stroke();
  label(context, 'FLOOR', 830, 155, 22, '#8ba4af');
  label(context, Math.round(state.currentFloor).toString(), 830, 245, 105, COLORS.cyan);
  const required = state.requests[state.requestIndex];
  label(context, 'NEXT NOTES', 830, 420, 22, COLORS.cream);
  state.requests.slice(state.requestIndex, state.requestIndex + 4).forEach((floor, index) => {
    context.fillStyle = index === 0 ? COLORS.yellow : '#183f4e';
    context.beginPath();
    context.roundRect(730 + (index % 2) * 105, 455 + Math.floor(index / 2) * 105, 88, 82, 12);
    context.fill();
    label(
      context,
      floor.toString(),
      774 + (index % 2) * 105,
      496 + Math.floor(index / 2) * 105,
      34,
      index === 0 ? COLORS.navy : COLORS.cream,
    );
  });
  label(context, required ? `HIT FLOOR ${required}` : 'FINALE!', 830, 730, 30, COLORS.yellow);
  label(context, `CHIMES ${state.hits}  ·  ×${state.combo}`, 830, 805, 24);
  if (state.feedback === 'good' && state.feedbackTicks > 0) {
    label(context, '♪', 110, 90 + state.feedbackTicks * 8, 60, COLORS.yellow);
    label(context, '♫', 650, 150 + state.feedbackTicks * 5, 52, COLORS.coral);
  }
  void config;
}

function drawGarment(
  context: CanvasRenderingContext2D,
  token: SortToken,
  x: number,
  y: number,
): void {
  const dark = token === 'navy-sock' || token === 'red-shirt' || token === 'black-towel';
  const color = token.startsWith('white')
    ? COLORS.cream
    : token.startsWith('yellow')
      ? COLORS.yellow
      : token.startsWith('red')
        ? COLORS.coral
        : '#142d52';
  context.save();
  context.translate(x, y);
  context.rotate(Math.sin(y * 0.018) * 0.09);
  context.fillStyle = color;
  context.strokeStyle = dark ? COLORS.cream : COLORS.navy;
  context.lineWidth = 10;
  if (token.includes('shirt')) {
    context.beginPath();
    context.moveTo(-72, -55);
    context.lineTo(-120, -15);
    context.lineTo(-82, 40);
    context.lineTo(-52, 18);
    context.lineTo(-52, 95);
    context.lineTo(52, 95);
    context.lineTo(52, 18);
    context.lineTo(82, 40);
    context.lineTo(120, -15);
    context.lineTo(72, -55);
    context.quadraticCurveTo(0, -18, -72, -55);
    context.closePath();
  } else if (token.includes('sock')) {
    context.beginPath();
    context.moveTo(-50, -90);
    context.lineTo(48, -90);
    context.lineTo(35, 30);
    context.quadraticCurveTo(92, 42, 72, 96);
    context.quadraticCurveTo(-5, 116, -42, 55);
    context.closePath();
  } else {
    context.beginPath();
    context.roundRect(-92, -75, 184, 150, 12);
  }
  context.fill();
  context.stroke();
  context.restore();
}

function drawSort(context: CanvasRenderingContext2D, config: SortConfig, state: SortState): void {
  fillBackground(context, '#dff3e4', '#7de3a1');
  context.fillStyle = '#d6f0f1';
  context.fillRect(0, 0, 1_000, 760);
  context.strokeStyle = '#bddadc';
  context.lineWidth = 6;
  for (let x = 0; x < 1_000; x += 125) {
    context.strokeRect(x, 0, 125, 125);
  }
  context.fillStyle = COLORS.cream;
  context.strokeStyle = COLORS.navy;
  context.lineWidth = 13;
  context.beginPath();
  context.roundRect(55, 120, 230, 310, 34);
  context.fill();
  context.stroke();
  context.beginPath();
  context.arc(170, 290, 82, 0, Math.PI * 2);
  context.stroke();
  context.fillStyle = COLORS.cyan;
  context.beginPath();
  context.arc(170, 290, 68, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = '#f0eadc';
  context.beginPath();
  context.moveTo(55, 1_000);
  context.lineTo(55, 760);
  context.lineTo(440, 690);
  context.lineTo(465, 1_000);
  context.closePath();
  context.fill();
  context.stroke();
  context.fillStyle = '#28344a';
  context.beginPath();
  context.moveTo(535, 1_000);
  context.lineTo(560, 690);
  context.lineTo(945, 760);
  context.lineTo(945, 1_000);
  context.closePath();
  context.fill();
  context.stroke();
  label(context, config.leftLabel.toUpperCase(), 260, 865, 43, COLORS.navy);
  label(context, config.rightLabel.toUpperCase(), 740, 865, 43, COLORS.cream);
  if (state.currentItemIndex !== null) {
    const item = config.items[state.currentItemIndex];
    if (item) drawGarment(context, item.token, 500, 210 + state.itemProgress * 470);
  }
  context.fillStyle = COLORS.navy;
  context.fillRect(350, 25, 300, 74);
  label(context, `${state.correct} SORTED  ·  ×${state.combo}`, 500, 62, 27);
}

export function rendererIdFor(config: DailyGameConfig): RendererId {
  if (config.engine === 'defense-v1') return 'samosa-defense';
  if (config.engine === 'dodge-v1') return 'pothole-lanes';
  if (config.engine === 'tap-v1') return 'mosquito-hunt';
  if (config.engine === 'classify-v1') return 'inbox-cards';
  if (config.engine === 'timing-v1') return 'microwave-timer';
  if (config.engine === 'sequence-v1') return 'elevator-sequence';
  return 'laundry-sort';
}

export function renderGameScene(
  context: CanvasRenderingContext2D,
  config: DailyGameConfig,
  state: DailyGameState,
  reducedMotion: boolean,
): RendererId {
  context.clearRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
  context.save();
  if (!reducedMotion && state.feedback === 'bad' && state.feedbackTicks > 12) {
    context.translate(state.feedbackTicks % 2 === 0 ? 9 : -9, 0);
  }
  if (config.engine === 'defense-v1' && state.engine === 'defense-v1')
    drawDefense(context, config, state);
  else if (config.engine === 'dodge-v1' && state.engine === 'dodge-v1')
    drawDodge(context, config, state);
  else if (config.engine === 'tap-v1' && state.engine === 'tap-v1') drawTap(context, config, state);
  else if (config.engine === 'classify-v1' && state.engine === 'classify-v1')
    drawClassify(context, config, state);
  else if (config.engine === 'timing-v1' && state.engine === 'timing-v1')
    drawTiming(context, config, state);
  else if (config.engine === 'sequence-v1' && state.engine === 'sequence-v1')
    drawSequence(context, config, state);
  else if (config.engine === 'sort-v1' && state.engine === 'sort-v1')
    drawSort(context, config, state);
  else throw new Error('Renderer received mismatched engine data.');
  context.restore();
  feedbackEffects(context, state, reducedMotion);
  return rendererIdFor(config);
}
