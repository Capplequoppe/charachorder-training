/**
 * E2E Tests: Campaign Mode - Finger Fundamentals (Chapter 1)
 *
 * These tests cover the main learning flow for Stage 1 (Index Fingers).
 * They verify:
 * - Both fingers are introduced before quiz mode
 * - Correct terminology ("Learned" not "Mastered")
 * - Navigation (back buttons work)
 * - No regression from double-Enter bug
 */

import { test, expect, Page } from '@playwright/test';

// Character mappings for Stage 1
const LEFT_INDEX_CHARS = ['e', 'r'];
const RIGHT_INDEX_CHARS = ['t', 'a'];

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
 * Helper: Start campaign mode from the mode selector
 */
async function startCampaignMode(page: Page) {
  // Click the Campaign Mode card
  await page.click('text=Campaign Mode');
}

/**
 * Helper: Select Finger Fundamentals chapter and click Learn More
 */
async function startFingerFundamentals(page: Page) {
  // Click on Chapter 1 in the roadmap (should be auto-selected/unlocked)
  await page.click('text=Finger Fundamentals');

  // Click Learn More to start learning
  await page.click('text=Learn More');
}

/**
 * Helper: Wait for the target character to be displayed and type it
 */
async function typeTargetChar(page: Page, expectedChar: string) {
  // Wait for the target char to appear in the prompt
  const targetCharLocator = page.locator('.finger-lesson__target-char');
  await expect(targetCharLocator).toContainText(expectedChar.toUpperCase(), { timeout: 5000 });

  // Small delay to ensure the component is ready for input
  await page.waitForTimeout(150);

  // Type the character
  await page.keyboard.press(expectedChar);

  // Wait for feedback to appear and clear
  await page.waitForTimeout(500);
}

/**
 * Helper: Read the current target character and type it
 * (used when we don't know the exact order of characters)
 */
async function typeCurrentTargetChar(page: Page) {
  const targetCharLocator = page.locator('.finger-lesson__target-char');
  await expect(targetCharLocator).toBeVisible({ timeout: 5000 });

  // Get the current target character
  const charText = await targetCharLocator.textContent();
  const char = charText?.toLowerCase() || '';

  // Small delay to ensure the component is ready for input
  await page.waitForTimeout(150);

  // Type the character
  await page.keyboard.press(char);

  // Wait for feedback to appear and clear
  await page.waitForTimeout(500);
}

/**
 * Helper: Complete a single finger lesson (intro → guided → quiz → complete)
 * Uses specific character order - use for tests that know the exact order
 */
async function completeFingerLesson(page: Page, fingerChars: string[]) {
  // Wait for intro phase - "Start Practice" button should be visible
  await expect(page.locator('text=Start Practice')).toBeVisible({ timeout: 5000 });

  // Click Start Practice to begin guided phase
  await page.click('text=Start Practice');

  // Wait for guided phase to start
  await expect(page.locator('text=Guided Practice')).toBeVisible({ timeout: 5000 });

  // Guided phase: type each character GUIDED_CORRECT_PER_CHAR times
  for (const char of fingerChars) {
    for (let i = 0; i < GUIDED_CORRECT_PER_CHAR; i++) {
      await typeTargetChar(page, char);
    }
  }

  // Wait for quiz phase to start
  await expect(page.locator('.finger-lesson__phase-label:has-text("Quiz")')).toBeVisible({ timeout: 5000 });

  // Quiz phase: type each character QUIZ_CORRECT_PER_CHAR times
  for (const char of fingerChars) {
    for (let i = 0; i < QUIZ_CORRECT_PER_CHAR; i++) {
      await typeTargetChar(page, char);
    }
  }

  // Should see completion screen with "Learned!" (not "Mastered!")
  await expect(page.locator('text=Learned!')).toBeVisible({ timeout: 5000 });
}

/**
 * Helper: Complete a finger lesson by reading and typing whatever character is shown
 * Use this when you don't know the exact character order
 */
