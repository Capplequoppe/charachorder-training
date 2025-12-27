import { Direction } from '../enums/Direction';

/**
 * HSL color representation for internal calculations.
 */
interface HSL {
  h: number; // 0-360
  s: number; // 0-100
  l: number; // 0-100
}

/**
 * Converts a hex color string to HSL values.
 */
function hexToHsl(hex: string): HSL {
  hex = hex.replace(/^#/, '');

  const r = parseInt(hex.slice(0, 2), 16) / 255;
  const g = parseInt(hex.slice(2, 4), 16) / 255;
  const b = parseInt(hex.slice(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;

  let h = 0;
  let s = 0;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

/**
 * Converts HSL values to a hex color string.
 */
function hslToHex(hsl: HSL): string {
  const h = hsl.h / 360;
  const s = hsl.s / 100;
  const l = hsl.l / 100;

  let r: number, g: number, b: number;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number): number => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  const toHex = (x: number): string => {
    const hex = Math.round(x * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

/**
 * Represents a finger's color with directional variations.
 * Based on pitch-color psychology research:
 * - High pitch -> cool/bright colors
 * - Low pitch -> warm/dark colors
 *
 * This is a Value Object - immutable and defined by its attributes.
 */
export class ColorDefinition {
  /** Base hex color (e.g., '#4DA6FF') */
  readonly base: string;

  /** Human-readable color name (e.g., 'Sky Blue') */
  readonly name: string;

  /** Directional color variations */
  readonly variations: Readonly<Record<Direction, string>>;

  /**
   * Creates a new ColorDefinition.
   * Private constructor - use static factory methods.
   */
  private constructor(
    base: string,
    name: string,
    variations: Record<Direction, string>
  ) {
    this.base = base;
    this.name = name;
    this.variations = Object.freeze({ ...variations });
  }

  /**
   * Creates a ColorDefinition with auto-generated directional variations.
   * - Up: Lighter shade (+15% lightness)
   * - Down: Darker shade (-15% lightness)
   * - Left: Desaturated (-20% saturation)
   * - Right: Saturated (+10% saturation)
   * - Press: Base color
   */
  static create(base: string, name: string): ColorDefinition {
    const hsl = hexToHsl(base);

    const variations: Record<Direction, string> = {
      [Direction.UP]: hslToHex({
        ...hsl,
        l: Math.min(100, hsl.l + 15),
      }),
      [Direction.DOWN]: hslToHex({
        ...hsl,
        l: Math.max(0, hsl.l - 15),
      }),
      [Direction.LEFT]: hslToHex({
        ...hsl,
        s: Math.max(0, hsl.s - 20),
      }),
      [Direction.RIGHT]: hslToHex({
        ...hsl,
        s: Math.min(100, hsl.s + 10),
      }),
      [Direction.PRESS]: base,
    };

    return new ColorDefinition(base, name, variations);
  }

  /**
   * Creates a ColorDefinition with pre-computed variations.
   * Use this when you have research-based specific color values
   * for each direction instead of auto-generated variations.
   */
  static createWithVariations(
    base: string,
    name: string,
    variations: Record<Direction, string>
  ): ColorDefinition {
    return new ColorDefinition(base, name, variations);
  }

  /**
   * Gets the color for a specific direction.
   */
  getColorForDirection(direction: Direction): string {
    return this.variations[direction];
  }

  /**
   * Returns true if this ColorDefinition equals another.
   * Value objects are equal if all their attributes are equal.
   */
  equals(other: ColorDefinition): boolean {
    if (this.base !== other.base || this.name !== other.name) {
      return false;
    }
    for (const dir of Object.values(Direction)) {
      if (this.variations[dir] !== other.variations[dir]) {
        return false;
      }
    }
    return true;
  }

  /**
   * Creates a lighter version of this color definition.
   */
  lighten(amount: number = 10): ColorDefinition {
    const hsl = hexToHsl(this.base);
    const newBase = hslToHex({
      ...hsl,
      l: Math.min(100, hsl.l + amount),
    });
    return ColorDefinition.create(newBase, `${this.name} (Light)`);
  }

  /**
   * Creates a darker version of this color definition.
   */
  darken(amount: number = 10): ColorDefinition {
    const hsl = hexToHsl(this.base);
    const newBase = hslToHex({
      ...hsl,
      l: Math.max(0, hsl.l - amount),
    });
    return ColorDefinition.create(newBase, `${this.name} (Dark)`);
  }

  // ==================== Static Color Utilities ====================

  /**
   * Lightens a hex color by a given amount.
   */
  static lightenHex(color: string, amount: number): string {
    const hsl = hexToHsl(color);
    hsl.l = Math.min(100, hsl.l + amount);
    return hslToHex(hsl);
  }

  /**
   * Darkens a hex color by a given amount.
   */
  static darkenHex(color: string, amount: number): string {
    const hsl = hexToHsl(color);
    hsl.l = Math.max(0, hsl.l - amount);
    return hslToHex(hsl);
  }

  /**
   * Saturates a hex color by a given amount.
   */
  static saturateHex(color: string, amount: number): string {
    const hsl = hexToHsl(color);
    hsl.s = Math.min(100, hsl.s + amount);
    return hslToHex(hsl);
  }

  /**
   * Desaturates a hex color by a given amount.
   */
  static desaturateHex(color: string, amount: number): string {
    const hsl = hexToHsl(color);
    hsl.s = Math.max(0, hsl.s - amount);
    return hslToHex(hsl);
  }

  /**
   * Blends two hex colors together using averaging.
   */
  static blendTwo(color1: string, color2: string): string {
    const hex1 = color1.replace('#', '');
    const hex2 = color2.replace('#', '');

    const r1 = parseInt(hex1.slice(0, 2), 16);
    const g1 = parseInt(hex1.slice(2, 4), 16);
    const b1 = parseInt(hex1.slice(4, 6), 16);

    const r2 = parseInt(hex2.slice(0, 2), 16);
    const g2 = parseInt(hex2.slice(2, 4), 16);
    const b2 = parseInt(hex2.slice(4, 6), 16);

    const r = Math.round((r1 + r2) / 2);
    const g = Math.round((g1 + g2) / 2);
    const b = Math.round((b1 + b2) / 2);

    const toHex = (n: number): string => n.toString(16).padStart(2, '0');
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
  }

  /**
   * Blends multiple hex colors together.
   */
  static blendMultiple(colors: string[]): string {
    if (colors.length === 0) return '#808080';
    if (colors.length === 1) return colors[0];

    let result = colors[0];
    for (let i = 1; i < colors.length; i++) {
      result = ColorDefinition.blendTwo(result, colors[i]);
    }
    return result;
  }

  /**
   * Generates direction variations for a base color.
   */
  static generateVariations(baseHex: string): Record<Direction, string> {
    const hsl = hexToHsl(baseHex);

    return {
      [Direction.UP]: hslToHex({
        ...hsl,
        l: Math.min(100, hsl.l + 15),
      }),
      [Direction.DOWN]: hslToHex({
        ...hsl,
        l: Math.max(0, hsl.l - 15),
      }),
      [Direction.LEFT]: hslToHex({
        ...hsl,
        s: Math.max(0, hsl.s - 20),
      }),
      [Direction.RIGHT]: hslToHex({
        ...hsl,
        s: Math.min(100, hsl.s + 10),
      }),
      [Direction.PRESS]: baseHex.toUpperCase(),
    };
  }

  /**
   * Calculates relative luminance of a color for contrast calculations.
   */
  static getLuminance(color: string): number {
    const hex = color.replace('#', '');
    const r = parseInt(hex.slice(0, 2), 16) / 255;
    const g = parseInt(hex.slice(2, 4), 16) / 255;
    const b = parseInt(hex.slice(4, 6), 16) / 255;
    return 0.299 * r + 0.587 * g + 0.114 * b;
  }

  /**
   * Returns black or white for best contrast against a background color.
   */
  static getContrastColor(backgroundColor: string): string {
    const luminance = ColorDefinition.getLuminance(backgroundColor);
    return luminance > 0.5 ? '#000000' : '#FFFFFF';
  }

  /**
   * Gets the hue of a color (0-360).
   */
  static getHue(color: string): number {
    return hexToHsl(color).h;
  }

  /**
   * Converts a hex color to RGBA string.
   */
  static hexToRgba(color: string, alpha: number): string {
    const hex = color.replace('#', '');
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    const clampedAlpha = Math.max(0, Math.min(1, alpha));
    return `rgba(${r}, ${g}, ${b}, ${clampedAlpha})`;
  }
}
