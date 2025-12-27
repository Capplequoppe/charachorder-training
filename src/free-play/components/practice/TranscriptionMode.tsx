/**
 * Transcription Mode Component
 *
 * Main component for free-form transcription practice.
 * Users type displayed text while tracking WPM, accuracy, and chord usage.
 */

import React, { useState, useCallback, useRef, useMemo } from 'react';
import {
  type TranscriptionText,
  type TranscriptionDifficulty,
  type TranscriptionCategory,
  TRANSCRIPTION_CATEGORIES,
} from '@/data/static/transcriptionTexts';
import {
  type TranscriptionSession,
  type TranscriptionAnalysis,
  type KeystrokeEvent,
  getTranscriptionService,
} from '@/free-play/services/TranscriptionService';
import { TranscriptionDisplay } from './TranscriptionDisplay';
import { TranscriptionStats } from './TranscriptionStats';
import { TranscriptionResults } from './TranscriptionResults';
import './practice.css';

export interface TranscriptionModeProps {
  /** Called when transcription is complete */
  onComplete?: (analysis: TranscriptionAnalysis) => void;
  /** Called when user exits */
  onExit?: () => void;
  /** Initial difficulty filter */
  difficulty?: TranscriptionDifficulty;
  /** Initial category filter */
  category?: TranscriptionCategory;
}

type Phase = 'select' | 'preview' | 'typing' | 'results';

/**
 * Text selector component for choosing transcription text.
 */
