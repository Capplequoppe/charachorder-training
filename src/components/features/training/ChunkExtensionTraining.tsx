/**
 * ChunkExtensionTraining Component
 *
 * Training mode for building 3+ key chords from 2-key power chord foundations.
 * Uses the "Lego model" approach where complex chords are built by adding
 * characters to already-mastered power chords.
 */

import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { ChordExtension, getRepositories, SemanticCategory } from '../../../data';
import { PowerChord, FingerId } from '../../../domain';
import { useInput, useAudio, useColor, useProgress } from '../../../hooks';
import { ColoredFinger } from '../../ui/atoms/ColoredFinger';
import { ColoredChord } from '../../ui/atoms/ColoredChord';
import { LegoVisualization, LegoPath } from './LegoVisualization';
import './training.css';
import './lego.css';

/**
 * Training phase type for chunk extension training.
 */
type ChunkPhase = 'select-base' | 'show-extension' | 'practice' | 'quiz' | 'complete';

/**
 * Props for ChunkExtensionTraining component.
 */
export interface ChunkExtensionTrainingProps {
  /** Callback when training session completes */
  onComplete: (results: ChunkExtensionResults) => void;
  /** Optional: specific base chord to train */
  baseChordId?: string;
  /** Optional: number of extensions to train per base chord */
  extensionsPerBase?: number;
  /** Optional: minimum mastered power chords required */
  minMasteredChords?: number;
}

/**
 * Results from a chunk extension training session.
 */
export interface ChunkExtensionResults {
  extensionsCompleted: number;
  totalAttempts: number;
  correctAttempts: number;
  accuracy: number;
  wordsLearned: string[];
  baseChordsUsed: string[];
}

/**
 * Progress for a single extension in the session.
 */
interface ExtensionProgress {
  extension: ChordExtension;
  attempts: number;
  successes: number;
  completed: boolean;
}

/**
 * ChunkExtensionTraining component for building words from power chords.
 */
