/**
 * Background Music Service
 *
 * Generates drums, bass, and pad accompaniment for song mode using Web Audio API.
 * Provides sample-accurate beat scheduling and synchronization.
 */

import { getPattern, type DrumPattern, type DrumHit } from '@/data/static/drumPatterns';
import {
  getBassPattern,
  calculateBassFrequency,
  BASS_BASE_FREQUENCY,
  type BassPattern,
  type BassNote,
} from '@/data/static/bassPatterns';

// ==================== Types ====================

export type BeatCallback = (beat: number, measure: number, timeMs: number) => void;

export interface BackgroundMusicConfig {
  bpm: number;
  drumPatternId: string;
  bassPatternId: string;
  padEnabled: boolean;
}

export interface IBackgroundMusicService {
  // Lifecycle
  initialize(): Promise<void>;
  isInitialized(): boolean;

  // Playback control
  start(config: BackgroundMusicConfig): void;
  stop(): void;
  pause(): void;
  resume(): void;
  isPlaying(): boolean;

  // Beat synchronization
  getCurrentBeat(): number;
  getCurrentMeasure(): number;
  getBeatTimeMs(): number;
  getTimeUntilNextBeat(): number;
  onBeat(callback: BeatCallback): () => void;

  // Dynamic adjustments
  setCurrentRoot(semitones: number): void;
  getCurrentRoot(): number;
  triggerChordBlend(frequencies: number[], duration: number): void;

  // Volume control
  setMasterVolume(volume: number): void;
  setDrumVolume(volume: number): void;
  setBassVolume(volume: number): void;
  setPadVolume(volume: number): void;
}

// ==================== Implementation ====================

export class BackgroundMusicService implements IBackgroundMusicService {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private drumGain: GainNode | null = null;
  private bassGain: GainNode | null = null;
  private padGain: GainNode | null = null;
  private chordBlendGain: GainNode | null = null;

  // Playback state
  private playing = false;
  private paused = false;
  private config: BackgroundMusicConfig | null = null;

  // Timing
  private startTime = 0;
  private pauseTime = 0;
  private currentBeat = 0;
  private currentMeasure = 0;
  private schedulerTimer: number | null = null;
  private nextScheduleTime = 0;
  private scheduleAheadTime = 0.1; // Schedule 100ms ahead
  private lookAheadMs = 25; // Check every 25ms

  // Patterns
  private drumPattern: DrumPattern | null = null;
  private bassPattern: BassPattern | null = null;

  // Musical state
  private currentRoot = 0; // Semitones from E

  // Beat callbacks
  private beatCallbacks = new Set<BeatCallback>();

  // Noise buffer for drums
  private noiseBuffer: AudioBuffer | null = null;

  // Pad oscillators
  private padOscillators: OscillatorNode[] = [];
  private padOscGains: GainNode[] = [];

  // ==================== Lifecycle ====================

  async initialize(): Promise<void> {
    if (this.ctx) return;

    this.ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();

    // Create gain nodes
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.7;
    this.masterGain.connect(this.ctx.destination);

    this.drumGain = this.ctx.createGain();
    this.drumGain.gain.value = 0.6;
    this.drumGain.connect(this.masterGain);

    this.bassGain = this.ctx.createGain();
    this.bassGain.gain.value = 0.5;
    this.bassGain.connect(this.masterGain);

    this.padGain = this.ctx.createGain();
    this.padGain.gain.value = 0.2;
    this.padGain.connect(this.masterGain);

    this.chordBlendGain = this.ctx.createGain();
    this.chordBlendGain.gain.value = 0.3;
    this.chordBlendGain.connect(this.masterGain);

    // Create noise buffer for drums
    this.noiseBuffer = this.createNoiseBuffer();

    // Resume context if suspended
    if (this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }
  }

  isInitialized(): boolean {
    return this.ctx !== null && this.ctx.state === 'running';
  }

  private createNoiseBuffer(): AudioBuffer {
    if (!this.ctx) throw new Error('AudioContext not initialized');

    const bufferSize = this.ctx.sampleRate * 2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    return buffer;
  }

  // ==================== Playback Control ====================

  start(config: BackgroundMusicConfig): void {
    if (!this.ctx || !this.masterGain) {
      console.warn('BackgroundMusicService not initialized');
      return;
    }

    // Resume context if needed
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    this.config = config;
    this.drumPattern = getPattern(config.drumPatternId);
    this.bassPattern = getBassPattern(config.bassPatternId);

    this.playing = true;
    this.paused = false;
    this.currentBeat = 0;
    this.currentMeasure = 0;
    this.startTime = this.ctx.currentTime;
    this.nextScheduleTime = this.startTime;

    // Start pad if enabled
    if (config.padEnabled) {
      this.startPad();
    }

    // Start scheduler
    this.startScheduler();
  }

