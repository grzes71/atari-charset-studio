import { AnticMode, CharacterBank, ColorRegisters, ScreenRow } from '../types';

export interface SavedPageDataDto {
  Nr?: number;
  Name?: string;
  Width?: number;
  Height?: number;
  View?: string;
  SelectedFont?: string;
}

export interface SavedTileDataDto {
  Nr?: number;
  Width?: number;
  Height?: number;
  View?: string;
  Font?: string;
  Nulls?: string;
}

export interface AtrViewDto {
  Version?: string;
  ColoredGfx?: string;
  Width?: number;
  Height?: number;
  Chars?: string;
  Lines?: string;
  Colors?: string;
  FortyBytes?: string;
  Fontname1?: string;
  Fontname2?: string;
  Fontname3?: string | null;
  Fontname4?: string | null;
  Data?: string;
  Pages?: SavedPageDataDto[] | null;
  Tiles?: SavedTileDataDto[] | null;
}

export interface ParsedAtrViewBank {
  name: string;
  data: Uint8Array; // 1024 bytes
}

export interface ParsedAtrView {
  version: string;
  mode: AnticMode;
  width: number;
  height: number;
  banks: ParsedAtrViewBank[]; // 4 banks
  screenRows: {
    mode: AnticMode;
    bankIndex: number; // 0..3 (mapping to bank 1..4)
    charData: Uint8Array; // 40 bytes
  }[];
  colorRegisters: ColorRegisters;
  rawColors: Uint8Array; // 10 bytes
  pages?: SavedPageDataDto[];
  tiles?: SavedTileDataDto[];
}

/**
 * Converts a hex string to a Uint8Array byte buffer.
 * Automatically handles whitespace and odd string lengths.
 */
