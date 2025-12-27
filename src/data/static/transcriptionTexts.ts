/**
 * Transcription Texts Data
 *
 * Curated texts for transcription practice, organized by category
 * and difficulty for realistic typing exercises.
 */

/**
 * Transcription text categories.
 */
export type TranscriptionCategory =
  | 'quotes'
  | 'stories'
  | 'articles'
  | 'code_comments'
  | 'emails'
  | 'poetry';

/**
 * Difficulty levels for transcription texts.
 */
export type TranscriptionDifficulty = 'beginner' | 'intermediate' | 'advanced' | 'expert';

/**
 * Transcription text structure.
 */
export interface TranscriptionText {
  /** Unique identifier */
  id: string;
  /** Display title */
  title: string;
  /** Full text content */
  content: string;
  /** Word count */
  wordCount: number;
  /** Difficulty level */
  difficulty: TranscriptionDifficulty;
  /** Text category */
  category: TranscriptionCategory;
  /** Estimated completion time in minutes */
  estimatedTimeMinutes: number;
  /** Percentage of words with known chords (0-1) */
  chordablePercentage: number;
  /** Source attribution (optional) */
  source?: string;
}

/**
 * Category metadata for UI display.
 */
export interface TranscriptionCategoryInfo {
  id: TranscriptionCategory;
  displayName: string;
  description: string;
  icon: string;
}

/**
 * Category definitions for transcription practice.
 */
export const TRANSCRIPTION_CATEGORIES: TranscriptionCategoryInfo[] = [
  {
    id: 'quotes',
    displayName: 'Quotes',
    description: 'Inspirational and famous quotes',
    icon: '💬',
  },
  {
    id: 'stories',
    displayName: 'Stories',
    description: 'Narrative excerpts and short stories',
    icon: '📖',
  },
  {
    id: 'articles',
    displayName: 'Articles',
    description: 'News and informational content',
    icon: '📰',
  },
  {
    id: 'code_comments',
    displayName: 'Code Comments',
    description: 'Technical documentation and comments',
    icon: '💻',
  },
  {
    id: 'emails',
    displayName: 'Emails',
    description: 'Professional email templates',
    icon: '📧',
  },
  {
    id: 'poetry',
    displayName: 'Poetry',
    description: 'Poems and lyrical content',
    icon: '🎭',
  },
];

/**
 * Count words in a text string.
 */
function countWords(text: string): number {
  return text.split(/\s+/).filter(w => w.length > 0).length;
}

/**
 * Estimate time based on word count and difficulty.
 */
function estimateTime(wordCount: number, difficulty: TranscriptionDifficulty): number {
  // Assume different WPM based on difficulty
  const wpmByDifficulty: Record<TranscriptionDifficulty, number> = {
    beginner: 30,
    intermediate: 40,
    advanced: 50,
    expert: 60,
  };
  return Math.ceil(wordCount / wpmByDifficulty[difficulty]);
}

/**
 * Create a transcription text entry.
 */
function createText(
  id: string,
  title: string,
  content: string,
  difficulty: TranscriptionDifficulty,
  category: TranscriptionCategory,
  chordablePercentage: number,
  source?: string
): TranscriptionText {
  const wordCount = countWords(content);
  return {
    id,
    title,
    content,
    wordCount,
    difficulty,
    category,
    estimatedTimeMinutes: estimateTime(wordCount, difficulty),
    chordablePercentage,
    source,
  };
}

/**
 * Complete transcription text library.
 */
