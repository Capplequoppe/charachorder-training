/**
 * Semantic Categories Configuration
 *
 * Defines word categories for semantic grouping to leverage
 * category-based memory and enable focused practice on word types.
 */

/**
 * Semantic category identifiers.
 */
export type SemanticCategory =
  | 'determiner'
  | 'pronoun'
  | 'preposition'
  | 'conjunction'
  | 'verb_common'
  | 'verb_modal'
  | 'noun_common'
  | 'adjective'
  | 'adverb'
  | 'time'
  | 'place'
  | 'question'
  | 'negation'
  | 'action'
  | 'common';

/**
 * Full category definition with metadata for UI display.
 */
export interface CategoryDefinition {
  /** Category identifier */
  id: SemanticCategory;
  /** Human-readable name */
  displayName: string;
  /** Brief description */
  description: string;
  /** Emoji icon */
  icon: string;
  /** Theme color (hex) */
  color: string;
  /** Example words */
  examples: string[];
  /** Learning tip for this category */
  learningTip: string;
  /** Priority for learning order (lower = more important) */
  priority: number;
}

/**
 * Complete category definitions.
 */
export const CATEGORY_DEFINITIONS: CategoryDefinition[] = [
  {
    id: 'determiner',
    displayName: 'Determiners',
    description: 'Words that introduce nouns (the, a, this, that)',
    icon: '📌',
    color: '#3498DB',
    examples: ['the', 'a', 'an', 'this', 'that', 'these', 'those', 'my', 'your', 'some'],
    learningTip: 'These are the most frequent words in English. Master them first!',
    priority: 1,
  },
  {
    id: 'pronoun',
    displayName: 'Pronouns',
    description: 'Words that replace nouns (I, you, he, she)',
    icon: '👤',
    color: '#9B59B6',
    examples: ['i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them'],
    learningTip: 'Pronouns appear in almost every sentence. High frequency = high value!',
    priority: 2,
  },
  {
    id: 'preposition',
    displayName: 'Prepositions',
    description: 'Words showing relationship (in, on, at, to)',
    icon: '📍',
    color: '#E74C3C',
    examples: ['in', 'on', 'at', 'to', 'for', 'with', 'from', 'by', 'of', 'about'],
    learningTip: 'Prepositions connect ideas spatially and temporally.',
    priority: 3,
  },
  {
    id: 'conjunction',
    displayName: 'Conjunctions',
    description: 'Words that connect clauses (and, but, or)',
    icon: '🔗',
    color: '#F1C40F',
    examples: ['and', 'but', 'or', 'if', 'when', 'because', 'while', 'although', 'so', 'yet'],
    learningTip: 'Conjunctions are the glue that holds your sentences together.',
    priority: 4,
  },
  {
    id: 'verb_common',
    displayName: 'Common Verbs',
    description: 'Everyday action words (go, come, make, take)',
    icon: '⚡',
    color: '#2ECC71',
    examples: ['go', 'come', 'make', 'take', 'get', 'give', 'see', 'know', 'think', 'want'],
    learningTip: 'Verbs are the engine of every sentence. These are the most used!',
    priority: 5,
  },
  {
    id: 'action',
    displayName: 'Action Words',
    description: 'Words describing actions and activities',
    icon: '🎬',
    color: '#27AE60',
    examples: ['start', 'stop', 'work', 'run', 'show', 'tell', 'step', 'stand'],
    learningTip: 'Action words bring your sentences to life!',
    priority: 5,
  },
  {
    id: 'verb_modal',
    displayName: 'Modal Verbs',
    description: 'Helping verbs (can, will, would, could)',
    icon: '💭',
    color: '#1ABC9C',
    examples: ['can', 'will', 'would', 'could', 'should', 'may', 'might', 'must'],
    learningTip: 'Modals express possibility, ability, and obligation.',
    priority: 6,
  },
  {
    id: 'time',
    displayName: 'Time Words',
    description: 'Words about when (now, then, before, after)',
    icon: '⏰',
    color: '#E67E22',
    examples: ['now', 'then', 'before', 'after', 'when', 'always', 'never', 'soon', 'still', 'yet'],
    learningTip: 'Time words help sequence your ideas and tell stories.',
    priority: 7,
  },
  {
    id: 'place',
    displayName: 'Place Words',
    description: 'Words about where (here, there, where)',
    icon: '🗺️',
    color: '#16A085',
    examples: ['here', 'there', 'where', 'up', 'down', 'out', 'back', 'over', 'under'],
    learningTip: 'Place words locate your ideas in space.',
    priority: 8,
  },
  {
    id: 'question',
    displayName: 'Question Words',
    description: 'Words that ask (who, what, when, where, why)',
    icon: '❓',
    color: '#8E44AD',
    examples: ['who', 'what', 'when', 'where', 'why', 'how', 'which'],
    learningTip: 'Questions drive conversation and curiosity.',
    priority: 9,
  },
  {
    id: 'negation',
    displayName: 'Negation Words',
    description: 'Words that negate (not, never, no)',
    icon: '🚫',
    color: '#C0392B',
    examples: ['not', 'never', 'no', "don't", "can't", "won't", "isn't", "aren't"],
    learningTip: 'Negation words flip the meaning of sentences.',
    priority: 10,
  },
  {
    id: 'adjective',
    displayName: 'Adjectives',
    description: 'Words that describe (good, new, first)',
    icon: '🎨',
    color: '#FF6B6B',
    examples: ['good', 'new', 'first', 'last', 'long', 'great', 'little', 'own', 'other', 'old'],
    learningTip: 'Adjectives add color and detail to your writing.',
    priority: 11,
  },
  {
    id: 'adverb',
    displayName: 'Adverbs',
    description: 'Words that modify verbs (very, also, just)',
    icon: '🏃',
    color: '#4ECDC4',
    examples: ['very', 'also', 'just', 'only', 'even', 'well', 'really', 'much', 'already'],
    learningTip: 'Adverbs modify actions and add nuance.',
    priority: 12,
  },
  {
    id: 'noun_common',
    displayName: 'Common Nouns',
    description: 'Everyday things and concepts (time, people, way)',
    icon: '📦',
    color: '#95A5A6',
    examples: ['time', 'people', 'way', 'day', 'man', 'woman', 'child', 'world', 'life', 'hand'],
    learningTip: 'These nouns appear frequently across all topics.',
    priority: 13,
  },
  {
    id: 'common',
    displayName: 'Common Words',
    description: 'Other frequently used words',
    icon: '📝',
    color: '#7F8C8D',
    examples: ['yes', 'more', 'most', 'such', 'even', 'any', 'same'],
    learningTip: 'High-frequency words that fit multiple categories.',
    priority: 14,
  },
];