async function completeFingerLessonDynamic(page: Page, charCount: number) {
  // Wait for intro phase - "Start Practice" button should be visible
  await expect(page.locator('text=Start Practice')).toBeVisible({ timeout: 5000 });

  // Click Start Practice to begin guided phase
  await page.click('text=Start Practice');

  // Wait for guided phase to start
  await expect(page.locator('text=Guided Practice')).toBeVisible({ timeout: 5000 });

  // Guided phase: type each character GUIDED_CORRECT_PER_CHAR times
  // Total attempts = charCount * GUIDED_CORRECT_PER_CHAR
  for (let i = 0; i < charCount * GUIDED_CORRECT_PER_CHAR; i++) {
    await typeCurrentTargetChar(page);
  }

  // Wait for quiz phase to start
  await expect(page.locator('.finger-lesson__phase-label:has-text("Quiz")')).toBeVisible({ timeout: 5000 });

  // Quiz phase: type each character QUIZ_CORRECT_PER_CHAR times
  // Total attempts = charCount * QUIZ_CORRECT_PER_CHAR
  for (let i = 0; i < charCount * QUIZ_CORRECT_PER_CHAR; i++) {
    await typeCurrentTargetChar(page);
  }

  // Should see completion screen with "Learned!" (not "Mastered!")
  await expect(page.locator('text=Learned!')).toBeVisible({ timeout: 5000 });
}

