/**
 * Sentence Practice Data
 *
 * Curated sentences for typing practice, organized by difficulty
 * and category for contextual chord training.
 */

/**
 * Sentence category types for focused practice.
 */
export type SentenceCategory =
  | 'common_phrases'
  | 'questions'
  | 'statements'
  | 'instructions'
  | 'conversational'
  | 'technical';

/**
 * Difficulty levels for sentences.
 */
export type SentenceDifficulty = 'beginner' | 'intermediate' | 'advanced';

/**
 * Practice sentence structure.
 */
export interface PracticeSentence {
  /** Unique identifier */
  id: string;
  /** Full sentence text */
  text: string;
  /** Tokenized words (preserving punctuation attachment) */
  words: string[];
  /** Difficulty level */
  difficulty: SentenceDifficulty;
  /** Sentence category for themed practice */
  category: SentenceCategory;
  /** Percentage of words with known chords (0-1) */
  chordCoverage: number;
  /** Estimated character count */
  charCount: number;
}

/**
 * Tokenize a sentence into words, handling punctuation.
 */
function tokenize(text: string): string[] {
  // Split on spaces, keeping punctuation attached to words
  return text.split(/\s+/).filter(w => w.length > 0);
}

/**
 * Create a practice sentence with automatic word tokenization.
 */
function createSentence(
  id: string,
  text: string,
  difficulty: SentenceDifficulty,
  category: SentenceCategory,
  chordCoverage: number
): PracticeSentence {
  const words = tokenize(text);
  return {
    id,
    text,
    words,
    difficulty,
    category,
    chordCoverage,
    charCount: text.length,
  };
}

/**
 * Complete sentence database organized by difficulty.
 */
