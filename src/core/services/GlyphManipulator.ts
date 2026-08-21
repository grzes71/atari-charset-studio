import { AnticMode, BitPair } from '../../types';
import {
  getBit,
  setBit,
  getBitPair,
  setBitPair,
  shiftGlyph as bitwiseShift,
  flipHorizontal as bitwiseFlipH,
  flipVertical as bitwiseFlipV,
  invertGlyph as bitwiseInvert,
} from '../../utils/bitwiseHelpers';

export class GlyphManipulator {
  /**
   * Returns a copy of the 8 bytes for a specific character index (0-127).
   */
  static getGlyphBytes(bankData: Uint8Array, charIndex: number): Uint8Array {
    const safeIndex = Math.max(0, Math.min(127, charIndex));
    const offset = safeIndex * 8;
    return new Uint8Array(bankData.subarray(offset, offset + 8));
  }

  /**
   * Sets the 8 bytes for a specific character index.
   */
  static setGlyphBytes(bankData: Uint8Array, charIndex: number, bytes: Uint8Array): void {
    const safeIndex = Math.max(0, Math.min(127, charIndex));
    const offset = safeIndex * 8;
    for (let r = 0; r < 8; r++) {
      bankData[offset + r] = bytes[r] || 0;
    }
  }

  /**
   * Get pixel or bit pair value at (x, y) for a glyph.
   */
  static getPixel(bankData: Uint8Array, charIndex: number, x: number, y: number, mode: AnticMode): number {
    if (y < 0 || y > 7) return 0;
    const safeIndex = Math.max(0, Math.min(127, charIndex));
    const byte = bankData[safeIndex * 8 + y];
    if (mode === 2) {
      return getBit(byte, x);
    } else {
      return getBitPair(byte, x);
    }
  }

  /**
   * Set pixel or bit pair value at (x, y) for a glyph.
   */
  static setPixel(
    bankData: Uint8Array,
    charIndex: number,
    x: number,
    y: number,
    val: number,
    mode: AnticMode
  ): void {
    if (y < 0 || y > 7) return;
    const safeIndex = Math.max(0, Math.min(127, charIndex));
    const offset = safeIndex * 8 + y;
    const byte = bankData[offset];

    if (mode === 2) {
      bankData[offset] = setBit(byte, x, val !== 0);
    } else {
      bankData[offset] = setBitPair(byte, x, (val & 0x03) as BitPair);
    }
  }

  /**
   * Clears the glyph (all 8 bytes set to 0).
   */
  static clearGlyph(bankData: Uint8Array, charIndex: number): void {
    const safeIndex = Math.max(0, Math.min(127, charIndex));
    const offset = safeIndex * 8;
    for (let r = 0; r < 8; r++) {
      bankData[offset + r] = 0;
    }
  }

  /**
   * Inverts all bits of the glyph.
   */
  static invertGlyph(bankData: Uint8Array, charIndex: number): void {
    const safeIndex = Math.max(0, Math.min(127, charIndex));
    const offset = safeIndex * 8;
    const current = new Uint8Array(bankData.subarray(offset, offset + 8));
    const inverted = bitwiseInvert(current);
    this.setGlyphBytes(bankData, safeIndex, inverted);
  }

  /**
   * Shifts glyph in given direction.
   */
  static shiftGlyph(
    bankData: Uint8Array,
    charIndex: number,
    direction: 'up' | 'down' | 'left' | 'right',
    wrap: boolean,
    mode: AnticMode
  ): void {
    const safeIndex = Math.max(0, Math.min(127, charIndex));
    const offset = safeIndex * 8;
    const current = new Uint8Array(bankData.subarray(offset, offset + 8));
    const shifted = bitwiseShift(current, direction, wrap, mode);
    this.setGlyphBytes(bankData, safeIndex, shifted);
  }

  /**
   * Flips glyph horizontally.
   */
  static flipHorizontal(bankData: Uint8Array, charIndex: number, mode: AnticMode): void {
    const safeIndex = Math.max(0, Math.min(127, charIndex));
    const offset = safeIndex * 8;
    const current = new Uint8Array(bankData.subarray(offset, offset + 8));
    const flipped = bitwiseFlipH(current, mode);
    this.setGlyphBytes(bankData, safeIndex, flipped);
  }

  /**
   * Flips glyph vertically.
   */
  static flipVertical(bankData: Uint8Array, charIndex: number): void {
    const safeIndex = Math.max(0, Math.min(127, charIndex));
    const offset = safeIndex * 8;
    const current = new Uint8Array(bankData.subarray(offset, offset + 8));
    const flipped = bitwiseFlipV(current);
    this.setGlyphBytes(bankData, safeIndex, flipped);
  }

  /**
   * Copies glyph bytes to a new 8-byte buffer.
   */
  static copyGlyph(bankData: Uint8Array, charIndex: number): Uint8Array {
    return this.getGlyphBytes(bankData, charIndex);
  }

  /**
   * Pastes 8-byte buffer into a glyph.
   */
  static pasteGlyph(bankData: Uint8Array, charIndex: number, clipboard: Uint8Array): void {
    this.setGlyphBytes(bankData, charIndex, clipboard);
  }
}
