/**
 * Song Service
 *
 * Orchestrates song playback, manages game state, and coordinates between
 * BackgroundMusicService, input handling, and UI updates.
 */

import {
  type SongConfig,
  type BeatItem,
  type TimingConfig,
  type SongResults,
  flattenSong,
  calculateTotalBeats,
  getTimingConfig,
} from '@/data/static/songConfig';
import {
  getBackgroundMusicService,
  type BackgroundMusicConfig,
} from './BackgroundMusicService';

// ==================== Types ====================

export type SongGameState = 'idle' | 'countdown' | 'playing' | 'paused' | 'complete';

export interface SongPlaybackState {
  gameState: SongGameState;
  song: SongConfig | null;
  beatItems: BeatItem[];
  currentItemIndex: number;
  currentBeat: number;
  currentMeasure: number;

  // Scoring
  score: number;
  combo: number;
  maxCombo: number;
  perfectCount: number;
  goodCount: number;
  earlyCount: number;
  lateCount: number;
  missCount: number;

  // Timing
  startTimeMs: number;
  elapsedTimeMs: number;
  countdownRemaining: number;
}

export type SongStateCallback = (state: SongPlaybackState) => void;
export type WordSubmitCallback = (
  word: string,
  item: BeatItem,
  timingResult: TimingResult
) => void;

export interface TimingResult {
  accuracy: 'perfect' | 'good' | 'early' | 'late' | 'miss';
  offsetMs: number;
}

export interface ISongService {
  // State
  getState(): SongPlaybackState;
  onStateChange(callback: SongStateCallback): () => void;

  // Song selection
  loadSong(song: SongConfig): void;
  getCurrentSong(): SongConfig | null;

  // Playback control
  start(): void;
  pause(): void;
  resume(): void;
  stop(): void;
  restart(): void;

  // Input handling
  submitWord(input: string): TimingResult;
  getCurrentWord(): string | null;
  getUpcomingWords(count: number): BeatItem[];

  // Timing
  getTimingConfig(): TimingConfig;
  getBeatProgress(): number; // 0-1 progress within current beat
  getExpectedBeatTimeMs(): number; // When the current word should be typed

  // Results
  getResults(): SongResults | null;
}

// Lead-in beats before first word (must match SongGame.tsx)
const LEAD_IN_BEATS = 8;

// ==================== Implementation ====================

export class SongService implements ISongService {
  private state: SongPlaybackState = this.createInitialState();
  private stateCallbacks = new Set<SongStateCallback>();
  private backgroundMusic = getBackgroundMusicService();
  private timingConfig: TimingConfig | null = null;

  // Timing tracking
  private animationFrameId: number | null = null;
  private countdownTimer: number | null = null;
  private expectedBeatTimes: number[] = [];
  private beatUnsubscribe: (() => void) | null = null;
  private leadInMs: number = 0;

  private createInitialState(): SongPlaybackState {
    return {
      gameState: 'idle',
      song: null,
      beatItems: [],
      currentItemIndex: 0,
      currentBeat: 0,
      currentMeasure: 0,
      score: 0,
      combo: 0,
      maxCombo: 0,
      perfectCount: 0,
      goodCount: 0,
      earlyCount: 0,
      lateCount: 0,
      missCount: 0,
      startTimeMs: 0,
      elapsedTimeMs: 0,
      countdownRemaining: 3,
    };
  }

  // ==================== State Management ====================

  getState(): SongPlaybackState {
    return { ...this.state };
  }

  onStateChange(callback: SongStateCallback): () => void {
    this.stateCallbacks.add(callback);
    return () => this.stateCallbacks.delete(callback);
  }

  private updateState(updates: Partial<SongPlaybackState>): void {
    this.state = { ...this.state, ...updates };
    this.notifyStateChange();
  }

  private notifyStateChange(): void {
    const stateCopy = this.getState();
    this.stateCallbacks.forEach((cb) => {
      try {
        cb(stateCopy);
      } catch (e) {
        console.error('Song state callback error:', e);
      }
    });
  }

  // ==================== Song Selection ====================

  loadSong(song: SongConfig): void {
    // Stop any current playback
    this.stop();

    // Flatten song into beat items
    const beatItems = flattenSong(song);

    // Calculate expected beat times
    this.calculateBeatTimes(song, beatItems);

    // Get timing config
    this.timingConfig = getTimingConfig(song);

    this.updateState({
      ...this.createInitialState(),
      song,
      beatItems,
    });
  }