export function ChunkExtensionTraining({
  onComplete,
  baseChordId,
  extensionsPerBase = 3,
  minMasteredChords = 1,
}: ChunkExtensionTrainingProps): React.ReactElement {
  const audioService = useAudio();
  const colorService = useColor();
  const progressService = useProgress();

  // Get repositories
  const { extensions, powerChords, characters } = getRepositories();

  // Get mastered power chord IDs (simulating - in real app, would come from progress)
  const masteredChordIds = useMemo(() => {
    // For now, assume all power chords are available for training
    // In a full implementation, this would query the progress service
    return powerChords.getAll().map((pc) => pc.id);
  }, [powerChords]);

  // Get available extensions based on mastered chords
  const availableExtensions = useMemo(() => {
    if (baseChordId) {
      return extensions.getByBaseChord(baseChordId).slice(0, extensionsPerBase);
    }

    // Get extensions for all mastered chords
    const allExtensions = extensions.getNextExtensions(masteredChordIds);

    // Sort by complexity (simpler first) and take a subset
    return allExtensions
      .sort((a, b) => a.addedChars.length - b.addedChars.length)
      .slice(0, extensionsPerBase * 3);
  }, [extensions, baseChordId, masteredChordIds, extensionsPerBase]);

  // Get base chords that have extensions
  const baseChordOptions = useMemo(() => {
    const baseIds = extensions.getBaseChordIds();
    return baseIds
      .map((id) => powerChords.getById(id))
      .filter((pc): pc is PowerChord => pc !== undefined);
  }, [extensions, powerChords]);

  // Current phase
  const [phase, setPhase] = useState<ChunkPhase>(
    baseChordId ? 'show-extension' : 'select-base'
  );

  // Selected base chord
  const [selectedBase, setSelectedBase] = useState<string | null>(baseChordId ?? null);

  // Current extension index
  const [currentIndex, setCurrentIndex] = useState(0);

  // Progress for each extension
  const [progress, setProgress] = useState<ExtensionProgress[]>(() =>
    availableExtensions.map((ext) => ({
      extension: ext,
      attempts: 0,
      successes: 0,
      completed: false,
    }))
  );

  // Input tracking
  const [pressedKeys, setPressedKeys] = useState<Set<string>>(new Set());
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);

  // Get current extension
  const currentExtension = availableExtensions[currentIndex];
  const currentProgress = progress[currentIndex];

  // Get the base power chord for current extension
  const currentBaseChord = useMemo(() => {
    if (!currentExtension) return null;
    return powerChords.getById(currentExtension.baseChordId) ?? null;
  }, [currentExtension, powerChords]);

  // Reset pressed keys
  const resetPressedKeys = useCallback(() => {
    setTimeout(() => {
      setPressedKeys(new Set());
      setFeedback(null);
    }, 600);
  }, []);

  // Check if pressed keys match the target chord
  const checkChordMatch = useCallback(
    (keys: Set<string>) => {
      if (!currentExtension) return false;

      const targetChars = new Set(
        currentExtension.resultChordChars.map((c) => c.toLowerCase())
      );

      // Check if all target chars are pressed
      if (targetChars.size !== keys.size) return false;

      for (const char of targetChars) {
        if (!keys.has(char)) return false;
      }

      return true;
    },
    [currentExtension]
  );

  // Handle key down
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (phase !== 'practice' && phase !== 'quiz') return;
      if (!currentExtension) return;

      const key = event.key.toLowerCase();

      // Only track relevant keys
      const allChars = new Set([
        ...currentExtension.resultChordChars.map((c) => c.toLowerCase()),
      ]);

      if (!allChars.has(key) && pressedKeys.size === 0) {
        // Allow any key to start, but track if it's wrong
        return;
      }

      setPressedKeys((prev) => {
        const newKeys = new Set(prev);
        newKeys.add(key);

        // Check if we have a complete chord attempt
        if (newKeys.size >= currentExtension.resultChordChars.length) {
          const isCorrect = checkChordMatch(newKeys);

          // Update progress
          setProgress((prevProgress) => {
            const updated = [...prevProgress];
            const curr = updated[currentIndex];
            curr.attempts++;

            if (isCorrect) {
              curr.successes++;
              if (curr.successes >= 3) {
                curr.completed = true;
              }
            }

            return updated;
          });

          // Show feedback
          if (isCorrect) {
            setFeedback('correct');
            audioService.playSuccessSound();

            // Check if we should advance
            setTimeout(() => {
              const updatedProgress = progress[currentIndex];
              if (updatedProgress.successes + 1 >= 3) {
                // Move to next extension or complete
                if (currentIndex < availableExtensions.length - 1) {
                  setCurrentIndex((i) => i + 1);
                  setPhase('show-extension');
                } else {
                  setPhase('complete');
                }
              }
            }, 600);
          } else {
            setFeedback('incorrect');
            audioService.playErrorSound?.();
          }

          resetPressedKeys();
        }

        return newKeys;
      });
    },
    [
      phase,
      currentExtension,
      currentIndex,
      pressedKeys,
      progress,
      availableExtensions.length,
      checkChordMatch,
      audioService,
      resetPressedKeys,
    ]
  );

  // Handle key up
  const handleKeyUp = useCallback((event: KeyboardEvent) => {
    const key = event.key.toLowerCase();
    setPressedKeys((prev) => {
      const newKeys = new Set(prev);
      newKeys.delete(key);
      return newKeys;
    });
  }, []);

  // Set up keyboard listeners
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  // Calculate final results
  const calculateResults = useCallback((): ChunkExtensionResults => {
    const totalAttempts = progress.reduce((sum, p) => sum + p.attempts, 0);
    const correctAttempts = progress.reduce((sum, p) => sum + p.successes, 0);
    const wordsLearned = progress
      .filter((p) => p.completed)
      .map((p) => p.extension.resultWord);
    const baseChordsUsed = [
      ...new Set(progress.map((p) => p.extension.baseChordId)),
    ];

    return {
      extensionsCompleted: progress.filter((p) => p.completed).length,
      totalAttempts,
      correctAttempts,
      accuracy: totalAttempts > 0 ? correctAttempts / totalAttempts : 0,
      wordsLearned,
      baseChordsUsed,
    };
  }, [progress]);

  // Complete handler
  useEffect(() => {
    if (phase === 'complete') {
      onComplete(calculateResults());
    }
  }, [phase, onComplete, calculateResults]);

  // Handle base chord selection
  const handleBaseSelect = (chordId: string) => {
    setSelectedBase(chordId);

    // Update available extensions for the selected base
    const baseExtensions = extensions
      .getByBaseChord(chordId)
      .slice(0, extensionsPerBase);

    setProgress(
      baseExtensions.map((ext) => ({
        extension: ext,
        attempts: 0,
        successes: 0,
        completed: false,
      }))
    );

    setCurrentIndex(0);
    setPhase('show-extension');
  };

  // Render base chord selection phase
  const renderSelectBasePhase = () => {
    return (
      <div className="training-phase select-base-phase">
        <h2>Choose a Power Chord to Extend</h2>
        <p className="subtitle">
          Select a power chord you know. We'll build words from it!
        </p>

        <div className="base-chord-grid">
          {baseChordOptions.slice(0, 9).map((pc) => {
            const extCount = extensions.getExtensionCount(pc.id);
            return (
              <button
                key={pc.id}
                className="base-chord-option"
                onClick={() => handleBaseSelect(pc.id)}
              >
                <div className="option-chars">
                  {pc.characters.map((char, idx) => (
                    <span key={idx} style={{ color: char.color }}>
                      {char.displayChar}
                    </span>
                  ))}
                </div>
                <div
                  className="option-color"
                  style={{ backgroundColor: pc.blendedColor }}
                />
                <div className="option-count">{extCount} words</div>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  // Render extension introduction phase
  const renderShowExtensionPhase = () => {
    if (!currentExtension || !currentBaseChord) return null;

    return (
      <div className="training-phase show-extension-phase">
        <h2>Build a New Word</h2>

        <LegoVisualization extension={currentExtension} size="large" />

        <div className="extension-info">
          {currentExtension.category && (
            <span className="category-badge">
              {currentExtension.category}
            </span>
          )}
        </div>

        <div className="action-buttons">
          <button
            className="btn primary"
            onClick={() => setPhase('practice')}
          >
            Practice This Word
          </button>
        </div>
      </div>
    );
  };

  // Render practice phase
  const renderPracticePhase = () => {
    if (!currentExtension || !currentProgress) return null;

    return (
      <div className={`training-phase practice-phase ${feedback ?? ''}`}>
        <h2>Practice: "{currentExtension.resultWord}"</h2>

        <div className="chord-target">
          <div className="target-chars">
            {currentExtension.resultChordChars.map((char, idx) => {
              const charEntity = characters.getByChar(char);
              const isPressed = pressedKeys.has(char.toLowerCase());
              return (
                <span
                  key={idx}
                  className={`target-char ${isPressed ? 'pressed' : ''}`}
                  style={{ color: charEntity?.color ?? '#fff' }}
                >
                  {char.toUpperCase()}
                </span>
              );
            })}
          </div>
        </div>

        <p className="hint">Press all keys simultaneously</p>

        <div className="progress-indicator">
          <div className="progress-dots">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className={`progress-dot ${i < currentProgress.successes ? 'filled' : ''}`}
                style={{
                  backgroundColor:
                    i < currentProgress.successes
                      ? currentBaseChord?.blendedColor
                      : undefined,
                }}
              />
            ))}
          </div>
          <p className="progress-text">{currentProgress.successes} / 3</p>
        </div>

        {feedback === 'correct' && (
          <div className="feedback correct">Correct!</div>
        )}
        {feedback === 'incorrect' && (
          <div className="feedback incorrect">Try again</div>
        )}
      </div>
    );
  };

  // Render quiz phase
  const renderQuizPhase = () => {
    // Quiz would present random extensions from learned set
    // For now, redirect to practice
    return renderPracticePhase();
  };

  // Render complete phase
  const renderCompletePhase = () => {
    const results = calculateResults();

    return (
      <div className="training-phase complete-phase">
        <h2>Words Learned!</h2>

        <div className="results-summary">
          <div className="result-item">
            <span className="label">Words Mastered</span>
            <span className="value">{results.extensionsCompleted}</span>
          </div>
          <div className="result-item">
            <span className="label">Accuracy</span>
            <span className="value">{Math.round(results.accuracy * 100)}%</span>
          </div>
        </div>

        {results.wordsLearned.length > 0 && (
          <div className="words-learned">
            <p>You can now chord:</p>
            <div className="word-list">
              {results.wordsLearned.map((word) => (
                <span key={word} className="learned-word">
                  {word}
                </span>
              ))}
            </div>
          </div>
        )}

        <button className="btn primary" onClick={() => onComplete(results)}>
          Continue
        </button>
      </div>
    );
  };

  // Render current phase
  const renderPhase = () => {
    switch (phase) {
      case 'select-base':
        return renderSelectBasePhase();
      case 'show-extension':
        return renderShowExtensionPhase();
      case 'practice':
        return renderPracticePhase();
      case 'quiz':
        return renderQuizPhase();
      case 'complete':
        return renderCompletePhase();
      default:
        return null;
    }
  };

  return (
    <div className="chunk-extension-training">
      <div className="training-header">
        <span className="hand-label">Word Building</span>
        {phase !== 'select-base' && phase !== 'complete' && (
          <span className="progress-label">
            {currentIndex + 1} / {availableExtensions.length}
          </span>
        )}
      </div>

      {renderPhase()}
    </div>
  );
}

export default ChunkExtensionTraining;
