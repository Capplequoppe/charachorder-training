/**
 * Audio Service
 *
 * Handles all audio generation and playback using Web Audio API.
 * Supports both soundfont-based MIDI playback (realistic instruments)
 * and synthesized oscillator fallback.
 *
 * Instruments available via soundfont:
 * - acoustic_guitar_nylon (default)
 * - acoustic_guitar_steel
 * - acoustic_grand_piano
 * - electric_guitar_clean
 * - electric_piano_1
 * - vibraphone
 * - marimba
 * - And many more General MIDI instruments
 *
 * Fallback synthesis uses E Minor Pentatonic power chords.
 */

import Soundfont, { type Player, type GMInstrument } from 'soundfont-player';
import {
  FingerId,
  Direction,
  Chord,
  PowerChord,
  Word,
  AudioVariation,
} from '../domain';
import { IFingerRepository, ICharacterRepository } from '../data/repositories';

/**
 * Default note durations in seconds.
 */
export const AUDIO_DURATIONS = {
  DEFAULT: 0.7,
  SUCCESS: 1.5,
  ERROR: 0.3,
  QUICK: 0.2,
  ARPEGGIO_NOTE: 0.4,
  SUSTAINED_MAX: 5.0,
} as const;

/**
 * Available instrument presets for easy selection.
 */
export const INSTRUMENT_PRESETS = {
  piano: 'acoustic_grand_piano',
  electricPiano: 'electric_piano_1',
  guitarClean: 'electric_guitar_clean',
  guitarNylon: 'acoustic_guitar_nylon',
  guitarSteel: 'acoustic_guitar_steel',
  vibraphone: 'vibraphone',
  marimba: 'marimba',
  organ: 'drawbar_organ',
  strings: 'string_ensemble_1',
  synth: 'lead_2_sawtooth',
} as const;

export type InstrumentPreset = keyof typeof INSTRUMENT_PRESETS;

/**
 * Interface for audio service operations.
 */
export interface IAudioService {
  // Initialization
  initialize(): Promise<void>;
  isReady(): boolean;

  // Single note playback
  playFingerNote(fingerId: FingerId, direction?: Direction, duration?: number): void;
  playCharacterNote(char: string, duration?: number): void;

  // Chord playback
  playChord(chord: Chord, style?: 'strum' | 'arpeggio' | 'simultaneous'): void;
  playPowerChord(powerChord: PowerChord): void;
  playWordResolution(word: Word): void;

  // Feedback sounds
  playSuccessSound(): void;
  playErrorSound(): void;

  // Combo sounds
  playComboSound(pitchMultiplier: number, tier: number): void;
  playStreakBrokenSound(brokenStreak: number): void;
  playLevelUpSound(tier: number): void;

  // Achievement sounds
  playAchievementUnlockSound(tier: 'bronze' | 'silver' | 'gold' | 'platinum'): void;
  playProgressMilestoneSound(): void;

  // Sustained notes
  startSustainedNote(fingerId: FingerId, direction?: Direction): string;
  stopSustainedNote(noteId: string): void;
  stopAllNotes(): void;

  // Configuration
  setMasterVolume(volume: number): void;
  getMasterVolume(): number;
  setMuted(muted: boolean): void;
  isMuted(): boolean;

  // Instrument selection
  setInstrument(preset: InstrumentPreset): Promise<void>;
  setInstrumentByName(name: GMInstrument): Promise<void>;
  getInstrument(): InstrumentPreset | GMInstrument;
  isInstrumentLoaded(): boolean;
  setUseSoundfonts(enabled: boolean): void;
  getUseSoundfonts(): boolean;
}

/**
 * Chord playback styles.
 */
export type ChordStyle = 'strum' | 'arpeggio' | 'simultaneous';

/**
 * Audio service implementation using Web Audio API with soundfont support.
 */
export class AudioService implements IAudioService {
  private audioContext: AudioContext | null = null;
  private fingerRepo: IFingerRepository;
  private characterRepo: ICharacterRepository | null = null;
  private masterVolume: number = 0.8;
  private muted: boolean = false;
  private activeOscillators: Map<string, OscillatorNode[]> = new Map();
  private noteIdCounter: number = 0;

