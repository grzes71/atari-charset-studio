import { AnticMode, ColorRegisters } from '../../types';
import { getBit, getBitPair } from '../../utils/bitwiseHelpers';
import { ColorConverter } from '../services/ColorConverter';

export interface CharsetSheetRenderOptions {
  ctx: CanvasRenderingContext2D;
  bankData: Uint8Array;
  mode: AnticMode;
  registers: ColorRegisters;
  selectedIndex: number;
  scale?: number; // e.g. 2 or 3
  isInverse?: boolean;
}

export class CharsetSheetRenderer {
  static render(options: CharsetSheetRenderOptions): void {
    const {
      ctx,
      bankData,
      mode,
      registers,
      selectedIndex,
      scale = 2,
      isInverse = false,
    } = options;

    ctx.imageSmoothingEnabled = false;

    const cols = 16;
    const rows = 8;

    const totalWidth = cols * 8 * scale;
    const totalHeight = rows * 8 * scale;

    ctx.clearRect(0, 0, totalWidth, totalHeight);

    const isMulticolor = mode !== 2;
    const pixelWidth = isMulticolor ? 2 * scale : 1 * scale;
    const pixelHeight = 1 * scale;
    const pixelCols = isMulticolor ? 4 : 8;

    for (let charIndex = 0; charIndex < 128; charIndex++) {
      const col = charIndex % 16;
      const row = Math.floor(charIndex / 16);

      const startX = col * 8 * scale;
      const startY = row * 8 * scale;
      const offset = charIndex * 8;

      const charCode = isInverse ? (charIndex | 0x80) : charIndex;

      for (let r = 0; r < 8; r++) {
        const byte = bankData[offset + r] || 0;
        for (let c = 0; c < pixelCols; c++) {
          const val = !isMulticolor ? getBit(byte, c) : getBitPair(byte, c);
          const hex = ColorConverter.getHexForPixel(mode, registers, val, charCode);

          ctx.fillStyle = hex;
          ctx.fillRect(
            startX + c * pixelWidth,
            startY + r * pixelHeight,
            pixelWidth,
            pixelHeight
          );
        }
      }

      // Draw grid line borders between characters
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 1;
      ctx.strokeRect(startX + 0.5, startY + 0.5, 8 * scale - 1, 8 * scale - 1);

      // Highlight selected character
      if (charIndex === selectedIndex) {
        ctx.strokeStyle = '#f59e0b'; // Amber-500
        ctx.lineWidth = 2;
        ctx.strokeRect(startX + 1, startY + 1, 8 * scale - 2, 8 * scale - 2);
      }
    }
  }
}
