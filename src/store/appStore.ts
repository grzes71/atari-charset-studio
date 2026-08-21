import { create } from 'zustand';
import {
  AnticMode,
  BitPair,
  CharacterBank,
  ColorRegisters,
  ScreenPaintMode,
  ScreenRow,
  ToolMode,
} from '../types';
import { getDefaultRomFontCopy } from '../utils/defaultRomFont';
import { GlyphManipulator } from '../core/services/GlyphManipulator';

interface HistorySnapshot {
  banks: Record<string, Uint8Array>; // cloned buffers
  screenRows: { id: string; mode: AnticMode; bankId: string; charData: Uint8Array }[];
  activeBankId: string;
  selectedCharIndex: number;
}

export interface AppState {
  // State
  banks: Record<string, CharacterBank>;
  activeBankId: string;
  screenRows: ScreenRow[];
  colorRegisters: ColorRegisters;

  selectedCharIndex: number;
  activeColorBitPair: BitPair;
  paintTool: ToolMode;
  screenPaintMode: ScreenPaintMode;
  isInverseActive: boolean;
  selectedRowIndex: number;
  selectedColIndex: number;
  clipboard: Uint8Array | null;

  revision: number;

  undoStack: HistorySnapshot[];
  redoStack: HistorySnapshot[];

  // Actions
  setSelectedCharIndex: (index: number) => void;
  setActiveColorBitPair: (pair: BitPair) => void;
  setPaintTool: (tool: ToolMode) => void;
  setScreenPaintMode: (mode: ScreenPaintMode) => void;
  setIsInverseActive: (inverse: boolean) => void;
  setSelectedCell: (row: number, col: number) => void;

  setColorRegister: (register: keyof ColorRegisters, val: number) => void;

  // Glyph editing
  setGlyphPixel: (x: number, y: number, value?: number) => void;
  clearGlyph: () => void;
  invertGlyph: () => void;
  shiftGlyph: (direction: 'up' | 'down' | 'left' | 'right', wrap: boolean) => void;
  flipGlyphHorizontal: () => void;
  flipGlyphVertical: () => void;
  copyGlyph: () => void;
  pasteGlyph: () => void;

  // Screen row editing
  setScreenChar: (rowIndex: number, colIndex: number, charCode: number) => void;
  typeScreenText: (text: string) => void;
  setRowMode: (rowIndex: number, mode: AnticMode) => void;
  setRowBank: (rowIndex: number, bankId: string) => void;
  addRow: (afterIndex?: number) => void;
  deleteRow: (rowIndex: number) => void;
  moveRow: (rowIndex: number, direction: 'up' | 'down') => void;
  clearRow: (rowIndex: number) => void;
  fillRow: (rowIndex: number, charCode: number) => void;
  setAllRowsModeAndBank: (mode: AnticMode, bankId: string) => void;

  // Bank management
  createBank: (name?: string, data?: Uint8Array) => string;
  deleteBank: (bankId: string) => void;
  duplicateBank: (bankId: string) => void;
  renameBank: (bankId: string, name: string) => void;
  setActiveBank: (bankId: string) => void;
  loadRomFont: () => void;
  importFont: (data: Uint8Array, name?: string) => string;

  // Project management (.atrview)
  importAtrViewProject: (parsed: import('../utils/atrviewIO').ParsedAtrView) => void;

  // Undo / Redo
  snapshotHistory: () => void;
  undo: () => void;
  redo: () => void;
}

const DEFAULT_BANK_ID = 'bank-0';

function createDefaultScreenRows(): ScreenRow[] {
  const rows: ScreenRow[] = [];
  for (let i = 0; i < 24; i++) {
    const charData = new Uint8Array(40);
    // Fill top row with a welcoming title in Atari screen codes
    if (i === 1) {
      const welcome = "  *** ATARI 8-BIT CHARSET STUDIO ***    ";
      for (let c = 0; c < 40 && c < welcome.length; c++) {
        const code = welcome.charCodeAt(c);
        // Map standard ASCII to Antic internal screen code
        if (code >= 32 && code <= 95) {
          charData[c] = code - 32;
        } else if (code >= 96 && code <= 126) {
          charData[c] = code;
        }
      }
    }
    rows.push({
      id: `row-${i}-${Date.now()}`,
      mode: 2,
      bankId: DEFAULT_BANK_ID,
      charData,
    });
  }
  return rows;
}

