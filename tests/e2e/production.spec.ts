import { createServer } from 'node:http';
import { readFile, readdir } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
import { expect, test } from '@playwright/test';

test('production excludes tuning, experimental renderer and answer hints', async ({
  page,
}, info) => {
  const root = resolve('dist/client');
  const files = await readdir(resolve(root, 'assets'));
  const bundles = await Promise.all(
    files.filter((f) => f.endsWith('.js')).map((f) => readFile(resolve(root, 'assets', f), 'utf8')),
  );
  expect(bundles.join(' ')).not.toMatch(
    /Show tuning|Reset playtest data|Upcoming safe lane|pixi-laundry-pilot|samosa-defense|laundry-sort|dev-playtest-v1|retryDelayTotalMs|runsThisSession/,
  );
  const server = createServer((request, response) => {
    const pathname = new URL(request.url ?? '/', 'http://localhost').pathname;
    const file = resolve(root, `.${pathname === '/' ? '/index.html' : pathname}`);
    if (!file.startsWith(root)) {
      response.writeHead(403).end();
      return;
    }
    void readFile(file)
      .then((bytes) => {
        response.setHeader(
          'Content-Type',
          extname(file) === '.js'
            ? 'text/javascript'
            : extname(file) === '.css'
              ? 'text/css'
              : extname(file) === '.svg'
                ? 'image/svg+xml'
                : 'text/html',
        );
        response.end(bytes);
      })
      .catch(() => response.writeHead(404).end());
  });
  await new Promise<void>((resolveReady) => server.listen(0, '127.0.0.1', resolveReady));
  try {
    const address = server.address();
    if (!address || typeof address === 'string') throw new Error('No test server');
    await page.goto(`http://127.0.0.1:${address.port}/?e2e=1&pixi=1`);
    await expect(page.getByLabel('Dev game launcher')).toHaveCount(0);
    const load = await page.evaluate(() => {
      const navigation = performance.getEntriesByType(
        'navigation',
      )[0] as PerformanceNavigationTiming;
      return {
        loadMs: Math.round(navigation.domContentLoadedEventEnd),
        transferredBytes: performance
          .getEntriesByType('resource')
          .reduce((total, entry) => total + (entry as PerformanceResourceTiming).transferSize, 0),
      };
    });
    const start = Date.now();
    await page.locator('.giant-play').click();
    await page.locator('.game-start-button').click();
    await expect(page.getByRole('button', { name: 'Pause', exact: true })).toBeVisible();
    console.log(
      'PRODUCTION_LOAD',
      info.project.name,
      JSON.stringify({ ...load, startMs: Date.now() - start }),
    );
    await expect(page.locator('[data-renderer]')).toHaveCount(0);
    await expect(page.locator('.pixi-pilot-layer')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Show tuning' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Finish demo run' })).toHaveCount(0);
    await page.screenshot({
      path: `screenshots/milestone-2.5/legacy/production-${info.project.name}.png`,
    });
  } finally {
    await new Promise<void>((done, reject) =>
      server.close((error) => (error ? reject(error) : done())),
    );
  }
});
