import type { DailyGameConfig, DailyGameState } from '@shared/game';
import { assessMastery, type RunMode } from '@shared/game/mastery';
import { carActor, mosquitoActor, pigeonActor } from './signature-art';

export interface ShareContext {
  day: number;
  streak: number;
  mode: RunMode;
  scale?: number;
}
export function shareCardModel(
  config: DailyGameConfig,
  state: DailyGameState,
  context: ShareContext,
) {
  const result = assessMastery(config, state);
  return {
    title: config.title,
    day: context.day,
    grade: result.grade,
    performance: result.performance,
    unit: result.lowerIsBetter ? 'MS AVERAGE ERROR' : 'POINTS',
    medal: result.medal,
    streak: context.streak,
    mode: context.mode,
  };
}

export function drawShareCard(
  canvas: HTMLCanvasElement,
  config: DailyGameConfig,
  state: DailyGameState,
  options: ShareContext = { day: 1, streak: 0, mode: 'daily' },
): void {
  const scale = Math.max(1, Math.min(3, options.scale ?? 1));
  canvas.width = 1200 * scale;
  canvas.height = 630 * scale;
  const c = canvas.getContext('2d');
  if (!c) throw new Error('Canvas is unavailable for the result card.');
  c.setTransform(scale, 0, 0, scale, 0, 0);
  const m = shareCardModel(config, state, options);
  const accent = {
    cyan: '#79d9d0',
    coral: '#f68b75',
    yellow: '#e7bf72',
    violet: '#bda2ea',
    green: '#99c5a5',
  }[config.palette];
  c.fillStyle = '#132c37';
  c.fillRect(0, 0, 1200, 630);
  c.fillStyle = accent;
  c.fillRect(0, 0, 18, 630);
  c.fillRect(854, 0, 346, 630);
  for (let i = 0; i < 80; i++) {
    c.fillStyle = 'rgba(255,245,211,.045)';
    c.fillRect((i * 173) % 840, (i * 79) % 630, 2, 2);
  }
  c.strokeStyle = 'rgba(245,231,199,.3)';
  c.lineWidth = 1;
  c.strokeRect(42, 38, 1116, 554);
  c.fillStyle = '#fff3d7';
  c.font = '800 22px system-ui';
  c.textAlign = 'left';
  c.fillText('TOMORROW’S GAME', 75, 91);
  c.font = '700 18px system-ui';
  c.fillStyle = accent;
  c.fillText(`DAY ${m.day}  /  ${m.mode.toUpperCase()}`, 75, 128);
  c.font = '900 44px system-ui';
  c.fillStyle = '#fff3d7';
  c.fillText(m.title, 72, 211, 740);
  c.font = '900 132px system-ui';
  c.fillText(m.performance.toLocaleString(), 68, 387);
  c.font = '800 18px system-ui';
  c.fillStyle = accent;
  c.fillText(m.unit, 76, 428);
  c.strokeStyle = 'rgba(255,243,215,.2)';
  c.beginPath();
  c.moveTo(75, 471);
  c.lineTo(795, 471);
  c.stroke();
  c.font = '700 21px system-ui';
  c.fillStyle = '#fff3d7';
  c.fillText(`${m.medal.toUpperCase()}  ·  ${m.streak} DAY STREAK`, 75, 522);
  c.font = '500 15px system-ui';
  c.fillStyle = '#b8c9c8';
  c.fillText('One small game. Yours to master.', 75, 561);
  c.textAlign = 'center';
  c.fillStyle = '#132c37';
  c.font = '900 190px system-ui';
  c.fillText(m.grade, 1025, 284);
  c.font = '800 18px system-ui';
  c.fillText('RANK', 1025, 325);
  c.save();
  c.translate(1025, 445);
  c.scale(0.8, 0.8);
  if (config.engine === 'defense-v1') pigeonActor(c, 0);
  else if (config.engine === 'dodge-v1') carActor(c, 0, 0, 0);
  else if (config.engine === 'tap-v1') mosquitoActor(c, 0);
  else {
    c.strokeStyle = '#132c37';
    c.lineWidth = 4;
    c.strokeRect(-54, -45, 108, 90);
    c.font = '900 38px system-ui';
    c.fillStyle = '#132c37';
    c.fillText(
      config.engine === 'sequence-v1'
        ? '♪'
        : config.engine === 'timing-v1'
          ? '00'
          : config.engine === 'sort-v1'
            ? '///'
            : '✉',
      0,
      15,
    );
  }
  c.restore();
  c.textAlign = 'left';
}

export function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) =>
        blob ? resolve(blob) : reject(new Error('The result image could not be created.')),
      'image/png',
    ),
  );
}
