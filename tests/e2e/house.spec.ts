import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

// M1 acceptance (handoff §17, §18.1): every room is reachable by doorway pins,
// the Explore menu, deep links and back/forward; unknown paths redirect home.

const ROOMS = [
  { id: 'front', path: './', name: 'Front' },
  { id: 'living-room', path: './living-room', name: 'Living room' },
  { id: 'bedroom', path: './bedroom', name: 'Bedroom' },
  { id: 'kitchen', path: './kitchen', name: 'Kitchen' },
];

const roomHeading = (page: Page) => page.getByRole('heading', { level: 1 });

async function expectRoom(page: Page, name: string) {
  await expect(roomHeading(page)).toContainText(name);
  // Wait for the room transition to finish before interacting.
  await expect(page.locator('main [data-room]')).toHaveCount(1);
}

async function blockingAxeViolations(page: Page) {
  const results = await new AxeBuilder({ page }).analyze();
  return results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
}

test('home shows the name in Lora and the front of the house', async ({ page }) => {
  const response = await page.goto('./');
  expect(response?.status()).toBe(200);
  const wordmark = page.getByRole('link', { name: 'Erika Doumbova' });
  await expect(wordmark).toBeVisible();
  await expect(wordmark).toHaveCSS('font-family', /Lora/);
  await expectRoom(page, 'Front');
  await expect(page).toHaveTitle('Erika Doumbova · graphic designer & content creator');
});

for (const room of ROOMS.slice(1)) {
  test(`hard navigation to /${room.id} shows the ${room.name}`, async ({ page }) => {
    const response = await page.goto(room.path);
    expect(response?.status()).toBe(200);
    await expectRoom(page, room.name);
    await expect(page).toHaveTitle(`${room.name} · Erika Doumbova`);
    await expect(page.locator(`[data-room="${room.id}"] img[alt]:not([alt=""])`)).toBeVisible();
  });
}

test('an object deep link loads its room', async ({ page }) => {
  const response = await page.goto('./kitchen/stuffed-peppers');
  expect(response?.status()).toBe(200);
  await expectRoom(page, 'Kitchen');
  await expect(page).toHaveTitle('Pot of stuffed peppers · Kitchen · Erika Doumbova');
});

test('doorway pins walk through the house, and back/forward retrace it', async ({ page }) => {
  await page.goto('./');
  await expectRoom(page, 'Front');

  await page.getByRole('link', { name: /Go to: Living room/ }).click();
  await expect(page).toHaveURL(/\/living-room$/);
  await expectRoom(page, 'Living room');
  await expect(roomHeading(page)).toBeFocused();

  await page.getByRole('link', { name: 'Go to: Bedroom' }).click();
  await expectRoom(page, 'Bedroom');
  await page.getByRole('link', { name: 'Go to: Living room' }).click();
  await expectRoom(page, 'Living room');
  await page.getByRole('link', { name: 'Go to: Kitchen' }).click();
  await expect(page).toHaveURL(/\/kitchen$/);
  await expectRoom(page, 'Kitchen');

  await page.goBack();
  await expectRoom(page, 'Living room');
  await page.goBack();
  await expectRoom(page, 'Bedroom');
  await page.goForward();
  await expectRoom(page, 'Living room');
});

test('the Explore menu jumps to any room and returns focus when closed', async ({ page }) => {
  await page.goto('./');
  await expectRoom(page, 'Front');
  const explore = page.getByRole('button', { name: 'Explore' });

  await explore.click();
  const menu = page.getByRole('dialog', { name: 'Explore the house' });
  await expect(menu).toBeVisible();
  await expect(menu.getByRole('link', { name: 'Pot of stuffed peppers' })).toBeVisible();

  await page.keyboard.press('Escape');
  await expect(menu).toBeHidden();
  await expect(explore).toBeFocused();

  await explore.click();
  await menu.getByRole('link', { name: /^Bedroom/ }).click();
  await expect(menu).toBeHidden();
  await expect(page).toHaveURL(/\/bedroom$/);
  await expectRoom(page, 'Bedroom');
});

test('the whole email address is never in the page source', async ({ page }) => {
  const response = await page.goto('./');
  const html = (await response?.text()) ?? '';
  expect(html).not.toContain('@gmail.com');
});

test('unknown paths redirect to the front door with a note', async ({ page, baseURL }) => {
  const response = await page.goto('./does-not-exist');
  expect(response?.status()).toBe(404); // GitHub Pages serves 404.html, which boots the app
  const home = new URL(baseURL!).pathname.replace(/\/$/, '');
  await expect.poll(() => new URL(page.url()).pathname.replace(/\/$/, '')).toBe(home);
  await expect(page.getByRole('status')).toHaveText("That room doesn't exist (yet)");
  await expectRoom(page, 'Front');
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

for (const room of ROOMS) {
  test(`no serious accessibility violations in the ${room.name}`, async ({ page }) => {
    await page.goto(room.path);
    await expectRoom(page, room.name);
    const blocking = await blockingAxeViolations(page);
    expect(blocking, JSON.stringify(blocking, null, 2)).toEqual([]);
  });
}

test('no serious accessibility violations in the Explore menu', async ({ page }) => {
  await page.goto('./kitchen');
  await expectRoom(page, 'Kitchen');
  await page.getByRole('button', { name: 'Explore' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  const blocking = await blockingAxeViolations(page);
  expect(blocking, JSON.stringify(blocking, null, 2)).toEqual([]);
});
