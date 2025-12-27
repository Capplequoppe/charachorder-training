/**
 * E2E Tests: Quiz Mode and Survival Mode
 *
 * Tests for:
 * 1. Standard Quiz - only quizzes learned characters, allows retries on mistakes
 * 2. Survival Mode - game over on first mistake, can return to chapter
 */

import { test, expect, Page } from '@playwright/test';

// Character mappings for Stage 1 (Index Fingers)
const LEFT_INDEX_CHARS = ['e', 'r'];
const RIGHT_INDEX_CHARS = ['t', 'a'];
const ALL_INDEX_CHARS = [...LEFT_INDEX_CHARS, ...RIGHT_INDEX_CHARS];

// Characters that should NOT appear (not yet learned)
const NON_INDEX_CHARS = ['o', 'i', 'n', 'l', 's', 'y', 'u', 'm', 'h', 'z', 'b'];

// How many correct answers needed per phase
const GUIDED_CORRECT_PER_CHAR = 2;
const QUIZ_CORRECT_PER_CHAR = 3;

/**
 * Helper: Clear localStorage to reset campaign state
 */
async function resetCampaign(page: Page) {
  await page.evaluate(() => localStorage.clear());
  await page.reload();
}

/**
 * Helper: Wait for the target character and type it
 */
async function typeTargetChar(page: Page, expectedChar: string) {
  const targetCharLocator = page.locator('.finger-lesson__target-char');
  await expect(targetCharLocator).toContainText(expectedChar.toUpperCase(), { timeout: 5000 });
  await page.waitForTimeout(150);
  await page.keyboard.press(expectedChar);
  await page.waitForTimeout(500);
}

/**
 * Helper: Complete a single finger lesson
 */
async function completeFingerLesson(page: Page, fingerChars: string[]) {
  await expect(page.locator('text=Start Practice')).toBeVisible({ timeout: 5000 });
  await page.click('text=Start Practice');
  await expect(page.locator('text=Guided Practice')).toBeVisible({ timeout: 5000 });

  for (const char of fingerChars) {
    for (let i = 0; i < GUIDED_CORRECT_PER_CHAR; i++) {
      await typeTargetChar(page, char);
    }
  }

  await expect(page.locator('.finger-lesson__phase-label:has-text("Quiz")')).toBeVisible({ timeout: 5000 });

  for (const char of fingerChars) {
    for (let i = 0; i < QUIZ_CORRECT_PER_CHAR; i++) {
      await typeTargetChar(page, char);
    }
  }

  await expect(page.locator('text=Learned!')).toBeVisible({ timeout: 5000 });
}

/**
 * Helper: Navigate to Finger Fundamentals and complete both index fingers
 */
async function setupCompletedIndexFingers(page: Page) {
  // Start campaign
  await page.click('text=Campaign Mode');
  await page.click('text=Finger Fundamentals');
  await page.click('text=Learn More');

  // Complete left index
  await completeFingerLesson(page, LEFT_INDEX_CHARS);
  await page.click('text=Continue');
  await page.waitForTimeout(500);

  // Complete right index
  await expect(page.locator('.finger-lesson__finger-name:has-text("Right Index")')).toBeVisible({ timeout: 5000 });
  await completeFingerLesson(page, RIGHT_INDEX_CHARS);
  await page.click('text=Continue');
  await page.waitForTimeout(500);
}

// ==================== Standard Quiz Tests ====================