export const PRACTICE_SENTENCES: PracticeSentence[] = [
  // ============================================================
  // BEGINNER - Very common words (top 50)
  // ============================================================

  // Statements
  createSentence('b01', 'The cat is on the mat.', 'beginner', 'statements', 0.83),
  createSentence('b02', 'I can see you there.', 'beginner', 'statements', 1.0),
  createSentence('b03', 'He was here with me.', 'beginner', 'statements', 1.0),
  createSentence('b04', 'They will be here soon.', 'beginner', 'statements', 1.0),
  createSentence('b05', 'She is my best friend.', 'beginner', 'statements', 1.0),
  createSentence('b06', 'We can do it now.', 'beginner', 'statements', 1.0),
  createSentence('b07', 'This is the one I want.', 'beginner', 'statements', 1.0),
  createSentence('b08', 'It is time to go.', 'beginner', 'statements', 1.0),
  createSentence('b09', 'You are so good at this.', 'beginner', 'statements', 1.0),
  createSentence('b10', 'I will see you then.', 'beginner', 'statements', 1.0),

  // Questions
  createSentence('b11', 'What do you want?', 'beginner', 'questions', 1.0),
  createSentence('b12', 'Where is it now?', 'beginner', 'questions', 1.0),
  createSentence('b13', 'Who was that?', 'beginner', 'questions', 1.0),
  createSentence('b14', 'How are you?', 'beginner', 'questions', 1.0),
  createSentence('b15', 'What time is it?', 'beginner', 'questions', 1.0),
  createSentence('b16', 'Can I help you?', 'beginner', 'questions', 1.0),
  createSentence('b17', 'Do you like it?', 'beginner', 'questions', 1.0),
  createSentence('b18', 'Is this your book?', 'beginner', 'questions', 0.95),
  createSentence('b19', 'Are you here?', 'beginner', 'questions', 1.0),
  createSentence('b20', 'Will you come with me?', 'beginner', 'questions', 1.0),

  // Common phrases
  createSentence('b21', 'Thank you so much.', 'beginner', 'common_phrases', 1.0),
  createSentence('b22', 'See you later.', 'beginner', 'common_phrases', 1.0),
  createSentence('b23', 'Good to see you.', 'beginner', 'common_phrases', 1.0),
  createSentence('b24', 'Have a good day.', 'beginner', 'common_phrases', 1.0),
  createSentence('b25', 'I think so too.', 'beginner', 'common_phrases', 1.0),

  // Conversational
  createSentence('b26', 'Yes, I can do that.', 'beginner', 'conversational', 1.0),
  createSentence('b27', 'No, not right now.', 'beginner', 'conversational', 1.0),
  createSentence('b28', 'I am here for you.', 'beginner', 'conversational', 1.0),
  createSentence('b29', 'That is a good one.', 'beginner', 'conversational', 1.0),
  createSentence('b30', 'Let me know if you need help.', 'beginner', 'conversational', 0.9),

  // ============================================================
  // INTERMEDIATE - Common words + some less common (top 200)
  // ============================================================

  // Statements
  createSentence('i01', 'They will come back after the meeting.', 'intermediate', 'statements', 0.86),
  createSentence('i02', 'The report should be ready by tomorrow.', 'intermediate', 'statements', 0.85),
  createSentence('i03', 'We need to find a better solution.', 'intermediate', 'statements', 0.9),
  createSentence('i04', 'The team worked hard on this project.', 'intermediate', 'statements', 0.85),
  createSentence('i05', 'Please make sure to check the details.', 'intermediate', 'statements', 0.88),
  createSentence('i06', 'Everyone should have their own copy.', 'intermediate', 'statements', 0.82),
  createSentence('i07', 'The system works well for most users.', 'intermediate', 'statements', 0.85),
  createSentence('i08', 'We have been waiting for this moment.', 'intermediate', 'statements', 0.9),
  createSentence('i09', 'The data shows a clear pattern here.', 'intermediate', 'statements', 0.83),
  createSentence('i10', 'This method seems to work the best.', 'intermediate', 'statements', 0.9),

  // Questions
  createSentence('i11', 'Could you please help me with this?', 'intermediate', 'questions', 1.0),
  createSentence('i12', 'What would you like to do today?', 'intermediate', 'questions', 1.0),
  createSentence('i13', 'Have you finished the assignment yet?', 'intermediate', 'questions', 0.85),
  createSentence('i14', 'When should we expect the results?', 'intermediate', 'questions', 0.88),
  createSentence('i15', 'How long will this process take?', 'intermediate', 'questions', 0.9),
  createSentence('i16', 'Why did they change the schedule?', 'intermediate', 'questions', 0.88),
  createSentence('i17', 'Would you mind explaining that again?', 'intermediate', 'questions', 0.85),
  createSentence('i18', 'Can you send me the document please?', 'intermediate', 'questions', 0.88),
  createSentence('i19', 'What do you think about this idea?', 'intermediate', 'questions', 1.0),
  createSentence('i20', 'Is there anything else you need?', 'intermediate', 'questions', 0.9),

  // Instructions
  createSentence('i21', 'First, open the application.', 'intermediate', 'instructions', 0.82),
  createSentence('i22', 'Click the button to continue.', 'intermediate', 'instructions', 0.85),
  createSentence('i23', 'Enter your name and email address.', 'intermediate', 'instructions', 0.82),
  createSentence('i24', 'Save the file before closing.', 'intermediate', 'instructions', 0.85),
  createSentence('i25', 'Make sure to check your work.', 'intermediate', 'instructions', 0.92),
  createSentence('i26', 'Please read the instructions carefully.', 'intermediate', 'instructions', 0.85),
  createSentence('i27', 'Follow the steps in the guide.', 'intermediate', 'instructions', 0.88),
  createSentence('i28', 'Wait for the page to load.', 'intermediate', 'instructions', 0.9),
  createSentence('i29', 'Select the option that fits best.', 'intermediate', 'instructions', 0.88),
  createSentence('i30', 'Review your changes before submitting.', 'intermediate', 'instructions', 0.78),

  // Conversational
  createSentence('i31', 'That sounds like a great plan.', 'intermediate', 'conversational', 0.92),
  createSentence('i32', 'I completely agree with you on this.', 'intermediate', 'conversational', 0.88),
  createSentence('i33', 'Let me think about it for a moment.', 'intermediate', 'conversational', 0.92),
  createSentence('i34', 'We should discuss this further.', 'intermediate', 'conversational', 0.85),
  createSentence('i35', 'I appreciate your help with this.', 'intermediate', 'conversational', 0.88),

  // Common phrases
  createSentence('i36', 'Looking forward to hearing from you.', 'intermediate', 'common_phrases', 0.85),
  createSentence('i37', 'Please let me know if you have questions.', 'intermediate', 'common_phrases', 0.9),
  createSentence('i38', 'Thank you for your time and help.', 'intermediate', 'common_phrases', 0.95),
  createSentence('i39', 'I hope this helps with your work.', 'intermediate', 'common_phrases', 0.9),
  createSentence('i40', 'Feel free to reach out any time.', 'intermediate', 'common_phrases', 0.88),

  // ============================================================
  // ADVANCED - Varied vocabulary
  // ============================================================

  // Classic sentences (pangrams and famous)
  createSentence('a01', 'The quick brown fox jumps over the lazy dog.', 'advanced', 'statements', 0.67),
  createSentence('a02', 'Pack my box with five dozen liquor jugs.', 'advanced', 'statements', 0.55),
  createSentence('a03', 'How vexingly quick daft zebras jump.', 'advanced', 'statements', 0.45),
  createSentence('a04', 'Sphinx of black quartz, judge my vow.', 'advanced', 'statements', 0.42),
  createSentence('a05', 'The five boxing wizards jump quickly.', 'advanced', 'statements', 0.55),

  // Technical statements
  createSentence('a06', 'The algorithm efficiently processes large datasets.', 'advanced', 'technical', 0.55),
  createSentence('a07', 'Configure the settings before running the program.', 'advanced', 'technical', 0.65),
  createSentence('a08', 'The database query returned unexpected results.', 'advanced', 'technical', 0.58),
  createSentence('a09', 'Debug the function to find the issue.', 'advanced', 'technical', 0.72),
  createSentence('a10', 'The server handles thousands of requests per second.', 'advanced', 'technical', 0.62),

  // Complex statements
  createSentence('a11', 'Understanding complex systems requires careful analysis.', 'advanced', 'statements', 0.55),
  createSentence('a12', 'The organization implemented comprehensive policies.', 'advanced', 'statements', 0.48),
  createSentence('a13', 'Effective communication improves collaboration.', 'advanced', 'statements', 0.52),
  createSentence('a14', 'The research demonstrates significant improvements.', 'advanced', 'statements', 0.55),
  createSentence('a15', 'Sustainable practices benefit future generations.', 'advanced', 'statements', 0.48),

  // Advanced questions
  createSentence('a16', 'What methodology would you recommend for this analysis?', 'advanced', 'questions', 0.55),
  createSentence('a17', 'How might we optimize the performance further?', 'advanced', 'questions', 0.65),
  createSentence('a18', 'Could you elaborate on the implementation details?', 'advanced', 'questions', 0.52),
  createSentence('a19', 'What considerations should we prioritize?', 'advanced', 'questions', 0.55),
  createSentence('a20', 'Have you evaluated alternative approaches?', 'advanced', 'questions', 0.58),

  // Technical instructions
  createSentence('a21', 'Initialize the repository with the default configuration.', 'advanced', 'technical', 0.55),
  createSentence('a22', 'Refactor the module to improve maintainability.', 'advanced', 'technical', 0.52),
  createSentence('a23', 'Validate the input parameters before processing.', 'advanced', 'technical', 0.58),
  createSentence('a24', 'Deploy the application to the production environment.', 'advanced', 'technical', 0.55),
  createSentence('a25', 'Monitor the system logs for potential errors.', 'advanced', 'technical', 0.62),

  // Business communication
  createSentence('a26', 'The quarterly report highlights significant progress.', 'advanced', 'statements', 0.55),
  createSentence('a27', 'We should schedule a meeting to discuss priorities.', 'advanced', 'conversational', 0.72),
  createSentence('a28', 'The proposal outlines the recommended approach.', 'advanced', 'statements', 0.58),
  createSentence('a29', 'Please review the attached documentation thoroughly.', 'advanced', 'instructions', 0.62),
  createSentence('a30', 'The team successfully completed the milestone.', 'advanced', 'statements', 0.68),

  // Professional phrases
  createSentence('a31', 'I would appreciate your feedback on this matter.', 'advanced', 'common_phrases', 0.72),
  createSentence('a32', 'Thank you for bringing this to our attention.', 'advanced', 'common_phrases', 0.78),
  createSentence('a33', 'Please do not hesitate to contact me.', 'advanced', 'common_phrases', 0.75),
  createSentence('a34', 'I look forward to your response.', 'advanced', 'common_phrases', 0.82),
  createSentence('a35', 'Your cooperation is greatly appreciated.', 'advanced', 'common_phrases', 0.68),

  // Varied complex sentences
  createSentence('a36', 'Innovation requires embracing calculated risks.', 'advanced', 'statements', 0.52),
  createSentence('a37', 'The architecture supports horizontal scaling.', 'advanced', 'technical', 0.52),
  createSentence('a38', 'Quality assurance ensures reliable deliverables.', 'advanced', 'statements', 0.48),
  createSentence('a39', 'Strategic planning guides organizational growth.', 'advanced', 'statements', 0.48),
  createSentence('a40', 'Continuous improvement drives long-term success.', 'advanced', 'statements', 0.55),
];

