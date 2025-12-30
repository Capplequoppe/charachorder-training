/**
 * E2E Tests: Power Chord Session Refresh
 *
 * Tests that after completing a learn session, clicking "Back to Mode Selection"
 * or "Continue" returns to mode selector, and clicking "Learn More" again
 * introduces NEW power chords (not the same ones).
 *
 * NOTE: These tests are complex due to chord input simulation and multiple phases.
 * The core functionality has been verified through code review and manual testing.
 * See useTrainingSession.ts selectMode() for the fix that ensures items refresh.
 */

import { test, expect, Page } from '@playwright/test';

// Skip these tests by default as they require complex chord input simulation
// that doesn't work reliably in all environments
test.describe.configure({ mode: 'parallel' });

// Left hand power chord characters in frequency rank order (from powerChordConfig.ts)
const LEFT_HAND_POWER_CHORDS = [
  { chars: 'er', display: ['E', 'R'] },  // rank 1: her, were, very
  { chars: 'or', display: ['O', 'R'] },  // rank 2: or, for, more
  { chars: 'eo', display: ['E', 'O'] },  // rank 3: people, one
  { chars: 'ou', display: ['O', 'U'] },  // rank 4: you, out, our
  { chars: 'ei', display: ['E', 'I'] },  // rank 5: their, being
  { chars: 'ir', display: ['I', 'R'] },  // rank 6: first, girl
  { chars: 'io', display: ['I', 'O'] },  // rank 7: into
  { chars: 'ru', display: ['R', 'U'] },  // rank 8: true, run
  { chars: 'ew', display: ['E', 'W'] },  // rank 9: new, few, knew
  { chars: 'iu', display: ['I', 'U'] },  // rank 10: just
];

/**
 * Helper: Clear localStorage to reset campaign state
 */
async function resetCampaign(page: Page) {
  await page.evaluate(() => localStorage.clear());
  await page.reload();
}

/**
 * Helper: Dismiss any visible tip modal
 * Waits for the modal's event listeners to be registered (100ms delay in TipModal)
 */
async function dismissTipModal(page: Page) {
  const tipModal = page.locator('.tip-modal-overlay');
  if (await tipModal.isVisible({ timeout: 1000 }).catch(() => false)) {
    // Wait for the modal's event listeners to be registered (TipModal has 100ms delay)
    await page.waitForTimeout(200);
    // Click the close button which is safest
    const closeButton = page.locator('.tip-modal-close');
    if (await closeButton.isVisible({ timeout: 500 }).catch(() => false)) {
      await closeButton.click();
      await page.waitForTimeout(300);
    } else {
      // Fallback to Escape key
      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);
    }
  }
}

/**
 * Helper: Dismiss all tip modals (loop until none remain)
 */
async function dismissAllTipModals(page: Page) {
  for (let i = 0; i < 5; i++) {
    await dismissTipModal(page);
    // Check if modal is gone
    const tipModal = page.locator('.tip-modal-overlay');
    if (!(await tipModal.isVisible({ timeout: 300 }).catch(() => false))) {
      break;
    }
  }
}

/**
 * Helper: Unlock a chapter via Settings
 */
async function unlockChapter(page: Page, chapterTitle: string) {
  await page.click('button:has-text("Settings")');
  await page.waitForTimeout(300);

  await expect(page.locator('text=Skip Ahead')).toBeVisible({ timeout: 5000 });

  const chapterItem = page.locator(`.chapter-unlock-item:has-text("${chapterTitle}")`);
  await expect(chapterItem).toBeVisible({ timeout: 5000 });

  const unlockButton = chapterItem.locator('.unlock-button');
  await unlockButton.click();
  await page.waitForTimeout(500);

  await page.click('text=Back to Campaign');
  await page.waitForTimeout(300);
}

/**
 * Helper: Navigate to Left Hand Power Chords chapter
 */
async function goToLeftHandPowerChords(page: Page) {
  const leftHandChapter = page.locator('.chapter-card:has-text("Left Hand Power Chords")');
  await expect(leftHandChapter).toBeVisible({ timeout: 5000 });
  await leftHandChapter.click();
  await page.waitForTimeout(500);
}

/**
 * Helper: Get the currently displayed power chord characters from intro phase
 * In intro phase, characters are in .character.large elements
 */
async function getCurrentPowerChordChars(page: Page): Promise<string[]> {
  // In intro phase, characters are displayed in .character.large spans
  const charLabels = await page.locator('.power-chord-display .character.large').allTextContents();
  return charLabels.map(c => c.trim().toUpperCase());
}

/**
 * Helper: Complete sync-practice phase (3 successful chord inputs)
 */
