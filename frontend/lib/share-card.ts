import type { DailyGameConfig, DailyGameState } from '@shared/game';
import { describeResult } from './game-result';

const CARD_WIDTH = 1_200;
const CARD_HEIGHT = 630;

function roundedRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
): void {
  context.beginPath();
  context.roundRect(x, y, width, height, radius);
  context.fill();
}

export function drawShareCard(
  canvas: HTMLCanvasElement,
  config: DailyGameConfig,
  state: DailyGameState,
): void {
  canvas.width = CARD_WIDTH;
  canvas.height = CARD_HEIGHT;
  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Canvas is unavailable for the result card.');
  }

  context.fillStyle = '#07172b';
  context.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);
  context.fillStyle = '#56e7ed';
  context.beginPath();
  context.arc(1_060, 80, 230, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = '#f7efdc';
  roundedRect(context, 70, 70, 1_060, 490, 44);

  context.fillStyle = '#102033';
  context.font = '800 28px system-ui, sans-serif';
  context.fillText("TOMORROW'S GAME", 120, 140);
  context.fillStyle = '#bb3c2f';
  context.font = '800 22px system-ui, sans-serif';
  context.fillText(config.title.toUpperCase(), 120, 198);
  context.fillStyle = '#102033';
  context.font = '900 154px Impact, sans-serif';
  context.fillText(state.score.toString(), 112, 385);
  context.font = '700 28px system-ui, sans-serif';
  context.fillText('POINTS', 126, 430);
  context.fillStyle = '#ff755f';
  context.beginPath();
  context.arc(970, 395, 96, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = '#07172b';
  context.font = '900 48px Impact, sans-serif';
  context.textAlign = 'center';
  const result = describeResult(state, state.score);
  const metric = result.metrics[0].value;
  const metricLabel = result.metrics[0].label.toUpperCase();
  context.fillText(metric, 970, 403);
  context.font = '800 20px system-ui, sans-serif';
  context.fillText(metricLabel, 970, 440);
  context.textAlign = 'start';
  context.fillStyle = '#57606b';
  context.font = '600 22px system-ui, sans-serif';
  context.fillText('Suggest it today. Vote tonight. Play it tomorrow.', 120, 510);
}

export function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error('The result image could not be created.'));
      }
    }, 'image/png');
  });
}
