import { describe, it, expect } from 'vitest';
import {
  parseAtrView,
  serializeAtrView,
  hexToBytes,
  bytesToHex,
} from '../src/utils/atrviewIO';
import { getDefaultRomFontCopy } from '../src/utils/defaultRomFont';
import { ScreenRow } from '../src/types';

describe('atrviewIO Utilities', () => {
  it('hexToBytes and bytesToHex convert correctly', () => {
    const original = new Uint8Array([0x00, 0x0e, 0x28, 0xca, 0x94, 0x46, 0xff]);
    const hex = bytesToHex(original);
    expect(hex).toBe('000E28CA9446FF');

    const decoded = hexToBytes(hex);
    expect(decoded).toEqual(original);
  });

  it('hexToBytes handles whitespace and case insensitivity', () => {
    const hex = ' 0e 00 28 ca 94 46 ';
    const bytes = hexToBytes(hex);
    expect(bytes).toEqual(new Uint8Array([0x0e, 0x00, 0x28, 0xca, 0x94, 0x46]));
  });

  it('parses standard modern .atrview JSON', () => {
    // 4 banks of 1024 bytes -> 4096 bytes = 8192 hex chars
    const mockDataHex = 'AA'.repeat(1024) + 'BB'.repeat(1024) + 'CC'.repeat(1024) + 'DD'.repeat(1024);
    const mockCharsHex = '01020304'.repeat(260); // 1040 bytes = 40 * 26
    const mockLinesHex = '0102030401020304010203040102030401020304010203040102'; // 26 bytes

    const json = JSON.stringify({
      Version: '2023',
      ColoredGfx: '1', // Mode 4
      Width: 40,
      Height: 26,
      Chars: mockCharsHex,
      Lines: mockLinesHex,
      Colors: '0E0028CA9446161AB4BA',
      FortyBytes: '1',
      Fontname1: 'FontA.fnt',
      Fontname2: 'FontB.fnt',
      Fontname3: 'FontC.fnt',
      Fontname4: 'FontD.fnt',
      Data: mockDataHex,
    });

    const parsed = parseAtrView(json);

    expect(parsed.version).toBe('2023');
    expect(parsed.mode).toBe(4);
    expect(parsed.width).toBe(40);
    expect(parsed.height).toBe(26);
    expect(parsed.banks).toHaveLength(4);
    expect(parsed.banks[0].name).toBe('FontA.fnt');
    expect(parsed.banks[0].data[0]).toBe(0xaa);
    expect(parsed.banks[1].data[0]).toBe(0xbb);
    expect(parsed.banks[2].data[0]).toBe(0xcc);
    expect(parsed.banks[3].data[0]).toBe(0xdd);

    expect(parsed.screenRows).toHaveLength(26);
    expect(parsed.screenRows[0].bankIndex).toBe(0); // line 1 (1-1 = 0)
    expect(parsed.screenRows[1].bankIndex).toBe(1); // line 2 (2-1 = 1)
    expect(parsed.screenRows[2].bankIndex).toBe(2); // line 3 (3-1 = 2)
    expect(parsed.screenRows[3].bankIndex).toBe(3); // line 4 (4-1 = 3)
    expect(parsed.screenRows[0].charData[0]).toBe(0x01);
    expect(parsed.screenRows[0].charData[1]).toBe(0x02);

    expect(parsed.colorRegisters.COLBAK).toBe(0x00);
    expect(parsed.colorRegisters.COLPF0).toBe(0x28);
    expect(parsed.colorRegisters.COLPF1).toBe(0xca);
    expect(parsed.colorRegisters.COLPF2).toBe(0x94);
    expect(parsed.colorRegisters.COLPF3).toBe(0x46);
  });

  it('handles legacy 2-bank (2048 bytes) data by duplicating to 4 banks', () => {
    const twoBanksDataHex = '11'.repeat(1024) + '22'.repeat(1024); // 2048 bytes = 4096 hex chars

    const json = JSON.stringify({
      Version: '2007',
      ColoredGfx: '0',
      Width: 40,
      Height: 24,
      Chars: '00'.repeat(40 * 24),
      Lines: '01'.repeat(24),
      Colors: '0E0028CA9446', // 12 hex chars (6 bytes)
      Data: twoBanksDataHex,
    });

    const parsed = parseAtrView(json);

    expect(parsed.banks).toHaveLength(4);
    expect(parsed.banks[0].data[0]).toBe(0x11);
    expect(parsed.banks[1].data[0]).toBe(0x22);
    expect(parsed.banks[2].data[0]).toBe(0x11); // duplicated bank 1
    expect(parsed.banks[3].data[0]).toBe(0x22); // duplicated bank 2

    // 12 hex char colors padded to 10 bytes
    expect(parsed.rawColors.length).toBe(10);
    expect(parsed.colorRegisters.COLBAK).toBe(0x00);
    expect(parsed.colorRegisters.COLPF0).toBe(0x28);
    expect(parsed.colorRegisters.COLPF3).toBe(0x46);
  });

  it('handles older v1911 files with Width 0 and 32 column fallback', () => {
    const json = JSON.stringify({
      Version: '1911',
      ColoredGfx: '0',
      Width: 0,
      Height: 0,
      Chars: '7F'.repeat(32 * 26),
      Lines: '00'.repeat(26), // 0 should fallback to font 1
      Colors: '0E0028CA9446',
      Data: '00'.repeat(1024),
    });

    const parsed = parseAtrView(json);

    expect(parsed.width).toBe(40);
    expect(parsed.height).toBe(26);
    expect(parsed.screenRows).toHaveLength(26);
    expect(parsed.screenRows[0].bankIndex).toBe(0);
    // In 32-column mode, first 32 chars are populated, remaining 8 are 0
    expect(parsed.screenRows[0].charData[0]).toBe(0x7f);
    expect(parsed.screenRows[0].charData[31]).toBe(0x7f);
    expect(parsed.screenRows[0].charData[32]).toBe(0x00);
  });

  it('serializes state to .atrview and round-trips correctly', () => {
    const romFont = getDefaultRomFontCopy();
    const customBank = new Uint8Array(1024);
    customBank.fill(0x55);

    const banks = {
      'bank-1': { id: 'bank-1', name: 'Main Font', data: romFont },
      'bank-2': { id: 'bank-2', name: 'Sprite Font', data: customBank },
    };

    const screenRows: ScreenRow[] = [];
    for (let i = 0; i < 26; i++) {
      const charData = new Uint8Array(40);
      charData.fill(i);
      screenRows.push({
        id: `row-${i}`,
        mode: 4,
        bankId: i % 2 === 0 ? 'bank-1' : 'bank-2',
        charData,
      });
    }

    const colorRegisters = {
      COLBAK: 0x12,
      COLPF0: 0x34,
      COLPF1: 0x56,
      COLPF2: 0x78,
      COLPF3: 0x9a,
    };

    const json = serializeAtrView({
      banks,
      screenRows,
      colorRegisters,
      activeBankId: 'bank-1',
    });

    expect(typeof json).toBe('string');
    const parsedDto = JSON.parse(json);
    expect(parsedDto.Version).toBe('2023');
    expect(parsedDto.ColoredGfx).toBe('1');
    expect(parsedDto.Width).toBe(40);
    expect(parsedDto.Height).toBe(26);

    // Parse it back
    const roundTrip = parseAtrView(json);
    expect(roundTrip.mode).toBe(4);
    expect(roundTrip.height).toBe(26);
    expect(roundTrip.banks[0].data).toEqual(romFont);
    expect(roundTrip.banks[1].data).toEqual(customBank);
    expect(roundTrip.screenRows[0].bankIndex).toBe(0);
    expect(roundTrip.screenRows[1].bankIndex).toBe(1);
    expect(roundTrip.screenRows[5].charData[0]).toBe(5);
    expect(roundTrip.colorRegisters).toEqual(colorRegisters);
  });
});
