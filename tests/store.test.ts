import { describe, it, expect } from 'vitest';
import { useAppStore } from '../src/store/appStore';

describe('AppStore - Row & Bank operations', () => {
  it('setAllRowsModeAndBank updates all rows to the selected mode and bank', () => {
    const { createBank, setAllRowsModeAndBank } = useAppStore.getState();
    const newBankId = createBank('Test Bank');

    // Apply mode 5 and newBankId to all rows
    setAllRowsModeAndBank(5, newBankId);

    const rows = useAppStore.getState().screenRows;
    expect(rows.length).toBeGreaterThan(0);
    for (const row of rows) {
      expect(row.mode).toBe(5);
      expect(row.bankId).toBe(newBankId);
    }
  });

  it('importAtrViewProject updates colorRegisters, banks, and screenRows', () => {
    const { importAtrViewProject } = useAppStore.getState();

    importAtrViewProject({
      version: '2023',
      mode: 4,
      width: 40,
      height: 26,
      banks: [
        { name: 'Custom Font 1', data: new Uint8Array(1024).fill(0x11) },
        { name: 'Custom Font 2', data: new Uint8Array(1024).fill(0x22) },
      ],
      screenRows: [
        { mode: 4, bankIndex: 0, charData: new Uint8Array(40).fill(0x41) },
        { mode: 4, bankIndex: 1, charData: new Uint8Array(40).fill(0x42) },
      ],
      colorRegisters: {
        COLBAK: 0x90,
        COLPF0: 0x28,
        COLPF1: 0x9a,
        COLPF2: 0x94,
        COLPF3: 0x46,
      },
      rawColors: new Uint8Array([0x0e, 0x90, 0x28, 0x9a, 0x94, 0x46, 0x16, 0x1a, 0xb4, 0xba]),
    });

    const state = useAppStore.getState();
    expect(state.colorRegisters.COLBAK).toBe(0x90);
    expect(state.colorRegisters.COLPF0).toBe(0x28);
    expect(state.colorRegisters.COLPF1).toBe(0x9a);
    expect(state.colorRegisters.COLPF2).toBe(0x94);
    expect(state.colorRegisters.COLPF3).toBe(0x46);
    expect(state.screenRows).toHaveLength(2);
    expect(state.screenRows[0].charData[0]).toBe(0x41);
    expect(state.screenRows[0].colorRegisters.COLBAK).toBe(0x90);
    expect(state.screenRows[1].colorRegisters.COLBAK).toBe(0x90);
  });

  it('setColorRegister with "currentRow" mode updates only the selected row palette', () => {
    const { setSelectedCell, setPaletteApplyMode, setColorRegister } = useAppStore.getState();

    setSelectedCell(0, 0);
    setPaletteApplyMode('currentRow');
    setColorRegister('COLBAK', 0x74);

    const state = useAppStore.getState();
    expect(state.screenRows[0].colorRegisters.COLBAK).toBe(0x74);
    // Other rows should not have 0x74 unless they already did
    if (state.screenRows.length > 1) {
      expect(state.screenRows[1].colorRegisters.COLBAK).not.toBe(0x74);
    }
  });

  it('setColorRegister with "all" mode updates all rows palettes', () => {
    const { setPaletteApplyMode, setColorRegister } = useAppStore.getState();

    setPaletteApplyMode('all');
    setColorRegister('COLPF0', 0x3e);

    const state = useAppStore.getState();
    expect(state.colorRegisters.COLPF0).toBe(0x3e);
    for (const row of state.screenRows) {
      expect(row.colorRegisters.COLPF0).toBe(0x3e);
    }
  });

  it('setColorRegister with "bankRows" mode updates only rows assigned to the active row bank', () => {
    const { createBank, setRowBank, setSelectedCell, setPaletteApplyMode, setColorRegister } =
      useAppStore.getState();

    const bankA = createBank('Bank Alpha');
    const bankB = createBank('Bank Beta');

    setRowBank(0, bankA);
    if (useAppStore.getState().screenRows.length > 1) {
      setRowBank(1, bankB);
    }

    setSelectedCell(0, 0);
    setPaletteApplyMode('bankRows');
    setColorRegister('COLPF1', 0xaa);

    const state = useAppStore.getState();
    expect(state.screenRows[0].colorRegisters.COLPF1).toBe(0xaa);
    if (state.screenRows.length > 1) {
      expect(state.screenRows[1].colorRegisters.COLPF1).not.toBe(0xaa);
    }
  });

  it('switching rows updates the active colorRegisters in store to that row palette', () => {
    const { setSelectedCell, setPaletteApplyMode, setColorRegister } = useAppStore.getState();

    setSelectedCell(0, 0);
    setPaletteApplyMode('currentRow');
    setColorRegister('COLBAK', 0x12);

    setSelectedCell(1, 0);
    setColorRegister('COLBAK', 0x34);

    // Switch back to row 0
    setSelectedCell(0, 0);
    expect(useAppStore.getState().colorRegisters.COLBAK).toBe(0x12);

    // Switch to row 1
    setSelectedCell(1, 0);
    expect(useAppStore.getState().colorRegisters.COLBAK).toBe(0x34);
  });
});

