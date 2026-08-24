import { describe, it, expect } from 'vitest';
import {
  serializeProject,
  parseProject,
  isStudioProjectJson,
  isAtrViewJson,
} from '../src/utils/projectIO';
import { CharacterBank, ScreenRow, ColorRegisters } from '../src/types';

describe('Project IO - Native JSON Project (.json / .acs.json)', () => {
  const mockColorRegisters: ColorRegisters = {
    COLBAK: 0x00,
    COLPF0: 0x28,
    COLPF1: 0xca,
    COLPF2: 0x94,
    COLPF3: 0x46,
  };

  const createMockBank = (id: string, name: string, fillByte: number): CharacterBank => {
    const data = new Uint8Array(1024);
    data.fill(fillByte);
    return { id, name, data };
  };

  const createMockRow = (
    id: string,
    mode: 2 | 4 | 5,
    bankId: string,
    fillByte: number,
    customColors?: Partial<ColorRegisters>
  ): ScreenRow => {
    const charData = new Uint8Array(40);
    charData.fill(fillByte);
    return {
      id,
      mode,
      bankId,
      charData,
      colorRegisters: {
        ...mockColorRegisters,
        ...customColors,
      },
    };
  };

  it('serializes and parses a complete project preserving all banks and screen rows (round-trip)', () => {
    const banks: Record<string, CharacterBank> = {
      'bank-main': createMockBank('bank-main', 'Main Font', 0x55),
      'bank-tiles': createMockBank('bank-tiles', 'Tile Set', 0xaa),
      'bank-ui': createMockBank('bank-ui', 'UI Icons', 0xff),
      'bank-extra1': createMockBank('bank-extra1', 'Extra Font 1', 0x12),
      'bank-extra2': createMockBank('bank-extra2', 'Extra Font 2', 0x34),
    };

    const screenRows: ScreenRow[] = [
      createMockRow('row-0', 2, 'bank-main', 0x01, { COLBAK: 0x10 }),
      createMockRow('row-1', 4, 'bank-tiles', 0x02, { COLPF0: 0x38 }),
      createMockRow('row-2', 5, 'bank-ui', 0x03, { COLPF1: 0xda }),
      createMockRow('row-3', 2, 'bank-extra1', 0x04),
      createMockRow('row-4', 4, 'bank-extra2', 0x05),
    ];

    const sourceState = {
      banks,
      activeBankId: 'bank-tiles',
      screenRows,
      colorRegisters: mockColorRegisters,
      paletteApplyMode: 'all' as const,
      selectedCharIndex: 42,
      activeColorBitPair: 3 as const,
      paintTool: 'draw' as const,
      screenPaintMode: 'glyph' as const,
      isInverseActive: true,
      selectedRowIndex: 1,
      selectedColIndex: 10,
    };

    // 1. Serialize
    const jsonStr = serializeProject(sourceState, 'My Epic Atari Game');
    expect(jsonStr).toContain('"format": "atari-charset-studio"');
    expect(jsonStr).toContain('"name": "My Epic Atari Game"');

    // 2. Parse
    const restored = parseProject(jsonStr);
    expect(restored.format).toBe('atari-charset-studio');
    expect(restored.version).toBe(1);
    expect(restored.name).toBe('My Epic Atari Game');
    expect(restored.activeBankId).toBe('bank-tiles');
    expect(restored.paletteApplyMode).toBe('all');

    // Check banks
    expect(Object.keys(restored.banks)).toHaveLength(5);
    expect(restored.banks['bank-main'].name).toBe('Main Font');
    expect(restored.banks['bank-main'].data[0]).toBe(0x55);
    expect(restored.banks['bank-main'].data.byteLength).toBe(1024);

    expect(restored.banks['bank-tiles'].name).toBe('Tile Set');
    expect(restored.banks['bank-tiles'].data[0]).toBe(0xaa);

    expect(restored.banks['bank-extra2'].name).toBe('Extra Font 2');
    expect(restored.banks['bank-extra2'].data[0]).toBe(0x34);

    // Check rows
    expect(restored.screenRows).toHaveLength(5);
    expect(restored.screenRows[0].mode).toBe(2);
    expect(restored.screenRows[0].bankId).toBe('bank-main');
    expect(restored.screenRows[0].colorRegisters.COLBAK).toBe(0x10);
    expect(restored.screenRows[0].charData[0]).toBe(0x01);

    expect(restored.screenRows[1].mode).toBe(4);
    expect(restored.screenRows[1].bankId).toBe('bank-tiles');
    expect(restored.screenRows[1].colorRegisters.COLPF0).toBe(0x38);

    expect(restored.screenRows[2].mode).toBe(5);
    expect(restored.screenRows[2].bankId).toBe('bank-ui');
    expect(restored.screenRows[2].colorRegisters.COLPF1).toBe(0xda);

    // Check editor state
    expect(restored.editorState?.selectedCharIndex).toBe(42);
    expect(restored.editorState?.activeColorBitPair).toBe(3);
    expect(restored.editorState?.isInverseActive).toBe(true);
    expect(restored.editorState?.selectedRowIndex).toBe(1);
    expect(restored.editorState?.selectedColIndex).toBe(10);
  });

  it('detects native Atari Charset Studio JSON vs Atari FontMaker .atrview JSON', () => {
    const acsJson = {
      format: 'atari-charset-studio',
      version: 1,
      banks: [],
      screenRows: [],
    };
    expect(isStudioProjectJson(acsJson)).toBe(true);
    expect(isAtrViewJson(acsJson)).toBe(false);

    const atrviewJson = {
      Version: '2023',
      ColoredGfx: '0',
      Fontname1: 'Font1.fnt',
      Data: '00112233',
    };
    expect(isAtrViewJson(atrviewJson)).toBe(true);
    expect(isStudioProjectJson(atrviewJson)).toBe(false);
  });

  it('handles corrupted or incomplete JSON gracefully with valid fallbacks', () => {
    const minimalJson = JSON.stringify({
      banks: [
        { id: 'b1', name: 'Minimal Font', data: 'AABB' }
      ],
    });

    const parsed = parseProject(minimalJson);
    expect(parsed.banks['b1']).toBeDefined();
    expect(parsed.banks['b1'].data.length).toBe(1024);
    expect(parsed.banks['b1'].data[0]).toBe(0xAA);
    expect(parsed.banks['b1'].data[1]).toBe(0xBB);
    expect(parsed.activeBankId).toBe('b1');
    expect(parsed.colorRegisters.COLBAK).toBe(0x00);
    expect(parsed.screenRows).toHaveLength(0);
  });

  it('throws an error on empty or invalid JSON string', () => {
    expect(() => parseProject('')).toThrowError();
    expect(() => parseProject('{ invalid json')).toThrowError();
    expect(() => parseProject(JSON.stringify({ banks: [] }))).toThrowError(/nie zawiera żadnych banków/i);
  });
});
