/**
 * Time Attack Challenge Component
 *
 * Complete as many items as possible within a time limit.
 * Correct answers add time, wrong answers subtract time.
 */

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { type TimeAttackConfig } from '@/data/static/challengeConfig';
import {
  getChallengeService,
  type ChallengeSession,
  type ChallengeItem,
  type ChallengeResult,
  type AnswerResult,
} from '@/free-play/services/ChallengeService';
import { getChallengeRepository } from '@/free-play/data/repositories/ChallengeRepository';
import { SIMULTANEOUS_THRESHOLD_MS } from '@/services/InputService';
import { TimerDisplay, TimeAddedIndicator } from './TimerDisplay';
import './challenges.css';

export interface TimeAttackChallengeProps {
  config: TimeAttackConfig;
  onComplete: (result: ChallengeResult) => void;
  onCancel?: () => void;
}

type Phase = 'ready' | 'countdown' | 'playing' | 'complete';

export function TimeAttackChallenge({
  config,
  onComplete,
  onCancel,
}: TimeAttackChallengeProps) {
  const [phase, setPhase] = useState<Phase>('ready');
  const [session, setSession] = useState<ChallengeSession | null>(null);
  const [currentItem, setCurrentItem] = useState<ChallengeItem | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(config.duration * 1000);
  const [input, setInput] = useState('');
  const [lastResult, setLastResult] = useState<AnswerResult | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [countdownValue, setCountdownValue] = useState(3);

  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<number | null>(null);
  const lastUpdateRef = useRef<number>(0);
  const charTimestampsRef = useRef<Map<string, number>>(new Map());
  const lastSubmitTimeRef = useRef<number>(0);

  const challengeService = getChallengeService();
  const challengeRepository = getChallengeRepository();

  // Get expected characters for power chord items
  const expectedPowerChordChars = useMemo(() => {
    if (!currentItem || currentItem.type !== 'powerChord' || !currentItem.powerChord) {
      return null;
    }
    return new Set(currentItem.powerChord.characters.map(c => c.char.toLowerCase()));
  }, [currentItem]);

  // Start countdown
  const startCountdown = useCallback(() => {
    setPhase('countdown');
    setCountdownValue(3);

    const countdown = setInterval(() => {
      setCountdownValue(prev => {
        if (prev <= 1) {
          clearInterval(countdown);
          startGame();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  // Start the actual game
  const startGame = useCallback(() => {
    const newSession = challengeService.startTimeAttack(config);
    setSession(newSession);
    setCurrentItem(challengeService.getCurrentItem(newSession.id));
    setTimeRemaining(newSession.timeRemainingMs);
    setPhase('playing');
    lastUpdateRef.current = Date.now();

    // Focus input
    setTimeout(() => inputRef.current?.focus(), 100);

    // Start timer
    timerRef.current = window.setInterval(() => {
      const now = Date.now();
      const delta = now - lastUpdateRef.current;
      lastUpdateRef.current = now;

      challengeService.updateTime(newSession.id, delta);
      const remaining = challengeService.getTimeRemaining(newSession.id);
      setTimeRemaining(remaining);

      if (remaining <= 0) {
        endGame(newSession.id);
      }
    }, 50);
  }, [challengeService, config]);

  // End game
  const endGame = useCallback((sessionId: string) => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    setPhase('complete');
    const result = challengeService.endChallenge(sessionId);

    // Check and save personal best
    const isPersonalBest = challengeRepository.setPersonalBest(result.challengeId, result);
    result.isPersonalBest = isPersonalBest;

    // Add to history
    challengeRepository.addToHistory(result);

    onComplete(result);
  }, [challengeService, challengeRepository, onComplete]);

  // Handle answer submission
  const handleSubmit = useCallback((e?: React.FormEvent) => {
    e?.preventDefault();

    if (!session || phase !== 'playing' || !input.trim()) return;

    const result = challengeService.submitAnswer(session.id, input);
    setLastResult(result);
    setShowFeedback(true);
    setInput('');

    // Update time remaining
    setTimeRemaining(challengeService.getTimeRemaining(session.id));

    // Update session state
    setSession({ ...session });

    // Get next item
    const nextItem = challengeService.getCurrentItem(session.id);
    setCurrentItem(nextItem);

    // Hide feedback after delay
    setTimeout(() => setShowFeedback(false), 300);

    if (result.isComplete) {
      endGame(session.id);
    }
  }, [session, phase, input, challengeService, endGame]);

  // Helper to submit an answer programmatically
  const submitAnswer = useCallback((answer: string) => {
    if (!session || phase !== 'playing') return;

    // Prevent double submissions
    const now = Date.now();
    if (now - lastSubmitTimeRef.current < 100) return;
    lastSubmitTimeRef.current = now;

    const result = challengeService.submitAnswer(session.id, answer);
    setLastResult(result);
    setShowFeedback(true);
    setInput('');
    setTimeRemaining(challengeService.getTimeRemaining(session.id));
    setSession({ ...session });
    const nextItem = challengeService.getCurrentItem(session.id);
    setCurrentItem(nextItem);
    charTimestampsRef.current.clear();
    setTimeout(() => setShowFeedback(false), 300);
    if (result.isComplete) {
      endGame(session.id);
    }
  }, [session, phase, challengeService, endGame]);

  // Handle input change with auto-submit on space (for CharaChorder)
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;

    // Auto-submit when space is typed (CharaChorder outputs word + space)
    if (newValue.endsWith(' ') && newValue.trim().length > 0) {
      setInput(newValue.trim());
      setTimeout(() => submitAnswer(newValue.trim()), 0);
    } else {
      setInput(newValue);

      // For power chord items, check if we have rapid sequential input of expected chars
      if (expectedPowerChordChars && newValue.length >= 2) {
        const now = Date.now();
        const chars = newValue.toLowerCase().split('');
        const lastTwoChars = chars.slice(-2);

        // Check if last two chars match expected power chord chars
        if (lastTwoChars.length === 2 &&
            expectedPowerChordChars.has(lastTwoChars[0]) &&
            expectedPowerChordChars.has(lastTwoChars[1]) &&
            lastTwoChars[0] !== lastTwoChars[1]) {
          // Submit the two characters as the answer
          submitAnswer(lastTwoChars.join(''));
        }
      }
    }
  }, [submitAnswer, expectedPowerChordChars]);

  // Handle cancel
  const handleCancel = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    onCancel?.();
  }, [onCancel]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && phase !== 'playing') {
        handleCancel();
      }
      if (e.key === ' ' && phase === 'ready') {
        e.preventDefault();
        startCountdown();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [phase, startCountdown, handleCancel]);

  // Simultaneous keypress detection for power chord challenges
  useEffect(() => {
    if (phase !== 'playing' || !expectedPowerChordChars) return;

    const pressedKeys = new Set<string>();

    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();

      // Only track expected characters
      if (expectedPowerChordChars.has(key)) {
        pressedKeys.add(key);
        charTimestampsRef.current.set(key, Date.now());

        // Check if both expected keys are pressed simultaneously
        if (pressedKeys.size === 2) {
          const chars = [...pressedKeys];
          if (expectedPowerChordChars.has(chars[0]) && expectedPowerChordChars.has(chars[1])) {
            // Check timing - both keys pressed within threshold
            const timestamps = chars.map(c => charTimestampsRef.current.get(c) || 0);
            const timeDiff = Math.abs(timestamps[0] - timestamps[1]);

            if (timeDiff <= SIMULTANEOUS_THRESHOLD_MS * 3) {
              submitAnswer(chars.join(''));
              pressedKeys.clear();
            }
          }
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      pressedKeys.delete(e.key.toLowerCase());
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [phase, expectedPowerChordChars, submitAnswer]);

  return (
    <div className="challenge-container time-attack-challenge">
      {/* Header */}
      <div className="challenge-header">
        <div className="challenge-title">
          <span className="challenge-icon">⏱️</span>
          <h2>{config.displayName}</h2>
        </div>

        {phase === 'playing' && (
          <div className="challenge-header-stats">
            <div className="stat">
              <span className="stat-value">{session?.score ?? 0}</span>
              <span className="stat-label">Score</span>
            </div>
            <div className="stat">
              <span className="stat-value">{session?.currentStreak ?? 0}</span>
              <span className="stat-label">Streak</span>
            </div>
          </div>
        )}
      </div>

      {/* Timer */}
      {phase === 'playing' && (
        <div className="challenge-timer-section">
          <TimerDisplay
            timeMs={timeRemaining}
            mode="countdown"
            size="large"
          />
          <TimeAddedIndicator
            time={lastResult?.bonusTime ?? 0}
            visible={showFeedback}
          />
        </div>
      )}

      {/* Ready Screen */}
      {phase === 'ready' && (
        <div className="challenge-ready">
          <p className="challenge-description">{config.description}</p>
          <div className="challenge-rules">
            <div className="rule">
              <span className="rule-icon">⏱️</span>
              <span>Duration: {config.duration} seconds</span>
            </div>
            <div className="rule">
              <span className="rule-icon">✅</span>
              <span>Correct: +{config.bonusTimeOnCorrect}s</span>
            </div>
            <div className="rule">
              <span className="rule-icon">❌</span>
              <span>Wrong: -{config.penaltyOnWrong}s</span>
            </div>
          </div>
          <button className="btn primary large" onClick={startCountdown}>
            Start Challenge
          </button>
          {onCancel && (
            <button className="btn secondary" onClick={handleCancel}>
              Cancel
            </button>
          )}
        </div>
      )}

      {/* Countdown */}
      {phase === 'countdown' && (
        <div className="challenge-countdown">
          <div className="countdown-number">{countdownValue}</div>
          <p>Get ready!</p>
        </div>
      )}

      {/* Playing */}
      {phase === 'playing' && currentItem && (
        <div className="challenge-play-area">
          <div className={`challenge-prompt ${showFeedback ? (lastResult?.isCorrect ? 'correct' : 'incorrect') : ''}`}>
            <div className="prompt-text">{currentItem.prompt}</div>
          </div>

          <form onSubmit={handleSubmit} className="challenge-input-form">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={handleInputChange}
              className="challenge-input"
              placeholder="Type your answer..."
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
            />
          </form>

          {showFeedback && lastResult && (
            <div className={`challenge-feedback ${lastResult.isCorrect ? 'correct' : 'incorrect'}`}>
              {lastResult.isCorrect ? (
                <span>+{lastResult.score.totalPoints} points</span>
              ) : (
                <span>Incorrect</span>
              )}
            </div>
          )}

          <div className="challenge-stats-bar">
            <div className="stat-item">
              <span className="label">Correct</span>
              <span className="value correct">{session?.correctCount ?? 0}</span>
            </div>
            <div className="stat-item">
              <span className="label">Wrong</span>
              <span className="value incorrect">{session?.wrongCount ?? 0}</span>
            </div>
            <div className="stat-item">
              <span className="label">Best Streak</span>
              <span className="value">{session?.bestStreak ?? 0}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
