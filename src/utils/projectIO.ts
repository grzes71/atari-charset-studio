import {
  AnticMode,
  BitPair,
  CharacterBank,
  ColorRegisters,
  PaletteApplyMode,
  ScreenPaintMode,
  ScreenRow,
  StudioProject,
  StudioProjectBankDto,
  StudioProjectDto,
  StudioProjectRowDto,
  ToolMode,
} from '../types';
import { bytesToHex, hexToBytes, parseAtrView, ParsedAtrView } from './atrviewIO';

export interface ProjectSerializationSource {
  banks: Record<string, CharacterBank>;
  activeBankId: string;
  screenRows: ScreenRow[];
  colorRegisters: ColorRegisters;
  paletteApplyMode?: PaletteApplyMode;
  selectedCharIndex?: number;
  activeColorBitPair?: BitPair;
  paintTool?: ToolMode;
  screenPaintMode?: ScreenPaintMode;
  isInverseActive?: boolean;
  selectedRowIndex?: number;
  selectedColIndex?: number;
}

const DEFAULT_COLOR_REGISTERS: ColorRegisters = {
  COLBAK: 0x00,
  COLPF0: 0x28,
  COLPF1: 0xca,
  COLPF2: 0x94,
  COLPF3: 0x46,
};

/**
 * Checks if a parsed JSON object has the signature of an Atari Charset Studio native project.
 */
export function isStudioProjectJson(obj: unknown): obj is StudioProjectDto {
  if (!obj || typeof obj !== 'object') return false;
  const candidate = obj as Record<string, unknown>;
  return candidate.format === 'atari-charset-studio' || (Array.isArray(candidate.banks) && Array.isArray(candidate.screenRows));
}

/**
 * Checks if a parsed JSON object has the signature of an Atari FontMaker .atrview file.
 */
export function isAtrViewJson(obj: unknown): boolean {
  if (!obj || typeof obj !== 'object') return false;
  const candidate = obj as Record<string, unknown>;
  return (
    typeof candidate.Data === 'string' ||
    typeof candidate.Fontname1 === 'string' ||
    typeof candidate.Chars === 'string' ||
    typeof candidate.ColoredGfx === 'string'
  );
}

/**
 * Serializes the full application state to an Atari Charset Studio JSON string.
 */
export function serializeProject(
  state: ProjectSerializationSource,
  projectName?: string
): string {
  const bankDtos: StudioProjectBankDto[] = Object.values(state.banks).map((b) => ({
    id: b.id,
    name: b.name,
    data: bytesToHex(b.data),
  }));

  const rowDtos: StudioProjectRowDto[] = state.screenRows.map((r) => ({
    id: r.id,
    mode: r.mode,
    bankId: r.bankId,
    charData: bytesToHex(r.charData),
    colorRegisters: { ...r.colorRegisters },
  }));

  const now = new Date().toISOString();

  const dto: StudioProjectDto = {
    format: 'atari-charset-studio',
    version: 1,
    appVersion: '1.6.0',
    createdAt: now,
    updatedAt: now,
    name: projectName || 'Atari Charset Project',
    activeBankId: state.activeBankId,
    banks: bankDtos,
    colorRegisters: { ...state.colorRegisters },
    paletteApplyMode: state.paletteApplyMode || 'currentRow',
    screenRows: rowDtos,
    editorState: {
      selectedCharIndex: state.selectedCharIndex ?? 0,
      activeColorBitPair: state.activeColorBitPair ?? 1,
      paintTool: state.paintTool ?? 'draw',
      screenPaintMode: state.screenPaintMode ?? 'glyph',
      isInverseActive: state.isInverseActive ?? false,
      selectedRowIndex: state.selectedRowIndex ?? 0,
      selectedColIndex: state.selectedColIndex ?? 0,
    },
  };

  return JSON.stringify(dto, null, 2);
}

/**
 * Parses and validates an Atari Charset Studio project JSON string into application data structures.
 */