function TextSelector({
  onSelect,
  difficulty,
  category,
  onDifficultyChange,
  onCategoryChange,
}: {
  onSelect: (text: TranscriptionText) => void;
  difficulty?: TranscriptionDifficulty;
  category?: TranscriptionCategory;
  onDifficultyChange: (d: TranscriptionDifficulty | undefined) => void;
  onCategoryChange: (c: TranscriptionCategory | undefined) => void;
}) {
  const service = getTranscriptionService();

  const texts = useMemo(() => {
    let filtered = service.getAllTexts();
    if (difficulty) {
      filtered = filtered.filter(t => t.difficulty === difficulty);
    }
    if (category) {
      filtered = filtered.filter(t => t.category === category);
    }
    return filtered;
  }, [difficulty, category, service]);

  return (
    <div className="text-selector">
      <h2>Choose a Text</h2>
      <p>Select a text to transcribe based on your skill level.</p>

      <div className="selector-filters">
        <div className="filter-group">
          <label>Difficulty</label>
          <div className="button-group">
            {(['beginner', 'intermediate', 'advanced', 'expert'] as TranscriptionDifficulty[]).map(d => (
              <button
                key={d}
                className={`filter-button ${difficulty === d ? 'active' : ''}`}
                onClick={() => onDifficultyChange(difficulty === d ? undefined : d)}
              >
                {d.charAt(0).toUpperCase() + d.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="filter-group">
          <label>Category</label>
          <div className="button-group">
            {TRANSCRIPTION_CATEGORIES.map(cat => (
              <button
                key={cat.id}
                className={`filter-button ${category === cat.id ? 'active' : ''}`}
                onClick={() => onCategoryChange(category === cat.id ? undefined : cat.id)}
                title={cat.description}
              >
                <span className="icon">{cat.icon}</span>
                {cat.displayName}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="text-grid">
        {texts.map(text => (
          <div
            key={text.id}
            className="text-card"
            onClick={() => onSelect(text)}
          >
            <div className="text-card-header">
              <h3>{text.title}</h3>
              <span className={`difficulty-badge ${text.difficulty}`}>
                {text.difficulty}
              </span>
            </div>
            <p className="text-preview">
              {text.content.slice(0, 100)}
              {text.content.length > 100 ? '...' : ''}
            </p>
            <div className="text-card-footer">
              <span>{text.wordCount} words</span>
              <span>{text.estimatedTimeMinutes} min</span>
              <span>{Math.round(text.chordablePercentage * 100)}% chordable</span>
            </div>
          </div>
        ))}
        {texts.length === 0 && (
          <div className="no-texts">
            No texts match your filters. Try adjusting them.
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Preview component before starting transcription.
 */
function TranscriptionPreview({
  text,
  onStart,
  onBack,
}: {
  text: TranscriptionText;
  onStart: () => void;
  onBack: () => void;
}) {
  return (
    <div className="transcription-preview">
      <h2>{text.title}</h2>

      <div className="preview-meta">
        <span className={`difficulty-badge ${text.difficulty}`}>
          {text.difficulty}
        </span>
        <span>{text.wordCount} words</span>
        <span>~{text.estimatedTimeMinutes} min</span>
      </div>

      {text.source && (
        <p className="source">- {text.source}</p>
      )}

      <div className="preview-content">
        {text.content}
      </div>

      <div className="preview-tips">
        <h4>Tips</h4>
        <ul>
          <li>Type at your own pace - accuracy is more important than speed</li>
          <li>Use backspace to correct mistakes</li>
          <li>Try to use chords for common words when possible</li>
          <li>Press Tab + Enter when finished, or click Complete</li>
        </ul>
      </div>

      <div className="preview-actions">
        <button className="secondary-button" onClick={onBack}>
          Back
        </button>
        <button className="primary-button" onClick={onStart} autoFocus>
          Start Typing
        </button>
      </div>
    </div>
  );
}

/**
 * Main transcription mode component.
 */
export function TranscriptionMode({
  onComplete,
  onExit,
  difficulty: initialDifficulty,
  category: initialCategory,
}: TranscriptionModeProps) {
  const [phase, setPhase] = useState<Phase>('select');
  const [selectedText, setSelectedText] = useState<TranscriptionText | null>(null);
  const [session, setSession] = useState<TranscriptionSession | null>(null);
  const [analysis, setAnalysis] = useState<TranscriptionAnalysis | null>(null);
  const [typedText, setTypedText] = useState('');
  const [cursorPosition, setCursorPosition] = useState(0);

  const [difficulty, setDifficulty] = useState<TranscriptionDifficulty | undefined>(initialDifficulty);
  const [category, setCategory] = useState<TranscriptionCategory | undefined>(initialCategory);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const service = useMemo(() => getTranscriptionService(), []);

  // Handle text selection
  const handleTextSelect = useCallback((text: TranscriptionText) => {
    setSelectedText(text);
    setPhase('preview');
  }, []);

  // Start transcription session
  const handleStart = useCallback(() => {
    if (!selectedText) return;

    const newSession = service.startSession(selectedText.id);
    setSession(newSession);
    setTypedText('');
    setCursorPosition(0);
    setPhase('typing');

    setTimeout(() => textareaRef.current?.focus(), 100);
  }, [selectedText, service]);

  // Handle input change
  const handleInput = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setTypedText(value);
    setCursorPosition(e.target.selectionStart ?? 0);

    if (session) {
      service.updateTypedText(session.id, value);
    }
  }, [session, service]);

  // Handle keydown for keystroke tracking
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!session) return;

    // Record keystroke
    const keystroke: KeystrokeEvent = {
      key: e.key,
      timestamp: Date.now(),
      isChord: false,
    };
    service.recordKeystroke(session.id, keystroke);

    // Check for completion shortcut (Tab + Enter)
    if (e.key === 'Enter' && e.ctrlKey) {
      e.preventDefault();
      handleComplete();
    }
  }, [session, service]);

  // Complete transcription
  const handleComplete = useCallback(() => {
    if (!session) return;

    const result = service.completeSession(session.id);
    setAnalysis(result);
    setPhase('results');
    onComplete?.(result);
  }, [session, service, onComplete]);

  // Retry same text
  const handleRetry = useCallback(() => {
    if (!selectedText) return;
    handleStart();
  }, [selectedText, handleStart]);

  // Select new text
  const handleNewText = useCallback(() => {
    setSelectedText(null);
    setSession(null);
    setAnalysis(null);
    setTypedText('');
    setPhase('select');
  }, []);

  // Back to selection
  const handleBack = useCallback(() => {
    setSelectedText(null);
    setPhase('select');
  }, []);

  // Render based on phase
  return (
    <div className="transcription-mode">
      {phase === 'select' && (
        <TextSelector
          onSelect={handleTextSelect}
          difficulty={difficulty}
          category={category}
          onDifficultyChange={setDifficulty}
          onCategoryChange={setCategory}
        />
      )}

      {phase === 'preview' && selectedText && (
        <TranscriptionPreview
          text={selectedText}
          onStart={handleStart}
          onBack={handleBack}
        />
      )}

      {phase === 'typing' && session && selectedText && (
        <div className="transcription-typing">
          <div className="transcription-header">
            <h3>{selectedText.title}</h3>
            <button
              className="complete-button"
              onClick={handleComplete}
              disabled={typedText.length === 0}
            >
              Complete
            </button>
          </div>

          <TranscriptionDisplay
            targetText={selectedText.content}
            typedText={typedText}
            cursorPosition={cursorPosition}
          />

          <textarea
            ref={textareaRef}
            value={typedText}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            onSelect={(e) => setCursorPosition((e.target as HTMLTextAreaElement).selectionStart)}
            className="transcription-input"
            placeholder="Start typing here..."
            autoFocus
            autoComplete="off"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
          />

          <TranscriptionStats
            session={session}
            targetText={selectedText.content}
            typedText={typedText}
          />

          <div className="transcription-hint">
            Press Ctrl+Enter to complete
          </div>
        </div>
      )}

      {phase === 'results' && analysis && selectedText && (
        <TranscriptionResults
          text={selectedText}
          analysis={analysis}
          onRetry={handleRetry}
          onNewText={handleNewText}
        />
      )}

      {onExit && (
        <button className="exit-button" onClick={onExit}>
          Exit
        </button>
      )}
    </div>
  );
}

export default TranscriptionMode;
