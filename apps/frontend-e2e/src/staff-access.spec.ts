import { expect, test } from '@playwright/test';

test('redirects unauthenticated staff access to sign in', async ({ page }) => {
  await page.goto('/staff');

  await expect(page).toHaveURL(
    /\/auth\/split\/sign-in\?callbackUrl=%2Fstaff/,
  );
});