  stop(): void {
    this.playing = false;
    this.paused = false;

    if (this.schedulerTimer !== null) {
      clearInterval(this.schedulerTimer);
      this.schedulerTimer = null;
    }

    this.stopPad();

    this.currentBeat = 0;
    this.currentMeasure = 0;
  }

  pause(): void {
    if (!this.playing || this.paused) return;

    this.paused = true;
    this.pauseTime = this.ctx?.currentTime ?? 0;

    if (this.schedulerTimer !== null) {
      clearInterval(this.schedulerTimer);
      this.schedulerTimer = null;
    }

    this.stopPad();
  }

  resume(): void {
    if (!this.playing || !this.paused || !this.ctx) return;

    this.paused = false;

    // Adjust start time to account for pause duration
    const pauseDuration = this.ctx.currentTime - this.pauseTime;
    this.startTime += pauseDuration;
    this.nextScheduleTime = this.ctx.currentTime;

    // Restart pad
    if (this.config?.padEnabled) {
      this.startPad();
    }

    // Restart scheduler
    this.startScheduler();
  }

  isPlaying(): boolean {
    return this.playing && !this.paused;
  }

  // ==================== Beat Timing ====================

  getCurrentBeat(): number {
    return this.currentBeat;
  }

  getCurrentMeasure(): number {
    return this.currentMeasure;
  }

  getBeatTimeMs(): number {
    if (!this.config) return 0;
    return (60 / this.config.bpm) * 1000;
  }

  getTimeUntilNextBeat(): number {
    if (!this.ctx || !this.config || !this.playing) return 0;

    const beatDuration = 60 / this.config.bpm;
    const elapsed = this.ctx.currentTime - this.startTime;
    const currentBeatTime = Math.floor(elapsed / beatDuration) * beatDuration;
    const nextBeatTime = currentBeatTime + beatDuration;
    const timeUntilNext = (nextBeatTime - elapsed + this.startTime - this.ctx.currentTime) * 1000;

    return Math.max(0, timeUntilNext);
  }

  onBeat(callback: BeatCallback): () => void {
    this.beatCallbacks.add(callback);
    return () => this.beatCallbacks.delete(callback);
  }

  private notifyBeatCallbacks(beat: number, measure: number, timeMs: number): void {
    this.beatCallbacks.forEach((cb) => {
      try {
        cb(beat, measure, timeMs);
      } catch (e) {
        console.error('Beat callback error:', e);
      }
    });
  }

  // ==================== Scheduler ====================

  private startScheduler(): void {
    if (this.schedulerTimer !== null) {
      clearInterval(this.schedulerTimer);
    }

    this.schedulerTimer = window.setInterval(() => {
      this.scheduleNotes();
    }, this.lookAheadMs);
  }

  private scheduleNotes(): void {
    if (!this.ctx || !this.config || !this.playing || this.paused) return;

    const bpm = this.config.bpm;
    const beatDuration = 60 / bpm;
    const beatsPerMeasure = 4; // Assuming 4/4 time

    // Limit iterations to prevent runaway loops
    let iterations = 0;
    const maxIterations = 10;

    while (
      this.nextScheduleTime < this.ctx.currentTime + this.scheduleAheadTime &&
      iterations < maxIterations
    ) {
      iterations++;

      const beatInMeasure = (this.currentBeat % beatsPerMeasure) + 1;
      const measureInPattern = this.currentMeasure % (this.drumPattern?.measuresPerLoop ?? 1);

      // Schedule drum hits for this beat
      this.scheduleDrumHits(this.nextScheduleTime, beatInMeasure, measureInPattern);

      // Schedule bass notes for this beat
      this.scheduleBassNotes(this.nextScheduleTime, beatInMeasure, measureInPattern);

      // Notify callbacks synchronously (simpler and safer)
      // Capture values to avoid closure issues
      const capturedBeat = beatInMeasure;
      const capturedMeasure = this.currentMeasure;
      const capturedTimeMs = this.nextScheduleTime * 1000;
      this.notifyBeatCallbacks(capturedBeat, capturedMeasure, capturedTimeMs);

      // Advance to next beat
      this.nextScheduleTime += beatDuration;
      this.currentBeat++;

      if (this.currentBeat % beatsPerMeasure === 0) {
        this.currentMeasure++;
      }
    }
  }