export function parseProject(jsonStr: string): StudioProject {
  let dto: unknown;
  try {
    const sanitized = jsonStr.replace(/^\uFEFF/, '').trim();
    dto = JSON.parse(sanitized);
  } catch {
    throw new Error('Nieprawidłowy format JSON pliku projektu.');
  }

  if (!dto || typeof dto !== 'object') {
    throw new Error('Plik JSON nie zawiera prawidłowego obiektu projektu.');
  }

  const candidate = dto as Record<string, unknown>;

  // Validate banks
  const rawBanks = Array.isArray(candidate.banks) ? candidate.banks : [];
  if (rawBanks.length === 0) {
    throw new Error('Projekt nie zawiera żadnych banków znaków (pole "banks" jest puste).');
  }

  const restoredBanks: Record<string, CharacterBank> = {};
  const bankIds: string[] = [];

  rawBanks.forEach((b: unknown, idx: number) => {
    if (!b || typeof b !== 'object') return;
    const bObj = b as Record<string, unknown>;
    const id = typeof bObj.id === 'string' && bObj.id.trim().length > 0 ? bObj.id : `bank-${idx}-${Date.now()}`;
    const name = typeof bObj.name === 'string' ? bObj.name : `Font ${idx + 1}`;
    
    let bankBytes: Uint8Array;
    if (typeof bObj.data === 'string') {
      bankBytes = hexToBytes(bObj.data);
    } else if (Array.isArray(bObj.data)) {
      bankBytes = new Uint8Array(bObj.data);
    } else {
      bankBytes = new Uint8Array(1024);
    }

    // Ensure 1024-byte buffer
    const finalBuffer = new Uint8Array(1024);
    finalBuffer.set(bankBytes.subarray(0, Math.min(1024, bankBytes.length)));

    restoredBanks[id] = {
      id,
      name,
      data: finalBuffer,
    };
    bankIds.push(id);
  });

  if (bankIds.length === 0) {
    throw new Error('Nie udało się wczytać żadnego prawidłowego banku znaków.');
  }

  // Validate color registers
  const rawColors = candidate.colorRegisters as Record<string, unknown> | undefined;
  const colorRegisters: ColorRegisters = {
    COLBAK: typeof rawColors?.COLBAK === 'number' ? (rawColors.COLBAK & 0xff) : DEFAULT_COLOR_REGISTERS.COLBAK,
    COLPF0: typeof rawColors?.COLPF0 === 'number' ? (rawColors.COLPF0 & 0xff) : DEFAULT_COLOR_REGISTERS.COLPF0,
    COLPF1: typeof rawColors?.COLPF1 === 'number' ? (rawColors.COLPF1 & 0xff) : DEFAULT_COLOR_REGISTERS.COLPF1,
    COLPF2: typeof rawColors?.COLPF2 === 'number' ? (rawColors.COLPF2 & 0xff) : DEFAULT_COLOR_REGISTERS.COLPF2,
    COLPF3: typeof rawColors?.COLPF3 === 'number' ? (rawColors.COLPF3 & 0xff) : DEFAULT_COLOR_REGISTERS.COLPF3,
  };

  // Validate screen rows
  const rawRows = Array.isArray(candidate.screenRows) ? candidate.screenRows : [];
  const screenRows: ScreenRow[] = rawRows.map((r: unknown, rowIdx: number) => {
    const rObj = (r && typeof r === 'object') ? (r as Record<string, unknown>) : {};
    const id = typeof rObj.id === 'string' ? rObj.id : `row-${rowIdx}-${Date.now()}`;
    
    let mode: AnticMode = 2;
    if (rObj.mode === 4 || rObj.mode === 5) {
      mode = rObj.mode;
    }

    let bankId = typeof rObj.bankId === 'string' ? rObj.bankId : bankIds[0];
    if (!restoredBanks[bankId]) {
      bankId = bankIds[0];
    }

    let charBytes: Uint8Array;
    if (typeof rObj.charData === 'string') {
      charBytes = hexToBytes(rObj.charData);
    } else if (Array.isArray(rObj.charData)) {
      charBytes = new Uint8Array(rObj.charData);
    } else {
      charBytes = new Uint8Array(40);
    }

    const rowCharData = new Uint8Array(40);
    rowCharData.set(charBytes.subarray(0, Math.min(40, charBytes.length)));

    const rColors = rObj.colorRegisters as Record<string, unknown> | undefined;
    const rowColorRegisters: ColorRegisters = {
      COLBAK: typeof rColors?.COLBAK === 'number' ? (rColors.COLBAK & 0xff) : colorRegisters.COLBAK,
      COLPF0: typeof rColors?.COLPF0 === 'number' ? (rColors.COLPF0 & 0xff) : colorRegisters.COLPF0,
      COLPF1: typeof rColors?.COLPF1 === 'number' ? (rColors.COLPF1 & 0xff) : colorRegisters.COLPF1,
      COLPF2: typeof rColors?.COLPF2 === 'number' ? (rColors.COLPF2 & 0xff) : colorRegisters.COLPF2,
      COLPF3: typeof rColors?.COLPF3 === 'number' ? (rColors.COLPF3 & 0xff) : colorRegisters.COLPF3,
    };

    return {
      id,
      mode,
      bankId,
      charData: rowCharData,
      colorRegisters: rowColorRegisters,
    };
  });

  // Active bank
  let activeBankId = typeof candidate.activeBankId === 'string' ? candidate.activeBankId : bankIds[0];
  if (!restoredBanks[activeBankId]) {
    activeBankId = bankIds[0];
  }

  // Palette apply mode
  let paletteApplyMode: PaletteApplyMode = 'currentRow';
  if (candidate.paletteApplyMode === 'all' || candidate.paletteApplyMode === 'bankRows') {
    paletteApplyMode = candidate.paletteApplyMode;
  }

  // Editor state
  const rawEditor = candidate.editorState as Record<string, unknown> | undefined;
  const editorState = rawEditor
    ? {
        selectedCharIndex: typeof rawEditor.selectedCharIndex === 'number' ? Math.max(0, Math.min(127, rawEditor.selectedCharIndex)) : 0,
        activeColorBitPair: (typeof rawEditor.activeColorBitPair === 'number' && [0, 1, 2, 3].includes(rawEditor.activeColorBitPair) ? rawEditor.activeColorBitPair : 1) as BitPair,
        paintTool: (typeof rawEditor.paintTool === 'string' && ['draw', 'erase', 'fill', 'picker'].includes(rawEditor.paintTool) ? rawEditor.paintTool : 'draw') as ToolMode,
        screenPaintMode: (typeof rawEditor.screenPaintMode === 'string' && ['glyph', 'text'].includes(rawEditor.screenPaintMode) ? rawEditor.screenPaintMode : 'glyph') as ScreenPaintMode,
        isInverseActive: typeof rawEditor.isInverseActive === 'boolean' ? rawEditor.isInverseActive : false,
        selectedRowIndex: typeof rawEditor.selectedRowIndex === 'number' ? Math.max(0, rawEditor.selectedRowIndex) : 0,
        selectedColIndex: typeof rawEditor.selectedColIndex === 'number' ? Math.max(0, Math.min(39, rawEditor.selectedColIndex)) : 0,
      }
    : undefined;

  return {
    format: 'atari-charset-studio',
    version: typeof candidate.version === 'number' ? candidate.version : 1,
    name: typeof candidate.name === 'string' ? candidate.name : undefined,
    activeBankId,
    banks: restoredBanks,
    colorRegisters,
    paletteApplyMode,
    screenRows,
    editorState,
  };
}