/**
 * Category metadata for UI display.
 */
export interface SentenceCategoryInfo {
  id: SentenceCategory;
  displayName: string;
  description: string;
  icon: string;
}

/**
 * Category definitions for sentence practice.
 */
export const SENTENCE_CATEGORIES: SentenceCategoryInfo[] = [
  {
    id: 'common_phrases',
    displayName: 'Common Phrases',
    description: 'Everyday expressions and greetings',
    icon: '💬',
  },
  {
    id: 'questions',
    displayName: 'Questions',
    description: 'Interrogative sentences',
    icon: '❓',
  },
  {
    id: 'statements',
    displayName: 'Statements',
    description: 'Declarative sentences',
    icon: '📝',
  },
  {
    id: 'instructions',
    displayName: 'Instructions',
    description: 'Step-by-step directions',
    icon: '📋',
  },
  {
    id: 'conversational',
    displayName: 'Conversational',
    description: 'Casual dialogue and responses',
    icon: '🗣️',
  },
  {
    id: 'technical',
    displayName: 'Technical',
    description: 'Professional and technical content',
    icon: '⚙️',
  },
];

// ============================================================
// Utility Functions
// ============================================================

/**
 * Get all sentences for a specific difficulty level.
 */
export function getSentencesByDifficulty(difficulty: SentenceDifficulty): PracticeSentence[] {
  return PRACTICE_SENTENCES.filter(s => s.difficulty === difficulty);
}

