import { AnticMode, BitPair } from '../types';

/**
 * Get bit at position x (0 = leftmost bit MSB 7, 7 = rightmost bit LSB 0).
 */
export function getBit(byte: number, x: number): number {
  if (x < 0 || x > 7) return 0;
  return (byte >> (7 - x)) & 1;
}

/**
 * Set bit at position x (0 = MSB 7, 7 = LSB 0).
 */
export function setBit(byte: number, x: number, bitVal: number | boolean): number {
  if (x < 0 || x > 7) return byte;
  const mask = 1 << (7 - x);
  return bitVal ? (byte | mask) : (byte & ~mask);
}

/**
 * Get 2-bit pair for Antic mode 4/5 (x: 0..3).
 * x=0 -> bits 7-6
 * x=1 -> bits 5-4
 * x=2 -> bits 3-2
 * x=3 -> bits 1-0
 */
export function getBitPair(byte: number, x: number): BitPair {
  if (x < 0 || x > 3) return 0;
  const shift = (3 - x) * 2;
  return ((byte >> shift) & 0x03) as BitPair;
}

/**
 * Set 2-bit pair for Antic mode 4/5 (x: 0..3).
 */
export function setBitPair(byte: number, x: number, pairVal: BitPair): number {
  if (x < 0 || x > 3) return byte;
  const shift = (3 - x) * 2;
  const mask = 0x03 << shift;
  return (byte & ~mask) | ((pairVal & 0x03) << shift);
}

/**
 * Shift glyph 8 bytes in 4 directions with optional wrapping.
 */
export function shiftGlyph(
  glyphBytes: Uint8Array,
  direction: 'up' | 'down' | 'left' | 'right',
  wrap: boolean = false,
  mode: AnticMode = 2
): Uint8Array {
  const result = new Uint8Array(8);

  if (direction === 'up') {
    for (let r = 0; r < 7; r++) {
      result[r] = glyphBytes[r + 1];
    }
    result[7] = wrap ? glyphBytes[0] : 0;
  } else if (direction === 'down') {
    for (let r = 7; r > 0; r--) {
      result[r] = glyphBytes[r - 1];
    }
    result[0] = wrap ? glyphBytes[7] : 0;
  } else if (direction === 'left') {
    if (mode === 2) {
      for (let r = 0; r < 8; r++) {
        const b = glyphBytes[r];
        const shifted = (b << 1) & 0xff;
        result[r] = wrap ? (shifted | ((b >> 7) & 1)) : shifted;
      }
    } else {
      // 2 bits per pixel shift left
      for (let r = 0; r < 8; r++) {
        const b = glyphBytes[r];
        const shifted = (b << 2) & 0xff;
        result[r] = wrap ? (shifted | ((b >> 6) & 0x03)) : shifted;
      }
    }
  } else if (direction === 'right') {
    if (mode === 2) {
      for (let r = 0; r < 8; r++) {
        const b = glyphBytes[r];
        const shifted = b >> 1;
        result[r] = wrap ? (shifted | ((b & 1) << 7)) : shifted;
      }
    } else {
      // 2 bits per pixel shift right
      for (let r = 0; r < 8; r++) {
        const b = glyphBytes[r];
        const shifted = b >> 2;
        result[r] = wrap ? (shifted | ((b & 0x03) << 6)) : shifted;
      }
    }
  }

  return result;
}

/**
 * Flip glyph horizontally (reversing pixel order per row).
 */
export function flipHorizontal(glyphBytes: Uint8Array, mode: AnticMode = 2): Uint8Array {
  const result = new Uint8Array(8);

  for (let r = 0; r < 8; r++) {
    const b = glyphBytes[r];
    if (mode === 2) {
      // Flip 8 single bits
      let flipped = 0;
      for (let i = 0; i < 8; i++) {
        if ((b >> i) & 1) {
          flipped |= 1 << (7 - i);
        }
      }
      result[r] = flipped;
    } else {
      // Flip 4 pairs of 2 bits
      let flipped = 0;
      for (let p = 0; p < 4; p++) {
        const pair = (b >> (p * 2)) & 0x03;
        flipped |= pair << ((3 - p) * 2);
      }
      result[r] = flipped;
    }
  }

  return result;
}

/**
 * Flip glyph vertically (reversing rows 0..7).
 */
export function flipVertical(glyphBytes: Uint8Array): Uint8Array {
  const result = new Uint8Array(8);
  for (let r = 0; r < 8; r++) {
    result[r] = glyphBytes[7 - r];
  }
  return result;
}

/**
 * Invert all bits of a glyph (bitwise NOT: ~byte & 0xFF).
 */
export function invertGlyph(glyphBytes: Uint8Array): Uint8Array {
  const result = new Uint8Array(8);
  for (let r = 0; r < 8; r++) {
    result[r] = ~glyphBytes[r] & 0xff;
  }
  return result;
}