  // Soundfont player
  private instrument: Player | null = null;
  private currentInstrumentName: GMInstrument = 'acoustic_guitar_nylon';
  private instrumentLoading: boolean = false;
  private useSoundfonts: boolean = true;

  // Track active soundfont notes for sustained playback
  private activeSoundfontNotes: Map<string, { stop: (time?: number) => void }> = new Map();

  constructor(fingerRepo: IFingerRepository, characterRepo?: ICharacterRepository) {
    this.fingerRepo = fingerRepo;
    this.characterRepo = characterRepo ?? null;
  }

  async initialize(): Promise<void> {
    if (!this.audioContext) {
      this.audioContext = new AudioContext();
    }
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }

    // Load default instrument
    if (this.useSoundfonts && !this.instrument && !this.instrumentLoading) {
      await this.loadInstrument(this.currentInstrumentName);
    }
  }

  isReady(): boolean {
    return this.audioContext !== null && this.audioContext.state === 'running';
  }

  private getContext(): AudioContext {
    if (!this.audioContext) {
      this.audioContext = new AudioContext();
    }
    return this.audioContext;
  }

  // ==================== Instrument Management ====================

  private async loadInstrument(name: GMInstrument): Promise<void> {
    if (this.instrumentLoading) return;

    this.instrumentLoading = true;
    try {
      const ctx = this.getContext();
      this.instrument = await Soundfont.instrument(ctx, name, {
        soundfont: 'MusyngKite',
        format: 'mp3',
      });
      this.currentInstrumentName = name;
      console.log(`Loaded soundfont instrument: ${name}`);
    } catch (error) {
      console.warn(`Failed to load soundfont instrument ${name}, using oscillator fallback:`, error);
      this.instrument = null;
    } finally {
      this.instrumentLoading = false;
    }
  }

  async setInstrument(preset: InstrumentPreset): Promise<void> {
    const instrumentName = INSTRUMENT_PRESETS[preset] as GMInstrument;
    await this.loadInstrument(instrumentName);
  }

  async setInstrumentByName(name: GMInstrument): Promise<void> {
    await this.loadInstrument(name);
  }

  getInstrument(): InstrumentPreset | GMInstrument {
    // Check if current instrument matches a preset
    for (const [preset, name] of Object.entries(INSTRUMENT_PRESETS)) {
      if (name === this.currentInstrumentName) {
        return preset as InstrumentPreset;
      }
    }
    return this.currentInstrumentName;
  }

  isInstrumentLoaded(): boolean {
    return this.instrument !== null;
  }

  setUseSoundfonts(enabled: boolean): void {
    this.useSoundfonts = enabled;
    if (enabled && !this.instrument && !this.instrumentLoading) {
      this.loadInstrument(this.currentInstrumentName);
    }
  }

  getUseSoundfonts(): boolean {
    return this.useSoundfonts;
  }

  // ==================== Single Note Playback ====================

  playFingerNote(
    fingerId: FingerId,
    direction: Direction = Direction.PRESS,
    duration: number = AUDIO_DURATIONS.DEFAULT
  ): void {
    if (this.muted) return;

    const finger = this.fingerRepo.getById(fingerId);
    if (!finger?.note) return;

    const variation = finger.note.variations[direction];

    if (this.useSoundfonts && this.instrument) {
      this.playSoundfontNote(
        finger.note.midiNote,
        duration,
        this.masterVolume * 0.8,
        variation
      );
    } else {
      this.playPowerChordTone(
        finger.note.frequency,
        duration,
        this.masterVolume * 0.4,
        variation.panPosition,
        variation.brightnessOffset,
        variation
      );
    }
  }

  playCharacterNote(char: string, duration: number = AUDIO_DURATIONS.DEFAULT): void {
    if (this.muted || !this.characterRepo) return;

    const character = this.characterRepo.getByChar(char);
    if (!character) return;

    this.playFingerNote(character.fingerId, character.direction, duration);
  }

  // ==================== Soundfont Playback ====================

  private playSoundfontNote(
    midiNote: number,
    duration: number,
    volume: number,
    variation?: AudioVariation
  ): void {
    if (!this.instrument) return;

    const ctx = this.getContext();
    const now = ctx.currentTime;

    // Apply ADSR from variation if provided
    const options = {
      gain: volume,
      duration: duration,
      attack: variation ? variation.attackMs / 1000 : 0.01,
      decay: variation ? variation.decayMs / 1000 : 0.1,
      sustain: variation?.sustainLevel ?? 0.7,
      release: variation ? variation.releaseMs / 1000 : 0.3,
    };

    this.instrument.play(midiNote, now, options);
  }

  private playSoundfontChord(
    midiNotes: number[],
    duration: number,
    volume: number,
    staggerMs: number = 0
  ): void {
    if (!this.instrument) return;

    const ctx = this.getContext();
    const now = ctx.currentTime;

    midiNotes.forEach((note, index) => {
      const startTime = now + (index * staggerMs) / 1000;
      this.instrument!.play(note, startTime, {
        gain: volume / Math.sqrt(midiNotes.length),
        duration: duration,
      });
    });
  }

  // ==================== Chord Playback ====================

  playChord(
    chord: Chord,
    style: 'strum' | 'arpeggio' | 'simultaneous' = 'arpeggio'
  ): void {
    if (this.muted) return;

    const fingerIds = chord.fingerIds;
    const delayMs = style === 'simultaneous' ? 0 : style === 'strum' ? 20 : 40;

    // Collect MIDI notes
    const midiNotes: number[] = [];
    fingerIds.forEach((fingerId) => {
      const finger = this.fingerRepo.getById(fingerId);
      if (finger?.note) {
        midiNotes.push(finger.note.midiNote);
      }
    });

    if (this.useSoundfonts && this.instrument && midiNotes.length > 0) {
      this.playSoundfontChord(midiNotes, AUDIO_DURATIONS.DEFAULT, this.masterVolume * 0.6, delayMs);
    } else {
      // Fallback to oscillator
      const volume = Math.min(0.3, 0.5 / Math.sqrt(fingerIds.length));
      fingerIds.forEach((fingerId, index) => {
        const finger = this.fingerRepo.getById(fingerId);
        if (!finger?.note) return;

        setTimeout(() => {
          this.playPowerChordTone(
            finger.note!.frequency,
            AUDIO_DURATIONS.DEFAULT,
            volume * this.masterVolume
          );
        }, index * delayMs);
      });
    }
  }

  playPowerChord(powerChord: PowerChord): void {
    if (this.muted) return;

    const [freq1, freq2] = powerChord.noteFrequencies;
    const volume = 0.25 * this.masterVolume;

    if (this.useSoundfonts && this.instrument) {
      const midiNotes: number[] = [];
      if (freq1 > 0) midiNotes.push(this.frequencyToMidi(freq1));
      if (freq2 > 0) midiNotes.push(this.frequencyToMidi(freq2));
      this.playSoundfontChord(midiNotes, AUDIO_DURATIONS.SUCCESS, volume, 30);
    } else {
      // Fallback
      if (freq1 > 0) {
        this.playPowerChordTone(freq1, AUDIO_DURATIONS.SUCCESS, volume);
      }
      if (freq2 > 0) {
        setTimeout(() => {
          this.playPowerChordTone(freq2, AUDIO_DURATIONS.SUCCESS, volume);
        }, 30);
      }
    }
  }

  playWordResolution(_word: Word): void {
    // No extra sound on correct - keypress notes are sufficient feedback
  }

  private playResolutionChime(): void {
    // Ascending two-note resolution: A5, C6
    const notes = [81, 84]; // MIDI notes

    if (this.useSoundfonts && this.instrument) {
      const ctx = this.getContext();
      notes.forEach((note, index) => {
        this.instrument!.play(note, ctx.currentTime + index * 0.06, {
          gain: 0.15 * this.masterVolume,
          duration: 0.15,
        });
      });
    } else {
      const freqs = [880, 1047];
      freqs.forEach((freq, index) => {
        setTimeout(() => {
          this.playSimpleNote(freq, 0.15, 0.1 * this.masterVolume);
        }, index * 60);
      });
    }
  }

  // ==================== Feedback Sounds ====================

  playSuccessSound(): void {
    if (this.muted) return;

    // Ascending major third: C5, E5
    if (this.useSoundfonts && this.instrument) {
      const ctx = this.getContext();
      this.instrument.play(72, ctx.currentTime, { gain: 0.15 * this.masterVolume, duration: 0.15 });
      this.instrument.play(76, ctx.currentTime + 0.08, { gain: 0.12 * this.masterVolume, duration: 0.2 });
    } else {
      this.playSimpleNote(523.25, 0.15, 0.15 * this.masterVolume);
      setTimeout(() => {
        this.playSimpleNote(659.25, 0.2, 0.12 * this.masterVolume);
      }, 80);
    }
  }

  playErrorSound(): void {
    if (this.muted) return;

    // Descending minor second: Eb4, D4
    if (this.useSoundfonts && this.instrument) {
      const ctx = this.getContext();
      this.instrument.play(63, ctx.currentTime, { gain: 0.15 * this.masterVolume, duration: 0.15 });
      this.instrument.play(62, ctx.currentTime + 0.08, { gain: 0.12 * this.masterVolume, duration: 0.2 });
    } else {
      this.playSimpleNote(311.13, 0.15, 0.15 * this.masterVolume);
      setTimeout(() => {
        this.playSimpleNote(293.66, 0.2, 0.12 * this.masterVolume);
      }, 80);
    }
  }

  // ==================== Combo Sounds ====================

  playComboSound(pitchMultiplier: number, tier: number): void {
    if (this.muted || tier === 0) return;

    // Base MIDI note - A4 (69) shifted by pitch multiplier
    const baseNote = 69 + Math.round(12 * Math.log2(pitchMultiplier));

    // Major triad arpeggio
    const intervals = [0, 4, 7]; // Root, major third, perfect fifth

    if (this.useSoundfonts && this.instrument) {
      const ctx = this.getContext();
      intervals.forEach((interval, index) => {
        this.instrument!.play(baseNote + interval, ctx.currentTime + index * 0.05, {
          gain: 0.1 * this.masterVolume,
          duration: 0.15,
        });
      });
    } else {
      const baseFreq = 440 * pitchMultiplier;
      const ratios = [1, 1.25, 1.5];
      ratios.forEach((ratio, index) => {
        setTimeout(() => {
          this.playSimpleNote(baseFreq * ratio, 0.15, 0.1 * this.masterVolume);
        }, index * 50);
      });
    }
  }

  playStreakBrokenSound(brokenStreak: number): void {
    if (this.muted || brokenStreak < 3) return;

    // Descending disappointed sound from A3 (57)
    const steps = brokenStreak >= 10 ? [0, -2, -4, -6] : [0, -2, -4];

    if (this.useSoundfonts && this.instrument) {
      const ctx = this.getContext();
      steps.forEach((step, index) => {
        this.instrument!.play(57 + step, ctx.currentTime + index * 0.1, {
          gain: 0.12 * this.masterVolume,
          duration: 0.2,
        });
      });
    } else {
      const baseFreq = 220;
      const ratios = brokenStreak >= 10 ? [1, 0.9, 0.8, 0.7] : [1, 0.9, 0.8];
      ratios.forEach((ratio, index) => {
        setTimeout(() => {
          this.playSimpleNote(baseFreq * ratio, 0.2, 0.12 * this.masterVolume);
        }, index * 100);
      });
    }
  }

  playLevelUpSound(tier: number): void {
    if (this.muted || tier <= 1) return;

    // Base note shifts up with tier
    const baseNote = 69 + (tier - 1); // A4 and up

    if (this.useSoundfonts && this.instrument) {
      const ctx = this.getContext();

      if (tier >= 5) {
        // Epic tier - full fanfare
        const fanfare = [0, 4, 7, 12];
        fanfare.forEach((interval, index) => {
          this.instrument!.play(baseNote + interval, ctx.currentTime + index * 0.08, {
            gain: 0.12 * this.masterVolume,
            duration: 0.25,
          });
        });
        // Resolve with octave
        this.instrument!.play(baseNote + 12, ctx.currentTime + fanfare.length * 0.08 + 0.05, {
          gain: 0.15 * this.masterVolume,
          duration: 0.4,
        });
      } else if (tier >= 3) {
        // Mid tier - simple arpeggio
        [0, 4, 7].forEach((interval, index) => {
          this.instrument!.play(baseNote + interval, ctx.currentTime + index * 0.06, {
            gain: 0.1 * this.masterVolume,
            duration: 0.2,
          });
        });
      } else {
        // Low tier - just two notes
        this.instrument!.play(baseNote, ctx.currentTime, { gain: 0.08 * this.masterVolume, duration: 0.15 });
        this.instrument!.play(baseNote + 4, ctx.currentTime + 0.07, { gain: 0.1 * this.masterVolume, duration: 0.2 });
      }
    } else {
      // Fallback to oscillator
      const baseFreq = 440 * Math.pow(1.05, tier - 1);

      if (tier >= 5) {
        const fanfare = [1, 1.25, 1.5, 2];
        fanfare.forEach((ratio, index) => {
          setTimeout(() => {
            this.playSimpleNote(baseFreq * ratio, 0.25, 0.12 * this.masterVolume);
          }, index * 80);
        });
        setTimeout(() => {
          this.playSimpleNote(baseFreq * 2, 0.4, 0.15 * this.masterVolume);
        }, fanfare.length * 80 + 50);
      } else if (tier >= 3) {
        [1, 1.25, 1.5].forEach((ratio, index) => {
          setTimeout(() => {
            this.playSimpleNote(baseFreq * ratio, 0.2, 0.1 * this.masterVolume);
          }, index * 60);
        });
      } else {
        this.playSimpleNote(baseFreq, 0.15, 0.08 * this.masterVolume);
        setTimeout(() => {
          this.playSimpleNote(baseFreq * 1.25, 0.2, 0.1 * this.masterVolume);
        }, 70);
      }
    }
  }

  // ==================== Achievement Sounds ====================

  playAchievementUnlockSound(tier: 'bronze' | 'silver' | 'gold' | 'platinum'): void {
    if (this.muted) return;

    const tierConfig = {
      bronze: { baseNote: 72 },    // C5
      silver: { baseNote: 74 },    // D5
      gold: { baseNote: 76 },      // E5
      platinum: { baseNote: 79 },  // G5
    };

    const config = tierConfig[tier];

    if (this.useSoundfonts && this.instrument) {
      if (tier === 'platinum') {
        this.playPlatinumFanfareSoundfont(config.baseNote);
      } else if (tier === 'gold') {
        this.playGoldFanfareSoundfont(config.baseNote);
      } else if (tier === 'silver') {
        this.playSilverChimeSoundfont(config.baseNote);
      } else {
        this.playBronzeChimeSoundfont(config.baseNote);
      }
    } else {
      // Fallback to oscillator
      const freqConfig = {
        bronze: 523.25,
        silver: 587.33,
        gold: 659.25,
        platinum: 783.99,
      };
      const baseFreq = freqConfig[tier];

      if (tier === 'platinum') {
        this.playPlatinumFanfare(baseFreq);
      } else if (tier === 'gold') {
        this.playGoldFanfare(baseFreq);
      } else if (tier === 'silver') {
        this.playSilverChime(baseFreq);
      } else {
        this.playBronzeChime(baseFreq);
      }
    }
  }

  private playBronzeChimeSoundfont(baseNote: number): void {
    if (!this.instrument) return;
    const ctx = this.getContext();
    [0, 7].forEach((interval, index) => {
      this.instrument!.play(baseNote + interval, ctx.currentTime + index * 0.1, {
        gain: 0.12 * this.masterVolume,
        duration: 0.25,
      });
    });
  }

  private playSilverChimeSoundfont(baseNote: number): void {
    if (!this.instrument) return;
    const ctx = this.getContext();
    [0, 4, 7].forEach((interval, index) => {
      this.instrument!.play(baseNote + interval, ctx.currentTime + index * 0.08, {
        gain: 0.14 * this.masterVolume,
        duration: 0.3,
      });
    });
  }

  private playGoldFanfareSoundfont(baseNote: number): void {
    if (!this.instrument) return;
    const ctx = this.getContext();
    [0, 4, 7, 12].forEach((interval, index) => {
      this.instrument!.play(baseNote + interval, ctx.currentTime + index * 0.07, {
        gain: 0.15 * this.masterVolume,
        duration: 0.35,
      });
    });
    // Resolution chord
    setTimeout(() => {
      [12, 16, 19].forEach((interval) => {
        this.instrument!.play(baseNote + interval, this.getContext().currentTime, {
          gain: 0.1 * this.masterVolume,
          duration: 0.5,
        });
      });
    }, 4 * 70 + 100);
  }

  private playPlatinumFanfareSoundfont(baseNote: number): void {
    if (!this.instrument) return;
    const ctx = this.getContext();

    // First phrase
    [0, 4, 7].forEach((interval, index) => {
      this.instrument!.play(baseNote + interval, ctx.currentTime + index * 0.06, {
        gain: 0.12 * this.masterVolume,
        duration: 0.25,
      });
    });

    // Second phrase (a fifth higher)
    const phrase2Start = 3 * 0.06 + 0.05;
    [7, 11, 14].forEach((interval, index) => {
      this.instrument!.play(baseNote + interval, ctx.currentTime + phrase2Start + index * 0.06, {
        gain: 0.14 * this.masterVolume,
        duration: 0.3,
      });
    });

    // Epic resolution chord
    const resolutionStart = phrase2Start + 3 * 0.06 + 0.1;
    setTimeout(() => {
      [12, 16, 19].forEach((interval) => {
        this.instrument!.play(baseNote + interval, this.getContext().currentTime, {
          gain: 0.1 * this.masterVolume,
          duration: 0.8,
        });
      });
    }, resolutionStart * 1000);

    // Shimmering finish
    setTimeout(() => {
      this.instrument!.play(baseNote + 24, this.getContext().currentTime, {
        gain: 0.08 * this.masterVolume,
        duration: 0.6,
      });
    }, (resolutionStart + 0.2) * 1000);
  }

  private playBronzeChime(baseFreq: number): void {
    const notes = [1, 1.5];
    notes.forEach((ratio, index) => {
      setTimeout(() => {
        this.playSimpleNote(baseFreq * ratio, 0.25, 0.12 * this.masterVolume);
      }, index * 100);
    });
  }

  private playSilverChime(baseFreq: number): void {
    const notes = [1, 1.25, 1.5];
    notes.forEach((ratio, index) => {
      setTimeout(() => {
        this.playSimpleNote(baseFreq * ratio, 0.3, 0.14 * this.masterVolume);
      }, index * 80);
    });
  }

  private playGoldFanfare(baseFreq: number): void {
    const notes = [1, 1.25, 1.5, 2];
    notes.forEach((ratio, index) => {
      setTimeout(() => {
        this.playSimpleNote(baseFreq * ratio, 0.35, 0.15 * this.masterVolume);
      }, index * 70);
    });

    setTimeout(() => {
      [1, 1.25, 1.5].forEach((ratio) => {
        this.playSimpleNote(baseFreq * 2 * ratio, 0.5, 0.1 * this.masterVolume);
      });
    }, notes.length * 70 + 100);
  }

  private playPlatinumFanfare(baseFreq: number): void {
    const phrase1 = [1, 1.25, 1.5];
    const phrase2 = [1.5, 1.875, 2.25];
    const resolution = [2, 2.5, 3];

    phrase1.forEach((ratio, index) => {
      setTimeout(() => {
        this.playSimpleNote(baseFreq * ratio, 0.25, 0.12 * this.masterVolume);
      }, index * 60);
    });

    phrase2.forEach((ratio, index) => {
      setTimeout(() => {
        this.playSimpleNote(baseFreq * ratio, 0.3, 0.14 * this.masterVolume);
      }, phrase1.length * 60 + 50 + index * 60);
    });

    const resolutionStart = phrase1.length * 60 + 50 + phrase2.length * 60 + 100;
    setTimeout(() => {
      resolution.forEach((ratio) => {
        this.playSimpleNote(baseFreq * ratio, 0.8, 0.1 * this.masterVolume);
      });
    }, resolutionStart);

    setTimeout(() => {
      this.playSimpleNote(baseFreq * 4, 0.6, 0.08 * this.masterVolume);
    }, resolutionStart + 200);
  }

  playProgressMilestoneSound(): void {
    if (this.muted) return;

    if (this.useSoundfonts && this.instrument) {
      const ctx = this.getContext();
      // Quick ascending run from A5 (81)
      [0, 2, 4].forEach((interval, index) => {
        this.instrument!.play(81 + interval, ctx.currentTime + index * 0.04, {
          gain: 0.08 * this.masterVolume,
          duration: 0.12,
        });
      });
    } else {
      const baseFreq = 880;
      [1, 1.125, 1.25].forEach((ratio, index) => {
        setTimeout(() => {
          this.playSimpleNote(baseFreq * ratio, 0.12, 0.08 * this.masterVolume);
        }, index * 40);
      });
    }
  }

  // ==================== Sustained Notes ====================

  startSustainedNote(
    fingerId: FingerId,
    direction: Direction = Direction.PRESS
  ): string {
    if (this.muted) return '';

    const finger = this.fingerRepo.getById(fingerId);
    if (!finger?.note) return '';

    const noteId = `note_${++this.noteIdCounter}`;

    if (this.useSoundfonts && this.instrument) {
      // Use soundfont for sustained note
      const scheduledNote = this.instrument.play(finger.note.midiNote, this.getContext().currentTime, {
        gain: 0.5 * this.masterVolume,
        duration: AUDIO_DURATIONS.SUSTAINED_MAX,
      });
      this.activeSoundfontNotes.set(noteId, scheduledNote);
    } else {
      // Fallback to oscillator sustained note
      this.startOscillatorSustainedNote(noteId, finger.note.frequency, finger.note.variations[direction]);
    }

    return noteId;
  }

  private startOscillatorSustainedNote(
    noteId: string,
    frequency: number,
    variation: AudioVariation
  ): void {
    const ctx = this.getContext();

    this.stopSustainedNote(noteId);

    const oscillators: OscillatorNode[] = [];

    const distortion = ctx.createWaveShaper();
    distortion.curve = this.makeDistortionCurve(15);
    distortion.oversample = '4x';

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1500 + variation.brightnessOffset, ctx.currentTime);

    const panner = ctx.createStereoPanner();
    panner.pan.setValueAtTime(variation.panPosition, ctx.currentTime);

    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.5 * this.masterVolume, ctx.currentTime);

    distortion.connect(filter);
    filter.connect(panner);
    panner.connect(masterGain);
    masterGain.connect(ctx.destination);

    [frequency, frequency * 1.5, frequency * 2].forEach((freq, index) => {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(distortion);

      oscillator.type = index === 0 ? 'sawtooth' : 'square';
      oscillator.frequency.setValueAtTime(freq, ctx.currentTime);

      const vol = index === 0 ? 0.2 : index === 1 ? 0.12 : 0.06;
      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(vol, ctx.currentTime + variation.attackMs / 1000);

      oscillator.start();
      oscillators.push(oscillator);

      (oscillator as any)._gainNode = gainNode;
    });

    this.activeOscillators.set(noteId, oscillators);
    (oscillators as any)._masterGain = masterGain;
  }

  stopSustainedNote(noteId: string): void {
    // Check soundfont notes first
    const soundfontNote = this.activeSoundfontNotes.get(noteId);
    if (soundfontNote) {
      soundfontNote.stop();
      this.activeSoundfontNotes.delete(noteId);
      return;
    }

    // Check oscillator notes
    const oscillators = this.activeOscillators.get(noteId);
    if (!oscillators) return;

    const ctx = this.getContext();

    oscillators.forEach((oscillator) => {
      const gainNode = (oscillator as any)._gainNode as GainNode;
      if (gainNode) {
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
      }
    });

    setTimeout(() => {
      oscillators.forEach((osc) => {
        try {
          osc.stop();
        } catch {
          // Already stopped
        }
      });
      this.activeOscillators.delete(noteId);
    }, 150);
  }

  stopAllNotes(): void {
    // Stop all soundfont notes
    this.activeSoundfontNotes.forEach((note) => {
      note.stop();
    });
    this.activeSoundfontNotes.clear();

    // Stop all oscillator notes
    this.activeOscillators.forEach((oscillators) => {
      oscillators.forEach((osc) => {
        try {
          osc.stop();
        } catch {
          // Already stopped
        }
      });
    });
    this.activeOscillators.clear();

    // Stop instrument if available
    if (this.instrument) {
      this.instrument.stop();
    }
  }

  // ==================== Configuration ====================

  setMasterVolume(volume: number): void {
    this.masterVolume = Math.max(0, Math.min(1, volume));
  }

  getMasterVolume(): number {
    return this.masterVolume;
  }

  setMuted(muted: boolean): void {
    if (muted) {
      this.stopAllNotes();
    }
    this.muted = muted;
  }

  isMuted(): boolean {
    return this.muted;
  }

  // ==================== Private Helpers ====================

  private frequencyToMidi(frequency: number): number {
    if (frequency <= 0) return 0;
    return Math.round(69 + 12 * Math.log2(frequency / 440));
  }

  private playPowerChordTone(
    frequency: number,
    duration: number,
    volume: number,
    pan: number = 0,
    brightnessOffset: number = 0,
    variation?: AudioVariation
  ): void {
    const ctx = this.getContext();
    const now = ctx.currentTime;

    const attackSec = (variation?.attackMs ?? 15) / 1000;
    const decaySec = (variation?.decayMs ?? 150) / 1000;
    const sustainLevel = variation?.sustainLevel ?? 0.75;
    const releaseSec = (variation?.releaseMs ?? 300) / 1000;
    const chorusDepth = variation?.chorusDepth ?? 0;

    const masterGain = ctx.createGain();
    const panner = ctx.createStereoPanner();
    panner.pan.setValueAtTime(pan, now);

    const distortion = ctx.createWaveShaper();
    distortion.curve = this.makeDistortionCurve(20);
    distortion.oversample = '4x';

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2000 + brightnessOffset, now);
    filter.Q.setValueAtTime(1, now);

    if (chorusDepth > 0) {
      const dryGain = ctx.createGain();
      const wetGain = ctx.createGain();
      const chorusMix = ctx.createGain();

      dryGain.gain.value = 0.7;
      wetGain.gain.value = 0.3;

      const { delay: chorusDelay } = this.createChorusEffect(chorusDepth, duration);

      distortion.connect(filter);
      filter.connect(dryGain);
      dryGain.connect(chorusMix);

      filter.connect(chorusDelay);
      chorusDelay.connect(wetGain);
      wetGain.connect(chorusMix);

      chorusMix.connect(panner);
      panner.connect(masterGain);
      masterGain.connect(ctx.destination);
    } else {
      distortion.connect(filter);
      filter.connect(panner);
      panner.connect(masterGain);
      masterGain.connect(ctx.destination);
    }

    const frequencies = [frequency, frequency * 1.5, frequency * 2];

    const attackEnd = now + attackSec;
    const decayEnd = attackEnd + decaySec;
    const sustainEnd = now + duration - releaseSec;
    const releaseEnd = now + duration;

    frequencies.forEach((freq, index) => {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(distortion);

      oscillator.type = index === 0 ? 'sawtooth' : 'square';
      oscillator.frequency.setValueAtTime(freq, now);

      const baseVolume = volume * (index === 0 ? 1 : index === 1 ? 0.6 : 0.3);

      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(baseVolume, attackEnd);
      gainNode.gain.exponentialRampToValueAtTime(
        Math.max(0.001, baseVolume * sustainLevel),
        decayEnd
      );
      gainNode.gain.setValueAtTime(baseVolume * sustainLevel, sustainEnd);
      gainNode.gain.exponentialRampToValueAtTime(0.001, releaseEnd);

      oscillator.start(now);
      oscillator.stop(releaseEnd + 0.1);
    });

    masterGain.gain.setValueAtTime(0.8, now);
    masterGain.gain.exponentialRampToValueAtTime(0.001, releaseEnd + 0.1);
  }

  private playSimpleNote(frequency: number, duration: number, volume: number): void {
    const ctx = this.getContext();

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);

    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(volume * 0.7, ctx.currentTime + 0.1);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration);
  }

  private makeDistortionCurve(amount: number): Float32Array<ArrayBuffer> | null {
    const k = amount;
    const nSamples = 44100;
    const buffer = new ArrayBuffer(nSamples * 4); // 4 bytes per float32
    const curve = new Float32Array(buffer);
    const deg = Math.PI / 180;

    for (let i = 0; i < nSamples; i++) {
      const x = (i * 2) / nSamples - 1;
      curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
    }
    return curve;
  }

  private createChorusEffect(
    depth: number,
    duration: number
  ): { delay: DelayNode; lfo: OscillatorNode } {
    const ctx = this.getContext();

    const delay = ctx.createDelay();
    delay.delayTime.value = 0.02;

    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();

    lfo.frequency.value = 0.5;
    lfoGain.gain.value = depth * 0.002;

    lfo.connect(lfoGain);
    lfoGain.connect(delay.delayTime);
    lfo.start();
    lfo.stop(ctx.currentTime + duration + 0.5);

    return { delay, lfo };
  }
}