/**
 * Get all sentences for a specific category.
 */
export function getSentencesByCategory(category: SentenceCategory): PracticeSentence[] {
  return PRACTICE_SENTENCES.filter(s => s.category === category);
}

/**
 * Get sentences matching both difficulty and category.
 */
export function getSentences(
  difficulty?: SentenceDifficulty,
  category?: SentenceCategory
): PracticeSentence[] {
  return PRACTICE_SENTENCES.filter(s => {
    if (difficulty && s.difficulty !== difficulty) return false;
    if (category && s.category !== category) return false;
    return true;
  });
}

/**
 * Get a random sentence from the database.
 */
export function getRandomSentence(
  difficulty?: SentenceDifficulty,
  category?: SentenceCategory
): PracticeSentence | null {
  const candidates = getSentences(difficulty, category);
  if (candidates.length === 0) return null;
  return candidates[Math.floor(Math.random() * candidates.length)];
}

/**
 * Get sentence by ID.
 */
export function getSentenceById(id: string): PracticeSentence | undefined {
  return PRACTICE_SENTENCES.find(s => s.id === id);
}

/**
 * Get category info by ID.
 */
export function getSentenceCategoryInfo(category: SentenceCategory): SentenceCategoryInfo | undefined {
  return SENTENCE_CATEGORIES.find(c => c.id === category);
}

/**
 * Count sentences by difficulty level.
 */
export function getSentenceCountByDifficulty(): Record<SentenceDifficulty, number> {
  return {
    beginner: getSentencesByDifficulty('beginner').length,
    intermediate: getSentencesByDifficulty('intermediate').length,
    advanced: getSentencesByDifficulty('advanced').length,
  };
}

/**
 * Get sentences sorted by chord coverage (easiest first).
 */
export function getSentencesByChordCoverage(
  difficulty?: SentenceDifficulty
): PracticeSentence[] {
  const sentences = difficulty
    ? getSentencesByDifficulty(difficulty)
    : [...PRACTICE_SENTENCES];

  return sentences.sort((a, b) => b.chordCoverage - a.chordCoverage);
}

/**
 * Get sentences with minimum chord coverage.
 */
export function getSentencesWithMinCoverage(
  minCoverage: number,
  difficulty?: SentenceDifficulty
): PracticeSentence[] {
  return getSentences(difficulty).filter(s => s.chordCoverage >= minCoverage);
}

/**
 * Count total words across all sentences.
 */
export function getTotalWordCount(): number {
  return PRACTICE_SENTENCES.reduce((sum, s) => sum + s.words.length, 0);
}

/**
 * Get unique words across all sentences.
 */
export function getUniqueWords(): Set<string> {
  const words = new Set<string>();
  for (const sentence of PRACTICE_SENTENCES) {
    for (const word of sentence.words) {
      // Normalize: lowercase, remove punctuation
      const normalized = word.toLowerCase().replace(/[.,!?;:'"]/g, '');
      if (normalized.length > 0) {
        words.add(normalized);
      }
    }
  }
  return words;
}