/**
 * Map from category ID to definition.
 */
export const CATEGORY_MAP: Map<SemanticCategory, CategoryDefinition> = new Map(
  CATEGORY_DEFINITIONS.map((def) => [def.id, def])
);

/**
 * Word to category assignments.
 * Comprehensive mapping of common English words.
 */
export const WORD_CATEGORIES: Record<string, SemanticCategory> = {
  // Determiners
  the: 'determiner',
  a: 'determiner',
  an: 'determiner',
  this: 'determiner',
  that: 'determiner',
  these: 'determiner',
  those: 'determiner',
  my: 'determiner',
  your: 'determiner',
  his: 'determiner',
  her: 'determiner',
  its: 'determiner',
  our: 'determiner',
  their: 'determiner',
  some: 'determiner',
  any: 'determiner',
  no: 'determiner',
  every: 'determiner',
  each: 'determiner',
  all: 'determiner',
  both: 'determiner',
  few: 'determiner',
  many: 'determiner',
  much: 'determiner',
  most: 'determiner',

  // Pronouns
  i: 'pronoun',
  you: 'pronoun',
  he: 'pronoun',
  she: 'pronoun',
  it: 'pronoun',
  we: 'pronoun',
  they: 'pronoun',
  me: 'pronoun',
  him: 'pronoun',
  us: 'pronoun',
  them: 'pronoun',
  myself: 'pronoun',
  yourself: 'pronoun',
  himself: 'pronoun',
  herself: 'pronoun',
  itself: 'pronoun',
  ourselves: 'pronoun',
  themselves: 'pronoun',

  // Prepositions
  in: 'preposition',
  on: 'preposition',
  at: 'preposition',
  to: 'preposition',
  for: 'preposition',
  with: 'preposition',
  from: 'preposition',
  by: 'preposition',
  of: 'preposition',
  about: 'preposition',
  into: 'preposition',
  through: 'preposition',
  during: 'preposition',
  before: 'preposition',
  after: 'preposition',
  above: 'preposition',
  below: 'preposition',
  between: 'preposition',
  under: 'preposition',
  over: 'preposition',
  against: 'preposition',
  without: 'preposition',
  within: 'preposition',

  // Conjunctions
  and: 'conjunction',
  but: 'conjunction',
  or: 'conjunction',
  if: 'conjunction',
  when: 'conjunction',
  because: 'conjunction',
  while: 'conjunction',
  although: 'conjunction',
  unless: 'conjunction',
  since: 'conjunction',
  so: 'conjunction',
  yet: 'conjunction',
  nor: 'conjunction',
  than: 'conjunction',
  as: 'conjunction',

  // Common Verbs
  be: 'verb_common',
  is: 'verb_common',
  are: 'verb_common',
  was: 'verb_common',
  were: 'verb_common',
  been: 'verb_common',
  being: 'verb_common',
  have: 'verb_common',
  has: 'verb_common',
  had: 'verb_common',
  do: 'verb_common',
  does: 'verb_common',
  did: 'verb_common',
  go: 'verb_common',
  come: 'verb_common',
  make: 'verb_common',
  take: 'verb_common',
  get: 'verb_common',
  give: 'verb_common',
  see: 'verb_common',
  know: 'verb_common',
  think: 'verb_common',
  want: 'verb_common',
  say: 'verb_common',
  tell: 'verb_common',
  find: 'verb_common',
  feel: 'verb_common',
  try: 'verb_common',
  leave: 'verb_common',
  call: 'verb_common',
  keep: 'verb_common',
  let: 'verb_common',
  begin: 'verb_common',
  start: 'verb_common',
  stop: 'verb_common',
  show: 'verb_common',
  work: 'verb_common',
  run: 'verb_common',
  move: 'verb_common',
  live: 'verb_common',
  look: 'verb_common',
  need: 'verb_common',
  help: 'verb_common',
  put: 'verb_common',
  set: 'verb_common',
  turn: 'verb_common',
  stand: 'verb_common',

  // Modal Verbs
  can: 'verb_modal',
  will: 'verb_modal',
  would: 'verb_modal',
  could: 'verb_modal',
  should: 'verb_modal',
  may: 'verb_modal',
  might: 'verb_modal',
  must: 'verb_modal',
  shall: 'verb_modal',

  // Time Words
  now: 'time',
  then: 'time',
  always: 'time',
  never: 'time',
  soon: 'time',
  still: 'time',
  already: 'time',
  today: 'time',
  tomorrow: 'time',
  yesterday: 'time',
  once: 'time',
  often: 'time',
  sometimes: 'time',
  ever: 'time',
  early: 'time',
  late: 'time',
  first: 'time',
  last: 'time',
  long: 'time',

  // Place Words
  here: 'place',
  there: 'place',
  where: 'place',
  up: 'place',
  down: 'place',
  out: 'place',
  back: 'place',
  away: 'place',
  home: 'place',
  around: 'place',
  near: 'place',
  far: 'place',
  left: 'place',
  right: 'place',
  inside: 'place',
  outside: 'place',
  world: 'place',

  // Question Words
  who: 'question',
  what: 'question',
  why: 'question',
  how: 'question',
  which: 'question',

  // Negation
  not: 'negation',
  "don't": 'negation',
  "doesn't": 'negation',
  "didn't": 'negation',
  "can't": 'negation',
  "won't": 'negation',
  "wouldn't": 'negation',
  "couldn't": 'negation',
  "shouldn't": 'negation',
  "isn't": 'negation',
  "aren't": 'negation',
  "wasn't": 'negation',
  "weren't": 'negation',
  "hasn't": 'negation',
  "haven't": 'negation',
  "hadn't": 'negation',
  nothing: 'negation',
  nobody: 'negation',
  none: 'negation',

  // Adjectives
  good: 'adjective',
  new: 'adjective',
  great: 'adjective',
  little: 'adjective',
  old: 'adjective',
  big: 'adjective',
  small: 'adjective',
  high: 'adjective',
  different: 'adjective',
  large: 'adjective',
  important: 'adjective',
  own: 'adjective',
  other: 'adjective',
  same: 'adjective',
  young: 'adjective',
  real: 'adjective',
  true: 'adjective',
  sure: 'adjective',
  able: 'adjective',
  full: 'adjective',
  free: 'adjective',
  open: 'adjective',
  possible: 'adjective',
  public: 'adjective',

  // Adverbs
  very: 'adverb',
  also: 'adverb',
  just: 'adverb',
  only: 'adverb',
  even: 'adverb',
  well: 'adverb',
  really: 'adverb',
  quite: 'adverb',
  almost: 'adverb',
  perhaps: 'adverb',
  probably: 'adverb',
  maybe: 'adverb',
  however: 'adverb',
  together: 'adverb',
  again: 'adverb',
  too: 'adverb',

  // Common Nouns
  time: 'noun_common',
  people: 'noun_common',
  way: 'noun_common',
  day: 'noun_common',
  man: 'noun_common',
  woman: 'noun_common',
  child: 'noun_common',
  life: 'noun_common',
  hand: 'noun_common',
  part: 'noun_common',
  place: 'noun_common',
  case: 'noun_common',
  week: 'noun_common',
  year: 'noun_common',
  thing: 'noun_common',
  name: 'noun_common',
  group: 'noun_common',
  number: 'noun_common',
  fact: 'noun_common',
  point: 'noun_common',
  story: 'noun_common',
  family: 'noun_common',
  friend: 'noun_common',
  state: 'noun_common',
  step: 'noun_common',

  // Common (misc)
  yes: 'common',
  more: 'common',
  such: 'common',
  like: 'common',
  one: 'common',
  two: 'common',
  three: 'common',
};

