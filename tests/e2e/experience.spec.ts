import { expect, test, type Page } from '@playwright/test';

const games = [
  'samosa-shield',
  'mosquito-meeting',
  'perfect-microwave',
  'laundry-logic',
  'pothole-patrol',
  'inbox-zero-hero',
  'elevator-orchestra',
];

test('portrait Inbox text keeps its native proportions', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => {
    const paintedText: { text: string; ratio: number }[] = [];
    Object.defineProperty(window, '__paintedText', { value: paintedText });
    const original = Object.getOwnPropertyDescriptor(CanvasRenderingContext2D.prototype, 'fillText')
      ?.value as CanvasRenderingContext2D['fillText'];
    CanvasRenderingContext2D.prototype.fillText = function (text, x, y, maxWidth) {
      if (this.canvas.classList.contains('game-canvas')) {
        const t = this.getTransform();
        paintedText.push({ text, ratio: Math.hypot(t.a, t.b) / Math.hypot(t.c, t.d) });
      }
      if (maxWidth === undefined) original.call(this, text, x, y);
      else original.call(this, text, x, y, maxWidth);
    };
  });
  await page.goto('/?e2e=1');
  await page.getByLabel('Dev game launcher').selectOption('inbox-zero-hero');
  await page.locator('.giant-play').click();
  await page.locator('.game-start-button').click();
  await expect(page.getByRole('button', { name: 'Pause', exact: true })).toBeVisible();
  await page.waitForFunction(() =>
    (
      window as typeof window & { __paintedText: { text: string; ratio: number }[] }
    ).__paintedText.some((entry) => entry.text === 'FROM'),
  );
  const text = await page.evaluate(
    () =>
      (window as typeof window & { __paintedText: { text: string; ratio: number }[] })
        .__paintedText,
  );
  expect(text.some((entry) => entry.text === 'FROM')).toBe(true);
  expect(text.filter((entry) => Math.abs(entry.ratio - 1) > 0.01)).toEqual([]);
});

async function fps(page: Page) {
  return page.evaluate(
    () =>
      new Promise<{ fps: number; p95: number }>((resolve) => {
        const frames: number[] = [];
        let previous = performance.now();
        const sample = (now: number) => {
          frames.push(now - previous);
          previous = now;
          if (frames.length < 90) requestAnimationFrame(sample);
          else {
            const intervals = frames.slice(5).sort((a, b) => a - b);
            resolve({
              fps: Math.round(1000 / (intervals.reduce((a, b) => a + b, 0) / intervals.length)),
              p95: Math.round(intervals[Math.floor(intervals.length * 0.95)] ?? 0),
            });
          }
        };
        requestAnimationFrame(sample);
      }),
  );
}

