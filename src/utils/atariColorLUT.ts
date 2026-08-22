export interface RGB {
  r: number;
  g: number;
  b: number;
}

export const ATARI_HUE_NAMES = [
  'szary',
  'złoty',
  'złoto-pomarańczowy',
  'czerwono-pomarańczowy',
  'różowo-czerwony',
  'purpurowy',
  'fioletowy',
  'niebiesko-fioletowy',
  'niebieski',
  'niebiesko-cyjanowy',
  'cyjanowy',
  'niebiesko-zielony',
  'zielony',
  'żółto-zielony',
  'żółty',
  'żółto-pomarańczowy',
] as const;

/**
 * Exact 256-color palette for Atari 8-bit / GTIA (16 Hues x 16 Luminance levels).
 */
export const ATARI_PALETTE_HEX: readonly string[] = [
  // Hue 0: szary
  '#000000', '#111111', '#222222', '#333333', '#444444', '#555555', '#666666', '#777777',
  '#888888', '#999999', '#AAAAAA', '#BBBBBB', '#CCCCCC', '#DDDDDD', '#EEEEEE', '#FFFFFF',

  // Hue 1: złoty
  '#190700', '#2A1800', '#3B2900', '#4C3A00', '#5D4B00', '#6E5C00', '#7F6D00', '#907E09',
  '#A18F1A', '#B3A02B', '#C3B13C', '#D4C24D', '#E5D35E', '#F7E46F', '#FFF582', '#FFFF96',

  // Hue 2: złoto-pomarańczowy
  '#310000', '#3F0000', '#531700', '#642800', '#753900', '#864A00', '#975B0A', '#A86C1B',
  '#B97D2C', '#CA8E3D', '#DB9F4E', '#ECB05F', '#FDC170', '#FFD285', '#FFE39C', '#FFF4B2',

  // Hue 3: czerwono-pomarańczowy
  '#420404', '#4F0000', '#600800', '#711900', '#822A0D', '#933B1E', '#A44C2F', '#B55D40',
  '#C66E51', '#D77F62', '#E89073', '#F9A183', '#FFB298', '#FFC3AE', '#FFD4C4', '#FFE5DA',

  // Hue 4: różowo-czerwony
  '#410103', '#50000F', '#61001B', '#720F2B', '#83203C', '#94314D', '#A5425E', '#B6536F',
  '#C76480', '#D87591', '#E986A2', '#FA97B3', '#FFA8C8', '#FFB9DE', '#FFCAEF', '#FBDCF6',

  // Hue 5: purpurowy
  '#330035', '#440041', '#55004C', '#660C5C', '#771D6D', '#882E7E', '#993F8F', '#AA50A0',
  '#BB61B1', '#CC72C2', '#DD83D3', '#EE94E4', '#FFA5E4', '#FFB6E9', '#FFC7EE', '#FFD8F3',

  // Hue 6: fioletowy
  '#1D005C', '#2E0068', '#400074', '#511084', '#622195', '#7332A6', '#8443B7', '#9554C8',
  '#A665D9', '#B776EA', '#C887EB', '#D998EB', '#E9A9EC', '#FBBAEB', '#FFCBEF', '#FFDFF9',

  // Hue 7: niebiesko-fioletowy
  '#020071', '#13007D', '#240B8C', '#351C9D', '#462DAE', '#573EBF', '#684FD0', '#7960E1',
  '#8A71F2', '#9B82F7', '#AC93F7', '#BDA4F7', '#CEB5F7', '#DFC6F7', '#F0D7F7', '#FFE8F8',

  // Hue 8: niebieski
  '#000068', '#000A7C', '#081B90', '#192CA1', '#2A3DB2', '#3B4EC3', '#4C5FD4', '#5D70E5',
  '#6E81F6', '#7F92FF', '#90A3FF', '#A1B4FF', '#B2C5FF', '#C3D6FF', '#D4E7FF', '#E5F8FF',

  // Hue 9: niebiesko-cyjanowy
  '#000A4D', '#001B63', '#002C79', '#023D8F', '#134EA0', '#245FB1', '#3570C2', '#4681D3',
  '#5792E4', '#68A3F5', '#79B4FF', '#8AC5FF', '#9BD6FF', '#ACE7FF', '#BDF8FF', '#CEFFFF',

  // Hue A (10): cyjanowy
  '#001A26', '#002B3C', '#003C52', '#004D68', '#065E7C', '#176F8D', '#28809E', '#3991AF',
  '#4AA2C0', '#5BB3D1', '#6CC4E2', '#7DD5F3', '#8EE6FF', '#9FF7FF', '#B0FFFF', '#C1FFFF',

  // Hue B (11): niebiesko-zielony
  '#01250A', '#023610', '#004622', '#005738', '#05684D', '#16795E', '#278A6F', '#389B80',
  '#49AC91', '#5ABDA2', '#6BCEB3', '#7CDFC4', '#8DF0D5', '#9EFFE5', '#AFFFF1', '#C0FFFD',

  // Hue C (12): zielony
  '#04260D', '#043811', '#054713', '#005A1B', '#106B1B', '#217C2C', '#328D3D', '#439E4E',
  '#54AF5F', '#65C070', '#76D181', '#87E292', '#98F3A3', '#A9FFB3', '#BAFFBF', '#CBFFCB',

  // Hue D (13): żółto-zielony
  '#00230A', '#003510', '#044613', '#155613', '#266713', '#377813', '#488914', '#599A25',
  '#6AAB36', '#7BBC47', '#8CCD58', '#9DDE69', '#AEEF7A', '#BFFF8B', '#D0FF97', '#E1FFA3',

  // Hue E (14): żółty
  '#001707', '#0E2808', '#1F3908', '#304A08', '#415B08', '#526C08', '#637D08', '#748E0D',
  '#859F1E', '#96B02F', '#A7C140', '#B8D251', '#C9E362', '#DAF473', '#EBFF82', '#FCFF8E',

  // Hue F (15): żółto-pomarańczowy
  '#1B0701', '#2C1801', '#3C2900', '#4D3B00', '#5F4C00', '#705E00', '#816F00', '#938009',
  '#A4921A', '#B2A02B', '#C7B43D', '#D8C64E', '#EAD760', '#F6E46F', '#FFFA84', '#FFFF99',
];