export const TRANSCRIPTION_TEXTS: TranscriptionText[] = [
  // ============================================================
  // QUOTES - Short, memorable texts
  // ============================================================

  createText(
    'quote1',
    'On Great Work',
    'The only way to do great work is to love what you do.',
    'beginner',
    'quotes',
    0.92,
    'Steve Jobs'
  ),

  createText(
    'quote2',
    'On Success',
    'Success is not final, failure is not fatal: it is the courage to continue that counts.',
    'beginner',
    'quotes',
    0.88,
    'Winston Churchill'
  ),

  createText(
    'quote3',
    'On Learning',
    'The more that you read, the more things you will know. The more that you learn, the more places you will go.',
    'beginner',
    'quotes',
    0.95,
    'Dr. Seuss'
  ),

  createText(
    'quote4',
    'On Innovation',
    'Innovation distinguishes between a leader and a follower. Stay hungry, stay foolish. Think different.',
    'intermediate',
    'quotes',
    0.82,
    'Steve Jobs'
  ),

  createText(
    'quote5',
    'On Knowledge',
    'The beautiful thing about learning is that no one can take it away from you. Education is the passport to the future, for tomorrow belongs to those who prepare for it today.',
    'intermediate',
    'quotes',
    0.85
  ),

  // ============================================================
  // EMAILS - Professional communication
  // ============================================================

  createText(
    'email1',
    'Quick Follow-up',
    `Hi there,

I wanted to follow up on our meeting from last week. Could you please send me the notes when you have a chance?

Thanks,
John`,
    'beginner',
    'emails',
    0.90
  ),

  createText(
    'email2',
    'Meeting Request',
    `Dear Team,

I would like to schedule a meeting to discuss the upcoming project deadline. Please let me know your availability for this Thursday or Friday afternoon.

Best regards,
Sarah`,
    'intermediate',
    'emails',
    0.88
  ),

  createText(
    'email3',
    'Project Update',
    `Hello everyone,

I wanted to provide a quick update on the current project status. We have completed the initial design phase and are now moving into development. The team has been making excellent progress, and we are on track to meet our deadline.

Please review the attached documents and share any feedback by end of day Friday.

Thank you for your continued support.

Best,
Michael`,
    'intermediate',
    'emails',
    0.85
  ),

  createText(
    'email4',
    'Client Proposal',
    `Dear Mr. Johnson,

Thank you for taking the time to discuss your requirements with us last week. Based on our conversation, I have prepared a comprehensive proposal that outlines our recommended approach, timeline, and investment.

Our team has extensive experience with similar projects and we are confident we can deliver exceptional results. The proposal includes three different packages to suit your specific needs and budget.

I look forward to hearing your thoughts and am happy to schedule a call to discuss any questions you may have.

Warm regards,
Jennifer Smith
Senior Account Manager`,
    'advanced',
    'emails',
    0.80
  ),

  // ============================================================
  // CODE COMMENTS - Technical documentation
  // ============================================================

  createText(
    'code1',
    'Function Description',
    'This function calculates the total price including tax. It takes the base price and tax rate as parameters and returns the final amount.',
    'intermediate',
    'code_comments',
    0.78
  ),

  createText(
    'code2',
    'API Documentation',
    `This endpoint handles user authentication. It accepts a POST request with username and password in the request body. On success, it returns a JSON object containing the access token and refresh token. The access token expires after one hour.`,
    'intermediate',
    'code_comments',
    0.72
  ),

  createText(
    'code3',
    'Algorithm Explanation',
    `The binary search algorithm works by repeatedly dividing the search interval in half. If the value of the search key is less than the item in the middle of the interval, the algorithm continues on the lower half. Otherwise, it continues on the upper half. This process continues until the value is found or the interval is empty.`,
    'advanced',
    'code_comments',
    0.75
  ),

  createText(
    'code4',
    'Module Overview',
    `This module provides utilities for handling date and time operations across different time zones. It includes functions for parsing, formatting, and comparing dates, as well as calculating differences between timestamps. The implementation follows the ISO 8601 standard and supports both local and UTC time representations.

Key functions include: parseDate, formatDate, getTimeDiff, convertTimeZone, and isValidDate. All functions handle edge cases gracefully and throw descriptive errors when invalid input is provided.`,
    'advanced',
    'code_comments',
    0.70
  ),

  // ============================================================
  // STORIES - Narrative content
  // ============================================================

  createText(
    'story1',
    'The Harbor',
    'Once upon a time, in a small village by the sea, there lived a young girl who dreamed of adventure. Every day she would sit by the harbor and watch the ships sail away to distant lands.',
    'beginner',
    'stories',
    0.88
  ),

  createText(
    'story2',
    'The Old Library',
    `The old library stood at the corner of Main Street, its weathered brick walls holding centuries of stories. Inside, dust motes danced in shafts of afternoon sunlight, and the scent of aging paper filled the air. Mrs. Chen, the librarian, knew every book by heart.`,
    'intermediate',
    'stories',
    0.82
  ),

  createText(
    'story3',
    'Mountain Journey',
    `The path wound upward through the ancient forest, each step taking them higher into the misty mountains. They had been walking since dawn, and the afternoon sun was beginning its slow descent toward the horizon. Somewhere above, hidden in the clouds, lay the temple they sought.

The travelers paused at a clearing to catch their breath. Below them, the village they had left that morning was now just a cluster of tiny dots. Ahead, the path grew steeper and more treacherous.`,
    'advanced',
    'stories',
    0.78
  ),

  createText(
    'story4',
    'The Last Letter',
    `My dearest friend,

I am writing to you from a small cafe in Paris, watching the rain fall on the cobblestone streets outside. It has been many years since we last spoke, and there is so much I wish to tell you.

Life has taken me to places I never imagined. I have seen the northern lights dancing across frozen skies, walked through ancient temples in lands far from home, and met people whose kindness restored my faith in humanity.

Yet through all these adventures, I have never forgotten the promises we made as children. Perhaps it is time to come home.

Always yours,
Emma`,
    'advanced',
    'stories',
    0.80
  ),

  // ============================================================
  // ARTICLES - Informational content
  // ============================================================

  createText(
    'article1',
    'Climate Change',
    'Scientists have discovered that global temperatures have risen significantly over the past century. This change is affecting weather patterns around the world and causing sea levels to rise.',
    'intermediate',
    'articles',
    0.82
  ),

  createText(
    'article2',
    'Technology Trends',
    `The rapid advancement of artificial intelligence is transforming industries across the globe. From healthcare to transportation, machine learning algorithms are being used to solve complex problems and improve efficiency. Experts predict that these technologies will continue to evolve and play an increasingly important role in our daily lives.`,
    'intermediate',
    'articles',
    0.75
  ),

  createText(
    'article3',
    'Space Exploration',
    `Scientists announced today that they have discovered evidence of water on a distant exoplanet. This finding significantly increases the chances of finding life beyond Earth. The planet, located approximately forty light-years away, orbits within its star's habitable zone.

The discovery was made using data from the James Webb Space Telescope, which has been providing unprecedented views of the cosmos since its launch. Researchers are now planning follow-up observations to learn more about the planet's atmosphere and surface conditions.`,
    'advanced',
    'articles',
    0.72
  ),

  createText(
    'article4',
    'Economic Analysis',
    `The global economy faces unprecedented challenges as nations navigate the complex interplay of inflation, supply chain disruptions, and shifting consumer behavior. Central banks around the world are implementing various monetary policies to stabilize markets and promote sustainable growth.

Recent data suggests that employment rates are recovering in most developed economies, though certain sectors continue to struggle with labor shortages. Economists emphasize the importance of balanced fiscal policies and international cooperation in addressing these systemic issues.

Looking ahead, experts predict a gradual stabilization of markets, though the timeline for full recovery remains uncertain. Businesses are advised to maintain flexibility and invest in resilient supply chains.`,
    'expert',
    'articles',
    0.68
  ),

  // ============================================================
  // POETRY - Lyrical content
  // ============================================================

  createText(
    'poetry1',
    'The Road Not Taken (Excerpt)',
    `Two roads diverged in a yellow wood,
And sorry I could not travel both
And be one traveler, long I stood
And looked down one as far as I could
To where it bent in the undergrowth.`,
    'intermediate',
    'poetry',
    0.85,
    'Robert Frost'
  ),

  createText(
    'poetry2',
    'Hope',
    `Hope is the thing with feathers
That perches in the soul,
And sings the tune without the words,
And never stops at all.`,
    'beginner',
    'poetry',
    0.90,
    'Emily Dickinson'
  ),

  createText(
    'poetry3',
    'Invictus (Excerpt)',
    `Out of the night that covers me,
Black as the pit from pole to pole,
I thank whatever gods may be
For my unconquerable soul.

In the fell clutch of circumstance
I have not winced nor cried aloud.
Under the bludgeonings of chance
My head is bloody, but unbowed.`,
    'advanced',
    'poetry',
    0.78,
    'William Ernest Henley'
  ),

  createText(
    'poetry4',
    'Stopping by Woods',
    `Whose woods these are I think I know.
His house is in the village though;
He will not see me stopping here
To watch his woods fill up with snow.

My little horse must think it queer
To stop without a farmhouse near
Between the woods and frozen lake
The darkest evening of the year.`,
    'intermediate',
    'poetry',
    0.88,
    'Robert Frost'
  ),
];

