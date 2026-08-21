import { CharacterBank, ColorRegisters, ScreenRow } from '../../types';
import { getBit, getBitPair } from '../../utils/bitwiseHelpers';
import { ColorConverter } from '../services/ColorConverter';

export interface ScreenRowRenderOptions {
  ctx: CanvasRenderingContext2D;
  row: ScreenRow;
  bank: CharacterBank;
  registers: ColorRegisters;
  scale?: number; // pixel scale factor e.g. 2
  selectedCol?: number | null;
  cursorVisible?: boolean;
}

export class ScreenMapRenderer {
  /**
   * Renders a single screen row onto its own canvas context.
   */
  static renderRow(options: ScreenRowRenderOptions): void {
    const {
      ctx,
      row,
      bank,
      registers,
      scale = 2,
      selectedCol = null,
      cursorVisible = false,
    } = options;

    ctx.imageSmoothingEnabled = false;

    const { mode, charData } = row;
    const isMulticolor = mode !== 2;
    const isDoubleHeight = mode === 5;

    const scanlinesPerGlyphRow = isDoubleHeight ? 2 : 1;
    const pixelWidth = (isMulticolor ? 2 : 1) * scale;
    const pixelHeight = scanlinesPerGlyphRow * scale;
    const pixelCols = isMulticolor ? 4 : 8;

    const rowWidth = 40 * 8 * scale;
    const rowHeight = (isDoubleHeight ? 16 : 8) * scale;

    ctx.clearRect(0, 0, rowWidth, rowHeight);

    for (let col = 0; col < 40; col++) {
      const charCode = charData[col] || 0;
      const glyphIndex = charCode & 0x7f; // 0..127
      const offset = glyphIndex * 8;
      const startX = col * 8 * scale;

      for (let r = 0; r < 8; r++) {
        const byte = bank.data[offset + r] || 0;
        const startY = r * pixelHeight;

        for (let c = 0; c < pixelCols; c++) {
          const val = !isMulticolor ? getBit(byte, c) : getBitPair(byte, c);
          const hex = ColorConverter.getHexForPixel(mode, registers, val, charCode);

          ctx.fillStyle = hex;
          ctx.fillRect(
            startX + c * pixelWidth,
            startY,
            pixelWidth,
            pixelHeight
          );
        }
      }

      // Draw cursor if active
      if (selectedCol === col && cursorVisible) {
        ctx.strokeStyle = '#38bdf8'; // Sky-400
        ctx.lineWidth = 1;
        ctx.strokeRect(startX + 0.5, 0.5, 8 * scale - 1, rowHeight - 1);
      }
    }
  }
}
