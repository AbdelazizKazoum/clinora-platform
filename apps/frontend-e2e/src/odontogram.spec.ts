import { expect, test, type Page } from '@playwright/test';
import { encode } from 'next-auth/jwt';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const DEV_SESSION_COOKIE_NAME = 'clinora.session-token';
const E2E_CLINIC_ID = '10000000-0000-4000-8000-000000000001';

const FRONTEND_ENV_CANDIDATES = [
  join(process.cwd(), 'apps', 'frontend', '.env.local'),
  join(process.cwd(), '..', 'frontend', '.env.local'),
  join(process.cwd(), 'frontend', '.env.local'),
];

const readAuthSecret = (): string => {
  const fromEnvironment = process.env.AUTH_SECRET;
  if (fromEnvironment) {
    return fromEnvironment;
  }

  for (const candidate of FRONTEND_ENV_CANDIDATES) {
    try {
      const match = /^AUTH_SECRET=(.+)$/m.exec(
        readFileSync(candidate, 'utf8'),
      );

      if (match) {
        return match[1].trim();
      }
    } catch {
      // Try the next candidate location.
    }
  }

  throw new Error(
    'AUTH_SECRET is required to sign the e2e session cookie. Set it or provide apps/frontend/.env.local.',
  );
};

const signInAsDoctor = async (page: Page): Promise<void> => {
  const sessionToken = await encode({
    salt: DEV_SESSION_COOKIE_NAME,
    secret: readAuthSecret(),
    token: {
      sub: 'doctor-e2e',
      user: {
        clinicId: E2E_CLINIC_ID,
        email: 'doctor@clinora.test',
        fullName: 'Dr. E2E',
        id: 'doctor-e2e',
        role: 'doctor',
      },
    },
  });

  await page.context().addCookies([
    {
      domain: 'localhost',
      httpOnly: true,
      name: DEV_SESSION_COOKIE_NAME,
      path: '/',
      sameSite: 'Lax',
      value: sessionToken,
    },
  ]);
};

test('redirects unauthenticated /visits/new access to sign in', async ({
  page,
}) => {
  await page.goto('/visits/new');

  // /visits/new has no server-side proxy capability rule yet; RequireAuth
  // performs the client-side redirect without a callbackUrl.
  await expect(page).toHaveURL(/\/auth\/split\/sign-in$/);
});

test('renders the treatment odontogram and projects planned acts onto it', async ({
  page,
}) => {
  await signInAsDoctor(page);

  await page.goto('/visits/new');

  const chart = page.getByRole('listbox', {
    name: 'Patient treatment odontogram',
  });
  await expect(chart).toBeVisible();
  await expect(page.locator('[data-odontogram-tooth-option]')).toHaveCount(32);

  await expect(
    page
      .locator(
        '[data-odontogram-position="36"] [data-odontogram-appearance="planned"]',
      )
      .first(),
  ).toBeVisible();

  await page.getByRole('option', { name: 'Tooth 26' }).click();
  await expect(
    page.getByRole('heading', { name: 'Tooth 26' }),
  ).toBeVisible();

  await page.getByRole('option', { name: 'Tooth 26' }).press('ArrowRight');
  await expect(
    page.getByRole('heading', { name: 'Tooth 27' }),
  ).toBeVisible();

  await page.getByRole('button', { name: 'Plan treatment' }).click();
  await page.getByRole('button', { name: 'Plan treatment act' }).click();
  await expect(
    page.getByText(
      'Treatment act planned and projected on the odontogram where supported.',
    ),
  ).toBeVisible();

  await expect(
    page
      .locator(
        '[data-odontogram-position="27"] [data-odontogram-appearance="planned"]',
      )
      .first(),
  ).toBeVisible();
});