/**
 * Type declarations for soundfont-player
 * @see https://github.com/danigb/soundfont-player
 */

declare module 'soundfont-player' {
  export interface InstrumentOptions {
    /** Destination AudioNode (default: audioContext.destination) */
    destination?: AudioNode;
    /** Gain level 0-1 (default: 1) */
    gain?: number;
    /** Attack time in seconds */
    attack?: number;
    /** Decay time in seconds */
    decay?: number;
    /** Sustain level 0-1 */
    sustain?: number;
    /** Release time in seconds */
    release?: number;
    /** Soundfont format: 'mp3' or 'ogg' (default: 'mp3') */
    format?: 'mp3' | 'ogg';
    /** Soundfont source URL or name: 'MusyngKite', 'FluidR3_GM' */
    soundfont?: string;
    /** Custom name map for instrument names */
    nameToUrl?: (name: string, soundfont: string, format: string) => string;
    /** Only load specific notes (array of MIDI numbers or note names) */
    notes?: (number | string)[];
  }

  export interface PlayOptions {
    /** When to start playing (AudioContext time, default: now) */
    time?: number;
    /** Duration in seconds */
    duration?: number;
    /** Gain level 0-1 */
    gain?: number;
    /** Attack time in seconds */
    attack?: number;
    /** Decay time in seconds */
    decay?: number;
    /** Sustain level 0-1 */
    sustain?: number;
    /** Release time in seconds */
    release?: number;
    /** Playback loop */
    loop?: boolean;
    /** Custom destination AudioNode */
    destination?: AudioNode;
  }

  export interface ScheduledNote {
    /** Stop the note immediately or at specified time */
    stop(time?: number): void;
  }

  export interface Player {
    /** Play a note by MIDI number (0-127) or note name (e.g., 'C4') */
    play(note: number | string, time?: number, options?: PlayOptions): ScheduledNote;
    /** Schedule multiple notes */
    schedule(time: number, events: Array<{ note: number | string; time?: number; duration?: number; gain?: number }>): ScheduledNote[];
    /** Start playing a note (returns a stop function) */
    start(note: number | string, time?: number, options?: PlayOptions): ScheduledNote;
    /** Stop a specific note or all notes */
    stop(time?: number, notes?: (number | string)[]): void;
    /** Connect to an AudioNode */
    connect(destination: AudioNode): Player;
    /** List of loaded note names */
    readonly notes: string[];
  }

  /**
   * Load an instrument by name
   * @param ac AudioContext
   * @param name Instrument name (e.g., 'acoustic_grand_piano', 'electric_guitar_clean')
   * @param options Loading options
   * @returns Promise resolving to Player instance
   */
  export function instrument(
    ac: AudioContext,
    name: string,
    options?: InstrumentOptions
  ): Promise<Player>;

  /**
   * Available General MIDI instrument names
   */
  export type GMInstrument =
    | 'accordion'
    | 'acoustic_bass'
    | 'acoustic_grand_piano'
    | 'acoustic_guitar_nylon'
    | 'acoustic_guitar_steel'
    | 'agogo'
    | 'alto_sax'
    | 'applause'
    | 'bagpipe'
    | 'banjo'
    | 'baritone_sax'
    | 'bassoon'
    | 'bird_tweet'
    | 'blown_bottle'
    | 'brass_section'
    | 'breath_noise'
    | 'bright_acoustic_piano'
    | 'celesta'
    | 'cello'
    | 'choir_aahs'
    | 'church_organ'
    | 'clarinet'
    | 'clavinet'
    | 'contrabass'
    | 'distortion_guitar'
    | 'drawbar_organ'
    | 'dulcimer'
    | 'electric_bass_finger'
    | 'electric_bass_pick'
    | 'electric_grand_piano'
    | 'electric_guitar_clean'
    | 'electric_guitar_jazz'
    | 'electric_guitar_muted'
    | 'electric_piano_1'
    | 'electric_piano_2'
    | 'english_horn'
    | 'fiddle'
    | 'flute'
    | 'french_horn'
    | 'fretless_bass'
    | 'fx_1_rain'
    | 'fx_2_soundtrack'
    | 'fx_3_crystal'
    | 'fx_4_atmosphere'
    | 'fx_5_brightness'
    | 'fx_6_goblins'
    | 'fx_7_echoes'
    | 'fx_8_scifi'
    | 'glockenspiel'
    | 'guitar_fret_noise'
    | 'guitar_harmonics'
    | 'gunshot'
    | 'harmonica'
    | 'harpsichord'
    | 'helicopter'
    | 'honkytonk_piano'
    | 'kalimba'
    | 'koto'
    | 'lead_1_square'
    | 'lead_2_sawtooth'
    | 'lead_3_calliope'
    | 'lead_4_chiff'
    | 'lead_5_charang'
    | 'lead_6_voice'
    | 'lead_7_fifths'
    | 'lead_8_bass_lead'
    | 'marimba'
    | 'melodic_tom'
    | 'music_box'
    | 'muted_trumpet'
    | 'oboe'
    | 'ocarina'
    | 'orchestra_hit'
    | 'orchestral_harp'
    | 'overdriven_guitar'
    | 'pad_1_new_age'
    | 'pad_2_warm'
    | 'pad_3_polysynth'
    | 'pad_4_choir'
    | 'pad_5_bowed'
    | 'pad_6_metallic'
    | 'pad_7_halo'
    | 'pad_8_sweep'
    | 'pan_flute'
    | 'percussive_organ'
    | 'piccolo'
    | 'pizzicato_strings'
    | 'recorder'
    | 'reed_organ'
    | 'reverse_cymbal'
    | 'rock_organ'
    | 'seashore'
    | 'shakuhachi'
    | 'shamisen'
    | 'shanai'
    | 'sitar'
    | 'slap_bass_1'
    | 'slap_bass_2'
    | 'soprano_sax'
    | 'steel_drums'
    | 'string_ensemble_1'
    | 'string_ensemble_2'
    | 'synth_bass_1'
    | 'synth_bass_2'
    | 'synth_brass_1'
    | 'synth_brass_2'
    | 'synth_choir'
    | 'synth_drum'
    | 'synth_strings_1'
    | 'synth_strings_2'
    | 'taiko_drum'
    | 'tango_accordion'
    | 'telephone_ring'
    | 'tenor_sax'
    | 'timpani'
    | 'tinkle_bell'
    | 'tremolo_strings'
    | 'trombone'
    | 'trumpet'
    | 'tuba'
    | 'tubular_bells'
    | 'vibraphone'
    | 'viola'
    | 'violin'
    | 'voice_oohs'
    | 'whistle'
    | 'woodblock'
    | 'xylophone';

  const Soundfont: {
    instrument: typeof instrument;
  };

  export default Soundfont;
}
