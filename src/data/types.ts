export interface ChordEntry {
  chord: string;
  word: string;
  rank: number | null;
}

export interface WordEntry {
  word: string;
  chords: string[];
  rank: number | null;
}
