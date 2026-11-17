import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

import bedroom from '../../content/rooms/bedroom.json' with { type: 'json' };
import front from '../../content/rooms/front.json' with { type: 'json' };
import kitchen from '../../content/rooms/kitchen.json' with { type: 'json' };
import livingRoom from '../../content/rooms/living-room.json' with { type: 'json' };

// M2 acceptance (handoff §17, §18.1): every object opens and closes with the
// zoom, deep links work, Esc closes, focus is trapped and returns to the pin.

type RoomJson = {
  id: string;
  objects: { id: string; enabled?: boolean; special?: string; title: { en: string } }[];
};
const rooms = [front, livingRoom, bedroom, kitchen] as RoomJson[];
const roomPath = (id: string) => (id === 'front' ? './' : `./${id}`);
const closeUp = (page: Page) => page.getByTestId('closeup');

async function waitForRoom(page: Page, roomId: string) {
  await expect(page.locator(`main [data-room="${roomId}"]`)).toHaveCount(1);
  await expect(page.locator('main [data-room]')).toHaveCount(1);
}

for (const room of rooms) {
  const objects = room.objects.filter((o) => o.enabled !== false && !o.special);
  test(`every object in the ${room.id} opens, zooms, and closes back to its pin`, async ({
    page,
  }) => {
    await page.goto(roomPath(room.id));
    await waitForRoom(page, room.id);
    const scene = page.locator(`[data-room="${room.id}"]`);

    for (const obj of objects) {
      const pin = page.locator(`[data-room="${room.id}"] [data-object="${obj.id}"]`);
      await pin.click();
      await expect(page).toHaveURL(new RegExp(`/${room.id}/${obj.id}$`));
      const dialog = closeUp(page);
      await expect(dialog).toBeVisible();
      await expect(dialog.getByRole('heading', { level: 2 })).toHaveText(obj.title.en);
      await expect(dialog.getByRole('heading', { level: 2 })).toBeFocused();
      await expect(scene).toHaveAttribute('style', /scale\(/); // camera zoomed in

      await page.keyboard.press('Escape');
      await expect(dialog).toBeHidden();
      await expect(page).not.toHaveURL(new RegExp(`/${obj.id}/?$`));
      if (room.id !== 'front') await expect(page).toHaveURL(new RegExp(`/${room.id}/?$`));
      await expect(pin).toBeFocused();
      await expect(pin).toHaveAttribute('data-visited', 'true');
    }
  });
}

test('an object deep link opens its close-up on a hard load', async ({ page }) => {
  const response = await page.goto('./kitchen/stuffed-peppers');
  expect(response?.status()).toBe(200);
  const dialog = closeUp(page);
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('heading', { level: 2 })).toHaveText(
    'Пълнени чушки — stuffed peppers',
  );
  await expect(dialog.getByTestId('recipe')).toBeVisible();
  await expect(dialog.getByText('500 g minced meat (pork and beef mix)')).toBeVisible();
});

test('the close-up keeps keyboard focus inside', async ({ page }) => {
  await page.goto('./front/mailbox');
  const dialog = closeUp(page);
  await expect(dialog.getByRole('heading', { level: 2 })).toBeFocused();
  for (let i = 0; i < 12; i++) {
    await page.keyboard.press('Tab');
    const inside = await dialog.evaluate((el) => el.contains(document.activeElement));
    expect(inside).toBe(true);
  }
  for (let i = 0; i < 4; i++) {
    await page.keyboard.press('Shift+Tab');
    const inside = await dialog.evaluate((el) => el.contains(document.activeElement));
    expect(inside).toBe(true);
  }
});

test('previous / next move through the room, and back closes again', async ({ page }) => {
  await page.goto('./bedroom');
  await waitForRoom(page, 'bedroom');
  await page.locator('[data-object="shawn-poster"]').click();
  const dialog = closeUp(page);
  await expect(dialog.getByRole('heading', { level: 2 })).toHaveText('My favourite artist');

  await dialog.getByRole('button', { name: 'Next in this room' }).click();
  await expect(page).toHaveURL(/\/bedroom\/headphones$/);
  await expect(dialog.getByRole('heading', { level: 2 })).toHaveText('Always listening');
  await dialog.getByRole('button', { name: 'Previous' }).click();
  await expect(dialog.getByRole('heading', { level: 2 })).toHaveText('My favourite artist');

  await page.goBack();
  await expect(page).toHaveURL(/\/bedroom\/headphones$/);
  await page.goBack();
  await expect(page).toHaveURL(/\/bedroom\/shawn-poster$/);
  await page.goBack();
  await expect(page).toHaveURL(/\/bedroom\/?$/);
  await expect(dialog).toBeHidden();
});

