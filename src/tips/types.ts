/**
 * Types for the Educational Tips System
 *
 * This module provides type definitions for the tips system that
 * educates users about learning techniques throughout their journey.
 */

/**
 * Unique identifier for each educational tip.
 */
export enum TipId {
  /** Introduction to chording concept */
  CHORDING_INTRO = 'chording_intro',
  /** Cross-modal learning explanation */
  MULTISENSORY_LEARNING = 'multisensory_learning',
  /** Finger to color/note mapping */
  FINGER_MAPPING = 'finger_mapping',
  /** Five directions per finger */
  DIRECTIONAL_SYSTEM = 'directional_system',
  /** Chunking theory for power chords */
  CHUNKING_THEORY = 'chunking_theory',
  /** Spaced repetition explanation */
  SPACED_REPETITION = 'spaced_repetition',
  /** Dopamine reinforcement after success */
  DOPAMINE_LOOP = 'dopamine_loop',
  /** Mastery criteria explanation */
  MASTERY_CRITERIA = 'mastery_criteria',
}

/**
 * Trigger points where tips can appear in the user journey.
 */
export enum TipTrigger {
  /** User selects Campaign Mode for the first time */
  CAMPAIGN_START = 'campaign_start',
  /** First finger lesson begins */
  FIRST_FINGER_LESSON = 'first_finger_lesson',
  /** During finger intro phase showing color/note */
  FINGER_INTRO = 'finger_intro',
  /** When directions are explained */
  DIRECTION_INTRO = 'direction_intro',
  /** Before first power chord chapter */
  POWER_CHORD_START = 'power_chord_start',
  /** User selects Review mode for first time */
  FIRST_REVIEW = 'first_review',
  /** Before first boss attempt */
  BOSS_INTRO = 'boss_intro',
  /** After first boss victory */
  BOSS_VICTORY = 'boss_victory',
}

/**
 * Definition of an educational tip.
 */
export interface TipDefinition {
  /** Unique identifier */
  id: TipId;
  /** When this tip should be triggered */
  trigger: TipTrigger;
  /** Short headline for the tip */
  title: string;
  /** Emoji icon for visual appeal */
  icon: string;
  /** Main explanation text (2-3 sentences) */
  content: string;
  /** Key takeaways as bullet points */
  keyPoints: string[];
}

/**
 * State tracking which tips have been shown.
 */
export interface TipsState {
  /** List of tip IDs that have been shown */
  shownTips: TipId[];
  /** Whether tips are enabled globally */
  tipsEnabled: boolean;
  /** ISO timestamp of last tip shown */
  lastTipShownAt: string | null;
}

/**
 * Creates the initial tips state.
 */
export function createInitialTipsState(): TipsState {
  return {
    shownTips: [],
    tipsEnabled: true,
    lastTipShownAt: null,
  };
}