/**
 * Triggers a browser download of an Atari Charset Studio .json project file.
 */
export function exportProjectFile(
  state: ProjectSerializationSource,
  filename: string = 'project.json'
): void {
  const jsonStr = serializeProject(state, filename.replace(/\.json$/i, ''));
  const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.json') ? filename : `${filename}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export type AnyProjectImportResult =
  | { type: 'acs'; project: StudioProject }
  | { type: 'atrview'; project: ParsedAtrView };

/**
 * Reads and automatically detects either an Atari Charset Studio JSON project or Atari FontMaker .atrview file.
 */
export async function importAnyProjectFile(file: File): Promise<AnyProjectImportResult> {
  const text = await file.text();
  let parsedObj: unknown;
  try {
    const sanitized = text.replace(/^\uFEFF/, '').trim();
    parsedObj = JSON.parse(sanitized);
  } catch {
    throw new Error('Wybrany plik nie jest prawidłowym dokumentem JSON.');
  }

  if (isStudioProjectJson(parsedObj)) {
    const project = parseProject(text);
    return { type: 'acs', project };
  }

  if (isAtrViewJson(parsedObj) || file.name.toLowerCase().endsWith('.atrview')) {
    const project = parseAtrView(text);
    return { type: 'atrview', project };
  }

  // If ambiguous, attempt ACS parse first, fallback to atrview
  try {
    const project = parseProject(text);
    return { type: 'acs', project };
  } catch {
    const project = parseAtrView(text);
    return { type: 'atrview', project };
  }
}
