export type AnticMode = 2 | 4 | 5;

export interface CharacterBank {
  id: string;
  name: string;
  data: Uint8Array; // 1024 bytes (128 characters * 8 bytes)
}

export interface ScreenRow {
  id: string;
  mode: AnticMode;
  bankId: string;
  charData: Uint8Array; // 40 bytes
  colorRegisters: ColorRegisters;
}

export interface ColorRegisters {
  COLBAK: number; // Background color (0-255)
  COLPF0: number; // Playfield 0 (0-255)
  COLPF1: number; // Playfield 1 (0-255)
  COLPF2: number; // Playfield 2 (0-255)
  COLPF3: number; // Playfield 3 (0-255)
}

export type PaletteApplyMode = 'currentRow' | 'all' | 'bankRows';

export type BitPair = 0 | 1 | 2 | 3;

export type ToolMode = 'draw' | 'erase' | 'fill' | 'picker';

export type ScreenPaintMode = 'glyph' | 'text';

export interface ClipboardGlyph {
  data: Uint8Array; // 8 bytes
  mode: AnticMode;
}

