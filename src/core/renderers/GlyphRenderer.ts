import { AnticMode, ColorRegisters } from '../../types';
import { getBit, getBitPair } from '../../utils/bitwiseHelpers';
import { ColorConverter } from '../services/ColorConverter';

export interface GlyphRenderOptions {
  ctx: CanvasRenderingContext2D;
  glyphBytes: Uint8Array;
  mode: AnticMode;
  registers: ColorRegisters;
  isInverse?: boolean;
  width: number;
  height: number;
  showGrid?: boolean;
  hoverPixel?: { x: number; y: number } | null;
}

export class GlyphRenderer {
  static render(options: GlyphRenderOptions): void {
    const {
      ctx,
      glyphBytes,
      mode,
      registers,
      isInverse = false,
      width,
      height,
      showGrid = true,
      hoverPixel,
    } = options;

    ctx.imageSmoothingEnabled = false;

    // Number of columns and rows
    const cols = mode === 2 ? 8 : 4;
    const rows = 8;

    const cellWidth = width / cols;
    const cellHeight = height / rows;

    const charCode = isInverse ? 128 : 0;

    // Draw pixels
    for (let r = 0; r < rows; r++) {
      const byte = glyphBytes[r] || 0;
      for (let c = 0; c < cols; c++) {
        const val = mode === 2 ? getBit(byte, c) : getBitPair(byte, c);
        const hex = ColorConverter.getHexForPixel(mode, registers, val, charCode);

        const x = c * cellWidth;
        const y = r * cellHeight;

        ctx.fillStyle = hex;
        ctx.fillRect(x, y, cellWidth, cellHeight);

        // Highlight hover pixel with a subtle border
        if (hoverPixel && hoverPixel.x === c && hoverPixel.y === r) {
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2;
          ctx.strokeRect(x + 1, y + 1, cellWidth - 2, cellHeight - 2);
        }
      }
    }

    // Draw grid lines
    if (showGrid) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 1;

      // Vertical lines
      for (let c = 1; c < cols; c++) {
        const x = Math.floor(c * cellWidth) + 0.5;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }

      // Horizontal lines
      for (let r = 1; r < rows; r++) {
        const y = Math.floor(r * cellHeight) + 0.5;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
    }
  }
}
