/**
 * Sprint Challenge Component
 *
 * Complete a fixed number of items as fast as possible.
 * Earn medals based on completion time.
 */

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  type SprintConfig,
  getMedalEmoji,
  getMedalColor,
} from '@/data/static/challengeConfig';
import {
  getChallengeService,
  type ChallengeSession,
  type ChallengeItem,
  type ChallengeResult,
  type AnswerResult,
} from '@/free-play/services/ChallengeService';
import { getChallengeRepository } from '@/free-play/data/repositories/ChallengeRepository';
import { SIMULTANEOUS_THRESHOLD_MS } from '@/services/InputService';
import { TimerDisplay } from './TimerDisplay';
import './challenges.css';

export interface SprintChallengeProps {
  config: SprintConfig;
  onComplete: (result: ChallengeResult) => void;
  onCancel?: () => void;
}

type Phase = 'ready' | 'countdown' | 'playing' | 'complete';

export function SprintChallenge({
  config,
  onComplete,
  onCancel,
}: SprintChallengeProps) {
  const [phase, setPhase] = useState<Phase>('ready');
  const [session, setSession] = useState<ChallengeSession | null>(null);
  const [currentItem, setCurrentItem] = useState<ChallengeItem | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [input, setInput] = useState('');
  const [lastResult, setLastResult] = useState<AnswerResult | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [countdownValue, setCountdownValue] = useState(3);

  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
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

  // Calculate progress
  const progress = session ? session.currentIndex : 0;
  const progressPercent = (progress / config.itemCount) * 100;

  // Determine current medal based on elapsed time
  const getCurrentMedal = useCallback(() => {
    const elapsedSeconds = elapsedTime / 1000;
    if (elapsedSeconds <= config.goldTime) return 'gold';
    if (elapsedSeconds <= config.silverTime) return 'silver';
    if (elapsedSeconds <= config.bronzeTime) return 'bronze';
    return 'none';
  }, [elapsedTime, config]);

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
    const newSession = challengeService.startSprint(config);
    setSession(newSession);
    setCurrentItem(challengeService.getCurrentItem(newSession.id));
    setElapsedTime(0);
    setPhase('playing');
    startTimeRef.current = Date.now();

    // Focus input
    setTimeout(() => inputRef.current?.focus(), 100);

    // Start timer
    timerRef.current = window.setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      setElapsedTime(elapsed);
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

    // Update session state
    const updatedSession = challengeService.getSession(session.id);
    if (updatedSession) {
      setSession(updatedSession);
    }

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
    const updatedSession = challengeService.getSession(session.id);
    if (updatedSession) {
      setSession(updatedSession);
    }
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

  const currentMedal = getCurrentMedal();

  return (
    <div className="challenge-container sprint-challenge">
      {/* Header */}
      <div className="challenge-header">
        <div className="challenge-title">
          <span className="challenge-icon">🏃</span>
          <h2>{config.displayName}</h2>
        </div>

        {phase === 'playing' && (
          <div className="challenge-header-stats">
            <div className="stat">
              <span className="stat-value">{progress}/{config.itemCount}</span>
              <span className="stat-label">Progress</span>
            </div>
            <div className="stat">
              <span className="stat-value">{session?.currentStreak ?? 0}</span>
              <span className="stat-label">Streak</span>
            </div>
          </div>
        )}
      </div>

      {/* Timer and Progress */}
      {phase === 'playing' && (
        <div className="challenge-timer-section">
          <TimerDisplay
            timeMs={elapsedTime}
            mode="countup"
            size="large"
          />
          <div className="medal-indicator">
            <span
              className="medal-icon"
              style={{ color: getMedalColor(currentMedal) }}
            >
              {getMedalEmoji(currentMedal)}
            </span>
          </div>
        </div>
      )}

      {/* Progress Track */}
      {phase === 'playing' && (
        <div className="sprint-progress-track">
          <div
            className="sprint-progress-fill"
            style={{ width: `${progressPercent}%` }}
          />
          <div className="sprint-milestones">
            {[25, 50, 75, 100].map(milestone => (
              <div
                key={milestone}
                className={`sprint-milestone ${progressPercent >= milestone ? 'passed' : ''}`}
                style={{ left: `${milestone}%` }}
              >
                {milestone === 100 ? '🏁' : `${milestone}%`}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Medal Targets */}
      {phase === 'playing' && (
        <div className="medal-targets">
          <div className={`medal-target ${currentMedal === 'gold' ? 'active' : ''}`}>
            <span style={{ color: getMedalColor('gold') }}>🥇</span>
            <span>{config.goldTime}s</span>
          </div>
          <div className={`medal-target ${currentMedal === 'silver' ? 'active' : ''}`}>
            <span style={{ color: getMedalColor('silver') }}>🥈</span>
            <span>{config.silverTime}s</span>
          </div>
          <div className={`medal-target ${currentMedal === 'bronze' ? 'active' : ''}`}>
            <span style={{ color: getMedalColor('bronze') }}>🥉</span>
            <span>{config.bronzeTime}s</span>
          </div>
        </div>
      )}

      {/* Ready Screen */}
      {phase === 'ready' && (
        <div className="challenge-ready">
          <p className="challenge-description">{config.description}</p>
          <div className="challenge-rules">
            <div className="rule">
              <span className="rule-icon">🎯</span>
              <span>Complete {config.itemCount} items</span>
            </div>
            <div className="rule">
              <span className="rule-icon">🥇</span>
              <span>Gold: under {config.goldTime}s</span>
            </div>
            <div className="rule">
              <span className="rule-icon">🥈</span>
              <span>Silver: under {config.silverTime}s</span>
            </div>
            <div className="rule">
              <span className="rule-icon">🥉</span>
              <span>Bronze: under {config.bronzeTime}s</span>
            </div>
          </div>
          <button className="btn primary large" onClick={startCountdown}>
            Start Sprint
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
              {lastResult.isCorrect ? 'Correct!' : 'Incorrect'}
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
              <span className="label">Accuracy</span>
              <span className="value">
                {session && (session.correctCount + session.wrongCount) > 0
                  ? Math.round((session.correctCount / (session.correctCount + session.wrongCount)) * 100)
                  : 0}%
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