async function completeSyncPractice(page: Page, chordChars: string) {
  await expect(page.locator('text=Sync Practice')).toBeVisible({ timeout: 5000 });

  for (let i = 1; i <= 3; i++) {
    const input = page.locator('input.chord-input');
    await expect(input).toBeAttached({ timeout: 5000 });
    await expect(input).toHaveValue('', { timeout: 5000 });

    await page.click('.sync-practice-phase');
    await page.waitForTimeout(100);

    await input.focus();
    await page.keyboard.type(chordChars + ' ', { delay: 30 });

    if (i < 3) {
      await expect(page.locator('.sync-meter-count')).toHaveText(`${i} / 3`, { timeout: 5000 });
    }
  }

  await page.waitForTimeout(800);
}

/**
 * Helper: Complete practice phase (5 successful chord inputs - the completion requirement)
 */
async function completePracticePhase(page: Page, chordChars: string) {
  // Practice phase title (may be partial match)
  await expect(page.locator('h2:has-text("Press Both Keys Together")')).toBeVisible({ timeout: 5000 });

  // Practice phase requires 5 successes to complete
  for (let i = 1; i <= 5; i++) {
    const input = page.locator('input.chord-input');
    await expect(input).toBeAttached({ timeout: 5000 });
    await expect(input).toHaveValue('', { timeout: 5000 });

    await page.click('.practice-phase');
    await page.waitForTimeout(100);

    await input.focus();
    await page.keyboard.type(chordChars + ' ', { delay: 30 });

    await page.waitForTimeout(600);
  }

  await page.waitForTimeout(500);
}

/**
 * Helper: Complete one full power chord (intro → sync → practice → next)
 * Handles the case where we might already be past certain phases.
 */
async function completeOnePowerChord(page: Page, chordChars: string) {
  // Dismiss any tip modals that might appear
  await dismissAllTipModals(page);

  // Check which phase we're in and handle accordingly
  const introPhase = page.locator('text=New Power Chord');
  const syncPhase = page.locator('text=Sync Practice');
  const practicePhase = page.locator('h2:has-text("Press Both Keys Together")');

  // If in intro phase, click to proceed
  if (await introPhase.isVisible({ timeout: 2000 }).catch(() => false)) {
    await dismissAllTipModals(page);
    await page.click('button:has-text("Start Practice")');
    await page.waitForTimeout(500);
  }

  // Dismiss any tips after clicking Start Practice
  await dismissAllTipModals(page);

  // If in sync-practice phase, complete it
  if (await syncPhase.isVisible({ timeout: 2000 }).catch(() => false)) {
    await completeSyncPractice(page, chordChars);
  }

  // Complete practice phase
  await expect(practicePhase).toBeVisible({ timeout: 10000 });
  await completePracticePhase(page, chordChars);
}

/**
 * Helper: Complete 5 power chords and reach the complete screen
 */
async function completeFivePowerChords(page: Page) {
  // Complete first 5 power chords
  for (let i = 0; i < 5; i++) {
    const chord = LEFT_HAND_POWER_CHORDS[i];
    await completeOnePowerChord(page, chord.chars);
  }

  // Should now see the complete screen
  await expect(page.locator('text=Training Complete!')).toBeVisible({ timeout: 15000 });
}