test.describe('Standard Quiz Mode', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await resetCampaign(page);
  });

  test('should only quiz index finger characters after learning Stage 1', async ({ page }) => {
    await setupCompletedIndexFingers(page);

    // Should be at quiz mode selector
    await expect(page.locator('text=Choose Quiz Mode')).toBeVisible({ timeout: 5000 });

    // Select Standard Quiz
    await page.click('.character-quiz__mode-card:has-text("Standard")');
    await page.click('text=Start Quiz');

    // Wait for quiz to start
    await expect(page.locator('.character-quiz__target')).toBeVisible({ timeout: 5000 });

    // Verify the character shown is one of the index finger characters
    const targetChar = await page.locator('.character-quiz__target').textContent();
    const charLower = targetChar?.toLowerCase();

    expect(ALL_INDEX_CHARS).toContain(charLower);
    expect(NON_INDEX_CHARS).not.toContain(charLower);
  });

  test('should allow retrying after a mistake (not game over)', async ({ page }) => {
    await setupCompletedIndexFingers(page);

    // Select Standard Quiz
    await page.click('.character-quiz__mode-card:has-text("Standard")');
    await page.click('text=Start Quiz');

    // Wait for quiz to start
    await expect(page.locator('.character-quiz__target')).toBeVisible({ timeout: 5000 });

    // Get the target character
    const targetChar = await page.locator('.character-quiz__target').textContent();
    const expectedChar = targetChar?.toLowerCase() ?? 'e';

    // Press a WRONG character (one that's NOT the expected one)
    const wrongChar = ALL_INDEX_CHARS.find(c => c !== expectedChar) ?? 'x';
    await page.keyboard.press(wrongChar);

    // Should show incorrect feedback (X) but NOT game over
    await expect(page.locator('.character-quiz__feedback--incorrect')).toBeVisible({ timeout: 2000 });

    // Should NOT show "Game Over" or results screen
    await expect(page.locator('text=Game Over')).not.toBeVisible();

    // Wait for feedback to clear and show the answer
    await expect(page.locator('text=The answer was')).toBeVisible({ timeout: 5000 });

    // Should have a Continue button to move on
    await expect(page.locator('text=Continue (Enter)')).toBeVisible();

    // Click Continue to proceed
    await page.click('text=Continue (Enter)');

    // Should move to next question (counter should update)
    await expect(page.locator('.character-quiz__counter:has-text("2 /")')).toBeVisible({ timeout: 5000 });
  });

  test('should complete quiz and show results', async ({ page }) => {
    await setupCompletedIndexFingers(page);

    // Select Standard Quiz
    await page.click('.character-quiz__mode-card:has-text("Standard")');
    await page.click('text=Start Quiz');

    // The quiz has 20 questions by default - answer them all
    for (let i = 0; i < 20; i++) {
      await expect(page.locator('.character-quiz__target')).toBeVisible({ timeout: 5000 });
      const targetChar = await page.locator('.character-quiz__target').textContent();
      const char = targetChar?.toLowerCase() ?? 'e';

      await page.waitForTimeout(100);
      await page.keyboard.press(char);
      await page.waitForTimeout(350);
    }

    // Should show results
    await expect(page.locator('text=Quiz Complete!')).toBeVisible({ timeout: 5000 });

    // Should show stats - use exact text matching
    await expect(page.getByText('Correct', { exact: true })).toBeVisible();
    await expect(page.getByText('Accuracy', { exact: true })).toBeVisible();
  });
});

// ==================== Survival Mode Tests ====================
// Survival Mode requires MASTERED items. During finger lessons, mastery updates
// are skipped (skipMasteryUpdate=true) because learning/introduction should NOT
// give mastery points. Items become "practiced" but stay at NEW mastery level.

test.describe('Survival Mode', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await resetCampaign(page);
  });

  test('survival mode should NOT be available after just completing lessons', async ({ page }) => {
    await setupCompletedIndexFingers(page);

    // Go back to mode selector
    await page.click('.character-quiz__back-btn');
    await page.waitForTimeout(500);

    // Should be at training mode selector
    await expect(page.locator('text=Mastery Progress')).toBeVisible({ timeout: 5000 });

    // Survival Mode should NOT be available (items are practiced but not mastered)
    // During lessons, skipMasteryUpdate=true prevents mastery from being updated
    await expect(page.locator('.mode-option.survival')).not.toBeVisible();

    // But Learn More should still be available to practice more
    await expect(page.locator('text=Learn More')).toBeVisible();
  });

  test('review modes should be available after learning', async ({ page }) => {
    await setupCompletedIndexFingers(page);

    // Go back to mode selector
    await page.click('.character-quiz__back-btn');
    await page.waitForTimeout(500);

    // Should be at training mode selector
    await expect(page.locator('text=Mastery Progress')).toBeVisible({ timeout: 5000 });

    // Review All should be available (for practiced items)
    await expect(page.locator('.mode-option.review-all')).toBeVisible();

    // Should show how many items are practiced
    await expect(page.locator('text=/\\d+ practiced/')).toBeVisible();
  });
});

