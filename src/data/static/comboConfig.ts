/**
 * Combo Configuration
 *
 * Defines combo tiers with escalating visual and audio feedback
 * for consecutive correct answers.
 */

// ==================== Types ====================

export interface ComboTier {
  minStreak: number;
  name: string;
  color: string;
  glowIntensity: number;        // 0-1, how bright the glow effect
  soundPitchMultiplier: number; // Pitch modifier for combo sounds
  particleCount: number;        // Number of particles to spawn
  screenShake: boolean;         // Whether to shake screen on level up
  scoreMultiplier: number;      // Score bonus multiplier
}

// ==================== Combo Tiers ====================

export const COMBO_TIERS: ComboTier[] = [
  {
    minStreak: 0,
    name: '',
    color: '#ffffff',
    glowIntensity: 0,
    soundPitchMultiplier: 1,
    particleCount: 0,
    screenShake: false,
    scoreMultiplier: 1,
  },
  {
    minStreak: 3,
    name: 'Nice!',
    color: '#3498db',
    glowIntensity: 0.3,
    soundPitchMultiplier: 1.05,
    particleCount: 5,
    screenShake: false,
    scoreMultiplier: 1.1,
  },
  {
    minStreak: 5,
    name: 'Good!',
    color: '#2ecc71',
    glowIntensity: 0.5,
    soundPitchMultiplier: 1.1,
    particleCount: 10,
    screenShake: false,
    scoreMultiplier: 1.25,
  },
  {
    minStreak: 10,
    name: 'Great!',
    color: '#f1c40f',
    glowIntensity: 0.7,
    soundPitchMultiplier: 1.15,
    particleCount: 20,
    screenShake: true,
    scoreMultiplier: 1.5,
  },
  {
    minStreak: 15,
    name: 'Excellent!',
    color: '#e67e22',
    glowIntensity: 0.85,
    soundPitchMultiplier: 1.2,
    particleCount: 30,
    screenShake: true,
    scoreMultiplier: 2,
  },
  {
    minStreak: 25,
    name: 'AMAZING!',
    color: '#e74c3c',
    glowIntensity: 1,
    soundPitchMultiplier: 1.25,
    particleCount: 50,
    screenShake: true,
    scoreMultiplier: 3,
  },
  {
    minStreak: 50,
    name: 'LEGENDARY!',
    color: '#9b59b6',
    glowIntensity: 1,
    soundPitchMultiplier: 1.3,
    particleCount: 100,
    screenShake: true,
    scoreMultiplier: 5,
  },
];

// ==================== Helper Functions ====================

/**
 * Get the combo tier for a given streak count
 */
export function getComboTier(streak: number): ComboTier {
  // Find highest tier that matches
  for (let i = COMBO_TIERS.length - 1; i >= 0; i--) {
    if (streak >= COMBO_TIERS[i].minStreak) {
      return COMBO_TIERS[i];
    }
  }
  return COMBO_TIERS[0];
}

/**
 * Get the next tier after current streak
 */
export function getNextComboTier(streak: number): ComboTier | null {
  const currentTier = getComboTier(streak);
  const currentIndex = COMBO_TIERS.indexOf(currentTier);

  if (currentIndex < COMBO_TIERS.length - 1) {
    return COMBO_TIERS[currentIndex + 1];
  }
  return null;
}

/**
 * Get progress to next tier (0-1)
 */
export function getComboProgress(streak: number): number {
  const currentTier = getComboTier(streak);
  const nextTier = getNextComboTier(streak);

  if (!nextTier) return 1; // Max tier

  const range = nextTier.minStreak - currentTier.minStreak;
  const progress = streak - currentTier.minStreak;

  return Math.min(1, progress / range);
}

/**
 * Get streaks needed for next tier
 */
export function getStreaksToNextTier(streak: number): number {
  const nextTier = getNextComboTier(streak);
  if (!nextTier) return 0;
  return nextTier.minStreak - streak;
}

/**
 * Check if streak just reached a new tier
 */
export function isNewTier(previousStreak: number, currentStreak: number): boolean {
  const prevTier = getComboTier(previousStreak);
  const currTier = getComboTier(currentStreak);
  return currTier.minStreak > prevTier.minStreak;
}

/**
 * Get tier index (0-based)
 */
export function getComboTierIndex(streak: number): number {
  const tier = getComboTier(streak);
  return COMBO_TIERS.indexOf(tier);
}

/**
 * Get all tier thresholds
 */
export function getComboTierThresholds(): number[] {
  return COMBO_TIERS.map(t => t.minStreak).filter(t => t > 0);
}
