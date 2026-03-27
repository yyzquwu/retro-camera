import { test, expect } from '@playwright/test';

test.use({
  // Grant camera permissions to bypass prompt
  permissions: ['camera'],
});

test('capture screenshots of landing and studio', async ({ page }) => {
  // Mock camera API to avoid failures
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'mediaDevices', {
      value: {
        getUserMedia: async () => ({
          getTracks: () => [{ stop: () => {} }],
        }),
      },
    });
  });

  // Start dev server in background if not already running is hard here,
  // so we'll assume the user is right and try to build/preview instead.
  // Actually, I'll just run against the built version.
  await page.goto('http://localhost:5174');
  
  // Wait a bit for React to hydrate and animations to settle
  await page.waitForTimeout(3000);
  
  // Take landing page screenshot
  await page.screenshot({ path: 'landing-page.png', fullPage: true });

  // Navigate to studio
  await page.goto('http://localhost:5174/#studio');
  await page.waitForTimeout(3000);

  // Take studio page screenshot
  await page.screenshot({ path: 'studio-page.png', fullPage: true });
});