test.describe('Power Chord Session Refresh', () => {
  // Increase timeout for tests that complete multiple power chords
  test.setTimeout(120000);

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await resetCampaign(page);

    // Start campaign and unlock Finger Fundamentals
    await page.click('text=Campaign Mode');
    await page.waitForTimeout(500);

    // Dismiss any tip modals that appear
    await dismissAllTipModals(page);

    await unlockChapter(page, 'Finger Fundamentals');
  });

  test('should show mode selector when navigating to power chords chapter', async ({ page }) => {
    // Go to Left Hand Power Chords
    await goToLeftHandPowerChords(page);

    // Verify mode selector is visible with Learn More option
    await expect(page.locator('text=Mastery Progress')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Learn More')).toBeVisible({ timeout: 5000 });
  });

  test('Learn More should show intro phase with power chord', async ({ page }) => {
    // Go to Left Hand Power Chords
    await goToLeftHandPowerChords(page);

    // Click Learn More
    await page.click('text=Learn More');
    await page.waitForTimeout(500);

    // Dismiss any tips
    await dismissAllTipModals(page);

    // Should be in intro or later phase (training started)
    // Use .first() since there may be multiple "Back to Mode Selection" buttons
    const inTraining = await page.locator('button:has-text("Back to Mode Selection")').first().isVisible({ timeout: 5000 });
    expect(inTraining).toBe(true);
  });

  test('Back to Mode Selection should return to mode selector with new power chords available', async ({ page }) => {
    // Go to Left Hand Power Chords
    await goToLeftHandPowerChords(page);

    // Verify mode selector is visible
    await expect(page.locator('text=Mastery Progress')).toBeVisible({ timeout: 5000 });

    // Click Learn More
    await page.click('text=Learn More');
    await page.waitForTimeout(500);

    // Dismiss power chord intro tip if shown
    await dismissTipModal(page);

    // Complete 5 power chords
    await completeFivePowerChords(page);

    // Verify we're on the complete screen before clicking
    await expect(page.locator('.complete-phase')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('.complete-actions')).toBeVisible({ timeout: 5000 });

    // On complete screen, click "Back to Mode Selection" (the one in complete-actions)
    const backButton = page.locator('.complete-actions button:has-text("Back to Mode Selection")');
    await expect(backButton).toBeVisible({ timeout: 5000 });
    await backButton.click();
    await page.waitForTimeout(500);

    // Should be back on mode selector
    await expect(page.locator('text=Mastery Progress')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Learn More')).toBeVisible({ timeout: 5000 });

    // Click Learn More again
    await page.click('text=Learn More');
    await page.waitForTimeout(500);

    // Should see intro for a NEW power chord (6th one: R+O)
    await expect(page.locator('text=New Power Chord')).toBeVisible({ timeout: 5000 });

    const displayedChars = await getCurrentPowerChordChars(page);
    const sixthChord = LEFT_HAND_POWER_CHORDS[5];

    // The displayed chars should be the 6th power chord, NOT the 1st
    expect(displayedChars).toEqual(sixthChord.display);
    expect(displayedChars).not.toEqual(LEFT_HAND_POWER_CHORDS[0].display);
  });

  test('Continue button should return to mode selector with new power chords available', async ({ page }) => {
    // Go to Left Hand Power Chords
    await goToLeftHandPowerChords(page);

    // Verify mode selector is visible
    await expect(page.locator('text=Mastery Progress')).toBeVisible({ timeout: 5000 });

    // Click Learn More
    await page.click('text=Learn More');
    await page.waitForTimeout(500);

    // Dismiss power chord intro tip if shown
    await dismissTipModal(page);

    // Complete 5 power chords
    await completeFivePowerChords(page);

    // On complete screen, click "Continue →" (the campaign continue button)
    // This should be visible since we're in campaign mode
    // Note: Must use exact text to avoid clicking "Continue Learning More" button
    await expect(page.locator('text=Challenge the boss to complete the chapter')).toBeVisible({ timeout: 5000 });
    await page.click('button:has-text("Continue →")');
    await page.waitForTimeout(500);

    // Should be back on mode selector
    await expect(page.locator('text=Mastery Progress')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Learn More')).toBeVisible({ timeout: 5000 });

    // Click Learn More again
    await page.click('text=Learn More');
    await page.waitForTimeout(500);

    // Should see intro for a NEW power chord (6th one: R+O)
    await expect(page.locator('text=New Power Chord')).toBeVisible({ timeout: 5000 });

    const displayedChars = await getCurrentPowerChordChars(page);
    const sixthChord = LEFT_HAND_POWER_CHORDS[5];

    // The displayed chars should be the 6th power chord, NOT the 1st
    expect(displayedChars).toEqual(sixthChord.display);
    expect(displayedChars).not.toEqual(LEFT_HAND_POWER_CHORDS[0].display);
  });

  test('Back to selection during intro should also work and allow learning new chords', async ({ page }) => {
    // Go to Left Hand Power Chords
    await goToLeftHandPowerChords(page);

    // Click Learn More
    await page.click('text=Learn More');
    await page.waitForTimeout(500);

    // Dismiss power chord intro tip if shown
    await dismissTipModal(page);

    // Complete only 3 power chords (not all 5)
    for (let i = 0; i < 3; i++) {
      const chord = LEFT_HAND_POWER_CHORDS[i];
      await completeOnePowerChord(page, chord.chars);
    }

    // After completing 3rd power chord, should move to 4th chord's intro
    // Wait for either intro phase or any training phase to be visible
    await page.waitForTimeout(1000);

    // Click "Back to Mode Selection" from wherever we are in the training
    await page.click('button:has-text("Back to Mode Selection")');
    await page.waitForTimeout(500);

    // Should be back on mode selector
    await expect(page.locator('text=Mastery Progress')).toBeVisible({ timeout: 5000 });

    // Click Learn More again
    await page.click('text=Learn More');
    await page.waitForTimeout(500);

    // Dismiss any tip that appears
    await dismissTipModal(page);

    // Should see the 4th power chord intro (since first 3 are now LEARNING, not NEW)
    // Wait for intro phase to appear
    await expect(page.locator('text=New Power Chord')).toBeVisible({ timeout: 10000 });

    const displayedChars = await getCurrentPowerChordChars(page);
    const fourthChord = LEFT_HAND_POWER_CHORDS[3];

    // Should be 4th chord (O+U), not 1st (E+R)
    expect(displayedChars).toEqual(fourthChord.display);
    expect(displayedChars).not.toEqual(LEFT_HAND_POWER_CHORDS[0].display);
  });
});
