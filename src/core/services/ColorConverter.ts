import { AnticMode, BitPair, ColorRegisters } from '../../types';
import { atariByteToHex, atariByteToRGB } from '../../utils/atariColorLUT';

export class ColorConverter {
  /**
   * Resolves the Atari color register value (0-255) for a given pixel in a character.
   */
  static getAtariColorForPixel(
    mode: AnticMode,
    registers: ColorRegisters,
    bitOrPair: number,
    charCode: number = 0
  ): number {
    const isInverse = (charCode & 0x80) !== 0;

    if (mode === 2) {
      const bit = bitOrPair ? 1 : 0;
      if (!isInverse) {
        return bit === 1 ? registers.COLPF2 : registers.COLBAK;
      } else {
        return bit === 1 ? registers.COLBAK : registers.COLPF2;
      }
    }

    // Antic 4 and 5 (Multicolor)
    const pair = (bitOrPair & 0x03) as BitPair;
    switch (pair) {
      case 0: // 00
        return registers.COLBAK;
      case 1: // 01
        return registers.COLPF0;
      case 2: // 10
        return registers.COLPF1;
      case 3: // 11
        // 5th color rule: if bit 7 is set, use COLPF3 instead of COLPF2
        return isInverse ? registers.COLPF3 : registers.COLPF2;
      default:
        return registers.COLBAK;
    }
  }

  /**
   * Returns CSS hex color string for a pixel.
   */
  static getHexForPixel(
    mode: AnticMode,
    registers: ColorRegisters,
    bitOrPair: number,
    charCode: number = 0
  ): string {
    const atariColor = this.getAtariColorForPixel(mode, registers, bitOrPair, charCode);
    return atariByteToHex(atariColor);
  }

  /**
   * Returns [r, g, b] array for a pixel.
   */
  static getRGBForPixel(
    mode: AnticMode,
    registers: ColorRegisters,
    bitOrPair: number,
    charCode: number = 0
  ): [number, number, number] {
    const atariColor = this.getAtariColorForPixel(mode, registers, bitOrPair, charCode);
    return atariByteToRGB(atariColor);
  }
}