  getCurrentSong(): SongConfig | null {
    return this.state.song;
  }

  private calculateBeatTimes(song: SongConfig, beatItems: BeatItem[]): void {
    const beatDurationMs = (60 / song.bpm) * 1000;
    // Add lead-in time before first word
    this.leadInMs = LEAD_IN_BEATS * beatDurationMs;
    // Each word's expected time is offset by the lead-in
    this.expectedBeatTimes = beatItems.map((_, index) => this.leadInMs + index * beatDurationMs);
  }

  // ==================== Playback Control ====================

  async start(): Promise<void> {
    if (!this.state.song) {
      console.warn('No song loaded');
      return;
    }

    // Initialize background music if needed
    if (!this.backgroundMusic.isInitialized()) {
      await this.backgroundMusic.initialize();
    }

    // Start countdown
    this.updateState({
      gameState: 'countdown',
      countdownRemaining: 3,
      startTimeMs: 0,
      elapsedTimeMs: 0,
      currentItemIndex: 0,
      score: 0,
      combo: 0,
      maxCombo: 0,
      perfectCount: 0,
      goodCount: 0,
      earlyCount: 0,
      lateCount: 0,
      missCount: 0,
    });

    this.runCountdown();
  }

  private runCountdown(): void {
    if (this.countdownTimer !== null) {
      clearInterval(this.countdownTimer);
    }

    this.countdownTimer = window.setInterval(() => {
      const remaining = this.state.countdownRemaining - 1;

      if (remaining <= 0) {
        if (this.countdownTimer !== null) {
          clearInterval(this.countdownTimer);
          this.countdownTimer = null;
        }
        this.beginPlayback();
      } else {
        this.updateState({ countdownRemaining: remaining });
      }
    }, 1000);
  }

  private beginPlayback(): void {
    if (!this.state.song) return;

    const now = performance.now();

    // Configure and start background music
    const musicConfig: BackgroundMusicConfig = {
      bpm: this.state.song.bpm,
      drumPatternId: this.state.song.drumPattern,
      bassPatternId: this.state.song.bassPattern,
      padEnabled: this.state.song.padEnabled,
    };

    this.backgroundMusic.start(musicConfig);

    // Subscribe to beat callbacks
    this.beatUnsubscribe = this.backgroundMusic.onBeat((beat, measure) => {
      this.updateState({
        currentBeat: beat,
        currentMeasure: measure,
      });
    });

    this.updateState({
      gameState: 'playing',
      startTimeMs: now,
      elapsedTimeMs: 0,
    });

    // Start animation loop for timing updates
    this.startAnimationLoop();
  }

  pause(): void {
    if (this.state.gameState !== 'playing') return;

    this.backgroundMusic.pause();
    this.stopAnimationLoop();

    this.updateState({ gameState: 'paused' });
  }

  resume(): void {
    if (this.state.gameState !== 'paused') return;

    this.backgroundMusic.resume();
    this.startAnimationLoop();

    this.updateState({ gameState: 'playing' });
  }

  stop(): void {
    // Stop countdown if running
    if (this.countdownTimer !== null) {
      clearInterval(this.countdownTimer);
      this.countdownTimer = null;
    }

    // Stop background music
    this.backgroundMusic.stop();

    // Unsubscribe from beat callbacks
    if (this.beatUnsubscribe) {
      this.beatUnsubscribe();
      this.beatUnsubscribe = null;
    }

    // Stop animation loop
    this.stopAnimationLoop();

    // Reset state
    this.updateState({
      gameState: 'idle',
      currentItemIndex: 0,
      currentBeat: 0,
      currentMeasure: 0,
      startTimeMs: 0,
      elapsedTimeMs: 0,
      countdownRemaining: 3,
    });
  }

  restart(): void {
    this.stop();
    this.start();
  }

  // ==================== Animation Loop ====================

  private startAnimationLoop(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }

    let lastNotifyTime = 0;
    const notifyThrottleMs = 50; // Only notify every 50ms to reduce re-renders

