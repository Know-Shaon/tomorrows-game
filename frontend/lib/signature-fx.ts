import type { SignatureEvent } from '@shared/game/signature';
import { ellipse, paperFlight, pigeonActor } from './signature-art';

export function drawSignature(
  c: CanvasRenderingContext2D,
  event: SignatureEvent | undefined,
  tick: number,
  reduced: boolean,
) {
  if (!event) return;
  const age = tick - event.tick;
  if (age < 0 || age > 32) return;
  const t = age / 32;
  c.save();
  if (event.kind === 'file' && !reduced) {
    paperFlight(c, t, event.side ?? 1, true);
    c.restore();
    return;
  }
  const transform = c.getTransform();
  c.translate(event.x, event.y);
  c.scale(
    1,
    Math.min(1, Math.hypot(transform.a, transform.b) / Math.hypot(transform.c, transform.d)),
  );
  c.globalAlpha = 1 - t;
  const color =
    event.kind === 'precision' ? '#fff4aa' : event.kind === 'near-miss' ? '#ffdf92' : '#f4eaca';
  if (!reduced) {
    const count = Math.min(20, 8 + event.power * 2);
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const r = 30 + t * (65 + event.power * 12);
      c.save();
      c.translate(Math.cos(angle) * r, Math.sin(angle) * r + t * t * 20);
      c.rotate(angle + t);
      ellipse(c, 0, 0, event.kind === 'shoo' || event.kind === 'save' ? 10 : 4, 3, color);
      c.restore();
    }
    if (event.kind === 'shoo' || event.kind === 'save') {
      c.save();
      c.translate(t * 150, -t * 160);
      c.rotate(-0.55 - t);
      c.scale(0.9, 0.9);
      pigeonActor(c, age * 0.6, true);
      c.restore();
    }
    c.strokeStyle = color;
    c.lineWidth = 3 + event.power;
    c.beginPath();
    c.arc(0, 0, 22 + t * 120, 0, Math.PI * 2);
    c.stroke();
  }
  const label =
    event.kind === 'save'
      ? 'LAST-SECOND SAVE'
      : event.kind === 'near-miss'
        ? 'NEAR MISS'
        : event.kind === 'precision'
          ? 'PINPOINT'
          : event.kind === 'note'
            ? '♪'
            : event.kind === 'basket' && event.power >= 3
              ? 'SPIN FLOW'
              : event.kind === 'swat' && event.power >= 3
                ? 'CLEAN STREAK'
                : '';
  if (label) {
    c.globalAlpha = Math.min(1, (1 - t) * 2);
    c.font = '900 27px system-ui';
    c.textAlign = 'center';
    c.strokeStyle = '#142b39';
    c.lineWidth = 7;
    c.strokeText(label, 0, -90);
    c.fillStyle = color;
    c.fillText(label, 0, -90);
  }
  c.restore();
}
