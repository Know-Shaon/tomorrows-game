import { expect, test, type Browser, type Page, type TestInfo } from '@playwright/test';

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

type Game = (typeof GAMES)[number];

interface PlaytestResult {
  game: string;
  run: number;
  viewport: 'desktop' | 'mobile';
  result: string;
  actions: number;
  overflow: boolean;
  errors: string[];
}

const INBOX_CHOICES: Readonly<Record<string, 'k' | 't'>> = {
  Mum: 'k',
  'Prize Wizard': 't',
  Dentist: 'k',
  'Receipt Bot': 'k',
  'Definitely Human': 't',
  'Daily Screaming': 't',
  Neighbour: 'k',
  'Coupon Tornado': 't',
  'Team Calendar': 'k',
};

async function pressOrTap(page: Page, mobile: boolean, key: string, buttonName: RegExp) {
  if (mobile) {
    try {
      await page.getByRole('button', { name: buttonName }).click({ timeout: 500 });
    } catch (error) {
      if (!(await page.getByRole('button', { name: /^retry/i }).isVisible())) throw error;
    }
  } else await page.keyboard.press(key);
}

async function playNaturally(page: Page, game: Game, mobile: boolean): Promise<number> {
  const status = page.locator('.game-shell > .sr-only').first();
  const result = page.getByRole('button', { name: /^retry/i });
  let actions = 0;
  let lastDecision = '';
  let lastTimingRound = 0;
  let lastFloor: number | null = null;
  let usedDirectTouch = false;

  const deadline = Date.now() + (game.duration + 10) * 1_000;
  while (Date.now() < deadline && !(await result.isVisible())) {
    const message = (await status.textContent({ timeout: 250 }).catch(() => null)) ?? '';

    if (game.engine === 'defense-v1') {
      await page.keyboard.press('Space');
      actions += 1;
      if (mobile && actions === 1) {
        const box = await page.locator('.game-canvas').boundingBox();
        if (box) await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
      }
      await page.waitForTimeout(360);
      continue;
    }

    if (game.engine === 'tap-v1') {
      if (message.includes('mosquito is buzzing')) {
        if (mobile && !usedDirectTouch) {
          const box = await page.locator('.game-canvas').boundingBox();
          if (box) await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
          usedDirectTouch = true;
        } else {
          await page.keyboard.press('Space');
        }
        actions += 1;
      }
      await page.waitForTimeout(90);
      continue;
    }

    if (game.engine === 'classify-v1') {
      if (message.startsWith('Message from') && message !== lastDecision) {
        const sender = Object.keys(INBOX_CHOICES).find((name) => message.includes(`from ${name}:`));
        const choice = sender ? INBOX_CHOICES[sender] : undefined;
        if (choice) {
          await pressOrTap(
            page,
            mobile,
            choice,
            choice === 'k' ? /Keep message/i : /Trash message/i,
          );
          actions += 1;
          lastDecision = message;
        }
      } else if (message.startsWith('Waiting')) {
        lastDecision = '';
      }
      await page.waitForTimeout(70);
      continue;
    }

    if (game.engine === 'sort-v1') {
      if (/sock|shirt|towel/.test(message) && message !== lastDecision) {
        const chooseLeft = /white|yellow/.test(message);
        await pressOrTap(
          page,
          mobile,
          chooseLeft ? 'l' : 'd',
          chooseLeft ? /Lights basket/i : /Darks basket/i,
        );
        actions += 1;
        lastDecision = message;
      } else if (message.startsWith('Waiting')) {
        lastDecision = '';
      }
      await page.waitForTimeout(70);
      continue;
    }

    if (game.engine === 'timing-v1') {
      const match = /Round (\d+)\. Timer ([\d.]+) seconds\. Target ([\d.]+)/.exec(message);
      if (match) {
        const round = Number(match[1]);
        const timer = Number(match[2]);
        const target = Number(match[3]);
        if (round > lastTimingRound && Math.abs(timer - target) <= 0.04) {
          await pressOrTap(page, mobile, 'Space', /^stop/i);
          lastTimingRound = round;
          actions += 1;
        }
      }
      await page.waitForTimeout(12);
      continue;
    }

    if (game.engine === 'sequence-v1') {
      const match = /Current floor ([\d.]+)\. Hit floor (\d+)/.exec(message);
      if (match) {
        const floor = Number(match[1]);
        const target = Number(match[2]);
        if (target !== lastFloor && Math.abs(floor - target) <= 0.18) {
          await pressOrTap(page, mobile, 'Space', /^hit floor/i);
          lastFloor = target;
          actions += 1;
        }
      }
      await page.waitForTimeout(18);
      continue;
    }

    const safeLane = 1 + (Math.floor(Date.now() / 600) % 3);
    const currentLane = Number(/Car in lane (\d+)/.exec(message)?.[1] ?? 0);
    if (safeLane && currentLane && safeLane !== currentLane) {
      const moveLeft = safeLane < currentLane;
      await pressOrTap(
        page,
        mobile,
        moveLeft ? 'ArrowLeft' : 'ArrowRight',
        moveLeft ? /Move left/i : /Move right/i,
      );
      actions += 1;
    }
    await page.waitForTimeout(80);
  }

  await expect(result).toBeVisible({ timeout: 2_000 });
  return actions;
}

