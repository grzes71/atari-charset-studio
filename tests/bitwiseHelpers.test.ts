import { describe, it, expect } from 'vitest';
import {
  getBit,
  setBit,
  getBitPair,
  setBitPair,
  shiftGlyph,
  flipHorizontal,
  flipVertical,
  invertGlyph,
} from '../src/utils/bitwiseHelpers';

describe('bitwiseHelpers', () => {
  it('should correctly get and set bits in 1 bpp mode', () => {
    let byte = 0;
    // Set MSB (x=0)
    byte = setBit(byte, 0, true);
    expect(byte).toBe(0x80);
    expect(getBit(byte, 0)).toBe(1);
    expect(getBit(byte, 7)).toBe(0);

    // Set LSB (x=7)
    byte = setBit(byte, 7, true);
    expect(byte).toBe(0x81);
    expect(getBit(byte, 7)).toBe(1);

    // Clear MSB
    byte = setBit(byte, 0, false);
    expect(byte).toBe(0x01);
    expect(getBit(byte, 0)).toBe(0);
  });

  it('should correctly get and set 2-bit pairs in multicolor mode', () => {
    let byte = 0;
    // Set pair 0 (bits 7-6) to 3 (binary 11)
    byte = setBitPair(byte, 0, 3);
    expect(byte).toBe(0xc0);
    expect(getBitPair(byte, 0)).toBe(3);
    expect(getBitPair(byte, 1)).toBe(0);

    // Set pair 3 (bits 1-0) to 2 (binary 10)
    byte = setBitPair(byte, 3, 2);
    expect(byte).toBe(0xc2);
    expect(getBitPair(byte, 3)).toBe(2);
  });

  it('should invert glyph bytes correctly', () => {
    const glyph = new Uint8Array([0x00, 0xff, 0x55, 0xaa, 0x0f, 0xf0, 0x33, 0xcc]);
    const inverted = invertGlyph(glyph);
    expect(inverted[0]).toBe(0xff);
    expect(inverted[1]).toBe(0x00);
    expect(inverted[2]).toBe(0xaa);
    expect(inverted[3]).toBe(0x55);
  });

  it('should flip glyph vertically', () => {
    const glyph = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]);
    const flipped = flipVertical(glyph);
    expect(Array.from(flipped)).toEqual([8, 7, 6, 5, 4, 3, 2, 1]);
  });

  it('should flip glyph horizontally in 1bpp mode', () => {
    const glyph = new Uint8Array([0x80, 0x01, 0, 0, 0, 0, 0, 0]);
    const flipped = flipHorizontal(glyph, 2);
    expect(flipped[0]).toBe(0x01);
    expect(flipped[1]).toBe(0x80);
  });

  it('should shift glyph up and down with wrap', () => {
    const glyph = new Uint8Array([10, 20, 30, 40, 50, 60, 70, 80]);
    const shiftedUp = shiftGlyph(glyph, 'up', true, 2);
    expect(Array.from(shiftedUp)).toEqual([20, 30, 40, 50, 60, 70, 80, 10]);

    const shiftedDown = shiftGlyph(glyph, 'down', true, 2);
    expect(Array.from(shiftedDown)).toEqual([80, 10, 20, 30, 40, 50, 60, 70]);
  });
});
