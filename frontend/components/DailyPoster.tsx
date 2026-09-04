import { useEffect, useRef } from 'react';
import type { DailyGameConfig } from '@shared/game';
import { prepareHiDpiCanvas } from '@frontend/lib/canvas';

const COLORS = {
  cyan: '#56e7ed',
  coral: '#ff755f',
  yellow: '#f6df49',
  violet: '#b9a0ff',
  green: '#7de3a1',
} as const;

function pigeon(context: CanvasRenderingContext2D, x: number, y: number): void {
  context.save();
  context.translate(x, y);
  context.strokeStyle = '#07172b';
  context.fillStyle = '#ff755f';
  context.lineWidth = 14;
  context.lineCap = 'round';
  context.beginPath();
  context.arc(0, 10, 36, 0, Math.PI * 2);
  context.fill();
  context.stroke();
  context.beginPath();
  context.moveTo(-16, 0);
  context.quadraticCurveTo(-70, -54, -82, 8);
  context.moveTo(16, 0);
  context.quadraticCurveTo(70, -54, 82, 8);
  context.stroke();
  context.restore();
}

function envelope(context: CanvasRenderingContext2D, x: number, y: number, rotation: number): void {
  context.save();
  context.translate(x, y);
  context.rotate(rotation);
  context.fillStyle = '#f7efdc';
  context.strokeStyle = '#07172b';
  context.lineWidth = 12;
  context.beginPath();
  context.roundRect(-76, -52, 152, 104, 12);
  context.fill();
  context.stroke();
  context.beginPath();
  context.moveTo(-70, -45);
  context.lineTo(0, 15);
  context.lineTo(70, -45);
  context.stroke();
  context.restore();
}

function drawPoster(canvas: HTMLCanvasElement, config: DailyGameConfig): void {
  const prepared = prepareHiDpiCanvas(canvas, 900, 700);
  if (!prepared) return;
  const { context } = prepared;
  const accent = COLORS[config.palette];
  context.clearRect(0, 0, 900, 700);
  context.fillStyle = accent;
  context.fillRect(0, 0, 900, 700);
  context.strokeStyle = '#07172b';
  context.fillStyle = '#07172b';
  context.lineWidth = 14;
  context.lineJoin = 'round';
  context.lineCap = 'round';

  if (config.poster === 'samosa-pigeons') {
    pigeon(context, 210, 170);
    pigeon(context, 700, 200);
    pigeon(context, 650, 520);
    context.fillStyle = '#f6df49';
    context.beginPath();
    context.moveTo(440, 210);
    context.lineTo(610, 560);
    context.lineTo(270, 560);
    context.closePath();
    context.fill();
    context.stroke();
  } else if (config.poster === 'mosquito-night') {
    context.fillStyle = '#f7efdc';
    context.beginPath();
    context.arc(690, 150, 90, 0, Math.PI * 2);
    context.fill();
    for (const [x, y, scale] of [
      [230, 190, 1],
      [520, 360, 1.25],
      [270, 540, 0.8],
    ] as const) {
      context.save();
      context.translate(x, y);
      context.scale(scale, scale);
      context.fillStyle = '#07172b';
      context.beginPath();
      context.ellipse(0, 0, 18, 48, 0, 0, Math.PI * 2);
      context.fill();
      context.beginPath();
      context.moveTo(-12, -8);
      context.lineTo(-75, -55);
      context.moveTo(12, -8);
      context.lineTo(75, -55);
      context.moveTo(-13, 10);
      context.lineTo(-65, 56);
      context.moveTo(13, 10);
      context.lineTo(65, 56);
      context.stroke();
      context.restore();
    }
  } else if (config.poster === 'microwave-timer') {
    context.fillStyle = '#f7efdc';
    context.beginPath();
    context.roundRect(120, 120, 660, 470, 42);
    context.fill();
    context.stroke();
    context.fillStyle = '#07172b';
    context.beginPath();
    context.roundRect(175, 180, 410, 320, 24);
    context.fill();
    context.fillStyle = accent;
    context.font = '900 118px monospace';
    context.textAlign = 'center';
    context.fillText('00:01', 380, 385);
    context.beginPath();
    context.arc(680, 250, 42, 0, Math.PI * 2);
    context.stroke();
    context.beginPath();
    context.arc(680, 390, 42, 0, Math.PI * 2);
    context.stroke();
  } else if (config.poster === 'laundry-piles') {
    context.beginPath();
    context.moveTo(70, 150);
    context.quadraticCurveTo(450, 240, 830, 140);
    context.stroke();
    context.fillStyle = '#f7efdc';
    context.beginPath();
    context.roundRect(170, 220, 190, 300, 30);
    context.fill();
    context.stroke();
    context.fillStyle = '#ff755f';
    context.beginPath();
    context.roundRect(520, 250, 190, 250, 30);
    context.fill();
    context.stroke();
    context.fillStyle = '#07172b';
    context.font = '900 64px system-ui';
    context.textAlign = 'center';
    context.fillText('SOCK', 265, 390);
    context.fillText('MUG?', 615, 390);
  } else if (config.poster === 'pothole-street') {
    context.fillStyle = '#283340';
    context.fillRect(210, 0, 480, 700);
    context.strokeStyle = '#f6df49';
    context.setLineDash([60, 50]);
    context.beginPath();
    context.moveTo(450, 0);
    context.lineTo(450, 700);
    context.stroke();
    context.setLineDash([]);
    context.fillStyle = '#07172b';
    context.beginPath();
    context.ellipse(360, 230, 110, 55, -0.2, 0, Math.PI * 2);
    context.ellipse(555, 520, 125, 62, 0.12, 0, Math.PI * 2);
    context.fill();
    context.strokeStyle = accent;
    context.beginPath();
    context.arc(330, 520, 48, 0, Math.PI * 2);
    context.arc(475, 520, 48, 0, Math.PI * 2);
    context.moveTo(330, 520);
    context.lineTo(395, 420);
    context.lineTo(475, 520);
    context.lineTo(375, 520);
    context.stroke();
  } else if (config.poster === 'inbox-storm') {
    envelope(context, 220, 180, -0.15);
    envelope(context, 640, 210, 0.18);
    envelope(context, 430, 480, -0.05);
    context.fillStyle = '#07172b';
    context.beginPath();
    context.arc(760, 510, 72, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = '#f7efdc';
    context.font = '900 62px system-ui';
    context.textAlign = 'center';
    context.fillText('99+', 760, 532);
  } else {
    context.fillStyle = '#f7efdc';
    context.beginPath();
    context.roundRect(210, 60, 480, 580, 22);
    context.fill();
    context.stroke();
    context.fillStyle = '#07172b';
    context.fillRect(440, 80, 20, 540);
    context.font = '900 96px system-ui';
    context.textAlign = 'center';
    context.fillText('7', 450, 390);
    context.fillStyle = '#ff755f';
    context.font = '900 88px system-ui';
    context.fillText('♪', 720, 180);
    context.fillText('♫', 150, 540);
  }
}

export function DailyPoster({ config }: { config: DailyGameConfig }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (canvasRef.current) drawPoster(canvasRef.current, config);
  }, [config]);
  return (
    <canvas
      ref={canvasRef}
      className="daily-poster"
      role="img"
      aria-label={`Original artwork for ${config.title}`}
    />
  );
}
