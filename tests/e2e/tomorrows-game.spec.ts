import { expect, test, type Page, type TestInfo } from '@playwright/test';

const GAMES = [
  {
    id: 'samosa-shield',
    title: 'Samosa Shield',
    engine: 'defense-v1',
    renderer: 'samosa-defense',
    control: 'tap-defense',
    duration: 36,
  },
  {
    id: 'mosquito-meeting',
    title: 'Mosquito Meeting',
    engine: 'tap-v1',
    renderer: 'mosquito-hunt',
    control: 'tap-target',
    duration: 28,
  },
  {
    id: 'perfect-microwave',
    title: 'Perfect Microwave',
    engine: 'timing-v1',
    renderer: 'microwave-timer',
    control: 'precision-stop',
    duration: 32,
  },
  {
    id: 'laundry-logic',
    title: 'Laundry Logic',
    engine: 'sort-v1',
    renderer: 'laundry-sort',
    control: 'sort',
    duration: 30,
  },
  {
    id: 'pothole-patrol',
    title: 'Pothole Patrol',
    engine: 'dodge-v1',
    renderer: 'pothole-lanes',
    control: 'lane',
    duration: 38,
  },
  {
    id: 'inbox-zero-hero',
    title: 'Inbox Zero Hero',
    engine: 'classify-v1',
    renderer: 'inbox-cards',
    control: 'classify',
    duration: 30,
  },
  {
    id: 'elevator-orchestra',
    title: 'Elevator Orchestra',
    engine: 'sequence-v1',
    renderer: 'elevator-sequence',
    control: 'sequence-hit',
    duration: 30,
  },
] as const;

async function verifyAllGames(page: Page, testInfo: TestInfo, expectedDpr: string) {
  const selector = page.getByLabel('Dev game launcher');
  for (const game of GAMES) {
    await selector.selectOption(game.id);
    await expect(page.getByRole('heading', { level: 1, name: game.title })).toBeVisible();
    await expect(selector.locator('option:checked')).toContainText(game.engine);

    await page.locator('.giant-play').click();
    await expect(page.getByRole('heading', { level: 1, name: game.title })).toBeVisible();
    await page.locator('.game-start-button').click();
    await expect(page.getByRole('button', { name: 'Pause' })).toBeVisible({ timeout: 5_000 });

    const canvas = page.locator('.game-canvas');
    await expect(canvas).toHaveAttribute('data-engine', game.engine);
    await expect(canvas).toHaveAttribute('data-renderer', game.renderer);
    await expect(canvas).toHaveAttribute('data-dpr', expectedDpr);
    await expect(page.locator(`[data-control="${game.control}"]`)).toBeVisible();
    await expect(page.getByText(game.duration.toString(), { exact: true }).first()).toBeVisible();
    if (game.engine === 'dodge-v1') {
      await expect(page.getByRole('button', { name: 'Move left' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Move right' })).toBeVisible();
    } else {
      await expect(page.getByRole('button', { name: 'Move left' })).toHaveCount(0);
      await expect(page.getByRole('button', { name: 'Move right' })).toHaveCount(0);
    }
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
    await testInfo.attach(`${testInfo.project.name}-${game.id}`, {
      body: await page.screenshot(),
      contentType: 'image/png',
    });

    await page.getByRole('button', { name: 'Finish demo run' }).click();
    await expect(page.locator('.result-explanation')).not.toBeEmpty();
    await expect(page.locator('.result-score')).toBeVisible();
    await expect(page.locator('.result-stats > div')).toHaveCount(3);

    await page.getByRole('button', { name: /play again/i }).click();
    await expect(page.getByRole('button', { name: 'Pause' })).toBeVisible({ timeout: 5_000 });
    await expect(page.getByText(game.duration.toString(), { exact: true }).first()).toBeVisible();
    const retryScore = Number(
      await page.locator('.game-hud > div:nth-child(2) strong').textContent(),
    );
    expect(retryScore).toBeLessThan(20);
    await page.getByRole('button', { name: 'Pause' }).click();
    const dialog = page.getByRole('dialog', { name: 'Take a breath' });
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: 'End run' }).click();
    await expect(selector).toBeVisible();
  }
}

test('desktop: all seven renderers, controls, results, and retries', async ({ page }, testInfo) => {
  test.setTimeout(60_000);
  test.skip(testInfo.project.name !== 'desktop-chrome');
  await page.setViewportSize({ width: 1_440, height: 900 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/?e2e=1');
  await expect(page.locator('[data-reduced-motion="true"]')).toBeVisible();
  await expect(page.locator('html')).toHaveCSS('scroll-behavior', 'auto');
  await verifyAllGames(page, testInfo, '1');
});

test('mobile: all seven touch layouts stay crisp and contained', async ({ page }, testInfo) => {
  test.setTimeout(60_000);
  test.skip(testInfo.project.name !== 'mobile-chrome');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/?e2e=1');
  await expect(page.locator('.giant-play')).toBeInViewport();
  await verifyAllGames(page, testInfo, '2');
});