// ============================================================
// Utility Functions
// ============================================================

/**
 * Get all texts for a specific difficulty level.
 */
export function getTextsByDifficulty(difficulty: TranscriptionDifficulty): TranscriptionText[] {
  return TRANSCRIPTION_TEXTS.filter(t => t.difficulty === difficulty);
}

/**
 * Get all texts for a specific category.
 */
export function getTextsByCategory(category: TranscriptionCategory): TranscriptionText[] {
  return TRANSCRIPTION_TEXTS.filter(t => t.category === category);
}

/**
 * Get texts matching both difficulty and category.
 */
export function getTexts(
  difficulty?: TranscriptionDifficulty,
  category?: TranscriptionCategory
): TranscriptionText[] {
  return TRANSCRIPTION_TEXTS.filter(t => {
    if (difficulty && t.difficulty !== difficulty) return false;
    if (category && t.category !== category) return false;
    return true;
  });
}

/**
 * Get a random text from the library.
 */
export function getRandomText(
  difficulty?: TranscriptionDifficulty,
  category?: TranscriptionCategory
): TranscriptionText | null {
  const candidates = getTexts(difficulty, category);
  if (candidates.length === 0) return null;
  return candidates[Math.floor(Math.random() * candidates.length)];
}

/**
 * Get text by ID.
 */
