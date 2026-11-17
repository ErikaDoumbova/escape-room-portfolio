import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

// M0 acceptance (handoff §17): the name shows in Lora on the canvas colour,
// and a hard refresh on a room URL does not 404.

const CANVAS = 'rgb(246, 238, 223)'; // --color-canvas #F6EEDF

async function expectHelloHouse(page: Page) {
  const name = page.getByRole('heading', { level: 1, name: 'Erika Doumbova' });
  await expect(name).toBeVisible();
  await expect(name).toHaveCSS('font-family', /Lora/);
  await expect.poll(() => page.evaluate(() => document.fonts.check('600 48px Lora'))).toBe(true);
  await expect(page.locator('body')).toHaveCSS('background-color', CANVAS);
}

test('home page shows the name in Lora on the canvas colour', async ({ page }) => {
  const response = await page.goto('./');
  expect(response?.status()).toBe(200);
  await expectHelloHouse(page);
  await expect(page).toHaveTitle('Erika Doumbova · graphic designer & content creator');
});

for (const room of ['living-room', 'bedroom', 'kitchen']) {
  test(`hard navigation to /${room} is served (no 404)`, async ({ page }) => {
    const response = await page.goto(`./${room}`);
    expect(response?.status()).toBe(200);
    expect(new URL(page.url()).pathname).toMatch(new RegExp(`/${room}/?$`));
    await expectHelloHouse(page);
  });
}

test('/tour is served (no 404)', async ({ page }) => {
  const response = await page.goto('./tour');
  expect(response?.status()).toBe(200);
});

test('unknown paths boot the app and redirect to the front door', async ({ page, baseURL }) => {
  const response = await page.goto('./does-not-exist');
  expect(response?.status()).toBe(404); // GitHub Pages serves 404.html, which boots the app
  const home = new URL(baseURL!).pathname.replace(/\/$/, '');
  await expect.poll(() => new URL(page.url()).pathname.replace(/\/$/, '')).toBe(home);
  await expectHelloHouse(page);
});

test('no third-party requests on initial load', async ({ page, baseURL }) => {
  const origin = new URL(baseURL!).origin;
  const requests: string[] = [];
  page.on('request', (req) => requests.push(req.url()));
  await page.goto('./');
  await page.waitForLoadState('networkidle');
  const external = requests.filter((u) => !u.startsWith(origin) && !u.startsWith('data:'));
  expect(external).toEqual([]);
});

test('no serious or critical accessibility violations', async ({ page }) => {
  await page.goto('./');
  await expectHelloHouse(page);
  const results = await new AxeBuilder({ page }).analyze();
  const blocking = results.violations.filter(
    (v) => v.impact === 'serious' || v.impact === 'critical',
  );
  expect(blocking, JSON.stringify(blocking, null, 2)).toEqual([]);
});