  // ==================== Drum Synthesis ====================

  private scheduleDrumHits(time: number, beat: number, measureInPattern: number): void {
    if (!this.drumPattern || !this.ctx || !this.drumGain) return;

    const beatsPerMeasure = 4;
    const patternBeat = measureInPattern * beatsPerMeasure + beat;

    // Find hits on this beat
    const hits = this.drumPattern.hits.filter((hit) => {
      const hitBeat = Math.floor(hit.beat);
      return hitBeat === patternBeat || hitBeat === beat;
    });

    const beatDuration = 60 / (this.config?.bpm ?? 90);

    hits.forEach((hit) => {
      const hitTime = time + hit.subdivision * beatDuration;
      this.playDrumHit(hit, hitTime);
    });
  }

  private playDrumHit(hit: DrumHit, time: number): void {
    switch (hit.sound) {
      case 'kick':
        this.playKick(time, hit.velocity);
        break;
      case 'snare':
        this.playSnare(time, hit.velocity);
        break;
      case 'hihat':
        this.playHihat(time, hit.velocity, false);
        break;
      case 'hihatOpen':
        this.playHihat(time, hit.velocity, true);
        break;
      case 'rim':
        this.playRim(time, hit.velocity);
        break;
      case 'clap':
        this.playClap(time, hit.velocity);
        break;
    }
  }

  private playKick(time: number, velocity: number): void {
    if (!this.ctx || !this.drumGain) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, time);
    osc.frequency.exponentialRampToValueAtTime(40, time + 0.08);

    gain.gain.setValueAtTime(velocity * 0.9, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.25);

    osc.connect(gain);
    gain.connect(this.drumGain);