export function getTextById(id: string): TranscriptionText | undefined {
  return TRANSCRIPTION_TEXTS.find(t => t.id === id);
}

/**
 * Get category info by ID.
 */
export function getTranscriptionCategoryInfo(category: TranscriptionCategory): TranscriptionCategoryInfo | undefined {
  return TRANSCRIPTION_CATEGORIES.find(c => c.id === category);
}

/**
 * Count texts by difficulty level.
 */
export function getTextCountByDifficulty(): Record<TranscriptionDifficulty, number> {
  return {
    beginner: getTextsByDifficulty('beginner').length,
    intermediate: getTextsByDifficulty('intermediate').length,
    advanced: getTextsByDifficulty('advanced').length,
    expert: getTextsByDifficulty('expert').length,
  };
}

/**
 * Get texts sorted by estimated time.
 */
export function getTextsByTime(ascending: boolean = true): TranscriptionText[] {
  const sorted = [...TRANSCRIPTION_TEXTS].sort(
    (a, b) => a.estimatedTimeMinutes - b.estimatedTimeMinutes
  );
  return ascending ? sorted : sorted.reverse();
}

/**
 * Get texts with minimum chordable percentage.
 */
export function getTextsWithMinChordable(minPercentage: number): TranscriptionText[] {
  return TRANSCRIPTION_TEXTS.filter(t => t.chordablePercentage >= minPercentage);
}

/**
 * Get total character count across all texts.
 */
export function getTotalCharacterCount(): number {
  return TRANSCRIPTION_TEXTS.reduce((sum, t) => sum + t.content.length, 0);
}