function cloneHistorySnapshot(state: {
  banks: Record<string, CharacterBank>;
  screenRows: ScreenRow[];
  activeBankId: string;
  selectedCharIndex: number;
}): HistorySnapshot {
  const bankCopies: Record<string, Uint8Array> = {};
  for (const [id, bank] of Object.entries(state.banks)) {
    bankCopies[id] = new Uint8Array(bank.data);
  }
  const rowCopies = state.screenRows.map((r) => ({
    id: r.id,
    mode: r.mode,
    bankId: r.bankId,
    charData: new Uint8Array(r.charData),
  }));

  return {
    banks: bankCopies,
    screenRows: rowCopies,
    activeBankId: state.activeBankId,
    selectedCharIndex: state.selectedCharIndex,
  };
}

export const useAppStore = create<AppState>((set, get) => ({
  banks: {
    [DEFAULT_BANK_ID]: {
      id: DEFAULT_BANK_ID,
      name: 'Default ROM Font',
      data: getDefaultRomFontCopy(),
    },
  },
  activeBankId: DEFAULT_BANK_ID,
  screenRows: createDefaultScreenRows(),
  colorRegisters: {
    COLBAK: 0x00, // Black
    COLPF0: 0x28, // Gold / Orange
    COLPF1: 0xca, // Green
    COLPF2: 0x94, // Blue
    COLPF3: 0x46, // Pink / Red
  },

  selectedCharIndex: 33, // 'A' by default
  activeColorBitPair: 1, // Default drawing color in multicolor
  paintTool: 'draw',
  screenPaintMode: 'glyph',
  isInverseActive: false,
  selectedRowIndex: 0,
  selectedColIndex: 0,
  clipboard: null,

  revision: 0,
  undoStack: [],
  redoStack: [],

  setSelectedCharIndex: (index) =>
    set({ selectedCharIndex: Math.max(0, Math.min(127, index)) }),

  setActiveColorBitPair: (pair) => set({ activeColorBitPair: pair }),

  setPaintTool: (tool) => set({ paintTool: tool }),

  setScreenPaintMode: (mode) => set({ screenPaintMode: mode }),

  setIsInverseActive: (inverse) => set({ isInverseActive: inverse }),

  setSelectedCell: (row, col) =>
    set({
      selectedRowIndex: Math.max(0, Math.min(get().screenRows.length - 1, row)),
      selectedColIndex: Math.max(0, Math.min(39, col)),
    }),

  setColorRegister: (register, val) =>
    set((state) => ({
      colorRegisters: {
        ...state.colorRegisters,
        [register]: val & 0xff,
      },
      revision: state.revision + 1,
    })),

  snapshotHistory: () => {
    const current = cloneHistorySnapshot(get());
    set((state) => ({
      undoStack: [...state.undoStack.slice(-30), current],
      redoStack: [],
    }));
  },

  undo: () => {
    const { undoStack, redoStack } = get();
    if (undoStack.length === 0) return;

    const previous = undoStack[undoStack.length - 1];
    const current = cloneHistorySnapshot(get());

    // Restore state from snapshot
    const restoredBanks: Record<string, CharacterBank> = {};
    for (const [id, data] of Object.entries(previous.banks)) {
      restoredBanks[id] = {
        id,
        name: get().banks[id]?.name || id,
        data: new Uint8Array(data),
      };
    }

    const restoredRows: ScreenRow[] = previous.screenRows.map((r) => ({
      id: r.id,
      mode: r.mode,
      bankId: r.bankId,
      charData: new Uint8Array(r.charData),
    }));

    set({
      banks: restoredBanks,
      screenRows: restoredRows,
      activeBankId: previous.activeBankId,
      selectedCharIndex: previous.selectedCharIndex,
      undoStack: undoStack.slice(0, -1),
      redoStack: [...redoStack, current],
      revision: get().revision + 1,
    });
  },

  redo: () => {
    const { undoStack, redoStack } = get();
    if (redoStack.length === 0) return;

    const next = redoStack[redoStack.length - 1];
    const current = cloneHistorySnapshot(get());

    const restoredBanks: Record<string, CharacterBank> = {};
    for (const [id, data] of Object.entries(next.banks)) {
      restoredBanks[id] = {
        id,
        name: get().banks[id]?.name || id,
        data: new Uint8Array(data),
      };
    }

    const restoredRows: ScreenRow[] = next.screenRows.map((r) => ({
      id: r.id,
      mode: r.mode,
      bankId: r.bankId,
      charData: new Uint8Array(r.charData),
    }));

    set({
      banks: restoredBanks,
      screenRows: restoredRows,
      activeBankId: next.activeBankId,
      selectedCharIndex: next.selectedCharIndex,
      undoStack: [...undoStack, current],
      redoStack: redoStack.slice(0, -1),
      revision: get().revision + 1,
    });
  },

  setGlyphPixel: (x, y, value) => {
    const { banks, activeBankId, selectedCharIndex, activeColorBitPair, paintTool } = get();
    const bank = banks[activeBankId];
    if (!bank) return;

    const activeRowMode = get().screenRows[get().selectedRowIndex]?.mode || 2;
    const isMulticolor = activeRowMode !== 2;

    let targetVal = value;
    if (targetVal === undefined) {
      if (paintTool === 'erase') {
        targetVal = 0;
      } else {
        targetVal = isMulticolor ? activeColorBitPair : 1;
      }
    }

    GlyphManipulator.setPixel(
      bank.data,
      selectedCharIndex,
      x,
      y,
      targetVal,
      activeRowMode
    );

    set((state) => ({ revision: state.revision + 1 }));
  },

  clearGlyph: () => {
    const { banks, activeBankId, selectedCharIndex, snapshotHistory } = get();
    const bank = banks[activeBankId];
    if (!bank) return;
    snapshotHistory();
    GlyphManipulator.clearGlyph(bank.data, selectedCharIndex);
    set((state) => ({ revision: state.revision + 1 }));
  },

  invertGlyph: () => {
    const { banks, activeBankId, selectedCharIndex, snapshotHistory } = get();
    const bank = banks[activeBankId];
    if (!bank) return;
    snapshotHistory();
    GlyphManipulator.invertGlyph(bank.data, selectedCharIndex);
    set((state) => ({ revision: state.revision + 1 }));
  },

  shiftGlyph: (direction, wrap) => {
    const { banks, activeBankId, selectedCharIndex, selectedRowIndex, screenRows, snapshotHistory } = get();
    const bank = banks[activeBankId];
    if (!bank) return;
    snapshotHistory();
    const mode = screenRows[selectedRowIndex]?.mode || 2;
    GlyphManipulator.shiftGlyph(bank.data, selectedCharIndex, direction, wrap, mode);
    set((state) => ({ revision: state.revision + 1 }));
  },

  flipGlyphHorizontal: () => {
    const { banks, activeBankId, selectedCharIndex, selectedRowIndex, screenRows, snapshotHistory } = get();
    const bank = banks[activeBankId];
    if (!bank) return;
    snapshotHistory();
    const mode = screenRows[selectedRowIndex]?.mode || 2;
    GlyphManipulator.flipHorizontal(bank.data, selectedCharIndex, mode);
    set((state) => ({ revision: state.revision + 1 }));
  },

  flipGlyphVertical: () => {
    const { banks, activeBankId, selectedCharIndex, snapshotHistory } = get();
    const bank = banks[activeBankId];
    if (!bank) return;
    snapshotHistory();
    GlyphManipulator.flipVertical(bank.data, selectedCharIndex);
    set((state) => ({ revision: state.revision + 1 }));
  },

  copyGlyph: () => {
    const { banks, activeBankId, selectedCharIndex } = get();
    const bank = banks[activeBankId];
    if (!bank) return;
    const copy = GlyphManipulator.copyGlyph(bank.data, selectedCharIndex);
    set({ clipboard: copy });
  },

  pasteGlyph: () => {
    const { banks, activeBankId, selectedCharIndex, clipboard, snapshotHistory } = get();
    const bank = banks[activeBankId];
    if (!bank || !clipboard) return;
    snapshotHistory();
    GlyphManipulator.pasteGlyph(bank.data, selectedCharIndex, clipboard);
    set((state) => ({ revision: state.revision + 1 }));
  },

  setScreenChar: (rowIndex, colIndex, charCode) => {
    const { screenRows } = get();
    if (rowIndex < 0 || rowIndex >= screenRows.length || colIndex < 0 || colIndex >= 40) return;

    screenRows[rowIndex].charData[colIndex] = charCode & 0xff;
    set((state) => ({ revision: state.revision + 1 }));
  },

  typeScreenText: (text) => {
    const { screenRows, selectedRowIndex, selectedColIndex, isInverseActive, snapshotHistory } = get();
    if (selectedRowIndex < 0 || selectedRowIndex >= screenRows.length) return;

    snapshotHistory();
    const row = screenRows[selectedRowIndex];
    let col = selectedColIndex;

    for (let i = 0; i < text.length && col < 40; i++) {
      const char = text[i];
      const code = char.charCodeAt(0);
      let screenCode = 0;

      // ASCII to Antic screen code conversion
      if (code >= 32 && code <= 95) {
        screenCode = code - 32;
      } else if (code >= 96 && code <= 126) {
        screenCode = code;
      }

      if (isInverseActive) {
        screenCode |= 0x80;
      }

      row.charData[col] = screenCode;
      col++;
    }

    set({
      selectedColIndex: Math.min(39, col),
      revision: get().revision + 1,
    });
  },

  setRowMode: (rowIndex, mode) => {
    const { screenRows, snapshotHistory } = get();
    if (rowIndex < 0 || rowIndex >= screenRows.length) return;
    snapshotHistory();
    screenRows[rowIndex].mode = mode;
    set((state) => ({ revision: state.revision + 1 }));
  },

  setRowBank: (rowIndex, bankId) => {
    const { screenRows, snapshotHistory } = get();
    if (rowIndex < 0 || rowIndex >= screenRows.length) return;
    snapshotHistory();
    screenRows[rowIndex].bankId = bankId;
    set((state) => ({ revision: state.revision + 1 }));
  },

  addRow: (afterIndex) => {
    const { screenRows, activeBankId, snapshotHistory } = get();
    snapshotHistory();
    const index = afterIndex !== undefined ? afterIndex + 1 : screenRows.length;
    const newRow: ScreenRow = {
      id: `row-${Date.now()}-${Math.random()}`,
      mode: 2,
      bankId: activeBankId,
      charData: new Uint8Array(40),
    };
    const updated = [...screenRows.slice(0, index), newRow, ...screenRows.slice(index)];
    set({ screenRows: updated, revision: get().revision + 1 });
  },

  deleteRow: (rowIndex) => {
    const { screenRows, snapshotHistory } = get();
    if (screenRows.length <= 1 || rowIndex < 0 || rowIndex >= screenRows.length) return;
    snapshotHistory();
    const updated = screenRows.filter((_, i) => i !== rowIndex);
    set({
      screenRows: updated,
      selectedRowIndex: Math.min(get().selectedRowIndex, updated.length - 1),
      revision: get().revision + 1,
    });
  },

  moveRow: (rowIndex, direction) => {
    const { screenRows, snapshotHistory } = get();
    const target = direction === 'up' ? rowIndex - 1 : rowIndex + 1;
    if (target < 0 || target >= screenRows.length) return;
    snapshotHistory();

    const updated = [...screenRows];
    const temp = updated[rowIndex];
    updated[rowIndex] = updated[target];
    updated[target] = temp;

    set({
      screenRows: updated,
      selectedRowIndex: target,
      revision: get().revision + 1,
    });
  },

  clearRow: (rowIndex) => {
    const { screenRows, snapshotHistory } = get();
    if (rowIndex < 0 || rowIndex >= screenRows.length) return;
    snapshotHistory();
    screenRows[rowIndex].charData.fill(0);
    set((state) => ({ revision: state.revision + 1 }));
  },

  fillRow: (rowIndex, charCode) => {
    const { screenRows, snapshotHistory } = get();
    if (rowIndex < 0 || rowIndex >= screenRows.length) return;
    snapshotHistory();
    screenRows[rowIndex].charData.fill(charCode & 0xff);
    set((state) => ({ revision: state.revision + 1 }));
  },

  setAllRowsModeAndBank: (mode, bankId) => {
    const { screenRows, snapshotHistory } = get();
    snapshotHistory();
    const updated = screenRows.map((r) => ({
      ...r,
      mode,
      bankId,
    }));
    set({ screenRows: updated, revision: get().revision + 1 });
  },

  createBank: (name, data) => {
    const id = `bank-${Date.now()}`;
    const bankName = name || `Bank ${Object.keys(get().banks).length + 1}`;
    const bankData = data ? new Uint8Array(data) : new Uint8Array(1024);

    set((state) => ({
      banks: {
        ...state.banks,
        [id]: { id, name: bankName, data: bankData },
      },
      activeBankId: id,
      revision: state.revision + 1,
    }));
    return id;
  },

  deleteBank: (bankId) => {
    const { banks, activeBankId } = get();
    const bankIds = Object.keys(banks);
    if (bankIds.length <= 1) return; // Keep at least one bank

    const updated = { ...banks };
    delete updated[bankId];

    const nextActive = activeBankId === bankId ? Object.keys(updated)[0] : activeBankId;

    // Update screen rows pointing to deleted bank
    const updatedRows = get().screenRows.map((r) =>
      r.bankId === bankId ? { ...r, bankId: nextActive } : r
    );

    set({
      banks: updated,
      activeBankId: nextActive,
      screenRows: updatedRows,
      revision: get().revision + 1,
    });
  },

  duplicateBank: (bankId) => {
    const { banks } = get();
    const source = banks[bankId];
    if (!source) return;

    const newId = `bank-${Date.now()}`;
    const newBank: CharacterBank = {
      id: newId,
      name: `${source.name} (Copy)`,
      data: new Uint8Array(source.data),
    };

    set((state) => ({
      banks: {
        ...state.banks,
        [newId]: newBank,
      },
      activeBankId: newId,
      revision: state.revision + 1,
    }));
  },

  renameBank: (bankId, name) => {
    set((state) => {
      const bank = state.banks[bankId];
      if (!bank) return state;
      return {
        banks: {
          ...state.banks,
          [bankId]: { ...bank, name },
        },
        revision: state.revision + 1,
      };
    });
  },

  setActiveBank: (bankId) => {
    if (get().banks[bankId]) {
      set({ activeBankId: bankId });
    }
  },

  loadRomFont: () => {
    const { banks, activeBankId, snapshotHistory } = get();
    const bank = banks[activeBankId];
    if (!bank) return;
    snapshotHistory();
    const rom = getDefaultRomFontCopy();
    bank.data.set(rom);
    set((state) => ({ revision: state.revision + 1 }));
  },

  importFont: (data, name) => {
    const id = `bank-${Date.now()}`;
    const bankName = name || `Imported Font ${Object.keys(get().banks).length + 1}`;
    const bankData = new Uint8Array(1024);
    bankData.set(data.subarray(0, 1024));

    set((state) => ({
      banks: {
        ...state.banks,
        [id]: { id, name: bankName, data: bankData },
      },
      activeBankId: id,
      revision: state.revision + 1,
    }));
    return id;
  },

  importAtrViewProject: (parsed) => {
    const { snapshotHistory } = get();
    snapshotHistory();

    const newBanks: Record<string, CharacterBank> = {};
    const bankIds: string[] = [];

    parsed.banks.forEach((b, idx) => {
      const id = `bank-${idx + 1}-${Date.now()}`;
      bankIds.push(id);
      newBanks[id] = {
        id,
        name: b.name || `Font ${idx + 1}`,
        data: new Uint8Array(b.data),
      };
    });

    const newRows: ScreenRow[] = parsed.screenRows.map((r, rowIdx) => {
      const bankId = bankIds[r.bankIndex] || bankIds[0];
      return {
        id: `row-${rowIdx}-${Date.now()}-${Math.random()}`,
        mode: r.mode,
        bankId,
        charData: new Uint8Array(r.charData),
      };
    });

    set((state) => ({
      banks: newBanks,
      activeBankId: bankIds[0] || state.activeBankId,
      screenRows: newRows.length > 0 ? newRows : state.screenRows,
      colorRegisters: { ...parsed.colorRegisters },
      selectedRowIndex: 0,
      selectedColIndex: 0,
      selectedCharIndex: 0,
      revision: state.revision + 1,
    }));
  },
}));
