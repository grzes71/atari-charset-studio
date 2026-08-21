import { describe, it, expect } from 'vitest';
import { GlyphManipulator } from '../src/core/services/GlyphManipulator';
import { ColorConverter } from '../src/core/services/ColorConverter';
import { ColorRegisters } from '../src/types';

describe('GlyphManipulator', () => {
  it('should manipulate single pixels in bank Uint8Array', () => {
    const bank = new Uint8Array(1024);
    const charIndex = 5;

    // Set pixel (0, 0) of char 5 in mode 2 (1 bpp)
    GlyphManipulator.setPixel(bank, charIndex, 0, 0, 1, 2);
    expect(GlyphManipulator.getPixel(bank, charIndex, 0, 0, 2)).toBe(1);
    expect(bank[charIndex * 8]).toBe(0x80);

    // Clear glyph
    GlyphManipulator.clearGlyph(bank, charIndex);
    expect(bank[charIndex * 8]).toBe(0x00);
    expect(GlyphManipulator.getPixel(bank, charIndex, 0, 0, 2)).toBe(0);
  });

  it('should copy and paste glyphs accurately', () => {
    const bank = new Uint8Array(1024);
    const sourceIndex = 10;
    const targetIndex = 20;

    for (let r = 0; r < 8; r++) {
      bank[sourceIndex * 8 + r] = r + 1;
    }

    const copied = GlyphManipulator.copyGlyph(bank, sourceIndex);
    GlyphManipulator.pasteGlyph(bank, targetIndex, copied);

    const pasted = GlyphManipulator.getGlyphBytes(bank, targetIndex);
    expect(Array.from(pasted)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
  });
});

describe('ColorConverter', () => {
  const registers: ColorRegisters = {
    COLBAK: 0x00, // Black
    COLPF0: 0x28, // Gold
    COLPF1: 0xca, // Green
    COLPF2: 0x94, // Blue
    COLPF3: 0x46, // Pink/Red
  };

  it('should resolve Antic 2 colors with and without inversion', () => {
    // Normal (charCode < 128): bit 0 -> COLBAK, bit 1 -> COLPF2
    expect(ColorConverter.getAtariColorForPixel(2, registers, 0, 0)).toBe(0x00);
    expect(ColorConverter.getAtariColorForPixel(2, registers, 1, 0)).toBe(0x94);

    // Inverse (charCode >= 128): bit 0 -> COLPF2, bit 1 -> COLBAK
    expect(ColorConverter.getAtariColorForPixel(2, registers, 0, 128)).toBe(0x94);
    expect(ColorConverter.getAtariColorForPixel(2, registers, 1, 128)).toBe(0x00);
  });

  it('should resolve Antic 4/5 multicolor 5th color when bit 7 is set', () => {
    // Bit pair 11 without bit 7 set -> COLPF2
    expect(ColorConverter.getAtariColorForPixel(4, registers, 3, 0)).toBe(0x94);
    // Bit pair 11 with bit 7 set (5th color rule) -> COLPF3
    expect(ColorConverter.getAtariColorForPixel(4, registers, 3, 128)).toBe(0x46);
  });
});
