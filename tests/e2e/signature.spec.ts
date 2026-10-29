import { expect, test, type Page } from '@playwright/test';

const ids = [
  'samosa-shield',
  'mosquito-meeting',
  'perfect-microwave',
  'laundry-logic',
  'pothole-patrol',
  'inbox-zero-hero',
  'elevator-orchestra',
];

for (const id of ids)
  test(`signature: honest low grade and audible feedback ${id}`, async ({ page }) => {
    test.setTimeout(150000);
    await page.addInitScript(() => {
      let tones = 0;
      AudioContext.prototype.createOscillator = function () {
        tones++;
        return BaseAudioContext.prototype.createOscillator.call(this);
      };
      Object.defineProperty(window, '__tones', { get: () => tones });
    });
    await page.goto('/?e2e=1');
    await page.getByLabel('Dev game launcher').selectOption(id);
    await page.locator('.giant-play').click();
    await page.getByRole('button', { name: 'Turn on game sounds', exact: true }).click();
    await page.locator('.game-start-button').click();
    await expect(page.getByRole('button', { name: 'Pause', exact: true })).toBeVisible();
    await page.evaluate((gameId) => {
      const timer = setInterval(() => {
        if (document.querySelector('.result-card')) {
          clearInterval(timer);
          return;
        }
        const text = document.querySelector('.game-shell > .sr-only')?.textContent ?? '';
        if (gameId === 'mosquito-meeting' && text.includes('mosquito is buzzing')) return;
        let key = ' ';
        if (
          gameId === 'samosa-shield' ||
          gameId === 'pothole-patrol' ||
          gameId === 'elevator-orchestra'
        )
          return;
        if (gameId === 'inbox-zero-hero')
          key = /Mum:|Dentist:|Receipt Bot:|Neighbour:|Team Calendar:/.test(text) ? 't' : 'k';
        if (gameId === 'laundry-logic') key = /white|yellow/.test(text) ? 'd' : 'l';
        window.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
        window.dispatchEvent(new KeyboardEvent('keyup', { key, bubbles: true }));
      }, 150);
    }, id);
    await expect(page.locator('.result-grade')).toHaveAttribute('data-grade', 'C', {
      timeout: 90000,
    });
    await expect(page.locator('.medal-strip li').last()).toHaveAttribute('data-earned', 'false');
    expect(
      await page.evaluate(() => (window as unknown as { __tones: number }).__tones),
    ).toBeGreaterThan(2);
    await page.getByRole('button', { name: 'Mute game sounds', exact: true }).click();
    expect(
      await page.evaluate(
        () =>
          (
            JSON.parse(localStorage.getItem('tomorrows-game:prototype') ?? '{}') as {
              preferences: { soundEnabled: boolean };
            }
          ).preferences.soundEnabled,
      ),
    ).toBe(false);
  });

async function playVisibleProblem(page: Page) {
  // Browser agent reads only the same intrinsic descriptions available to a player.
  // No engine-state hook, safe-route field, card answer or forced finish is used.
  await page.evaluate(() => {
    let last = '',
      lastRound = 0,
      lastFloor = 0;
    let clock: { round: number; target: number; timer: number; at: number } | null = null;
    const press = (key: string) => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
      window.dispatchEvent(new KeyboardEvent('keyup', { key, bubbles: true }));
    };
    const interval = window.setInterval(() => {
      if (document.querySelector('.result-card')) {
        clearInterval(interval);
        return;
      }
      const text = document.querySelector('.game-shell > .sr-only')?.textContent ?? '';
      if (/pigeons approaching/.test(text)) {
        if (!text.startsWith('0 ')) press(' ');
      } else if (text.includes('mosquito is buzzing')) press(' ');
      else if (text.startsWith('Message from') && last !== text) {
        press(/Mum:|Dentist:|Receipt Bot:|Neighbour:|Team Calendar:/.test(text) ? 'k' : 't');
        last = text;
      } else if (/sock|shirt|towel/.test(text) && last !== text) {
        press(/white|yellow/.test(text) ? 'l' : 'd');
        last = text;
      } else if (text.startsWith('Waiting') || text.includes('desk is clear')) last = '';
      else if (text.startsWith('Round')) {
        const m = /Round (\d+)\. Timer ([\d.]+|hidden) seconds\. Target ([\d.]+)/.exec(text);
        if (m) {
          const round = Number(m[1]),
            target = Number(m[3]);
          if (m[2] !== 'hidden')
            clock = { round, target, timer: Number(m[2]), at: performance.now() };
          const timer =
            m[2] === 'hidden' && clock?.round === round
              ? clock.timer + (performance.now() - clock.at) / 1000
              : Number(m[2]);
          if (round !== lastRound && timer >= target - 0.008) {
            press(' ');
            lastRound = round;
          }
        }
      } else if (text.startsWith('Current floor')) {
        const m = /Current floor ([\d.]+)\. Hit floor (\d+)/.exec(text);
        if (m && Number(m[2]) !== lastFloor && Math.abs(Number(m[1]) - Number(m[2])) <= 0.05) {
          press(' ');
          lastFloor = Number(m[2]);
        }
      } else if (text.startsWith('Car in lane')) {
        const current = Number(/Car in lane (\d+)/.exec(text)?.[1]);
        const hazards = (/Potholes approaching in lanes ([\d, ]+)/.exec(text)?.[1] ?? '')
          .split(',')
          .map(Number);
        if (hazards.includes(current)) {
          const next = [1, 2, 3]
            .filter((n) => !hazards.includes(n))
            .sort((a, b) => Math.abs(a - current) - Math.abs(b - current))[0];
          if (next) press(next < current ? 'ArrowLeft' : 'ArrowRight');
        }
      }
    }, 20);
  });
}

