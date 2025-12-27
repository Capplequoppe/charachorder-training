/**
 * Practice Components
 *
 * Components for sentence practice and typing exercises.
 */

// Sentence Practice
export { SentencePractice, default as SentencePracticeDefault } from './SentencePractice';
export type { SentencePracticeProps } from './SentencePractice';

export { WordHighlight, ChordHint } from './WordHighlight';
export type { WordHighlightProps, ChordHintProps, WordStatus } from './WordHighlight';

export { SentenceResultsDisplay, CompactResults } from './SentenceResults';
export type { SentenceResultsDisplayProps, CompactResultsProps } from './SentenceResults';

// Transcription Mode
export { TranscriptionMode, default as TranscriptionModeDefault } from './TranscriptionMode';
export type { TranscriptionModeProps } from './TranscriptionMode';

export { TranscriptionDisplay, TranscriptionDisplayCompact } from './TranscriptionDisplay';
export type { TranscriptionDisplayProps } from './TranscriptionDisplay';

export { TranscriptionStats, CompactStats, WpmGauge } from './TranscriptionStats';
export type { TranscriptionStatsProps, CompactStatsProps, WpmGaugeProps } from './TranscriptionStats';

export { TranscriptionResults } from './TranscriptionResults';
export type { TranscriptionResultsProps } from './TranscriptionResults';
