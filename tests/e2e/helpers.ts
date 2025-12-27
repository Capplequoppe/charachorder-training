/**
 * E2E Test Helpers
 *
 * Common utilities for Playwright E2E tests.
 */

import { Page, expect } from '@playwright/test';

// ============================================================================
// Character mappings by finger
// ============================================================================

export const FINGER_CHARS = {
  l_index: ['e', 'r'],
  r_index: ['t', 'a'],
  l_middle: ['o', 'i', '.'],
  r_middle: ['n', 'l', 'j'],
  l_ring: ['u', "'", ','],
  r_ring: ['s', 'y', ';'],
  l_thumb_inner: ['m', 'c', 'k', 'v'],
  r_thumb_inner: ['h', 'p', 'd', 'f'],
  l_thumb_outer: ['z', 'g', 'w'],
  r_thumb_outer: ['b', 'x', 'q'],
} as const;

// Stage definitions
export const STAGES = [
  { name: 'Index Fingers', fingers: ['l_index', 'r_index'] as const },
  { name: 'Middle Fingers', fingers: ['l_middle', 'r_middle'] as const },
  { name: 'Ring Fingers', fingers: ['l_ring', 'r_ring'] as const },
  { name: 'Inner Thumbs', fingers: ['l_thumb_inner', 'r_thumb_inner'] as const },
  { name: 'Outer Thumbs', fingers: ['l_thumb_outer', 'r_thumb_outer'] as const },
];

// Lesson requirements
export const GUIDED_CORRECT_PER_CHAR = 2;
export const QUIZ_CORRECT_PER_CHAR = 3;

// ============================================================================
// Page Helpers
// ============================================================================

/**
 * Clear localStorage and reload to reset campaign state
 */
export async function resetCampaign(page: Page) {
  await page.evaluate(() => localStorage.clear());
  await page.reload();
}

/**
 * Start campaign mode from the initial mode selector
 */
export async function startCampaignMode(page: Page) {
  await page.click('text=Campaign Mode');
}

/**
 * Select a chapter from the roadmap
 */
export async function selectChapter(page: Page, chapterName: string) {
  await page.click(`text=${chapterName}`);
}

/**
 * Click "Learn More" to start learning in a chapter
 */
export async function clickLearnMore(page: Page) {
  await page.click('text=Learn More');
}

/**
 * Complete the intro phase (click Start Practice)
 */
export async function startPractice(page: Page) {
  await expect(page.locator('text=Start Practice')).toBeVisible({ timeout: 5000 });
  await page.click('text=Start Practice');
}

/**
 * Type a character the required number of times for guided phase
 */
export async function typeForGuided(page: Page, char: string) {
  for (let i = 0; i < GUIDED_CORRECT_PER_CHAR; i++) {
    await page.waitForTimeout(100);
    await page.keyboard.press(char);
    await page.waitForTimeout(500);
  }
}

/**
 * Type a character the required number of times for quiz phase
 */
export async function typeForQuiz(page: Page, char: string) {
  for (let i = 0; i < QUIZ_CORRECT_PER_CHAR; i++) {
    await page.waitForTimeout(100);
    await page.keyboard.press(char);
    await page.waitForTimeout(500);
  }
}

/**
 * Complete a full finger lesson (intro → guided → quiz → complete)
 */
export async function completeFingerLesson(
  page: Page,
  fingerChars: readonly string[]
) {
  await startPractice(page);

  // Guided phase
  for (const char of fingerChars) {
    await typeForGuided(page, char);
  }

  // Quiz phase
  for (const char of fingerChars) {
    await typeForQuiz(page, char);
  }

  // Should see completion
  await expect(page.locator('text=Learned!')).toBeVisible({ timeout: 5000 });
}

/**
 * Click Continue button after completing a finger
 */
export async function clickContinue(page: Page) {
  await page.click('text=Continue');
}

/**
 * Complete an entire stage (both fingers)
 */
export async function completeStage(
  page: Page,
  stageIndex: number
) {
  const stage = STAGES[stageIndex];
  for (const fingerId of stage.fingers) {
    const chars = FINGER_CHARS[fingerId];
    await completeFingerLesson(page, chars);
    await clickContinue(page);
  }
}

// ============================================================================
// Assertions
// ============================================================================

/**
 * Assert that the quiz mode selector is visible
 */
export async function expectQuizModeSelector(page: Page) {
  await expect(page.locator('text=Standard')).toBeVisible({ timeout: 5000 });
}

/**
 * Assert that we're on a finger intro screen
 */
export async function expectFingerIntro(page: Page, fingerName: string) {
  await expect(page.locator(`text=${fingerName}`)).toBeVisible({ timeout: 5000 });
  await expect(page.locator('text=Start Practice')).toBeVisible();
}

/**
 * Assert that we're on the training mode selector
 */
export async function expectTrainingModeSelector(page: Page) {
  await expect(page.locator('text=Mastery Progress')).toBeVisible({ timeout: 5000 });
}
