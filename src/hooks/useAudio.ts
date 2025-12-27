/**
 * useAudio Hook
 *
 * Provides audio playback functionality using the AudioService.
 * This hook wraps the AudioService to provide a simple API for components.
 *
 * NOTE: This hook now delegates to the AudioService which supports
 * both soundfont-based MIDI playback and oscillator synthesis fallback.
 * Settings can be changed via the Settings page.
 */

import { useCallback, useEffect, useRef } from 'react';
import { getServices } from '../services/ServiceContainer';
import { Finger, FINGER_NOTES, getFingersForChord } from '../config/fingerMapping';
import type { FingerId } from '../domain';

// Default durations (matching AudioService)
const DEFAULT_DURATION = 0.7;
const SUCCESS_DURATION = 1.5;

/**
 * Helper to safely call audio service methods.
 * Wraps calls in try-catch to prevent crashes if audio isn't ready.
 */
function safeAudioCall<T>(fn: () => T, fallback?: T): T | undefined {
  try {
    return fn();
  } catch (error) {
    console.warn('[useAudio] Audio call failed:', error);
    return fallback;
  }
}

/**
 * Hook providing audio playback via the AudioService.
 * Supports soundfont instruments when enabled in settings.
 */
export function useAudio() {
  // Get fresh reference to audio service on each render to ensure it's current
  const getAudioService = useCallback(() => {
    try {
      return getServices().audio;
    } catch {
      return null;
    }
  }, []);

  const activeNotesRef = useRef<Map<string, string>>(new Map());

  // Ensure audio is initialized on first user interaction
  useEffect(() => {
    const initAudio = () => {
      const audioService = getAudioService();
      if (audioService) {
        audioService.initialize().catch(console.warn);
      }
      // Remove listeners after first interaction
      document.removeEventListener('click', initAudio);
      document.removeEventListener('keydown', initAudio);
    };

    document.addEventListener('click', initAudio, { once: true });
    document.addEventListener('keydown', initAudio, { once: true });

    return () => {
      document.removeEventListener('click', initAudio);
      document.removeEventListener('keydown', initAudio);
    };
  }, [getAudioService]);

  // Play a note for a specific finger
  const playFingerNote = useCallback((finger: Finger, duration: number = DEFAULT_DURATION) => {
    const audioService = getAudioService();
    if (!audioService) return;

    // Convert old Finger type to FingerId
    const fingerId = finger as FingerId;

    safeAudioCall(() => audioService.playFingerNote(fingerId, undefined, duration));
  }, [getAudioService]);

  // Play error sound
  const playErrorSound = useCallback(() => {
    const audioService = getAudioService();
    if (!audioService) return;

    safeAudioCall(() => audioService.playErrorSound());
  }, [getAudioService]);

  // Play a simple note by frequency (for backwards compatibility)
  const playNote = useCallback((frequency: number, duration: number = DEFAULT_DURATION, volume: number = 0.3) => {
    // This uses the character note API if we can find a matching finger
    // Otherwise fall back to a simple oscillator (not through service)
    const audioService = getAudioService();
    if (!audioService) return;

    // Try to find a finger with this frequency
    for (const [finger, noteInfo] of Object.entries(FINGER_NOTES)) {
      if (noteInfo && Math.abs(noteInfo.frequency - frequency) < 1) {
        safeAudioCall(() => audioService.playFingerNote(finger as FingerId, undefined, duration));
        return;
      }
    }

    // Fallback: play through success sound (approximation)
    // In practice, this path is rarely used
    safeAudioCall(() => audioService.playSuccessSound());
  }, [getAudioService]);

  // Play power chord note (delegates to AudioService)
  const playPowerChordNote = useCallback((frequency: number, duration: number = DEFAULT_DURATION, _volume: number = 0.3) => {
    // Find the closest finger for this frequency and play it
    const audioService = getAudioService();
    if (!audioService) return;

    let closestFinger: FingerId | null = null;
    let closestDiff = Infinity;

    for (const [finger, noteInfo] of Object.entries(FINGER_NOTES)) {
      if (noteInfo) {
        const diff = Math.abs(noteInfo.frequency - frequency);
        if (diff < closestDiff) {
          closestDiff = diff;
          closestFinger = finger as FingerId;
        }
      }
    }

    if (closestFinger) {
      safeAudioCall(() => audioService.playFingerNote(closestFinger, undefined, duration));
    }
  }, [getAudioService]);

  // Play multiple notes together (chord)
  const playChordNotes = useCallback((fingers: Finger[], duration: number = DEFAULT_DURATION) => {
    const audioService = getAudioService();
    if (!audioService) return;

    // Filter out fingers without notes
    const playableFingers = fingers.filter(finger => FINGER_NOTES[finger]);

    // Play each finger note with slight stagger for arpeggio effect
    playableFingers.forEach((finger, index) => {
      setTimeout(() => {
        safeAudioCall(() => audioService.playFingerNote(finger as FingerId, undefined, duration));
      }, index * 40);
    });
  }, [getAudioService]);

  // Play chord from string (e.g., "th" -> play fingers for 't' and 'h')
  const playChordFromString = useCallback((chord: string, duration: number = DEFAULT_DURATION) => {
    const fingers = getFingersForChord(chord);
    playChordNotes(fingers, duration);
  }, [playChordNotes]);

  // Start a sustained note
  const startSustainedNote = useCallback((finger: Finger, id: string) => {
    const audioService = getAudioService();
    if (!audioService) return;

    const fingerId = finger as FingerId;

    // Stop existing note with this ID
    const existingNoteId = activeNotesRef.current.get(id);
    if (existingNoteId) {
      safeAudioCall(() => audioService.stopSustainedNote(existingNoteId));
    }

    // Start new sustained note
    const noteId = safeAudioCall(() => audioService.startSustainedNote(fingerId), '');
    if (noteId) {
      activeNotesRef.current.set(id, noteId);
    }
  }, [getAudioService]);

  // Stop a sustained note
  const stopSustainedNote = useCallback((id: string) => {
    const audioService = getAudioService();
    if (!audioService) return;

    const noteId = activeNotesRef.current.get(id);

    if (noteId) {
      safeAudioCall(() => audioService.stopSustainedNote(noteId));
      activeNotesRef.current.delete(id);
    }
  }, [getAudioService]);

  // Stop all notes
  const stopAllNotes = useCallback(() => {
    const audioService = getAudioService();
    if (!audioService) return;

    safeAudioCall(() => audioService.stopAllNotes());
    activeNotesRef.current.clear();
  }, [getAudioService]);

  // Play a power chord (delegates to AudioService)
  const playPowerChord = useCallback((powerChord: Parameters<NonNullable<ReturnType<typeof getAudioService>>['playPowerChord']>[0]) => {
    const audioService = getAudioService();
    if (!audioService) return;

    safeAudioCall(() => audioService.playPowerChord(powerChord));
  }, [getAudioService]);

  // Play success sound
  const playSuccessSound = useCallback(() => {
    const audioService = getAudioService();
    if (!audioService) return;

    safeAudioCall(() => audioService.playSuccessSound());
  }, [getAudioService]);

  // Play word resolution sound
  const playWordResolution = useCallback((word: Parameters<NonNullable<ReturnType<typeof getAudioService>>['playWordResolution']>[0]) => {
    const audioService = getAudioService();
    if (!audioService) return;

    safeAudioCall(() => audioService.playWordResolution(word));
  }, [getAudioService]);

  // Play note for a character (e.g., 'a', 'b', 'c')
  const playCharacterNote = useCallback((char: string, duration: number = DEFAULT_DURATION) => {
    const audioService = getAudioService();
    if (!audioService) return;

    safeAudioCall(() => audioService.playCharacterNote(char, duration));
  }, [getAudioService]);

  return {
    playNote,
    playPowerChordNote,
    playFingerNote,
    playCharacterNote,
    playErrorSound,
    playChordNotes,
    playChordFromString,
    startSustainedNote,
    stopSustainedNote,
    stopAllNotes,
    playPowerChord,
    playSuccessSound,
    playWordResolution,
    DEFAULT_DURATION,
    SUCCESS_DURATION,
  };
}
