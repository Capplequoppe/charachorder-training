/**
 * Song Game Component
 *
 * Main orchestrating component for rhythm-based song gameplay.
 * Manages game states: idle, countdown, playing, paused, complete.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { type SongConfig, type TimingAccuracy } from '@/data/static/songConfig';
import {
  getSongService,
  type SongPlaybackState,
  type SongGameState,
  type TimingResult,
} from '@/free-play/services/SongService';
import { getBackgroundMusicService } from '@/free-play/services/BackgroundMusicService';
import { BeatIndicator } from './BeatIndicator';
import { RhythmDisplay } from './RhythmDisplay';
import { TimingFeedback } from './TimingFeedback';
import { SongResults } from './SongResults';
import './songs.css';

export interface SongGameProps {
  song: SongConfig;
  onComplete?: () => void;
  onBack?: () => void;
}

// Number of beats to play music before the first word arrives at the hit zone
const LEAD_IN_BEATS = 8; // 2 measures at 4/4

export function SongGame({ song, onComplete, onBack }: SongGameProps) {
  const [playbackState, setPlaybackState] = useState<SongPlaybackState | null>(null);
  const [input, setInput] = useState('');
  const [lastTiming, setLastTiming] = useState<TimingResult | null>(null);
  const [feedbackKey, setFeedbackKey] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const songService = getSongService();
  const backgroundMusic = getBackgroundMusicService();

  // Subscribe to state changes
  useEffect(() => {
    const unsubscribe = songService.onStateChange((state) => {
      setPlaybackState(state);
    });

    return () => {
      unsubscribe();
      songService.stop();
    };
  }, []);

  // Load song on mount
  useEffect(() => {
    songService.loadSong(song);
    setPlaybackState(songService.getState());
  }, [song]);

  // Focus input when playing
  useEffect(() => {
    if (playbackState?.gameState === 'playing') {
      inputRef.current?.focus();
    }
  }, [playbackState?.gameState]);

  // Initialize background music
  useEffect(() => {
    const init = async () => {
      if (!backgroundMusic.isInitialized()) {
        await backgroundMusic.initialize();
      }
    };
    init();
  }, []);

  // Handle start
  const handleStart = useCallback(async () => {
    await songService.start();
  }, []);

  // Handle pause/resume
  const handlePauseResume = useCallback(() => {
    if (playbackState?.gameState === 'playing') {
      songService.pause();
    } else if (playbackState?.gameState === 'paused') {
      songService.resume();
    }
  }, [playbackState?.gameState]);

  // Handle restart
  const handleRestart = useCallback(() => {
    songService.restart();
    setInput('');
    setLastTiming(null);
  }, []);

  // Handle back to song selection
  const handleBack = useCallback(() => {
    songService.stop();
    onBack?.();
  }, [onBack]);

  // Handle input change
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setInput(value);

      // Check for space (chord submission)
      if (value.endsWith(' ')) {
        const word = value.trim();
        if (word) {
          const result = songService.submitWord(word);
          setLastTiming(result);
          setFeedbackKey((k) => k + 1);
          setInput('');
        }
      }
    },
    []
  );

  // Handle key down for special keys
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (playbackState?.gameState === 'playing') {
          songService.pause();
        } else if (playbackState?.gameState === 'paused') {
          handleBack();
        }
      }
    },
    [playbackState?.gameState, handleBack]
  );

  // Render based on game state
  if (!playbackState) {
    return <div className="song-game">Loading...</div>;
  }

  const { gameState } = playbackState;

  // Complete state - show results
  if (gameState === 'complete') {
    const results = songService.getResults();
    if (results) {
      return (
        <SongResults
          results={results}
          onPlayAgain={handleRestart}
          onSelectSong={() => {
            songService.stop();
            onComplete?.();
          }}
        />
      );
    }
  }

  return (
    <div className="song-game" onKeyDown={handleKeyDown}>
      {/* Header */}
      <div className="song-game__header">
        <div>
          <div className="song-game__title">{song.title}</div>
          <div
            className={`song-game__combo ${playbackState.combo > 0 ? 'song-game__combo--active' : ''}`}
          >
            {playbackState.combo > 0 ? `${playbackState.combo}x Combo` : 'No Combo'}
          </div>
        </div>
        <div className="song-game__score">{playbackState.score.toLocaleString()}</div>
        <div className="song-game__controls">
          {gameState === 'idle' && (
            <button className="song-game__btn" onClick={handleStart}>
              Start
            </button>
          )}
          {(gameState === 'playing' || gameState === 'paused') && (
            <button className="song-game__btn" onClick={handlePauseResume}>
              {gameState === 'playing' ? 'Pause' : 'Resume'}
            </button>
          )}
          <button className="song-game__btn" onClick={handleBack}>
            Back
          </button>
        </div>
      </div>

      {/* Beat indicator */}
      <BeatIndicator
        currentBeat={playbackState.currentBeat}
        beatsPerMeasure={song.beatsPerMeasure}
        beatProgress={songService.getBeatProgress()}
      />

      {/* Rhythm display */}
      {gameState === 'playing' && (
        <RhythmDisplay
          words={playbackState.beatItems}
          currentIndex={playbackState.currentItemIndex}
          elapsedMs={playbackState.elapsedTimeMs}
          bpm={song.bpm}
          leadInBeats={LEAD_IN_BEATS}
        />
      )}

      {/* Countdown overlay */}
      {gameState === 'countdown' && (
        <div className="song-game__countdown" key={playbackState.countdownRemaining}>
          {playbackState.countdownRemaining}
        </div>
      )}

      {/* Paused overlay */}
      {gameState === 'paused' && (
        <div className="song-game__countdown">PAUSED</div>
      )}

      {/* Idle state - start prompt */}
      {gameState === 'idle' && (
        <div className="rhythm-display">
          <div className="rhythm-display__lane">
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                color: 'var(--color-text-secondary)',
                fontSize: '1.2rem',
              }}
            >
              Press Start to begin
            </div>
          </div>
        </div>
      )}

      {/* Input area */}
      <div className="song-game__input-area">
        <input
          ref={inputRef}
          type="text"
          className="song-game__input"
          value={input}
          onChange={handleInputChange}
          placeholder={
            gameState === 'playing'
              ? songService.getCurrentWord() || 'Type the word...'
              : 'Ready to type...'
          }
          disabled={gameState !== 'playing'}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
        />
      </div>

      {/* Timing feedback */}
      <TimingFeedback
        accuracy={lastTiming?.accuracy as TimingAccuracy | null}
        offsetMs={lastTiming?.offsetMs}
        key={feedbackKey}
      />
    </div>
  );
}

export default SongGame;
