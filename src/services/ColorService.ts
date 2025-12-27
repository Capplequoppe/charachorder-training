/**
 * Color Service
 *
 * Handles color calculations, blending, and accessibility features.
 * Based on pitch-color psychology research.
 */

import {
  FingerId,
  Direction,
  Chord,
  PowerChord,
  ColorDefinition,
} from '../domain';
import { IFingerRepository, ICharacterRepository } from '../data/repositories';

/**
 * Interface for color service operations.
 */
export interface IColorService {
  // Get colors for entities
  getFingerColor(fingerId: FingerId, direction?: Direction): string;
  getCharacterColor(char: string): string;

  // Chord color blending
  getChordBlendedColor(chord: Chord): string;
  getPowerChordColor(powerChord: PowerChord): string;
  blendColors(colors: string[]): string;

  // Direction variations
  generateDirectionVariations(baseHex: string): Record<Direction, string>;

  // Color manipulation
  lighten(color: string, amount: number): string;
  darken(color: string, amount: number): string;
  saturate(color: string, amount: number): string;
  desaturate(color: string, amount: number): string;
  adjustAlpha(color: string, alpha: number): string;

  // Accessibility
  getContrastColor(backgroundColor: string): string;
  isColorBlindSafe(colors: string[]): boolean;
  getColorBlindAlternative(color: string): string;
}

/**
 * Color service implementation.
 */
export class ColorService implements IColorService {
  private fingerRepo: IFingerRepository;
  private characterRepo: ICharacterRepository | null = null;

  constructor(fingerRepo: IFingerRepository, characterRepo?: ICharacterRepository) {
    this.fingerRepo = fingerRepo;
    this.characterRepo = characterRepo ?? null;
  }

  // ==================== Get Colors ====================

  getFingerColor(fingerId: FingerId, direction?: Direction): string {
    const finger = this.fingerRepo.getById(fingerId);
    if (!finger) return '#808080';

    if (direction) {
      return finger.color.variations[direction];
    }
    return finger.color.base;
  }

  getCharacterColor(char: string): string {
    if (!this.characterRepo) return '#808080';

    const character = this.characterRepo.getByChar(char);
    if (!character) return '#808080';

    return this.getFingerColor(character.fingerId, character.direction);
  }

  // ==================== Chord Colors ====================

  getChordBlendedColor(chord: Chord): string {
    return chord.blendedColor;
  }

  getPowerChordColor(powerChord: PowerChord): string {
    return powerChord.blendedColor;
  }

  /**
   * Blend multiple colors together using averaging.
   * This creates a visually pleasing middle color.
   */
  blendColors(colors: string[]): string {
    return ColorDefinition.blendMultiple(colors);
  }

  // ==================== Direction Variations ====================

  /**
   * Generate directional color variations from a base color.
   * Used when creating new finger colors or for dynamic variation.
   *
   * - Up: Lighter (+15% lightness)
   * - Down: Darker (-15% lightness)
   * - Left: Desaturated (-20% saturation)
   * - Right: More saturated (+10% saturation)
   * - Press: Base color unchanged
   */
  generateDirectionVariations(baseHex: string): Record<Direction, string> {
    return ColorDefinition.generateVariations(baseHex);
  }

  // ==================== Color Manipulation ====================

  lighten(color: string, amount: number): string {
    return ColorDefinition.lightenHex(color, amount);
  }

  darken(color: string, amount: number): string {
    return ColorDefinition.darkenHex(color, amount);
  }

  saturate(color: string, amount: number): string {
    return ColorDefinition.saturateHex(color, amount);
  }

  desaturate(color: string, amount: number): string {
    return ColorDefinition.desaturateHex(color, amount);
  }

  adjustAlpha(color: string, alpha: number): string {
    return ColorDefinition.hexToRgba(color, alpha);
  }

  // ==================== Accessibility ====================

  getContrastColor(backgroundColor: string): string {
    return ColorDefinition.getContrastColor(backgroundColor);
  }

  isColorBlindSafe(colors: string[]): boolean {
    // Simple check: ensure colors have sufficient hue separation
    // For proper implementation, would need to simulate color blindness types
    if (colors.length < 2) return true;

    const hues = colors.map((c) => ColorDefinition.getHue(c));
    for (let i = 0; i < hues.length; i++) {
      for (let j = i + 1; j < hues.length; j++) {
        const diff = Math.abs(hues[i] - hues[j]);
        const hueDiff = Math.min(diff, 360 - diff);
        // Colors should be at least 30 degrees apart
        if (hueDiff < 30) return false;
      }
    }
    return true;
  }

  getColorBlindAlternative(color: string): string {
    // Map colors to more distinguishable alternatives
    // This is a simplified implementation
    const hue = ColorDefinition.getHue(color);

    // Shift red-green confusion colors
    if (hue >= 0 && hue < 60) {
      // Red-orange range: shift to blue
      return ColorDefinition.darkenHex(ColorDefinition.desaturateHex(color, 20), 10);
    } else if (hue >= 60 && hue < 180) {
      // Yellow-green range: shift to purple
      return ColorDefinition.saturateHex(ColorDefinition.lightenHex(color, 10), 15);
    }

    return color;
  }
}