async function runFullPlaytest(
  browser: Browser,
  game: Game,
  viewport: 'desktop' | 'mobile',
  run: number,
): Promise<PlaytestResult> {
  const mobile = viewport === 'mobile';
  const context = await browser.newContext({
    viewport: mobile ? { width: 390, height: 844 } : { width: 1_440, height: 900 },
    deviceScaleFactor: mobile ? 2 : 1,
    hasTouch: mobile,
    isMobile: mobile,
  });
  const page = await context.newPage();
  const errors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('pageerror', (error) => errors.push(error.message));

  await page.goto('/?e2e=1');
  await page.getByLabel('Dev game launcher').selectOption(game.id);
  await page.locator('.giant-play').click();
  await page.locator('.game-start-button').click();
  await expect(page.getByRole('button', { name: 'Pause' })).toBeVisible({ timeout: 5_000 });
  const actions = await playNaturally(page, game, mobile);
  const result = (await page.locator('.result-card').innerText())
    .split('\n')
    .slice(0, 5)
    .join(' · ')
    .trim();
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth,
  );
  await context.close();

  return { game: game.title, run, viewport, result, actions, overflow, errors };
}

async function verifyAllGames(page: Page, testInfo: TestInfo, expectedDpr: string) {
  const selector = page.getByLabel('Dev game launcher');
  for (const game of GAMES) {
    await selector.selectOption(game.id);
    await expect(page.getByRole('heading', { level: 1, name: game.title })).toBeVisible();
    await expect(selector.locator('option:checked')).toContainText(game.engine);

    await page.locator('.giant-play').click();
    await expect(page.getByRole('heading', { level: 1, name: game.title })).toBeVisible();
    if (game.id === 'samosa-shield') {
      await page.getByRole('button', { name: 'Turn on game sounds' }).click();
      await expect(page.getByRole('button', { name: 'Mute game sounds' })).toHaveAttribute(
        'aria-pressed',
        'true',
      );
      expect(
        await page.evaluate(() =>
          (localStorage.getItem('tomorrows-game:prototype') ?? '').includes('"soundEnabled":true'),
        ),
      ).toBe(true);
      await page.getByRole('button', { name: 'Mute game sounds' }).click();
    }
    await page.locator('.game-start-button').click();
    await expect(page.getByRole('button', { name: 'Pause' })).toBeVisible({ timeout: 5_000 });

    const canvas = page.locator('.game-canvas');
    await expect(canvas).toHaveAttribute('data-engine', game.engine);
    await expect(canvas).toHaveAttribute('data-renderer', game.renderer);
    await expect(canvas).toHaveAttribute('data-dpr', expectedDpr);
    await expect(canvas).toHaveAttribute('tabindex', '0');
    await expect(page.locator('.game-shell > .sr-only').first()).not.toBeEmpty();
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
    expect(
      await page.locator('.game-shell button:visible').evaluateAll((buttons) =>
        buttons
          .map((button) => {
            const box = button.getBoundingClientRect();
            return {
              label: button.textContent?.trim() ?? '',
              width: box.width,
              height: box.height,
            };
          })
          .filter(({ width, height }) => width < 44 || height < 44),
      ),
    ).toEqual([]);
    if (game.id === 'samosa-shield') {
      await page.getByRole('button', { name: 'Show tuning' }).click();
      await expect(page.getByText(/samosa-shield · defense-v1/i)).toBeVisible();
      await expect(page.getByRole('button', { name: 'Reset playtest data' })).toBeVisible();
      await page.getByRole('button', { name: 'Hide tuning' }).click();
      await page.waitForTimeout(250);
    }
    await testInfo.attach(`${testInfo.project.name}-${game.id}`, {
      body: await page.screenshot(),
      contentType: 'image/png',
    });

    await page.getByRole('button', { name: 'Finish demo run' }).click();
    await expect(page.locator('.result-explanation')).not.toBeEmpty();
    await expect(page.locator('.result-score')).toBeVisible();
    await expect(page.locator('.result-stats > div')).toHaveCount(3);
    await expect(page.locator('.result-verdict')).not.toBeEmpty();
    await expect(page.locator('.result-why')).not.toBeEmpty();
    if (game.id === 'samosa-shield') {
      await expect(page.locator('.personal-best-result')).toHaveAttribute('data-new-best', 'true');
    }

    await page.getByRole('button', { name: /^retry/i }).click();
    await expect(page.locator('.instruction-card')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Pause' })).toBeVisible({ timeout: 5_000 });
    await expect(page.getByText(game.duration.toString(), { exact: true }).first()).toBeVisible();
    const retryScore = Number(
      await page.locator('.game-hud > div').nth(1).locator('strong').textContent(),
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

if (process.env.RUN_FULL_PLAYTEST === '1') {
  test.describe('required full playtest matrix', () => {
    test.describe.configure({ mode: 'parallel' });

    for (const game of GAMES) {
      for (const run of [1, 2, 3]) {
        test(`full playtest: desktop ${game.title} run ${run}`, async ({ browser }, testInfo) => {
          test.setTimeout(60_000);
          test.skip(testInfo.project.name !== 'desktop-chrome');
          const result = await runFullPlaytest(browser, game, 'desktop', run);
          expect(result.actions, `${result.game} received input`).toBeGreaterThan(0);
          expect(result.overflow, `${result.game} overflowed`).toBe(false);
          expect(result.errors, `${result.game} browser errors`).toEqual([]);
          await testInfo.attach('playtest-result', {
            body: Buffer.from(JSON.stringify(result, null, 2)),
            contentType: 'application/json',
          });
        });
      }

      test(`full playtest: mobile ${game.title}`, async ({ browser }, testInfo) => {
        test.setTimeout(60_000);
        test.skip(testInfo.project.name !== 'desktop-chrome');
        const result = await runFullPlaytest(browser, game, 'mobile', 1);
        expect(result.actions, `${result.game} received input`).toBeGreaterThan(0);
        expect(result.overflow, `${result.game} overflowed`).toBe(false);
        expect(result.errors, `${result.game} browser errors`).toEqual([]);
        await testInfo.attach('playtest-result', {
          body: Buffer.from(JSON.stringify(result, null, 2)),
          contentType: 'application/json',
        });
      });
    }
  });
}