test('no Spotify iframe is loaded until the visitor asks', async ({ page }) => {
  const requests: string[] = [];
  page.on('request', (r) => requests.push(r.url()));
  await page.goto('./bedroom/shawn-poster');
  const dialog = closeUp(page);
  await expect(dialog).toBeVisible();
  await expect(page.locator('iframe')).toHaveCount(0);
  // The playlist isn't set yet (PLACEHOLDER), so the card says it's coming soon.
  await expect(dialog.getByText('Playlist coming soon')).toBeVisible();
  expect(requests.filter((u) => u.includes('spotify'))).toEqual([]);
});

test('images open in a lightbox that Esc closes, returning to the close-up', async ({ page }) => {
  await page.goto('./living-room/sketchbook');
  const dialog = closeUp(page);
  await expect(dialog).toBeVisible();
  await dialog
    .getByRole('button', { name: /^Enlarge image/ })
    .nth(1)
    .click();
  const lightbox = page.locator('dialog[open]');
  await expect(lightbox).toBeVisible();
  await expect(lightbox.locator('figcaption')).toContainText('2 of 4');
  await page.keyboard.press('ArrowRight');
  await expect(lightbox.locator('figcaption')).toContainText('3 of 4');

  await page.keyboard.press('Escape');
  await expect(lightbox).toBeHidden();
  await expect(dialog).toBeVisible(); // only the lightbox closed
  await expect(dialog.getByRole('button', { name: /^Enlarge image/ }).nth(1)).toBeFocused();
});

test('printing the recipe prints only the recipe', async ({ page }) => {
  await page.goto('./kitchen/stuffed-peppers');
  const dialog = closeUp(page);
  await expect(dialog.getByTestId('recipe')).toBeVisible();
  await page.evaluate(() => {
    window.print = () => {
      (window as unknown as { printed: string }).printed =
        document.querySelector('.print-root')?.textContent ?? '';
    };
  });
  await dialog.getByRole('button', { name: 'Print recipe' }).click();
  const printed = await page.evaluate(() => (window as unknown as { printed: string }).printed);
  expect(printed).toContain('Ingredients');
  expect(printed).toContain('Whisk the yogurt, egg and flour');

  await page.emulateMedia({ media: 'print' });
  await expect(page.locator('#root')).toBeHidden();
  await expect(page.locator('.print-root')).toBeVisible();
});

test('the rooftop terrace cycles the lighting instead of opening a close-up', async ({ page }) => {
  await page.goto('./');
  await waitForRoom(page, 'front');
  await page.getByRole('button', { name: 'Rooftop terrace: Lighting' }).click();
  await expect(page.getByText("I'm a night person, honestly. Click me again.")).toBeVisible();
  await expect(closeUp(page)).toHaveCount(0);
  await expect(page).toHaveURL(/\/$/);
});

test('desktop: clicking the room outside the panel closes the close-up', async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, 'desktop-only behaviour; phones use the scrim or the handle');
  await page.goto('./kitchen/nevsky-magnet');
  const dialog = closeUp(page);
  await expect(dialog).toBeVisible();
  await page.mouse.click(120, 450);
  await expect(dialog).toBeHidden();
  await expect(page).toHaveURL(/\/kitchen\/?$/);
});

test('phones: tapping the scrim closes the bottom sheet', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'phone-only behaviour');
  await page.goto('./kitchen/nevsky-magnet');
  const dialog = closeUp(page);
  await expect(dialog).toBeVisible();
  await page.mouse.click(195, 120);
  await expect(dialog).toBeHidden();
});

test('no serious accessibility violations with a close-up open', async ({ page }) => {
  await page.goto('./kitchen/stuffed-peppers');
  await expect(closeUp(page).getByTestId('recipe')).toBeVisible();
  const results = await new AxeBuilder({ page }).analyze();
  const blocking = results.violations.filter(
    (v) => v.impact === 'serious' || v.impact === 'critical',
  );
  expect(blocking, JSON.stringify(blocking, null, 2)).toEqual([]);
});

test('with reduced motion the room stays put and the panel just fades in', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('./kitchen');
  await waitForRoom(page, 'kitchen');
  await page.locator('[data-object="stuffed-peppers"]').click();
  await expect(closeUp(page)).toBeVisible();
  await page.waitForTimeout(300);
  await expect(page.locator('[data-room="kitchen"]')).not.toHaveAttribute('style', /scale\(/);
});