    const loop = () => {
      if (this.state.gameState !== 'playing') return;

      const now = performance.now();
      const elapsed = now - this.state.startTimeMs;

      // Check for missed words
      this.checkMissedWords(elapsed);

      // Check for song completion
      if (this.checkSongComplete()) {
        this.completeSong();
        return;
      }

      // Update elapsed time
      this.state.elapsedTimeMs = elapsed;

      // Throttle state notifications to reduce React re-renders
      if (now - lastNotifyTime > notifyThrottleMs) {
        lastNotifyTime = now;
        this.notifyStateChange();
      }

      this.animationFrameId = requestAnimationFrame(loop);
    };

    this.animationFrameId = requestAnimationFrame(loop);
  }

  private stopAnimationLoop(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  private checkMissedWords(elapsedMs: number): void {
    if (!this.timingConfig) return;

    const beatItems = this.state.beatItems;
    let currentIndex = this.state.currentItemIndex;
    let missCount = this.state.missCount;
    let combo = this.state.combo;
    let didUpdate = false;

    // Check if current word was missed (past accept window)
    // Limit iterations to prevent infinite loops
    let iterations = 0;
    const maxIterations = 20;

    while (currentIndex < beatItems.length && iterations < maxIterations) {
      iterations++;
      const expectedTime = this.expectedBeatTimes[currentIndex];
      const item = beatItems[currentIndex];

      // Skip rests
      if (item.isRest) {
        currentIndex++;
        didUpdate = true;
        continue;
      }

      // Check if word was missed
      if (elapsedMs > expectedTime + this.timingConfig.acceptWindowMs) {
        // Mark as missed
        currentIndex++;
        missCount++;
        combo = 0;
        didUpdate = true;
      } else {
        // Word is still active or upcoming
        break;
      }
    }

    // Only update state once at the end
    if (didUpdate) {
      this.updateState({
        currentItemIndex: currentIndex,
        missCount,
        combo,
      });
    }
  }

  private checkSongComplete(): boolean {
    // All words have been typed or missed
    return this.state.currentItemIndex >= this.state.beatItems.length;
  }

  private completeSong(): void {
    this.backgroundMusic.stop();
    this.stopAnimationLoop();

    if (this.beatUnsubscribe) {
      this.beatUnsubscribe();
      this.beatUnsubscribe = null;
    }

    this.updateState({ gameState: 'complete' });
  }

  // ==================== Input Handling ====================

  submitWord(input: string): TimingResult {
    const normalizedInput = input.trim().toLowerCase();
    const currentItem = this.getCurrentItem();

    // Default miss result
    const missResult: TimingResult = {
      accuracy: 'miss',
      offsetMs: 0,
    };

    if (!currentItem || currentItem.isRest) {
      return missResult;
    }

    const expectedWord = currentItem.word.toLowerCase();
    const isCorrect = normalizedInput === expectedWord;

    if (!isCorrect) {
      // Wrong word breaks combo but doesn't count as miss
      this.updateState({ combo: 0 });
      return missResult;
    }

    // Calculate timing
    const elapsedMs = this.state.elapsedTimeMs;
    const expectedTimeMs = this.expectedBeatTimes[this.state.currentItemIndex];
    const offsetMs = elapsedMs - expectedTimeMs;

    const timingResult = this.calculateTiming(offsetMs);

    // Update score and counts
    this.updateScoring(timingResult);

    // Update bass root if word has musical root
    if (currentItem.musicalRoot !== undefined) {
      this.backgroundMusic.setCurrentRoot(currentItem.musicalRoot);
    }

    // Move to next word
    this.advanceToNextWord();

    return timingResult;
  }

  private calculateTiming(offsetMs: number): TimingResult {
    if (!this.timingConfig) {
      return { accuracy: 'miss', offsetMs };
    }

    const absOffset = Math.abs(offsetMs);

    if (absOffset <= this.timingConfig.perfectWindowMs) {
      return { accuracy: 'perfect', offsetMs };
    } else if (absOffset <= this.timingConfig.goodWindowMs) {
      return { accuracy: 'good', offsetMs };
    } else if (absOffset <= this.timingConfig.acceptWindowMs) {
      return { accuracy: offsetMs < 0 ? 'early' : 'late', offsetMs };
    } else {
      return { accuracy: 'miss', offsetMs };
    }
  }

  private updateScoring(result: TimingResult): void {
    const combo = this.state.combo + 1;
    const maxCombo = Math.max(this.state.maxCombo, combo);

    // Points based on accuracy with combo multiplier
    const basePoints: Record<string, number> = {
      perfect: 100,
      good: 75,
      early: 50,
      late: 50,
      miss: 0,
    };

    const comboMultiplier = Math.min(2, 1 + combo * 0.05);
    const points = Math.floor(basePoints[result.accuracy] * comboMultiplier);

    const updates: Partial<SongPlaybackState> = {
      score: this.state.score + points,
      combo: result.accuracy === 'miss' ? 0 : combo,
      maxCombo,
    };

    // Update accuracy counts
    switch (result.accuracy) {
      case 'perfect':
        updates.perfectCount = this.state.perfectCount + 1;
        break;
      case 'good':
        updates.goodCount = this.state.goodCount + 1;
        break;
      case 'early':
        updates.earlyCount = this.state.earlyCount + 1;
        break;
      case 'late':
        updates.lateCount = this.state.lateCount + 1;
        break;
      case 'miss':
        updates.missCount = this.state.missCount + 1;
        break;
    }

    this.updateState(updates);
  }

  private advanceToNextWord(): void {
    let nextIndex = this.state.currentItemIndex + 1;

    // Skip rests
    while (nextIndex < this.state.beatItems.length && this.state.beatItems[nextIndex].isRest) {
      nextIndex++;
    }

    this.updateState({ currentItemIndex: nextIndex });

    // Check for completion
    if (this.checkSongComplete()) {
      this.completeSong();
    }
  }

  private getCurrentItem(): BeatItem | null {
    const { beatItems, currentItemIndex } = this.state;
    if (currentItemIndex >= beatItems.length) return null;
    return beatItems[currentItemIndex];
  }

  getCurrentWord(): string | null {
    const item = this.getCurrentItem();
    if (!item || item.isRest) return null;
    return item.word;
  }

  getUpcomingWords(count: number): BeatItem[] {
    const { beatItems, currentItemIndex } = this.state;
    const upcoming: BeatItem[] = [];

    for (let i = currentItemIndex; i < beatItems.length && upcoming.length < count; i++) {
      const item = beatItems[i];
      if (!item.isRest) {
        upcoming.push(item);
      }
    }

    return upcoming;
  }

  // ==================== Timing ====================

  getTimingConfig(): TimingConfig {
    return (
      this.timingConfig ?? {
        perfectWindowMs: 50,
        goodWindowMs: 150,
        acceptWindowMs: 300,
      }
    );
  }

  getBeatProgress(): number {
    if (!this.state.song || this.state.gameState !== 'playing') return 0;

    const beatDurationMs = (60 / this.state.song.bpm) * 1000;
    const elapsedMs = this.state.elapsedTimeMs;
    const progress = (elapsedMs % beatDurationMs) / beatDurationMs;

    return progress;
  }

  getExpectedBeatTimeMs(): number {
    const { currentItemIndex } = this.state;
    if (currentItemIndex >= this.expectedBeatTimes.length) return 0;
    return this.expectedBeatTimes[currentItemIndex];
  }

  // ==================== Results ====================

  getResults(): SongResults | null {
    if (this.state.gameState !== 'complete' || !this.state.song) {
      return null;
    }

    const totalWords = this.state.beatItems.filter((item) => !item.isRest).length;
    const correctCount =
      this.state.perfectCount +
      this.state.goodCount +
      this.state.earlyCount +
      this.state.lateCount;
    const accuracy = totalWords > 0 ? correctCount / totalWords : 0;

    // Calculate average offset (excluding misses)
    const totalOffsetSum = 0; // Would need to track this during gameplay for accuracy

    return {
      songId: this.state.song.id,
      songTitle: this.state.song.title,
      difficulty: this.state.song.difficulty,
      perfectCount: this.state.perfectCount,
      goodCount: this.state.goodCount,
      earlyCount: this.state.earlyCount,
      lateCount: this.state.lateCount,
      missCount: this.state.missCount,
      totalWords,
      accuracy,
      score: this.state.score,
      maxCombo: this.state.maxCombo,
      averageOffsetMs: totalOffsetSum, // Simplified
      totalTimeMs: this.state.elapsedTimeMs,
      completedAt: new Date(),
    };
  }
}

// ==================== Singleton ====================

let songService: SongService | null = null;

export function getSongService(): SongService {
  if (!songService) {
    songService = new SongService();
  }
  return songService;
}

export function resetSongService(): void {
  if (songService) {
    songService.stop();
  }
  songService = null;
}
