import { AnticMode, ColorRegisters } from '../../types';
import { getBit, getBitPair } from '../../utils/bitwiseHelpers';
import { ColorConverter } from '../services/ColorConverter';

export type CharsetViewRange = 'standard' | 'inverse' | 'full256';

export interface CharsetSheetRenderOptions {
  ctx: CanvasRenderingContext2D;
  bankData: Uint8Array;
  mode: AnticMode;
  registers: ColorRegisters;
  selectedIndex: number;
  scale?: number;
  viewRange?: CharsetViewRange;
  isInverseActive?: boolean;
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
      viewRange = 'standard',
      isInverseActive = false,
    } = options;

    ctx.imageSmoothingEnabled = false;

    const cols = 16;
    const isFull256 = viewRange === 'full256';
    const rows = isFull256 ? 16 : 8;

    const totalWidth = cols * 8 * scale;
    const totalHeight = rows * 8 * scale;

    ctx.clearRect(0, 0, totalWidth, totalHeight);

    const isMulticolor = mode !== 2;
    const pixelWidth = isMulticolor ? 2 * scale : 1 * scale;
    const pixelHeight = 1 * scale;
    const pixelCols = isMulticolor ? 4 : 8;

    const count = isFull256 ? 256 : 128;

    for (let i = 0; i < count; i++) {
      let charCode = i;
      let glyphIndex = i % 128;

      if (viewRange === 'inverse') {
        charCode = i + 128;
        glyphIndex = i;
      }

      const col = i % 16;
      const row = Math.floor(i / 16);

      const startX = col * 8 * scale;
      const startY = row * 8 * scale;
      const offset = glyphIndex * 8;

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
      const isSelected = isFull256
        ? (glyphIndex === selectedIndex && ((charCode >= 128) === isInverseActive))
        : glyphIndex === selectedIndex;

      if (isSelected) {
        ctx.strokeStyle = '#f59e0b'; // Amber-500
        ctx.lineWidth = 2;
        ctx.strokeRect(startX + 1, startY + 1, 8 * scale - 2, 8 * scale - 2);
      }
    }

    // In full 256 view, draw a divider line between 0..127 and 128..255
    if (isFull256) {
      const midY = 8 * 8 * scale;
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, midY);
      ctx.lineTo(totalWidth, midY);
      ctx.stroke();
    }
  }
}