// ==================== Learning Progression Tests ====================

test.describe('Learning Progression', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await resetCampaign(page);
  });

  test('Learn More should present middle fingers after completing index fingers', async ({ page }) => {
    await setupCompletedIndexFingers(page);

    // Go back to mode selector
    await page.click('.character-quiz__back-btn');
    await page.waitForTimeout(500);

    // Should be at training mode selector
    await expect(page.locator('text=Mastery Progress')).toBeVisible({ timeout: 5000 });

    // Click Learn More to continue learning
    await page.click('text=Learn More');
    await page.waitForTimeout(500);

    // Should now be in finger lesson for Left Middle finger
    // The finger name should show "Left Middle" (not "Left Index" or "Right Index")
    await expect(page.locator('.finger-lesson__finger-name:has-text("Left Middle")')).toBeVisible({ timeout: 5000 });

    // Should NOT show index finger names
    await expect(page.locator('.finger-lesson__finger-name:has-text("Left Index")')).not.toBeVisible();
    await expect(page.locator('.finger-lesson__finger-name:has-text("Right Index")')).not.toBeVisible();

    // Verify we can start practice for middle finger
    await expect(page.locator('text=Start Practice')).toBeVisible({ timeout: 5000 });

    // The target characters should be from middle finger (o, i, .) not index (e, r, t, a)
    await page.click('text=Start Practice');
    await expect(page.locator('text=Guided Practice')).toBeVisible({ timeout: 5000 });

    // Get the first target character - should be from left middle finger (O, I, or .)
    const targetCharLocator = page.locator('.finger-lesson__target-char');
    await expect(targetCharLocator).toBeVisible({ timeout: 5000 });
    const targetChar = await targetCharLocator.textContent();
    const charLower = targetChar?.toLowerCase();

    // Should be one of the middle finger characters, NOT index finger
    const LEFT_MIDDLE_CHARS = ['o', '.', 'i'];
    expect(LEFT_MIDDLE_CHARS).toContain(charLower);
    expect(ALL_INDEX_CHARS).not.toContain(charLower);
  });
});

// ==================== Endless Quiz Mode Tests ====================

test.describe('Endless Quiz Mode', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await resetCampaign(page);
  });

  test('should end on first mistake in endless mode', async ({ page }) => {
    await setupCompletedIndexFingers(page);

    // Select Endless mode
    await page.click('.character-quiz__mode-card:has-text("Endless")');

    // Select Beginner difficulty (10 seconds)
    await page.click('.character-quiz__difficulty-btn:has-text("Beginner")');
    await page.click('text=Start Endless');

    // Answer a few correctly
    for (let i = 0; i < 2; i++) {
      await expect(page.locator('.character-quiz__target')).toBeVisible({ timeout: 5000 });
      const targetChar = await page.locator('.character-quiz__target').textContent();
      const char = targetChar?.toLowerCase() ?? 'e';

      await page.waitForTimeout(200);
      await page.keyboard.press(char);
      await page.waitForTimeout(300);
    }

    // Verify streak is 2
    await expect(page.locator('text=Streak: 2')).toBeVisible({ timeout: 2000 });

    // Now make a mistake
    await expect(page.locator('.character-quiz__target')).toBeVisible({ timeout: 5000 });
    await page.keyboard.press('z'); // Wrong character

    // Should show game over (endless mode ends on first mistake)
    await expect(page.locator('text=Game Over!')).toBeVisible({ timeout: 5000 });

    // Should show final streak
    await expect(page.locator('text=Final Streak')).toBeVisible();

    // Should have Exit button to return
    await expect(page.locator('button:has-text("Exit")')).toBeVisible();
  });
});
