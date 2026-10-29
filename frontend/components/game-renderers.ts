import {
  WORLD_HEIGHT,
  WORLD_WIDTH,
  getDefenseThreatPosition,
  getTapTargetPosition,
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
import { staticLayer } from '@frontend/lib/scene-cache';
import {
  carActor,
  pigeonActor,
  mosquitoActor,
  brassCab,
  elevatorDoors,
  material,
  panel,
  ellipse,
} from '@frontend/lib/signature-art';
import { drawSignature } from '@frontend/lib/signature-fx';
import { concealedTimer, isEncore } from '@shared/game/encore';
import { samosa } from '@frontend/lib/scene-art';

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

// Keep props undistorted while their world positions fill a portrait stage.
function preserveObjectAspect(context: CanvasRenderingContext2D, x: number, y: number): void {
  const transform = context.getTransform();
  const ratio = Math.hypot(transform.a, transform.b) / Math.hypot(transform.c, transform.d);
  context.translate(x, y);
  context.scale(1, Math.min(1, ratio));
  context.translate(-x, -y);
}

function fillBackground(context: CanvasRenderingContext2D, top: string, bottom: string): void {
  const gradient = context.createLinearGradient(0, 0, 0, WORLD_HEIGHT);
  gradient.addColorStop(0, top);
  gradient.addColorStop(1, bottom);
  context.fillStyle = gradient;
  context.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
}

function finishScene(context: CanvasRenderingContext2D, accent: string): void {
  context.save();
  const vignette = context.createRadialGradient(500, 430, 250, 500, 500, 720);
  vignette.addColorStop(0, 'rgba(0,0,0,0)');
  vignette.addColorStop(1, 'rgba(0,8,18,0.34)');
  context.fillStyle = vignette;
  context.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
  context.globalAlpha = 0.12;
  context.fillStyle = COLORS.cream;
  for (let index = 0; index < 86; index += 1) {
    const x = (index * 193 + 47) % WORLD_WIDTH;
    const y = (index * 109 + 23) % WORLD_HEIGHT;
    context.fillRect(x, y, index % 4 === 0 ? 3 : 2, 2);
  }
  context.globalAlpha = 0.42;
  context.strokeStyle = accent;
  context.lineWidth = 4;
  context.strokeRect(12, 12, WORLD_WIDTH - 24, WORLD_HEIGHT - 24);
  context.restore();
}

function label(
  context: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  size: number,
  color = COLORS.cream,
): void {
  context.save();
  const transform = context.getTransform();
  context.translate(x, y);
  context.scale(1, Math.min(1, Math.abs(transform.a / transform.d)));
  context.fillStyle = color;
  context.font = `900 ${size}px system-ui`;
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText(text, 0, 0);
  context.restore();
}

function drawPigeon(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale: number,
  angle: number,
  wingPhase: number,
): void {
  context.save();
  context.translate(x, y);
  const transform = context.getTransform();
  const ratio = Math.hypot(transform.a, transform.b) / Math.hypot(transform.c, transform.d);
  context.scale(1, Math.min(1, ratio));
  context.rotate(angle + Math.PI);
  context.scale(scale, scale);
  pigeonActor(context, wingPhase);
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
  context.lineWidth = 6;
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
  let message = state.feedback === 'good' ? 'NICE!' : 'OOPS!';
  if (state.engine === 'defense-v1') message = state.feedback === 'good' ? 'SHOO!' : 'SNACK HIT!';
  else if (state.engine === 'dodge-v1') message = state.feedback === 'good' ? 'CLEAR!' : 'BUMP!';
  else if (state.engine === 'tap-v1') message = state.feedback === 'good' ? 'SPLAT!' : 'MISSED!';
  else if (state.engine === 'classify-v1')
    message = state.feedback === 'good' ? 'SORTED!' : 'WRONG CALL!';
  else if (state.engine === 'timing-v1') message = state.lastRating?.toUpperCase() ?? message;
  else if (state.engine === 'sequence-v1')
    message = state.feedback === 'good' ? 'CHIME!' : 'MISSED CUE!';
  else if (state.engine === 'sort-v1')
    message = state.feedback === 'good' ? 'IN THE BASKET!' : 'WRONG BASKET!';
  label(context, message, 500, 115, 52, color);
  context.restore();
}

function drawDefense(
  context: CanvasRenderingContext2D,
  config: DefenseConfig,
  state: DefenseState,
  reducedMotion: boolean,
): void {
  staticLayer(context, 'rooftop', (context) => {
    fillBackground(context, '#f2a86f', '#ffd07a');
    const sun = context.createRadialGradient(775, 105, 10, 775, 105, 145);
    sun.addColorStop(0, 'rgba(255,245,198,0.95)');
    sun.addColorStop(0.35, 'rgba(255,218,115,0.68)');
    sun.addColorStop(1, 'rgba(255,174,94,0)');
    context.fillStyle = sun;
    context.fillRect(610, 0, 330, 290);
    context.fillStyle = '#d9674b';
    context.fillRect(0, 150, 1_000, 210);
    context.fillStyle = '#754d45';
    for (let x = 25; x < 1_000; x += 115) {
      context.fillRect(x, 185 + ((x / 115) % 2) * 30, 80, 120);
      context.fillStyle = 'rgba(255,222,125,0.55)';
      context.fillRect(x + 16, 218 + ((x / 115) % 2) * 30, 12, 18);
      context.fillRect(x + 48, 254 + ((x / 115) % 2) * 30, 12, 18);
      context.fillStyle = '#754d45';
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
    // Rooftop silhouettes, cable, awning and pot establish scale around the plate.
    context.strokeStyle = '#6f4943';
    context.lineWidth = 5;
    context.beginPath();
    context.moveTo(0, 145);
    context.quadraticCurveTo(500, 230, 1000, 125);
    context.stroke();
    for (let i = 0; i < 10; i++) {
      ellipse(context, 50 + i * 106, 155 + Math.sin(i * 0.34) * 38, 4, 6, '#fff0b0');
    }
    for (let x = 30; x < 1000; x += 125) {
      panel(context, x, 170, 8, 75, '#5a4d46', 0);
      panel(context, x - 20, 176, 49, 4, '#5a4d46', 0);
    }
    panel(context, 0, 347, 1000, 23, '#224f50', 0);
    panel(context, 0, 347, 1000, 5, '#e7b583', 0);
    context.save();
    preserveObjectAspect(context, 905, 720);
    ellipse(context, 905, 779, 61, 16, 'rgba(5,40,44,.23)');
    panel(context, 860, 702, 88, 65, '#c87d59', 12);
    for (let i = 0; i < 5; i++) {
      context.save();
      context.translate(905, 701);
      context.rotate((i - 2) * 0.45);
      ellipse(context, 0, -42, 16, 55, i % 2 ? '#386b58' : '#5d9471');
      context.restore();
    }
    context.restore();
  });
  context.save();
  preserveObjectAspect(context, 500, 550);
  context.fillStyle = COLORS.cream;
  context.strokeStyle = COLORS.navy;
  context.lineWidth = 15;
  context.beginPath();
  context.ellipse(500, 550, 155, 95, 0, 0, Math.PI * 2);
  context.fill();
  context.stroke();
  context.strokeStyle = 'rgba(255,255,255,0.62)';
  context.lineWidth = 8;
  context.beginPath();
  context.ellipse(475, 520, 100, 46, -0.2, Math.PI, Math.PI * 1.8);
  context.stroke();
  samosa(context, 500, 530, 1);
  context.fillStyle = '#c69048';
  for (let crumb = 0; crumb < 13; crumb += 1) {
    context.beginPath();
    context.ellipse(
      365 + ((crumb * 31) % 270),
      610 + ((crumb * 13) % 60),
      4,
      2,
      crumb,
      0,
      Math.PI * 2,
    );
    context.fill();
  }
  context.strokeStyle = 'rgba(247,239,220,0.72)';
  context.lineWidth = 7;
  const steamSway = reducedMotion ? 0 : Math.sin(state.tick * 0.16) * 18;
  for (const offset of [-48, 35]) {
    context.beginPath();
    context.moveTo(500 + offset, 440);
    context.bezierCurveTo(
      475 + offset + steamSway,
      400,
      530 + offset - steamSway,
      365,
      500 + offset,
      325,
    );
    context.stroke();
  }
  context.restore();
  for (const threat of state.threats) {
    const position = getDefenseThreatPosition(threat, state.tick);
    const scale = 0.55 + (650 - threat.distance) / 850;
    drawPigeon(
      context,
      position.x,
      position.y,
      scale,
      threat.angle,
      reducedMotion ? 0 : state.tick * 0.7 + threat.id,
    );
  }
  const nearestThreat = state.threats.reduce<number | null>(
    (nearest, threat) =>
      nearest === null || threat.distance < nearest ? threat.distance : nearest,
    null,
  );
  if (nearestThreat !== null && nearestThreat < 260) {
    context.strokeStyle = COLORS.coral;
    context.lineWidth = 12 + Math.max(0, 260 - nearestThreat) * 0.08;
    context.beginPath();
    context.arc(500, 550, 175, 0, Math.PI * 2);
    context.stroke();
    label(context, 'DANGER', 500, 700, 30, COLORS.coral);
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
  reducedMotion: boolean,
): void {
  staticLayer(context, 'street', (context) => {
    fillBackground(context, '#67c8d8', '#efc57e');
    context.fillStyle = 'rgba(255,236,158,0.78)';
    context.beginPath();
    context.arc(790, 95, 64, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = '#21485a';
    for (let x = 0; x < 1_000; x += 90) {
      const height = 90 + ((x * 17) % 150);
      context.fillRect(x, 250 - height, 72, height);
      context.fillStyle = 'rgba(246,223,73,0.48)';
      context.fillRect(x + 14, 205 - height, 10, 14);
      context.fillRect(x + 45, 225 - height, 10, 14);
      context.fillStyle = '#21485a';
    }
    context.fillStyle = '#39424b';
    context.beginPath();
    context.moveTo(390, 250);
    context.lineTo(610, 250);
    context.lineTo(970, 1_000);
    context.lineTo(30, 1_000);
    context.closePath();
    context.fill();
    context.strokeStyle = '#d8c899';
    context.lineWidth = 7;
    context.beginPath();
    context.moveTo(389, 250);
    context.lineTo(28, 1000);
    context.moveTo(611, 250);
    context.lineTo(972, 1000);
    context.stroke();
    for (let x = 0; x < 1000; x += 90) {
      for (let y = 120; y < 240; y += 22) {
        context.fillStyle = 'rgba(217,225,176,.25)';
        context.fillRect(x + 13, y, 8, 10);
      }
    }
  });
  context.strokeStyle = 'rgba(255,255,255,0.18)';
  context.lineWidth = 5;
  const roadScroll = reducedMotion ? 0 : (state.tick * 7) % 96;
  for (let stripe = -1; stripe < 8; stripe += 1) {
    const y = 330 + stripe * 96 + roadScroll;
    context.beginPath();
    context.moveTo(350 - stripe * 40, y);
    context.lineTo(650 + stripe * 40, y);
    context.stroke();
  }
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
      context.save();
      preserveObjectAspect(context, x, y);
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
      context.restore();
    }
  }
  const playerX = roadLaneX(state.playerLanePosition, 0.82);
  context.save();
  preserveObjectAspect(context, playerX, 830);
  context.translate(playerX, 830);
  carActor(
    context,
    reducedMotion ? 0 : state.tick,
    reducedMotion ? 0 : (state.targetLane - state.playerLanePosition) * 0.13,
    !reducedMotion && state.feedback === 'bad' ? state.feedbackTicks * 0.4 : 0,
  );
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
  wingPhase: number,
): void {
  context.save();
  context.translate(x, y);
  const transform = context.getTransform();
  context.scale(1, Math.min(1, Math.abs(transform.a / transform.d)));
  context.strokeStyle = COLORS.navy;
  context.lineWidth = 9;
  if (token === 'mosquito') {
    mosquitoActor(context, wingPhase);
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
  context.strokeStyle = 'rgba(247,239,220,0.35)';
  context.lineWidth = 6;
  context.beginPath();
  context.arc(0, 0, radius, 0, Math.PI * 2);
  context.stroke();
  context.restore();
}

function drawTap(
  context: CanvasRenderingContext2D,
  config: TapConfig,
  state: TapState,
  reducedMotion: boolean,
): void {
  staticLayer(context, 'office', (context) => {
    fillBackground(context, '#19123e', '#392458');
    const lamp = context.createRadialGradient(760, 170, 20, 760, 170, 330);
    lamp.addColorStop(0, 'rgba(246,223,73,0.65)');
    lamp.addColorStop(1, 'rgba(246,223,73,0)');
    context.save();
    context.globalAlpha = 1;
    context.fillStyle = lamp;
    context.fillRect(400, 0, 600, 650);
    context.restore();
    panel(context, 60, 155, 410, 405, '#26384e', 12);
    panel(context, 76, 169, 378, 373, '#111d39', 4);
    for (let i = 0; i < 8; i++) {
      const h = 40 + ((i * 41) % 150);
      panel(context, 85 + i * 46, 535 - h, 34, h, '#28445a', 0);
      for (let j = 0; j < 3; j++) panel(context, 90 + i * 46, 535 - h + j * 29, 6, 9, '#aa937c', 0);
    }
    panel(context, 259, 162, 12, 380, '#56657e', 0);
    panel(context, 65, 330, 400, 10, '#56657e', 0);
    context.strokeStyle = '#766882';
    context.lineWidth = 12;
    context.beginPath();
    context.moveTo(880, 738);
    context.lineTo(880, 405);
    context.lineTo(775, 228);
    context.stroke();
    context.fillStyle = '#d5b077';
    context.beginPath();
    context.moveTo(710, 263);
    context.lineTo(830, 235);
    context.lineTo(790, 163);
    context.closePath();
    context.fill();
    panel(context, 0, 730, 1000, 19, '#d39b71', 0);
    context.fillStyle = '#633f35';
    context.fillRect(0, 730, 1_000, 270);
    context.save();
    preserveObjectAspect(context, 500, 850);
    context.fillStyle = '#20172a';
    context.fillRect(75, 760, 360, 170);
    context.strokeStyle = COLORS.cyan;
    context.lineWidth = 8;
    context.strokeRect(75, 760, 360, 170);
    context.fillStyle = 'rgba(86,231,237,0.12)';
    context.fillRect(98, 785, 314, 118);
    context.fillStyle = '#8da0bb';
    for (let row = 0; row < 3; row += 1) {
      for (let column = 0; column < 8; column += 1) {
        context.fillRect(102 + column * 37, 812 + row * 27, 24, 11);
      }
    }
    context.fillStyle = COLORS.cream;
    context.beginPath();
    context.roundRect(700, 770, 120, 120, 16);
    context.fill();
    context.strokeStyle = COLORS.navy;
    context.stroke();
    context.fillStyle = '#8f5539';
    context.beginPath();
    context.ellipse(760, 796, 41, 18, 0, 0, Math.PI * 2);
    context.fill();
    context.strokeStyle = 'rgba(255,245,223,0.5)';
    context.lineWidth = 6;
    context.beginPath();
    context.moveTo(742, 742);
    context.quadraticCurveTo(716, 704, 748, 675);
    context.stroke();
    context.restore();
    for (let i = 0; i < 9; i++) {
      context.fillStyle = 'rgba(30,14,23,.1)';
      context.fillRect(0, 756 + i * 29, 1000, 2);
    }
  });
  if (isEncore(config)) {
    context.fillStyle = 'rgba(9,12,35,.46)';
    context.fillRect(0, 0, 1000, 730);
  }
  if (state.target) {
    const position = getTapTargetPosition(state.target, state.tick);
    context.strokeStyle = 'rgba(185,160,255,0.35)';
    context.lineWidth = 5;
    context.beginPath();
    context.moveTo(position.x - 80, position.y + 30);
    context.quadraticCurveTo(position.x + 20, position.y - 90, position.x + 70, position.y + 12);
    context.stroke();
    drawTapToken(
      context,
      state.target.token,
      position.x,
      position.y,
      state.target.radius,
      reducedMotion ? 0 : state.tick * 1.3,
    );
  }
  context.fillStyle = 'rgba(7,23,43,0.82)';
  context.fillRect(25, 22, 420, 82);
  label(context, `HITS ${state.hits}   COMBO ×${state.combo}`, 235, 63, 27);
  for (let i = 0; i < 8; i++)
    panel(context, 500 + i * 45, 45, 31, 12, i < state.combo % 9 ? '#edc8b1' : '#655771', 5);
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
  reducedMotion: boolean,
): void {
  fillBackground(context, '#d79c77', '#806856');
  context.fillStyle = COLORS.cream;
  context.strokeStyle = COLORS.navy;
  context.lineWidth = 14;
  context.beginPath();
  context.roundRect(70, 110, 860, 770, 26);
  context.fill();
  context.stroke();
  context.fillStyle = COLORS.navy;
  context.fillRect(70, 110, 860, 92);
  for (const [x, color] of [
    [105, COLORS.coral],
    [141, COLORS.yellow],
    [177, COLORS.green],
  ] as const) {
    context.fillStyle = color;
    context.beginPath();
    context.arc(x, 156, 11, 0, Math.PI * 2);
    context.fill();
  }
  label(context, `${state.correct} FILED  ·  ×${state.combo}`, 690, 156, 23, COLORS.yellow);
  if (state.currentCardIndex === null) {
    label(context, 'NEXT MESSAGE…', 500, 510, 52, COLORS.navy);
  } else {
    const card = config.cards[state.currentCardIndex];
    if (card) {
      context.save();
      const cardAge = state.tick - state.cardStartedAtTick;
      const enterOffset = reducedMotion ? 0 : Math.max(0, 12 - cardAge) * 34;
      context.translate(enterOffset, 0);
      preserveObjectAspect(context, 500, 475);
      const remaining = Math.max(0, state.cardExpiresAtTick - state.tick);
      const total = Math.max(1, state.cardExpiresAtTick - state.cardStartedAtTick);
      context.fillStyle = 'rgba(7,23,43,0.18)';
      for (let index = 0; index < 3; index += 1) {
        context.fillRect(155 + index * 14, 250 - index * 12, 690, 380);
      }
      context.fillStyle = material(context, 130, 265, 740, 420, ['#fff9e8', '#f2e6cc', '#d6c3a4']);
      context.shadowColor = 'rgba(7,23,43,0.28)';
      context.shadowBlur = 26;
      context.shadowOffsetY = 14;
      context.beginPath();
      context.roundRect(130, 265, 740, 420, 26);
      context.fill();
      context.stroke();
      context.shadowColor = 'transparent';
      context.fillStyle =
        card.icon === 'prize' || card.icon === 'robot' ? COLORS.violet : COLORS.cyan;
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
      context.strokeStyle = '#fef8e8';
      context.lineWidth = 3;
      context.strokeRect(146, 280, 708, 390);
      context.fillStyle = '#d8cdb6';
      context.fillRect(150, 625, 700, 20);
      context.fillStyle = remaining / total > 0.3 ? COLORS.cyan : COLORS.coral;
      context.fillRect(150, 625, 700 * Math.min(1, remaining / total), 20);
      context.restore();
    }
  }
  if (state.feedbackTicks > 0 && state.currentCardIndex === null) {
    context.strokeStyle = state.feedback === 'good' ? '#11645d' : '#a9352b';
    context.lineWidth = 12;
    context.strokeRect(360, 350, 280, 170);
    label(
      context,
      state.feedback === 'good' ? '✓ FILED' : '× WRONG',
      500,
      435,
      44,
      context.strokeStyle,
    );
  }
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
  reducedMotion: boolean,
): void {
  staticLayer(context, 'appliance', (context) => {
    fillBackground(context, '#111720', '#202936');
    context.strokeStyle = 'rgba(255,255,255,0.045)';
    context.lineWidth = 3;
    for (let x = 0; x < WORLD_WIDTH; x += 125) context.strokeRect(x, 0, 125, 125);
    context.fillStyle = material(context, 75, 100, 850, 780, ['#80949b', '#465966', '#1a303d']);
    context.strokeStyle = '#05090e';
    context.lineWidth = 18;
    context.beginPath();
    context.roundRect(75, 100, 850, 780, 42);
    context.fill();
    context.stroke();
    context.fillStyle = 'rgba(255,255,255,0.08)';
    context.fillRect(108, 126, 780, 12);
    context.fillStyle = '#111820';
    context.beginPath();
    context.roundRect(125, 170, 560, 500, 25);
    context.fill();
    context.stroke();
  });
  const glow = context.createRadialGradient(405, 430, 10, 405, 430, 260);
  glow.addColorStop(0, 'rgba(246,223,73,0.45)');
  glow.addColorStop(1, 'rgba(246,223,73,0)');
  context.save();
  context.globalAlpha = reducedMotion ? 1 : 0.78 + Math.sin(state.tick * 0.12) * 0.22;
  context.fillStyle = glow;
  context.fillRect(135, 180, 540, 480);
  context.restore();
  context.save();
  context.translate(405, 465);
  const foodTransform = context.getTransform();
  context.scale(1, Math.min(1, foodTransform.a / foodTransform.d));
  context.scale(1, 0.56);
  context.rotate(reducedMotion ? 0 : state.timerSeconds * 0.9);
  ellipse(context, 0, 14, 161, 156, 'rgba(10,21,26,.3)');
  ellipse(context, 0, 0, 161, 161, '#c9d6c5');
  context.fillStyle = material(context, -145, -145, 290, 290, ['#f4d384', '#df9f53', '#b76332']);
  context.strokeStyle = COLORS.cream;
  context.lineWidth = 9;
  context.beginPath();
  context.arc(0, 0, 145, 0, Math.PI * 2);
  context.fill();
  context.stroke();
  for (let slice = 0; slice < 6; slice += 1) {
    context.rotate(Math.PI / 3);
    context.beginPath();
    context.moveTo(0, 0);
    context.lineTo(125, 0);
    context.stroke();
  }
  for (let i = 0; i < 38; i++) {
    const angle = i * 2.4;
    const r = 25 + ((i * 37) % 105);
    ellipse(
      context,
      Math.cos(angle) * r,
      Math.sin(angle) * r,
      2 + (i % 3),
      2,
      i % 4 ? '#bd7a3d' : '#68916a',
    );
  }
  context.fillStyle = '#b44528';
  for (const [x, y] of [
    [-60, -20],
    [35, -40],
    [65, 25],
    [-25, 35],
  ] as const) {
    context.beginPath();
    context.ellipse(x, y, 16, 12, 0, 0, Math.PI * 2);
    context.fill();
  }
  context.restore();
  context.strokeStyle = 'rgba(255,245,223,0.42)';
  context.lineWidth = 8;
  context.beginPath();
  const steamSway = reducedMotion ? 0 : Math.sin(state.tick * 0.13) * 22;
  context.moveTo(365, 325);
  context.quadraticCurveTo(325 + steamSway, 275, 365, 225);
  context.moveTo(445, 325);
  context.quadraticCurveTo(485 - steamSway, 275, 445, 225);
  context.stroke();
  context.strokeStyle = 'rgba(224,247,247,.12)';
  context.lineWidth = 24;
  context.beginPath();
  context.moveTo(173, 192);
  context.lineTo(351, 641);
  context.moveTo(239, 192);
  context.lineTo(417, 641);
  context.stroke();
  panel(context, 646, 310, 20, 204, '#99a9a5', 8);
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
  label(
    context,
    concealedTimer(config, state.timerSeconds, state.targetSeconds, state.waitingTicks)
      ? '··:··.··'
      : formatTimer(state.timerSeconds),
    500,
    770,
    56,
    COLORS.yellow,
  );
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
  reducedMotion: boolean,
): void {
  staticLayer(context, 'lift-room', (context) => {
    fillBackground(context, '#1f4957', '#112c39');
    for (let x = 0; x < 1000; x += 100) {
      context.strokeStyle = 'rgba(155,199,193,.08)';
      context.lineWidth = 2;
      context.strokeRect(x, 0, 100, 1000);
    }
    brassCab(context);
  });
  const open =
    !reducedMotion && state.signature?.kind === 'note'
      ? Math.max(0, 1 - Math.abs(state.tick - state.signature.tick - 12) / 12) * 36
      : 0;
  context.save();
  context.beginPath();
  context.rect(105, 149, 525, 710);
  context.clip();
  context.save();
  context.translate(-open, 0);
  staticLayer(context, 'door-left', (c) => elevatorDoors(c, 0, [-1]));
  context.restore();
  context.save();
  context.translate(open, 0);
  staticLayer(context, 'door-right', (c) => elevatorDoors(c, 0, [1]));
  context.restore();
  context.restore();
  label(context, '♪', 365, 108, 32, '#e9c987');
  ellipse(context, 85, 825 - (state.currentFloor - 1) * 77, 5, 12, '#f4dba6');
  for (let i = 0; i < config.sequenceLength; i++)
    ellipse(context, 140 + i * 39, 880, 5, 5, i < state.hits ? '#f1d49b' : '#496270');
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
    context.fillStyle =
      index === 0
        ? material(context, 730, 455, 88, 82, ['#fff1c3', '#dfc58c', '#b6995d'])
        : '#31525d';
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
  label(
    context,
    required === undefined ? 'FINALE!' : `TARGET ${required}`,
    830,
    730,
    28,
    COLORS.yellow,
  );
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
  tick: number,
  reducedMotion: boolean,
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
  const transform = context.getTransform();
  context.scale(1, Math.min(1, Math.abs(transform.a / transform.d)));
  context.rotate(reducedMotion ? 0 : Math.sin(tick * 0.11 + y * 0.018) * 0.13);
  ellipse(context, 0, 108, 75, 13, 'rgba(12,34,41,.18)');
  context.fillStyle = material(context, -80, -85, 160, 185, [
    color,
    color,
    dark ? '#162c43' : '#c8b79a',
  ]);
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
  context.strokeStyle = 'rgba(255,255,255,0.38)';
  context.lineWidth = 3;
  for (let seam = -1; seam <= 1; seam += 1) {
    context.beginPath();
    context.moveTo(-35 + seam * 14, -45);
    context.quadraticCurveTo(10 + seam * 14, 0, -10 + seam * 14, 65);
    context.stroke();
  }
  context.restore();
}

function drawSort(
  context: CanvasRenderingContext2D,
  config: SortConfig,
  state: SortState,
  reducedMotion: boolean,
): void {
  staticLayer(context, 'laundrette', (context) => {
    fillBackground(context, '#dff3e4', '#7de3a1');
    context.fillStyle = '#d6f0f1';
    context.fillRect(0, 0, 1_000, 760);
    context.strokeStyle = '#bddadc';
    context.lineWidth = 6;
    for (let x = 0; x < 1_000; x += 125) {
      context.strokeRect(x, 0, 125, 125);
    }
    context.fillStyle = '#86a896';
    context.fillRect(350, 135, 560, 18);
    for (const [x, color, height] of [
      [420, COLORS.cyan, 92],
      [560, COLORS.coral, 120],
      [710, COLORS.yellow, 82],
    ] as const) {
      context.save();
      preserveObjectAspect(context, x + 35, 135);
      context.fillStyle = color;
      context.strokeStyle = COLORS.navy;
      context.lineWidth = 8;
      context.beginPath();
      context.roundRect(x, 135 - height, 70, height, 12);
      context.fill();
      context.stroke();
      context.restore();
    }
    context.save();
    preserveObjectAspect(context, 170, 275);
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
    context.save();
    context.translate(170, 290);
    context.rotate(0);
    context.strokeStyle = 'rgba(247,239,220,0.72)';
    context.lineWidth = 9;
    for (let arm = 0; arm < 3; arm += 1) {
      context.rotate((Math.PI * 2) / 3);
      context.beginPath();
      context.moveTo(0, 0);
      context.lineTo(45, 0);
      context.stroke();
    }
    context.restore();
    context.restore();
    context.fillStyle = '#f0eadc';
    context.strokeStyle = COLORS.navy;
    context.lineWidth = 13;
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
    context.save();
    context.strokeStyle = 'rgba(145,130,100,0.55)';
    context.lineWidth = 8;
    for (let row = 0; row < 4; row += 1) {
      context.beginPath();
      context.moveTo(75, 790 + row * 48);
      context.lineTo(430, 725 + row * 60);
      context.moveTo(570, 725 + row * 60);
      context.lineTo(925, 790 + row * 48);
      context.stroke();
    }
    context.restore();
  });
  context.save();
  preserveObjectAspect(context, 170, 290);
  context.translate(170, 290);
  context.rotate(reducedMotion ? 0 : state.tick * (state.combo >= 8 ? 0.16 : 0.04));
  for (let i = 0; i < 5; i++) {
    context.rotate((Math.PI * 2) / 5);
    ellipse(context, 47, 0, 5, 9, state.combo >= 8 ? '#fff1b5' : '#5bb7bd');
  }
  context.restore();
  if (state.signature?.kind === 'basket' && state.tick - state.signature.tick < 25) {
    const age = (state.tick - state.signature.tick) / 25;
    const side = state.signature.side ?? 1;
    const x = reducedMotion ? 500 + side * 240 : 500 + side * 240 * (1 - (1 - age) ** 3);
    const y = reducedMotion ? 775 : 570 + age * age * 240;
    context.save();
    context.globalAlpha = 1 - age;
    drawGarment(
      context,
      state.signature.token ?? 'white-sock',
      x,
      y,
      reducedMotion ? 0 : state.tick,
      reducedMotion,
    );
    context.restore();
    context.strokeStyle = '#e3b76e';
    context.lineWidth = 7;
    context.strokeRect(side < 0 ? 63 : 550, 710, 385, 35);
  }
  if (state.currentItemIndex !== null) {
    const item = config.items[state.currentItemIndex];
    if (item)
      drawGarment(
        context,
        item.token,
        500,
        210 + state.itemProgress * 470,
        state.combo >= 8 ? state.tick * 1.5 : state.tick,
        reducedMotion,
      );
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
): void {
  context.clearRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
  context.save();
  if (!reducedMotion && state.feedback === 'bad' && state.feedbackTicks > 12) {
    context.translate(state.feedbackTicks % 2 === 0 ? 9 : -9, 0);
  }
  if (config.engine === 'defense-v1' && state.engine === 'defense-v1')
    drawDefense(context, config, state, reducedMotion);
  else if (config.engine === 'dodge-v1' && state.engine === 'dodge-v1')
    drawDodge(context, config, state, reducedMotion);
  else if (config.engine === 'tap-v1' && state.engine === 'tap-v1')
    drawTap(context, config, state, reducedMotion);
  else if (config.engine === 'classify-v1' && state.engine === 'classify-v1')
    drawClassify(context, config, state, reducedMotion);
  else if (config.engine === 'timing-v1' && state.engine === 'timing-v1')
    drawTiming(context, config, state, reducedMotion);
  else if (config.engine === 'sequence-v1' && state.engine === 'sequence-v1')
    drawSequence(context, config, state, reducedMotion);
  else if (config.engine === 'sort-v1' && state.engine === 'sort-v1')
    drawSort(context, config, state, reducedMotion);
  else throw new Error('Renderer received mismatched engine data.');
  context.restore();
  staticLayer(context, `finish-${config.palette}`, (c) => finishScene(c, COLORS[config.palette]));
  if (state.feedback === 'bad' || !state.signature || state.tick - state.signature.tick > 32)
    feedbackEffects(context, state, reducedMotion);
  if (state.feedback !== 'bad') drawSignature(context, state.signature, state.tick, reducedMotion);
}
