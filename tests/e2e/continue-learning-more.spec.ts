/**
 * E2E Tests: Continue Learning More Feature
 *
 * Tests the "Continue Learning More" button functionality in campaign mode.
 * Uses Left Hand Power Chords chapter as the test case.
 */

import { test, expect, Page } from '@playwright/test';

// Increase timeout for these tests since they involve multiple learning phases
test.setTimeout(90000);

// ============================================================================
// Shared Helper Functions
// ============================================================================

/**
 * Helper: Dismiss any visible tip modal
 */
async function dismissTipModal(page: Page) {
  // Check for tip modal overlay
  const tipModal = page.locator('.tip-modal-overlay');
  if (await tipModal.isVisible({ timeout: 1000 }).catch(() => false)) {
    await page.waitForTimeout(200);
    // Try "Got it!" button first (common on tip modals)
    const gotItButton = page.locator('button:has-text("Got it!")');
    if (await gotItButton.isVisible({ timeout: 500 }).catch(() => false)) {
      await gotItButton.click();
      await page.waitForTimeout(300);
      return;
    }
    // Try close button
    const closeButton = page.locator('.tip-modal-close');
    if (await closeButton.isVisible({ timeout: 500 }).catch(() => false)) {
      await closeButton.click();
      await page.waitForTimeout(300);
      return;
    }
    // Fallback to Escape key
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
  }
}

/**
 * Helper: Dismiss all tip modals (loop until none remain)
 */
async function dismissAllTipModals(page: Page) {
  for (let i = 0; i < 5; i++) {
    await dismissTipModal(page);
    const tipModal = page.locator('.tip-modal-overlay');
    if (!(await tipModal.isVisible({ timeout: 300 }).catch(() => false))) {
      break;
    }
  }
}

/**
 * Helper: Clear localStorage and reload to reset campaign state
 */
async function resetCampaign(page: Page) {
  await page.evaluate(() => localStorage.clear());
  await page.reload();
}

/**
 * Helper: Unlock a chapter via Settings
 */
async function unlockChapter(page: Page, chapterTitle: string) {
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

/**
 * Helper: Complete one sync practice cycle (type chord 3 times)
 */
async function completeSyncPractice(page: Page, chord: string) {
  await expect(page.locator('text=Sync Practice')).toBeVisible({ timeout: 5000 });

  for (let i = 1; i <= 3; i++) {
    const input = page.locator('input.chord-input');
    await expect(input).toBeAttached({ timeout: 5000 });
    await expect(input).toHaveValue('', { timeout: 5000 });

    await page.click('.sync-practice-phase');
    await page.waitForTimeout(100);
    await input.focus();
    await page.keyboard.type(`${chord} `, { delay: 30 });

    if (i < 3) {
      await expect(page.locator('.sync-meter-count')).toHaveText(`${i} / 3`, { timeout: 5000 });
    }
  }
  await page.waitForTimeout(1000);
}

/**
 * Helper: Complete practice phase (type chord 5 times)
 */
async function completePracticePhase(page: Page, chord: string) {
  await expect(page.locator('text=Press Both Keys Together')).toBeVisible({ timeout: 10000 });

  for (let i = 0; i < 5; i++) {
    const input = page.locator('input.chord-input');
    await expect(input).toBeAttached({ timeout: 5000 });
    await expect(input).toHaveValue('', { timeout: 5000 });

    await page.click('.training-phase');
    await page.waitForTimeout(100);
    await input.focus();
    await page.keyboard.type(`${chord} `, { delay: 30 });
    await page.waitForTimeout(300);
  }
}

// ============================================================================
// Test Suite
// ============================================================================

test.describe('Continue Learning More - Left Hand Power Chords', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await resetCampaign(page);
  });

  test('should complete one power chord and see Continue Learning More button or auto-advance to next chord', async ({ page }) => {
    // Start campaign
    await page.click('text=Campaign Mode');
    await page.waitForTimeout(500);
    await dismissAllTipModals(page);

    // Unlock Finger Fundamentals via Settings
    await unlockChapter(page, 'Finger Fundamentals');

    // Click on Left Hand Power Chords
    await page.click('.chapter-card:has-text("Left Hand Power Chords")');
    await page.waitForTimeout(500);

    // Click Learn More to start learning
    await page.click('text=Learn More');
    await page.waitForTimeout(500);
    await dismissAllTipModals(page);

    // Verify we're on intro screen showing first chord (E+R)
    await expect(page.locator('text=New Power Chord')).toBeVisible({ timeout: 5000 });
    await dismissAllTipModals(page);

    // Verify it shows E and R characters
    const charLabels = await page.locator('.power-chord-display .character').allTextContents();
    expect(charLabels).toEqual(['E', 'R']);

    // Click Start Practice - dismiss any modal first
    await dismissAllTipModals(page);
    await page.click('button:has-text("Start Practice")');
    await page.waitForTimeout(500);
    await dismissAllTipModals(page);

    // Complete sync practice (3 times) with E+R chord
    await completeSyncPractice(page, 'er');

    // Complete practice phase (5 times)
    await completePracticePhase(page, 'er');

    // After completion, we should either:
    // 1. See "Training Complete!" with "Continue Learning More" button, OR
    // 2. Auto-advance to next chord (O+R) if Enter key was triggered

    // Try to catch the completion screen
    const sawCompletion = await page.locator('text=Training Complete!').isVisible({ timeout: 3000 }).catch(() => false);

    if (sawCompletion) {
      // Verify the Continue Learning More button is present
      await expect(page.locator('text=Continue Learning More')).toBeVisible({ timeout: 2000 });
      await expect(page.locator('.continue-learn-more-message')).toContainText('more item');

      // Click it to advance
      await page.click('text=Continue Learning More');
      await page.waitForTimeout(500);
    }

    // Now we should be on the next chord (O+R)
    await expect(page.locator('text=New Power Chord')).toBeVisible({ timeout: 5000 });

    // Verify it's a different chord (O+R, not E+R)
    const newCharLabels = await page.locator('.power-chord-display .character').allTextContents();
    expect(newCharLabels).not.toEqual(['E', 'R']);
  });

  test('should show progress indicator when completing multiple power chords', async ({ page }) => {
    // Start campaign
    await page.click('text=Campaign Mode');
    await page.waitForTimeout(500);
    await dismissAllTipModals(page);

    // Unlock Finger Fundamentals
    await unlockChapter(page, 'Finger Fundamentals');

    // Go to Left Hand Power Chords
    await page.click('.chapter-card:has-text("Left Hand Power Chords")');
    await page.waitForTimeout(500);
    await page.click('text=Learn More');
    await page.waitForTimeout(500);
    await dismissAllTipModals(page);

    // Verify progress indicator shows "1 / 5" for first chord
    await expect(page.locator('text=1 / 5')).toBeVisible({ timeout: 5000 });
    await dismissAllTipModals(page);

    // Complete first chord (E+R) - dismiss any modal first
    await dismissAllTipModals(page);
    await page.click('button:has-text("Start Practice")');
    await page.waitForTimeout(500);
    await dismissAllTipModals(page);
    await completeSyncPractice(page, 'er');
    await completePracticePhase(page, 'er');

    // Wait for transition to next chord or completion screen
    await page.waitForTimeout(1000);

    // Either click Continue Learning More or wait for auto-advance
    const continueBtn = page.locator('text=Continue Learning More');
    if (await continueBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await continueBtn.click();
      await page.waitForTimeout(500);
    }

    // Now on second chord - verify progress shows "2 / 5"
    await expect(page.locator('text=2 / 5')).toBeVisible({ timeout: 5000 });
  });
});