export const LUMA_STEPS = [0x0, 0x2, 0x4, 0x6, 0x8, 0xa, 0xc, 0xe] as const;

function hexToRgb(hex: string): RGB {
  const clean = hex.replace('#', '');
  const num = parseInt(clean, 16);
  return {
    r: (num >> 16) & 0xff,
    g: (num >> 8) & 0xff,
    b: num & 0xff,
  };
}

export const ATARI_COLOR_LUT: readonly RGB[] = ATARI_PALETTE_HEX.map(hexToRgb);

/**
 * Returns [r, g, b] array for a given Atari color byte (0-255).
 * Enforces even luminance (bit 0 = 0) as per standard Atari GTIA hardware.
 */
export function atariByteToRGB(colorByte: number): [number, number, number] {
  const clamped = colorByte & 0xfe;
  const color = ATARI_COLOR_LUT[clamped] || { r: 0, g: 0, b: 0 };
  return [color.r, color.g, color.b];
}

/**
 * Returns HEX color string `#RRGGBB` for a given Atari color byte.
 * Enforces even luminance (bit 0 = 0) as per standard Atari GTIA hardware.
 */
export function atariByteToHex(colorByte: number): string {
  const clamped = colorByte & 0xfe;
  return ATARI_PALETTE_HEX[clamped] || '#000000';
}

/**
 * Extracts Hue (0-15) from Atari color byte.
 */
export function getHue(colorByte: number): number {
  return (colorByte >> 4) & 0x0f;
}

/**
 * Extracts even Luma value (0x0, 0x2, 0x4, 0x6, 0x8, 0xA, 0xC, 0xE) from Atari color byte.
 */
export function getLuma(colorByte: number): number {
  return colorByte & 0x0e;
}

/**
 * Extracts Luma step index (0-7) from Atari color byte.
 */
export function getLumaStep(colorByte: number): number {
  return (colorByte & 0x0e) >> 1;
}

/**
 * Constructs an Atari color byte from Hue (0-15) and Luma step (0-7).
 */
export function makeAtariByte(hue: number, lumaStep: number): number {
  return ((hue & 0x0f) << 4) | ((lumaStep & 0x07) << 1);
}