    osc.start(time);
    osc.stop(time + 0.25);
  }

  private playSnare(time: number, velocity: number): void {
    if (!this.ctx || !this.drumGain || !this.noiseBuffer) return;

    // Noise component
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.noiseBuffer;

    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'highpass';
    noiseFilter.frequency.value = 1500;

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(velocity * 0.35, time);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.drumGain);

    // Tone component
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.value = 200;

    oscGain.gain.setValueAtTime(velocity * 0.4, time);
    oscGain.gain.exponentialRampToValueAtTime(0.001, time + 0.08);

    osc.connect(oscGain);
    oscGain.connect(this.drumGain);

    noise.start(time);
    noise.stop(time + 0.15);
    osc.start(time);
    osc.stop(time + 0.08);
  }

  private playHihat(time: number, velocity: number, open: boolean): void {
    if (!this.ctx || !this.drumGain || !this.noiseBuffer) return;

    const noise = this.ctx.createBufferSource();
    noise.buffer = this.noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 8000;

    const gain = this.ctx.createGain();
    const duration = open ? 0.2 : 0.04;

    gain.gain.setValueAtTime(velocity * 0.2, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.drumGain);

    noise.start(time);
    noise.stop(time + duration);
  }

  private playRim(time: number, velocity: number): void {
    if (!this.ctx || !this.drumGain) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.value = 1000;

    gain.gain.setValueAtTime(velocity * 0.4, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.03);

    osc.connect(gain);
    gain.connect(this.drumGain);

    osc.start(time);
    osc.stop(time + 0.03);
  }

  private playClap(time: number, velocity: number): void {
    if (!this.ctx || !this.drumGain || !this.noiseBuffer) return;

    // Multi-layered clap
    for (let i = 0; i < 3; i++) {
      const noise = this.ctx.createBufferSource();
      noise.buffer = this.noiseBuffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 2000;
      filter.Q.value = 1;

      const gain = this.ctx.createGain();
      const offset = i * 0.01;

      gain.gain.setValueAtTime(velocity * 0.25, time + offset);
      gain.gain.exponentialRampToValueAtTime(0.001, time + offset + 0.1);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.drumGain);

      noise.start(time + offset);
      noise.stop(time + offset + 0.1);
    }
  }

  // ==================== Bass Synthesis ====================

  private scheduleBassNotes(time: number, beat: number, measureInPattern: number): void {
    if (!this.bassPattern || !this.ctx || !this.bassGain || !this.config) return;

    const beatsPerMeasure = 4;
    const patternBeat = measureInPattern * beatsPerMeasure + beat;
    const beatDuration = 60 / this.config.bpm;

    // Find notes on this beat
    const notes = this.bassPattern.notes.filter((note) => {
      const noteBeat = Math.floor(note.beat);
      return noteBeat === patternBeat || noteBeat === beat;
    });

    notes.forEach((note) => {
      const noteTime = time + note.subdivision * beatDuration;
      const noteDuration = note.duration * beatDuration;
      this.playBassNote(note, noteTime, noteDuration);
    });
  }

  private playBassNote(note: BassNote, time: number, duration: number): void {
    if (!this.ctx || !this.bassGain) return;

    const rootToUse = this.bassPattern?.followsChordRoot ? this.currentRoot : 0;
    const frequency = calculateBassFrequency(note, rootToUse);

    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.value = frequency;

    filter.type = 'lowpass';
    filter.frequency.value = 600;
    filter.Q.value = 2;

    // ADSR envelope
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(note.velocity * 0.5, time + 0.01);
    gain.gain.exponentialRampToValueAtTime(note.velocity * 0.4, time + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.bassGain);

    osc.start(time);
    osc.stop(time + duration + 0.01);
  }

  // ==================== Pad Synthesis ====================

  private startPad(): void {
    if (!this.ctx || !this.padGain) return;

    // Stop any existing pad
    this.stopPad();

    // Em7 voicing: E, G, B, D (0, 3, 7, 10 semitones from E)
    const voicing = [0, 3, 7, 10];
    const baseFreq = 164.81; // E3

    voicing.forEach((semitones, i) => {
      const freq = baseFreq * Math.pow(2, semitones / 12);

      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = i % 2 === 0 ? 'sine' : 'triangle';
      osc.frequency.value = freq;
      osc.detune.value = (Math.random() - 0.5) * 8; // Slight detune for warmth

      gain.gain.setValueAtTime(0, this.ctx!.currentTime);
      gain.gain.linearRampToValueAtTime(0.15 / voicing.length, this.ctx!.currentTime + 1.5);

      osc.connect(gain);
      gain.connect(this.padGain!);
      osc.start();

      this.padOscillators.push(osc);
      this.padOscGains.push(gain);
    });
  }

  private stopPad(): void {
    if (!this.ctx) return;

    const fadeTime = 0.5;
    const now = this.ctx.currentTime;

    this.padOscGains.forEach((gain) => {
      gain.gain.linearRampToValueAtTime(0, now + fadeTime);
    });

    setTimeout(() => {
      this.padOscillators.forEach((osc) => {
        try {
          osc.stop();
        } catch {
          // Already stopped
        }
      });
      this.padOscillators = [];
      this.padOscGains = [];
    }, fadeTime * 1000 + 50);
  }

  // ==================== Dynamic Music ====================

  setCurrentRoot(semitones: number): void {
    this.currentRoot = semitones;
  }

  getCurrentRoot(): number {
    return this.currentRoot;
  }

  triggerChordBlend(frequencies: number[], duration: number): void {
    if (!this.ctx || !this.chordBlendGain) return;

    const now = this.ctx.currentTime;

    frequencies.forEach((freq, i) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'sine';
      osc.frequency.value = freq;

      // Quick attack, blend with pad
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.12 / frequencies.length, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      osc.connect(gain);
      gain.connect(this.chordBlendGain!);

      osc.start(now);
      osc.stop(now + duration + 0.01);
    });
  }

  // ==================== Volume Control ====================

  setMasterVolume(volume: number): void {
    if (this.masterGain) {
      this.masterGain.gain.value = Math.max(0, Math.min(1, volume));
    }
  }

  setDrumVolume(volume: number): void {
    if (this.drumGain) {
      this.drumGain.gain.value = Math.max(0, Math.min(1, volume));
    }
  }

  setBassVolume(volume: number): void {
    if (this.bassGain) {
      this.bassGain.gain.value = Math.max(0, Math.min(1, volume));
    }
  }

  setPadVolume(volume: number): void {
    if (this.padGain) {
      this.padGain.gain.value = Math.max(0, Math.min(1, volume));
    }
  }
}

// ==================== Singleton ====================

let backgroundMusicService: BackgroundMusicService | null = null;

export function getBackgroundMusicService(): BackgroundMusicService {
  if (!backgroundMusicService) {
    backgroundMusicService = new BackgroundMusicService();
  }
  return backgroundMusicService;
}

export function resetBackgroundMusicService(): void {
  if (backgroundMusicService) {
    backgroundMusicService.stop();
  }
  backgroundMusicService = null;
}
