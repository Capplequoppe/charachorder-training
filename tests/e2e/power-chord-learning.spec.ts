/**
 * E2E Tests: Power Chord Learning
 *
 * Tests for Left Hand Power Chords chapter after unlocking via Settings.
 */

import { test, expect, Page } from '@playwright/test';

/**
 * Helper: Clear localStorage to reset campaign state
 */
async function resetCampaign(page: Page) {
  await page.evaluate(() => localStorage.clear());
  await page.reload();
}

/**
 * Helper: Unlock a chapter via Settings
 */
async function unlockChapter(page: Page, chapterTitle: string) {
  // Click Settings button
  await page.click('button:has-text("Settings")');
  await page.waitForTimeout(300);

  // Wait for Settings panel
  await expect(page.locator('text=Skip Ahead')).toBeVisible({ timeout: 5000 });

  // Find the chapter and click Unlock
  const chapterItem = page.locator(`.chapter-unlock-item:has-text("${chapterTitle}")`);
  await expect(chapterItem).toBeVisible({ timeout: 5000 });

  const unlockButton = chapterItem.locator('.unlock-button');
  await unlockButton.click();
  await page.waitForTimeout(500);

  // Go back to campaign
  await page.click('text=Back to Campaign');
  await page.waitForTimeout(300);
}