for (const id of ids)
  test(`signature: daily, Encore, mastery and retry ${id}`, async ({ page }, info) => {
    test.setTimeout(240000);
    const mobile = info.project.name === 'mobile-chrome';
    await page.setViewportSize(mobile ? { width: 390, height: 844 } : { width: 1440, height: 900 });
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto('/?e2e=1');
    await page.getByLabel('Dev game launcher').selectOption(id);
    await page.locator('.giant-play').click();
    await expect(page.getByRole('button', { name: /^Encore/ })).toHaveCount(0);
    await page.locator('.game-start-button').click();
    await expect(page.getByRole('button', { name: 'Pause', exact: true })).toBeVisible();
    for (const mode of ['daily', 'encore']) {
      await playVisibleProblem(page);
      for (let frame = 0; frame < 3; frame++) {
        await page.waitForTimeout(900);
        await page.screenshot({
          path: `screenshots/milestone-2.5/${info.project.name}-${id}-${mode}-motion-${frame}.png`,
        });
      }
      await expect(page.locator('.result-grade')).toBeVisible({ timeout: 90000 });
      const grade = await page.locator('.result-grade').getAttribute('data-grade');
      console.log(
        'SIGNATURE_RUN',
        JSON.stringify({
          id,
          mode,
          project: info.project.name,
          grade,
          result: await page.locator('.result-verdict').innerText(),
        }),
      );
      await expect(page.locator('.medal-strip li[data-earned="true"]').first()).toBeVisible();
      await page.screenshot({
        path: `screenshots/milestone-2.5/${info.project.name}-${id}-${mode}-result.png`,
        fullPage: true,
      });
      const download = page.waitForEvent('download');
      await page.getByRole('button', { name: 'Save card', exact: true }).click();
      await (
        await download
      ).saveAs(`screenshots/milestone-2.5/${info.project.name}-${id}-${mode}-share.png`);
      if (mode === 'daily') {
        await expect(page.getByRole('button', { name: /^Encore/ })).toBeVisible();
        await page.getByRole('button', { name: /^Encore/ }).click();
        await expect(page.getByRole('button', { name: 'Pause', exact: true })).toBeVisible();
      }
    }
    const start = Date.now();
    await page.getByRole('button', { name: /^Retry/ }).click();
    await expect(page.getByRole('button', { name: 'Pause', exact: true })).toBeVisible();
    console.log('RETRY_MS', id, info.project.name, Date.now() - start);
    await page.getByRole('button', { name: 'Pause', exact: true }).click();
    await page.getByRole('button', { name: 'End run', exact: true }).click();
    await expect(
      page.getByRole('region', { name: 'Daily Deck on this device' }).locator('li'),
    ).toHaveCount(1);
    await page.reload();
    await page.getByLabel('Dev game launcher').selectOption(id);
    await expect(
      page.getByRole('region', { name: 'Daily Deck on this device' }).locator('li'),
    ).toHaveCount(1);
    expect(errors).toEqual([]);
  });

test('signature four-size layout, reduced motion and quick failures', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop-chrome');
  test.setTimeout(300000);
  for (const [width, height] of [
    [1440, 900],
    [1280, 720],
    [390, 844],
    [360, 800],
  ]) {
    await page.setViewportSize({ width: width!, height: height! });
    await page.emulateMedia({ reducedMotion: width === 360 ? 'reduce' : 'no-preference' });
    for (const id of ids) {
      await page.goto('/?e2e=1');
      await page.getByLabel('Dev game launcher').selectOption(id);
      await page.locator('.giant-play').click();
      await page.locator('.game-start-button').click();
      await expect(page.getByRole('button', { name: 'Pause', exact: true })).toBeVisible();
      await page.waitForTimeout(600);
      await expect(page.locator('h1')).toHaveCount(1);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      expect(
        await page
          .locator('.game-stage')
          .evaluate((el) => el.getBoundingClientRect().bottom <= innerHeight + 1),
      ).toBe(true);
      if (width === 360)
        await expect(page.locator('.game-stage')).toHaveCSS('animation-name', 'none');
      await page.screenshot({ path: `screenshots/milestone-2.5/${width}-${id}-game.png` });
      await page.getByRole('button', { name: 'Finish demo run', exact: true }).click();
      await expect(page.getByRole('button', { name: /^Retry/ })).toBeVisible();
      await page.screenshot({
        path: `screenshots/milestone-2.5/${width}-${id}-result.png`,
        fullPage: true,
      });
    }
  }
});