test('title safe areas, answer integrity and screenshots at four sizes', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop-chrome');
  test.setTimeout(600000);
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const metrics: object[] = [];
  for (const [width, height] of [
    [1440, 900],
    [1280, 720],
    [390, 844],
    [360, 800],
  ]) {
    await page.setViewportSize({ width: width!, height: height! });
    await page.goto('/?e2e=1');
    for (const id of games) {
      await page.getByLabel('Dev game launcher').selectOption(id);
      await page.evaluate(() => window.scrollTo(0, 0));
      const heading = page.locator('#challenge-title');
      await expect(heading).toBeVisible();
      expect(
        await heading.evaluate((el) => {
          const box = el.getBoundingClientRect();
          return box.left >= 0 && box.right <= innerWidth && el.scrollWidth <= el.clientWidth;
        }),
      ).toBe(true);
      await page.screenshot({ path: `screenshots/milestone-2.5/legacy/${width}-${id}-today.png` });
      await page.locator('.giant-play').click();
      await page.locator('.game-start-button').click();
      await expect(page.getByRole('button', { name: 'Pause', exact: true })).toBeVisible();
      await expect(page.locator('h1')).toHaveCount(1);
      expect(await page.locator('h1').evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(
        true,
      );
      const status = page.locator('.game-shell > .sr-only').first();
      await expect(status).not.toContainText(/choose|safe lane|correct category|decoy/i);
      expect(
        await page.locator('.game-stage').evaluate((el) => {
          const b = el.getBoundingClientRect();
          return b.left >= 0 && b.right <= innerWidth && b.bottom <= innerHeight;
        }),
      ).toBe(true);
      const performance = await fps(page);
      metrics.push({ width, height, id, ...performance });
      await page.screenshot({ path: `screenshots/milestone-2.5/legacy/${width}-${id}-game.png` });
      const key =
        id === 'laundry-logic'
          ? 'l'
          : id === 'inbox-zero-hero'
            ? 't'
            : id === 'pothole-patrol'
              ? 'ArrowRight'
              : 'Space';
      await page.keyboard.press(key);
      await page.getByRole('button', { name: 'Pause', exact: true }).click();
      await expect(page.getByRole('dialog')).toBeVisible();
      await page
        .getByRole('dialog')
        .getByRole('button', { name: /^Resume/ })
        .click();
      await page.getByRole('button', { name: 'Finish demo run' }).click();
      await expect(page.getByRole('button', { name: /^Retry/ })).toBeVisible();
      await page.screenshot({
        path: `screenshots/milestone-2.5/legacy/${width}-${id}-result.png`,
        fullPage: true,
      });
      await page.getByRole('button', { name: 'Back to today' }).click();
    }
    await page.locator('#vote').scrollIntoViewIfNeeded();
    await page.screenshot({
      path: `screenshots/milestone-2.5/legacy/${width}-community.png`,
      fullPage: true,
    });
  }
  expect(errors).toEqual([]);
  await info.attach('fps-measurements', {
    body: JSON.stringify(metrics, null, 2),
    contentType: 'application/json',
  });
  console.log('EXPERIENCE_METRICS', JSON.stringify(metrics));
});

test('Pixi Laundry pilot: WebGL, DPR, pause, retry, fallback', async ({ page }, info) => {
  test.setTimeout(120000);
  await page.goto('/?e2e=1&pixi=1');
  await page.getByLabel('Dev game launcher').selectOption('laundry-logic');
  await page.locator('.giant-play').click();
  await page.locator('.game-start-button').click();
  await expect(page.locator('.game-canvas')).toHaveAttribute('data-renderer', 'pixi-laundry-pilot');
  const pilot = page.locator('.pixi-pilot-layer canvas');
  expect(
    await pilot.evaluate(
      (canvas: HTMLCanvasElement) => canvas.width / canvas.getBoundingClientRect().width,
    ),
  ).toBeCloseTo(info.project.name === 'mobile-chrome' ? 2 : 1, 1);
  await page.screenshot({ path: `screenshots/milestone-2.5/legacy/pixi-${info.project.name}.png` });
  console.log('PIXI_METRICS', info.project.name, await fps(page));
  await page.getByRole('button', { name: 'Pause', exact: true }).click();
  const frozen = await pilot.screenshot();
  await page.waitForTimeout(200);
  expect(await pilot.screenshot()).toEqual(frozen);
  await page
    .getByRole('dialog')
    .getByRole('button', { name: /^Resume/ })
    .click();
  await page.getByRole('button', { name: /Darks basket/ }).click();
  await page.getByRole('button', { name: 'Finish demo run' }).click();
  await page.getByRole('button', { name: /^Retry/ }).click();
  await expect(page.locator('.game-canvas')).toHaveAttribute('data-renderer', 'pixi-laundry-pilot');
  await expect(pilot).toHaveCount(1);
  await pilot.evaluate((canvas: HTMLCanvasElement) => {
    const gl = canvas.getContext('webgl2') ?? canvas.getContext('webgl');
    gl?.getExtension('WEBGL_lose_context')?.loseContext();
  });
  await expect(page.locator('.game-canvas')).toHaveAttribute('data-renderer', 'laundry-sort');
  await expect(page.getByRole('button', { name: /Lights basket/ })).toBeEnabled();
});