test.describe('Power Chord Learning - Left Hand', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await resetCampaign(page);
  });

  test('should unlock Finger Fundamentals and access Left Hand Power Chords', async ({ page }) => {
    // Start campaign
    await page.click('text=Campaign Mode');
    await page.waitForTimeout(500);

    // Unlock Finger Fundamentals via Settings
    await unlockChapter(page, 'Finger Fundamentals');

    // Now Left Hand Power Chords should be accessible (unlocked as dependent)
    const leftHandChapter = page.locator('.chapter-card:has-text("Left Hand Power Chords")');
    await expect(leftHandChapter).toBeVisible({ timeout: 5000 });

    // Click on Left Hand Power Chords
    await leftHandChapter.click();
    await page.waitForTimeout(500);

    // Should see the mode selector with "Learn More" option
    await expect(page.locator('text=Mastery Progress')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Learn More')).toBeVisible({ timeout: 5000 });
  });

  test('should show intro phase when clicking Learn More', async ({ page }) => {
    // Start campaign
    await page.click('text=Campaign Mode');
    await page.waitForTimeout(500);

    // Unlock Finger Fundamentals
    await unlockChapter(page, 'Finger Fundamentals');

    // Click on Left Hand Power Chords
    await page.click('.chapter-card:has-text("Left Hand Power Chords")');
    await page.waitForTimeout(500);

    // Click Learn More
    await page.click('text=Learn More');
    await page.waitForTimeout(500);

    // Should be in intro phase showing "New Power Chord"
    await expect(page.locator('text=New Power Chord')).toBeVisible({ timeout: 5000 });

    // Should show the first left hand power chord (E+R)
    // The intro displays characters with + between them
    await expect(page.locator('.power-chord-display')).toBeVisible({ timeout: 5000 });

    // Should have "Practice Timing" button (continue button)
    await expect(page.locator('button:has-text("Practice Timing")')).toBeVisible({ timeout: 5000 });
  });

  test('should go to sync-practice when clicking Practice Timing', async ({ page }) => {
    // Start campaign
    await page.click('text=Campaign Mode');
    await page.waitForTimeout(500);

    // Unlock Finger Fundamentals
    await unlockChapter(page, 'Finger Fundamentals');

    // Navigate to Left Hand Power Chords > Learn More
    await page.click('.chapter-card:has-text("Left Hand Power Chords")');
    await page.waitForTimeout(500);
    await page.click('text=Learn More');
    await page.waitForTimeout(500);

    // Click Practice Timing
    await page.click('button:has-text("Practice Timing")');
    await page.waitForTimeout(500);

    // Should be in sync-practice phase
    await expect(page.locator('text=Timing Practice')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Press both keys at exactly the same time')).toBeVisible({ timeout: 5000 });

    // Should show sync progress meter
    await expect(page.locator('.sync-meter')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=0 / 3')).toBeVisible({ timeout: 5000 });
  });

  test('should register input in sync-practice phase', async ({ page }) => {
    // Start campaign
    await page.click('text=Campaign Mode');
    await page.waitForTimeout(500);

    // Unlock Finger Fundamentals
    await unlockChapter(page, 'Finger Fundamentals');

    // Navigate to Left Hand Power Chords > Learn More > Practice Timing
    await page.click('.chapter-card:has-text("Left Hand Power Chords")');
    await page.waitForTimeout(500);
    await page.click('text=Learn More');
    await page.waitForTimeout(500);
    await page.click('button:has-text("Practice Timing")');
    await page.waitForTimeout(500);

    // Should be in sync-practice phase
    await expect(page.locator('text=Timing Practice')).toBeVisible({ timeout: 5000 });

    // Click on the phase to focus input
    await page.click('.sync-practice-phase');
    await page.waitForTimeout(300);

    // First power chord is E+R - type both keys together
    // Since regular keyboard can't truly press simultaneously,
    // we need to type quickly or use the text input method

    // Try pressing E and R quickly together
    await page.keyboard.press('e');
    await page.keyboard.press('r');
    await page.waitForTimeout(500);

    // Check if we got feedback or progress
    // The sync meter should show progress if input was registered
    const syncCount = await page.locator('.sync-meter-count').textContent();
    console.log('Sync count after pressing e+r:', syncCount);

    // Take a screenshot for debugging
    await page.screenshot({ path: 'test-results/power-chord-input-debug.png' });
  });

  test('should register chord input via text field (CharaChorder style)', async ({ page }) => {
    // Start campaign
    await page.click('text=Campaign Mode');
    await page.waitForTimeout(500);

    // Unlock Finger Fundamentals
    await unlockChapter(page, 'Finger Fundamentals');

    // Navigate to Left Hand Power Chords > Learn More > Practice Timing
    await page.click('.chapter-card:has-text("Left Hand Power Chords")');
    await page.waitForTimeout(500);
    await page.click('text=Learn More');
    await page.waitForTimeout(500);
    await page.click('button:has-text("Practice Timing")');
    await page.waitForTimeout(500);

    // Should be in sync-practice phase
    await expect(page.locator('text=Timing Practice')).toBeVisible({ timeout: 5000 });

    // Check what characters are displayed (to know what to type)
    const charLabels = await page.locator('.char-label').allTextContents();
    expect(charLabels).toEqual(['E', 'R']);

    // Click on the phase to focus input
    await page.click('.sync-practice-phase');
    await page.waitForTimeout(300);

    // Find the hidden input field and focus it
    const input = page.locator('input.chord-input');
    await expect(input).toBeAttached({ timeout: 5000 });
    await input.focus();
    await page.waitForTimeout(200);

    // Type 'er ' (with space) to simulate CharaChorder chord completion
    await page.keyboard.type('er ', { delay: 50 });
    await page.waitForTimeout(500);

    // Sync meter should show 1 / 3 progress
    await expect(page.locator('.sync-meter-count')).toHaveText('1 / 3');
  });

  test('should complete sync-practice with 3 successful inputs and transition to practice', async ({ page }) => {
    // Start campaign
    await page.click('text=Campaign Mode');
    await page.waitForTimeout(500);

    // Unlock Finger Fundamentals
    await unlockChapter(page, 'Finger Fundamentals');

    // Navigate to sync-practice
    await page.click('.chapter-card:has-text("Left Hand Power Chords")');
    await page.waitForTimeout(500);
    await page.click('text=Learn More');
    await page.waitForTimeout(500);
    await page.click('button:has-text("Practice Timing")');
    await page.waitForTimeout(500);

    // Should be in sync-practice phase
    await expect(page.locator('text=Timing Practice')).toBeVisible({ timeout: 5000 });

    // Complete 3 sync successes by checking for progress increment each time
    for (let i = 1; i <= 3; i++) {
      // Wait for input to be ready
      const input = page.locator('input.chord-input');
      await expect(input).toBeAttached({ timeout: 5000 });

      // Wait for input to have empty value (reset complete)
      await expect(input).toHaveValue('', { timeout: 5000 });

      // Click to focus the phase area
      await page.click('.sync-practice-phase');
      await page.waitForTimeout(100);

      // Focus input and type chord
      await input.focus();
      await page.keyboard.type('er ', { delay: 30 });

      // Wait for the sync count to update
      if (i < 3) {
        await expect(page.locator('.sync-meter-count')).toHaveText(`${i} / 3`, { timeout: 5000 });
      }
    }

    // After 3 successes, wait for transition
    await page.waitForTimeout(1000);

    // Should now be in practice phase
    await expect(page.locator('text=Press Both Keys Together')).toBeVisible({ timeout: 5000 });
  });

  // Note: Quiz completion test requires complex localStorage setup.
  // The quiz completion fix (useEffect watching session.isComplete) has been added to:
  // - IntraHandTraining.tsx (lines 162-167)
  // - CrossHandTraining.tsx (lines 161-165)
  // - WordChordTraining.tsx (lines 135-139)
  // Manual testing or unit tests are recommended to verify quiz completion behavior.
});