export function hexToBytes(hex: string): Uint8Array {
  const sanitized = hex.replace(/[^0-9a-fA-F]/g, '');
  const length = Math.floor(sanitized.length / 2);
  const bytes = new Uint8Array(length);
  for (let i = 0; i < length; i++) {
    bytes[i] = parseInt(sanitized.substring(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

/**
 * Converts a Uint8Array byte buffer to an uppercase hex string without separators.
 */
export function bytesToHex(bytes: Uint8Array): string {
  let hex = '';
  for (let i = 0; i < bytes.length; i++) {
    hex += bytes[i].toString(16).padStart(2, '0').toUpperCase();
  }
  return hex;
}

/**
 * Parses an Atari FontMaker .atrview JSON project string into application data structures.
 */
export function parseAtrView(jsonStr: string): ParsedAtrView {
  let dto: AtrViewDto;
  try {
    dto = JSON.parse(jsonStr);
  } catch {
    throw new Error('Nieprawidłowy format JSON pliku .atrview.');
  }

  // 1. Version and dimensions
  const versionStr = (dto.Version || '2023').toString().trim();
  const versionNum = parseInt(versionStr, 10) || 2023;

  let width = typeof dto.Width === 'number' && dto.Width > 0 ? dto.Width : 40;
  let height = typeof dto.Height === 'number' && dto.Height > 0 ? dto.Height : 26;

  // Backward compatibility: files before v2007 used 32 columns
  const viewWidth = versionNum < 2007 ? 32 : width;

  // 2. Graphic Mode
  const gfxStr = (dto.ColoredGfx ?? '0').toString().trim();
  let defaultMode: AnticMode = 2;
  if (gfxStr === '1') {
    defaultMode = 4;
  } else if (gfxStr === '2') {
    defaultMode = 5;
  } else if (gfxStr === '3') {
    // Mode 10 / GTIA: fallback to Antic mode 4
    defaultMode = 4;
  }

  // 3. Colors
  let colorsHex = (dto.Colors || '0E0028CA9446161AB4BA').trim();
  if (colorsHex.length === 12) {
    colorsHex += '161AB4BA';
  }
  let colorBytes = hexToBytes(colorsHex);
  if (colorBytes.length < 6) {
    const padded = new Uint8Array(10);
    padded.set([0x0e, 0x00, 0x28, 0xca, 0x94, 0x46, 0x16, 0x1a, 0xb4, 0xba]);
    padded.set(colorBytes);
    colorBytes = padded;
  } else if (colorBytes.length < 10) {
    const padded = new Uint8Array(10);
    padded.set([0x0e, 0x00, 0x28, 0xca, 0x94, 0x46, 0x16, 0x1a, 0xb4, 0xba]);
    padded.set(colorBytes);
    colorBytes = padded;
  }

  const colorRegisters: ColorRegisters = {
    COLBAK: colorBytes[1] ?? 0x00,
    COLPF0: colorBytes[2] ?? 0x28,
    COLPF1: colorBytes[3] ?? 0xca,
    COLPF2: colorBytes[4] ?? 0x94,
    COLPF3: colorBytes[5] ?? 0x46,
  };

  // 4. Fonts (Data)
  let fontBytes = hexToBytes(dto.Data || '');
  // Legacy support: 2048 bytes (2 banks) -> duplicate to 4096 bytes (4 banks)
  if (fontBytes.length === 2048) {
    const full = new Uint8Array(4096);
    full.set(fontBytes, 0);
    full.set(fontBytes, 2048);
    fontBytes = full;
  } else if (fontBytes.length < 4096) {
    const full = new Uint8Array(4096);
    full.set(fontBytes);
    fontBytes = full;
  }

  const bank1Data = new Uint8Array(fontBytes.buffer.slice(fontBytes.byteOffset + 0, fontBytes.byteOffset + 1024));
  const bank2Data = new Uint8Array(fontBytes.buffer.slice(fontBytes.byteOffset + 1024, fontBytes.byteOffset + 2048));
  const bank3Data = new Uint8Array(fontBytes.buffer.slice(fontBytes.byteOffset + 2048, fontBytes.byteOffset + 3072));
  const bank4Data = new Uint8Array(fontBytes.buffer.slice(fontBytes.byteOffset + 3072, fontBytes.byteOffset + 4096));

  const banks: ParsedAtrViewBank[] = [
    { name: dto.Fontname1 || 'Font 1', data: bank1Data },
    { name: dto.Fontname2 || 'Font 2', data: bank2Data },
    { name: dto.Fontname3 || 'Font 3', data: bank3Data },
    { name: dto.Fontname4 || 'Font 4', data: bank4Data },
  ];

  // 5. Lines (Font assignments per row)
  const lineBytes = hexToBytes(dto.Lines || '');
  const fontPerLine: number[] = [];
  for (let y = 0; y < height; y++) {
    let fontNum = y < lineBytes.length ? lineBytes[y] : 1;
    // Old files or 0 -> fallback to 1
    if (fontNum < 1 || fontNum > 4) {
      fontNum = 1;
    }
    fontPerLine.push(fontNum - 1); // 0-indexed bank index
  }

  // 6. Chars (Screen RAM matrix)
  const charBytes = hexToBytes(dto.Chars || '');
  const screenRows: ParsedAtrView['screenRows'] = [];
  let charByteIdx = 0;

  for (let y = 0; y < height; y++) {
    const rowCharData = new Uint8Array(40);
    for (let x = 0; x < viewWidth; x++) {
      if (charByteIdx < charBytes.length) {
        if (x < 40) {
          rowCharData[x] = charBytes[charByteIdx];
        }
        charByteIdx++;
      }
    }
    screenRows.push({
      mode: defaultMode,
      bankIndex: fontPerLine[y] ?? 0,
      charData: rowCharData,
    });
  }

  return {
    version: versionStr,
    mode: defaultMode,
    width,
    height,
    banks,
    screenRows,
    colorRegisters,
    rawColors: colorBytes,
    pages: dto.Pages || undefined,
    tiles: dto.Tiles || undefined,
  };
}

/**
 * Serializes the current application state into the Atari FontMaker .atrview JSON project format.
 */
export function serializeAtrView(state: {
  banks: Record<string, CharacterBank>;
  screenRows: ScreenRow[];
  colorRegisters: ColorRegisters;
  activeBankId: string;
}): string {
  const bankList = Object.values(state.banks);
  const bankMap = new Map<string, number>();

  // Map each bank in bankList to 1-based index (1..4)
  bankList.forEach((b, idx) => {
    bankMap.set(b.id, Math.min(4, idx + 1));
  });

  // Prepare 4 banks in 4096-byte buffer
  const banksData = new Uint8Array(4096);
  const fontNames: [string, string, string, string] = [
    'Default.fnt',
    'Default.fnt',
    'Default.fnt',
    'Default.fnt',
  ];

  for (let i = 0; i < 4; i++) {
    const bank = bankList[i] || bankList[0];
    if (bank) {
      fontNames[i] = bank.name.endsWith('.fnt') ? bank.name : `${bank.name}.fnt`;
      banksData.set(bank.data.subarray(0, 1024), i * 1024);
    }
  }

  const height = state.screenRows.length > 0 ? state.screenRows.length : 26;
  const width = 40;

  // Build Chars hex (Width * Height bytes)
  const charBytes = new Uint8Array(width * height);
  // Build Lines hex (Height bytes)
  const lineBytes = new Uint8Array(height);

  // Determine dominant/first row mode for ColoredGfx
  let dominantMode: AnticMode = 2;
  if (state.screenRows.length > 0) {
    dominantMode = state.screenRows[0].mode;
  }

  let gfxStr = '0';
  if (dominantMode === 4) gfxStr = '1';
  else if (dominantMode === 5) gfxStr = '2';

  for (let y = 0; y < height; y++) {
    const row = state.screenRows[y];
    if (row) {
      charBytes.set(row.charData.subarray(0, 40), y * width);
      const fontNum = bankMap.get(row.bankId) || 1;
      lineBytes[y] = fontNum;
    } else {
      lineBytes[y] = 1;
    }
  }

  // Colors: 10 bytes: 0E, COLBAK, COLPF0, COLPF1, COLPF2, COLPF3, 16, 1A, B4, BA
  const colorBytes = new Uint8Array([
    0x0e,
    state.colorRegisters.COLBAK & 0xff,
    state.colorRegisters.COLPF0 & 0xff,
    state.colorRegisters.COLPF1 & 0xff,
    state.colorRegisters.COLPF2 & 0xff,
    state.colorRegisters.COLPF3 & 0xff,
    0x16,
    0x1a,
    0xb4,
    0xba,
  ]);

  const dto: AtrViewDto = {
    Version: '2023',
    ColoredGfx: gfxStr,
    Width: width,
    Height: height,
    Chars: bytesToHex(charBytes),
    Lines: bytesToHex(lineBytes),
    Colors: bytesToHex(colorBytes),
    FortyBytes: '1',
    Fontname1: fontNames[0],
    Fontname2: fontNames[1],
    Fontname3: fontNames[2],
    Fontname4: fontNames[3],
    Data: bytesToHex(banksData),
    Pages: [],
    Tiles: [],
  };

  return JSON.stringify(dto, null, 2);
}

/**
 * Triggers a browser download of an .atrview file.
 */
export function exportAtrViewFile(
  state: {
    banks: Record<string, CharacterBank>;
    screenRows: ScreenRow[];
    colorRegisters: ColorRegisters;
    activeBankId: string;
  },
  filename: string = 'project.atrview'
): void {
  const jsonStr = serializeAtrView(state);
  const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.atrview') ? filename : `${filename}.atrview`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/**
 * Reads and parses an .atrview file selected by the user.
 */
export async function importAtrViewFile(file: File): Promise<ParsedAtrView> {
  const text = await file.text();
  return parseAtrView(text);
}