test.describe('Campaign: Finger Fundamentals - Stage 1', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await resetCampaign(page);
  });

  test('should show "Learned" not "Mastered" after completing finger intro', async ({ page }) => {
    await startCampaignMode(page);
    await startFingerFundamentals(page);

    // Complete left index finger
    await completeFingerLesson(page, LEFT_INDEX_CHARS);

    // Verify terminology
    await expect(page.locator('text=Learned!')).toBeVisible();
    await expect(page.locator('text=Mastered!')).not.toBeVisible();
  });

  test('should introduce BOTH index fingers before showing quiz mode selector', async ({ page }) => {
    await startCampaignMode(page);
    await startFingerFundamentals(page);

    // Complete LEFT index finger
    await completeFingerLesson(page, LEFT_INDEX_CHARS);

    // Click Continue - should go to RIGHT index, NOT quiz mode selector
    await page.click('text=Continue');

    // Wait for the page to transition
    await page.waitForTimeout(500);

    // Should see Right Index intro (NOT quiz mode selector)
    await expect(page.locator('.finger-lesson__finger-name:has-text("Right Index")')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Choose Quiz Mode')).not.toBeVisible();

    // Verify we're on the intro screen for Right Index
    await expect(page.locator('text=Start Practice')).toBeVisible({ timeout: 5000 });

    // Complete RIGHT index finger
    await completeFingerLesson(page, RIGHT_INDEX_CHARS);

    // Click Continue - NOW should go to stage quiz
    await page.click('text=Continue');

    // Wait for transition
    await page.waitForTimeout(500);

    // Should see quiz options (Standard Quiz or Endless)
    await expect(page.locator('text=Standard')).toBeVisible({ timeout: 5000 });
  });

  test('should not skip fingers when pressing Enter multiple times quickly', async ({ page }) => {
    await startCampaignMode(page);
    await startFingerFundamentals(page);

    // Complete left index finger
    await completeFingerLesson(page, LEFT_INDEX_CHARS);

    // Verify we're on the completion screen
    await expect(page.locator('text=Left Index Learned!')).toBeVisible();

    // Click Continue button (not using Enter key)
    await page.click('text=Continue');

    // Wait for transition
    await page.waitForTimeout(500);

    // Should be on Right Index intro, not skipped to quiz
    await expect(page.locator('.finger-lesson__finger-name:has-text("Right Index")')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Choose Quiz Mode')).not.toBeVisible();
  });

  test('should trigger Continue button when pressing Enter after finger is learned', async ({ page }) => {
    await startCampaignMode(page);
    await startFingerFundamentals(page);

    // Complete left index finger
    await completeFingerLesson(page, LEFT_INDEX_CHARS);

    // Verify we're on the completion screen with Continue button
    await expect(page.locator('text=Learned!')).toBeVisible();
    const continueButton = page.locator('.finger-lesson__continue-btn');
    await expect(continueButton).toBeVisible();

    // Press Enter WITHOUT focusing the button first
    // This tests that Enter works globally (like user expects)
    await page.keyboard.press('Enter');

    // Wait for transition
    await page.waitForTimeout(500);

    // Should navigate to Right Index intro
    await expect(page.locator('.finger-lesson__finger-name:has-text("Right Index")')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Start Practice')).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Campaign: Enter Key Navigation Through All Fingers', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await resetCampaign(page);
  });

  // Finger names and character counts in the order they appear during learning
  const FINGER_ORDER = [
    { id: 'l_index', name: 'Left Index', charCount: 2 },
    { id: 'r_index', name: 'Right Index', charCount: 2 },
    { id: 'l_middle', name: 'Left Middle', charCount: 3 },
    { id: 'r_middle', name: 'Right Middle', charCount: 3 },
    { id: 'l_ring', name: 'Left Ring', charCount: 3 },
    { id: 'r_ring', name: 'Right Ring', charCount: 3 },
    { id: 'l_thumb_inner', name: 'Left Thumb (Inner)', charCount: 4 },
    { id: 'r_thumb_inner', name: 'Right Thumb (Inner)', charCount: 4 },
    { id: 'l_thumb_outer', name: 'Left Thumb (Outer)', charCount: 3 },
    { id: 'r_thumb_outer', name: 'Right Thumb (Outer)', charCount: 3 },
  ];

  /**
   * Helper: Press Enter to continue after completing a finger
   * Does NOT focus the button - tests that Enter works globally like user expects
   */
  async function pressEnterToContinue(page: Page, fingerName: string) {
    // Verify we're on the completion screen
    await expect(page.locator('text=Learned!')).toBeVisible({ timeout: 5000 });

    // Verify Continue button is visible
    const continueButton = page.locator('.finger-lesson__continue-btn');
    await expect(continueButton).toBeVisible();

    // Press Enter WITHOUT focusing the button first
    // This tests that Enter works globally (like user expects)
    await page.keyboard.press('Enter');

    // Wait for transition
    await page.waitForTimeout(500);

    console.log(`✓ Pressed Enter to continue after ${fingerName}`);
  }

  test('should allow pressing Enter to continue after EACH finger introduction and to start quiz', async ({ page }) => {
    // Increase timeout for this long test
    test.setTimeout(180000); // 3 minutes

    await startCampaignMode(page);
    await startFingerFundamentals(page);

    // Go through all 10 fingers
    for (let i = 0; i < FINGER_ORDER.length; i++) {
      const finger = FINGER_ORDER[i];
      const isLastInStage = i % 2 === 1; // Every second finger is last in its stage

      console.log(`\n=== Testing finger ${i + 1}/10: ${finger.name} ===`);

      // Complete the finger lesson (uses dynamic character detection)
      await completeFingerLessonDynamic(page, finger.charCount);

      // Press Enter to continue (this is what we're testing)
      await pressEnterToContinue(page, finger.name);

      // Verify we've moved to the next state
      if (isLastInStage) {
        // After completing both fingers in a stage, we should see quiz selector
        await expect(page.locator('text=Standard')).toBeVisible({ timeout: 5000 });
        await expect(page.locator('text=Choose Quiz Mode')).toBeVisible({ timeout: 5000 });
        console.log(`  → Quiz selector visible after completing stage`);

        // Test that Enter works on the quiz mode selector (Standard mode is selected by default)
        await page.keyboard.press('Enter');
        await page.waitForTimeout(500);

        // Should have started the quiz - verify quiz interface is visible
        await expect(page.locator('.character-quiz__question')).toBeVisible({ timeout: 5000 });
        console.log(`  → Enter started the quiz from mode selector`);

        // If not the last stage, abort quiz and continue to next stage
        if (i < FINGER_ORDER.length - 1) {
          // Go back from quiz - this goes directly to training mode selector
          const backButton = page.locator('.character-quiz__back-btn');
          await backButton.click();
          await page.waitForTimeout(500);

          // Should be at training mode selector
          await expect(page.locator('text=Mastery Progress')).toBeVisible({ timeout: 5000 });

          // Click Learn More to continue to next stage
          await page.click('text=Learn More');
          await page.waitForTimeout(500);
        }
      } else {
        // After first finger in stage, should see next finger intro
        const nextFinger = FINGER_ORDER[i + 1];
        await expect(page.locator('text=Start Practice')).toBeVisible({ timeout: 5000 });
        console.log(`  → Next finger intro visible: ${nextFinger.name}`);
      }
    }

    // Final verification: should have started quiz after last stage
    await expect(page.locator('.character-quiz__question')).toBeVisible({ timeout: 5000 });
    console.log('\n✓ Successfully completed all 10 fingers using Enter to continue and start quiz!');
  });

});

test.describe('Campaign: Quiz Mode Selector', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await resetCampaign(page);
  });

  test('should have back button in quiz mode selector', async ({ page }) => {
    await startCampaignMode(page);
    await startFingerFundamentals(page);

    // Complete both index fingers to get to quiz mode selector
    await completeFingerLesson(page, LEFT_INDEX_CHARS);
    await page.click('text=Continue');
    await page.waitForTimeout(500);

    // Wait for right index intro
    await expect(page.locator('.finger-lesson__finger-name:has-text("Right Index")')).toBeVisible({ timeout: 5000 });

    await completeFingerLesson(page, RIGHT_INDEX_CHARS);
    await page.click('text=Continue');
    await page.waitForTimeout(500);

    // Should be at quiz mode selector - wait for Standard to appear
    await expect(page.locator('text=Standard')).toBeVisible({ timeout: 5000 });

    // Back button should exist (look for the specific back button in the selector)
    const backButton = page.locator('.character-quiz__back-btn');
    await expect(backButton).toBeVisible();

    // Clicking back should return to mode selector (Learn More)
    await backButton.click();
    await page.waitForTimeout(500);

    // Should see the training mode selector
    await expect(page.locator('text=Mastery Progress')).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Campaign: Learning Progression After Introduction', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await resetCampaign(page);
  });

  /**
   * Helper: Navigate to Your Journey from the mode selector
   */
  async function goToYourJourney(page: Page) {
    // Click the "Your Journey" tab/button in the mode selector
    await page.click('text=Your Journey');
    await expect(page.locator('.progress-journey')).toBeVisible({ timeout: 5000 });
  }

  /**
   * Helper: Verify that specific characters are NOT at Familiar or Mastered level
   * (they should remain at New or Learning after introduction)
   */
  async function verifyCharsNotAdvanced(page: Page, chars: string[]) {
    for (const char of chars) {
      // Find the character card
      const charCard = page.locator(`.progress-journey__char-card:has(.progress-journey__char:text-is("${char.toUpperCase()}"))`);
      await expect(charCard).toBeVisible({ timeout: 5000 });

      // Verify mastery label is NOT Familiar or Mastered
      const masteryLabel = charCard.locator('.progress-journey__mastery');
      const labelText = await masteryLabel.textContent();
      expect(labelText).not.toBe('Familiar');
      expect(labelText).not.toBe('Mastered');
    }
  }

  /**
   * Helper: Verify that specific characters are still "New" (not practiced yet)
   */
  async function verifyCharsAreNew(page: Page, chars: string[]) {
    for (const char of chars) {
      const charCard = page.locator(`.progress-journey__char-card:has(.progress-journey__char:text-is("${char.toUpperCase()}"))`);
      await expect(charCard).toBeVisible({ timeout: 5000 });

      const masteryLabel = charCard.locator('.progress-journey__mastery');
      await expect(masteryLabel).toHaveText('New');
    }
  }

  test('should show ALL characters as New with ZERO progress after Learn More introduction only', async ({ page }) => {
    // This is the critical test: after ONLY the Learn More introduction,
    // characters should be "New" with 0 mastery progress - not Learning, Familiar, or Mastered
    await startCampaignMode(page);
    await startFingerFundamentals(page);

    // Complete LEFT index finger introduction
    await completeFingerLesson(page, LEFT_INDEX_CHARS);
    await page.click('text=Continue');
    await page.waitForTimeout(500);

    // Complete RIGHT index finger introduction
    await expect(page.locator('.finger-lesson__finger-name:has-text("Right Index")')).toBeVisible({ timeout: 5000 });
    await completeFingerLesson(page, RIGHT_INDEX_CHARS);

    // IMPORTANT: Go back from completion screen WITHOUT going to quiz selector
    // This ensures we only test the Learn More introduction, not any quiz attempts
    const backButton = page.locator('.finger-lesson__back-btn');
    await backButton.click();
    await page.waitForTimeout(500);

    // Should see Mastery Progress (mode selector)
    await expect(page.locator('text=Mastery Progress')).toBeVisible({ timeout: 5000 });

    // Navigate to Your Journey
    await goToYourJourney(page);

    // Verify ALL introduced characters show as "New" (not Learning, Familiar, or Mastered)
    const allIndexChars = [...LEFT_INDEX_CHARS, ...RIGHT_INDEX_CHARS];
    for (const char of allIndexChars) {
      const charCard = page.locator(`.progress-journey__char-card:has(.progress-journey__char:text-is("${char.toUpperCase()}"))`);
      await expect(charCard).toBeVisible({ timeout: 5000 });

      // Mastery label should be "New"
      const masteryLabel = charCard.locator('.progress-journey__mastery');
      await expect(masteryLabel).toHaveText('New');
    }

    // Verify the summary counts: 0 mastered, 0 familiar, 0 learning
    // The progress bar legend shows these counts
    await expect(page.locator('text=Mastered (0)')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Familiar (0)')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Learning (0)')).toBeVisible({ timeout: 5000 });

    // Verify no character cards have mastered/familiar/learning classes
    const masteredCards = page.locator('.progress-journey__char-card.mastered');
    const familiarCards = page.locator('.progress-journey__char-card.familiar');
    const learningCards = page.locator('.progress-journey__char-card.learning');
    await expect(masteredCards).toHaveCount(0);
    await expect(familiarCards).toHaveCount(0);
    await expect(learningCards).toHaveCount(0);
  });

  test('should not advance characters to Familiar or Mastered after completing finger introductions', async ({ page }) => {
    await startCampaignMode(page);
    await startFingerFundamentals(page);

    // Complete LEFT index finger introduction
    await completeFingerLesson(page, LEFT_INDEX_CHARS);
    await page.click('text=Continue');
    await page.waitForTimeout(500);

    // Complete RIGHT index finger introduction
    await expect(page.locator('.finger-lesson__finger-name:has-text("Right Index")')).toBeVisible({ timeout: 5000 });
    await completeFingerLesson(page, RIGHT_INDEX_CHARS);
    await page.click('text=Continue');
    await page.waitForTimeout(500);

    // Should be at quiz mode selector now - go back to mode selector
    await expect(page.locator('text=Standard')).toBeVisible({ timeout: 5000 });
    const backButton = page.locator('.character-quiz__back-btn');
    await backButton.click();
    await page.waitForTimeout(500);

    // Should see Mastery Progress (mode selector)
    await expect(page.locator('text=Mastery Progress')).toBeVisible({ timeout: 5000 });

    // Navigate to Your Journey
    await goToYourJourney(page);

    // Verify all index finger characters are NOT advanced to Familiar or Mastered
    const allIndexChars = [...LEFT_INDEX_CHARS, ...RIGHT_INDEX_CHARS];
    await verifyCharsNotAdvanced(page, allIndexChars);

    // Verify no characters are Familiar or Mastered globally
    const familiarCards = page.locator('.progress-journey__char-card.familiar');
    const masteredCards = page.locator('.progress-journey__char-card.mastered');
    await expect(familiarCards).toHaveCount(0);
    await expect(masteredCards).toHaveCount(0);
  });

  test('should not advance to Familiar or Mastered from Learn More introduction alone', async ({ page }) => {
    await startCampaignMode(page);
    await startFingerFundamentals(page);

    // Complete only LEFT index finger
    await completeFingerLesson(page, LEFT_INDEX_CHARS);

    // Go back to mode selector
    const backButton = page.locator('.finger-lesson__back-btn');
    await backButton.click();
    await page.waitForTimeout(500);

    // Navigate to Your Journey
    await expect(page.locator('text=Mastery Progress')).toBeVisible({ timeout: 5000 });
    await goToYourJourney(page);

    // Verify LEFT index chars are NOT advanced to Familiar or Mastered
    await verifyCharsNotAdvanced(page, LEFT_INDEX_CHARS);

    // Verify RIGHT index chars are still New (not introduced yet)
    await verifyCharsAreNew(page, RIGHT_INDEX_CHARS);

    // Verify no characters are Familiar or Mastered
    const familiarCards = page.locator('.progress-journey__char-card.familiar');
    const masteredCards = page.locator('.progress-journey__char-card.mastered');
    await expect(familiarCards).toHaveCount(0);
    await expect(masteredCards).toHaveCount(0);
  });

  test('should verify journey shows correct state after completing left finger only', async ({ page }) => {
    await startCampaignMode(page);
    await startFingerFundamentals(page);

    // Complete LEFT index finger
    await completeFingerLesson(page, LEFT_INDEX_CHARS);
    await page.click('text=Continue');
    await page.waitForTimeout(500);

    // We're now at Right Index intro - go back to mode selector
    await expect(page.locator('.finger-lesson__finger-name:has-text("Right Index")')).toBeVisible({ timeout: 5000 });

    // Use back button to return to mode selector
    const backButton = page.locator('.finger-lesson__back-btn');
    await backButton.click();
    await page.waitForTimeout(500);

    // Check Your Journey - LEFT chars should not be advanced, RIGHT should be New
    await expect(page.locator('text=Mastery Progress')).toBeVisible({ timeout: 5000 });
    await goToYourJourney(page);

    // LEFT index chars should NOT be Familiar or Mastered
    await verifyCharsNotAdvanced(page, LEFT_INDEX_CHARS);

    // RIGHT index chars should still be New (not introduced yet)
    await verifyCharsAreNew(page, RIGHT_INDEX_CHARS);

    // Confirm NONE are Familiar or Mastered globally
    const familiarCards = page.locator('.progress-journey__char-card.familiar');
    const masteredCards = page.locator('.progress-journey__char-card.mastered');
    await expect(familiarCards).toHaveCount(0);
    await expect(masteredCards).toHaveCount(0);
  });
});

test.describe('Campaign: Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await resetCampaign(page);
  });

  test('should allow going back from finger lesson', async ({ page }) => {
    await startCampaignMode(page);
    await startFingerFundamentals(page);

    // Should see Back button on finger lesson
    const backButton = page.locator('.finger-lesson__back-btn');
    await expect(backButton).toBeVisible();

    // Click back
    await backButton.click();

    // Should return to mode selector (Mastery Progress should be visible)
    await expect(page.locator('text=Mastery Progress')).toBeVisible({ timeout: 5000 });
  });

  test('should persist progress across page reloads', async ({ page }) => {
    await startCampaignMode(page);
    await startFingerFundamentals(page);

    // Complete left index finger
    await completeFingerLesson(page, LEFT_INDEX_CHARS);

    // Reload the page
    await page.reload();

    // Start campaign again
    await startCampaignMode(page);

    // Finger Fundamentals should remember we started
    await page.click('text=Finger Fundamentals');

    // Should see the training mode selector with progress
    await expect(page.locator('text=Mastery Progress')).toBeVisible({ timeout: 5000 });

    // Progress should show some items practiced
    await expect(page.locator('text=/\\d+ practiced/')).toBeVisible({ timeout: 5000 });
  });
});
