/**
 * Character Display Utilities
 *
 * Helpers for displaying characters clearly, especially punctuation
 * that can be visually confusing.
 */

/**
 * Characters that benefit from visual reference lines.
 * These are punctuation marks that can be confused with each other
 * due to similar shapes but different vertical positions.
 */
export const CHARACTERS_NEEDING_REFERENCE: Set<string> = new Set([
  ',',  // comma - hangs below baseline
  "'",  // apostrophe - sits at top
  '.',  // period - sits on baseline
  ';',  // semicolon - dot on baseline, tail below
  ':',  // colon - dots stacked at middle
  '`',  // backtick - sits at top, different angle than apostrophe
  '"',  // double quote
]);

/**
 * Human-readable names for characters.
 */
export const CHARACTER_NAMES: Record<string, string> = {
  ',': 'comma',
  "'": 'apostrophe',
  '.': 'period',
  ';': 'semicolon',
  ':': 'colon',
  '`': 'backtick',
  '"': 'double quote',
  '!': 'exclamation',
  '?': 'question mark',
  '-': 'hyphen',
  '_': 'underscore',
  '/': 'slash',
  '\\': 'backslash',
  '(': 'open paren',
  ')': 'close paren',
  '[': 'open bracket',
  ']': 'close bracket',
  '{': 'open brace',
  '}': 'close brace',
  '<': 'less than',
  '>': 'greater than',
  '=': 'equals',
  '+': 'plus',
  '*': 'asterisk',
  '&': 'ampersand',
  '@': 'at sign',
  '#': 'hash',
  '$': 'dollar',
  '%': 'percent',
  '^': 'caret',
  '~': 'tilde',
  '|': 'pipe',
};

/**
 * Check if a character benefits from visual reference lines.
 */
export function needsVisualReference(char: string): boolean {
  return CHARACTERS_NEEDING_REFERENCE.has(char);
}

/**
 * Get the human-readable name for a character.
 * Returns undefined if no special name is defined.
 */
export function getCharacterName(char: string): string | undefined {
  return CHARACTER_NAMES[char];
}

/**
 * Get display information for a character.
 */
export function getCharacterDisplayInfo(char: string): {
  needsReference: boolean;
  name: string | undefined;
  displayChar: string;
} {
  return {
    needsReference: needsVisualReference(char),
    name: getCharacterName(char),
    displayChar: char.toUpperCase(),
  };
}