/**
 * Gets the category for a word.
 */
export function getWordCategory(word: string): SemanticCategory | undefined {
  return WORD_CATEGORIES[word.toLowerCase()];
}

/**
 * Gets the category definition by ID.
 */
export function getCategoryDefinition(
  id: SemanticCategory
): CategoryDefinition | undefined {
  return CATEGORY_MAP.get(id);
}

/**
 * Gets all words in a category.
 */
export function getWordsByCategory(category: SemanticCategory): string[] {
  return Object.entries(WORD_CATEGORIES)
    .filter(([_, cat]) => cat === category)
    .map(([word]) => word);
}

/**
 * Gets category icon.
 */
export function getCategoryIcon(category: SemanticCategory): string {
  return CATEGORY_MAP.get(category)?.icon ?? '📝';
}

/**
 * Gets category color.
 */
export function getCategoryColor(category: SemanticCategory): string {
  return CATEGORY_MAP.get(category)?.color ?? '#7F8C8D';
}

/**
 * Gets category display name.
 */
export function getCategoryDisplayName(category: SemanticCategory): string {
  return CATEGORY_MAP.get(category)?.displayName ?? category;
}

/**
 * Gets all categories sorted by priority.
 */
export function getCategoriesByPriority(): CategoryDefinition[] {
  return [...CATEGORY_DEFINITIONS].sort((a, b) => a.priority - b.priority);
}
