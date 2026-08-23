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
  '#000000', '#000000', '#252525', '#252525', '#464646', '#464646', '#6B6B6B', '#6B6B6B',
  '#838383', '#838383', '#A8A8A8', '#A8A8A8', '#CACACA', '#CACACA', '#EEEEEE', '#EEEEEE',

  // Hue 1: złoty
  '#3E0000', '#3E0000', '#621900', '#621900', '#843B00', '#843B00', '#A85F04', '#A85F04',
  '#C1781D', '#C1781D', '#E69D42', '#E69D42', '#FFBE63', '#FFBE63', '#FFE388', '#FFE388',

  // Hue 2: złoto-pomarańczowy
  '#4F0000', '#4F0000', '#740600', '#740600', '#962714', '#962714', '#BA4C39', '#BA4C39',
  '#D36551', '#D36551', '#F88976', '#F88976', '#FFAB97', '#FFAB97', '#FFCFBC', '#FFCFBC',

  // Hue 3: czerwono-pomarańczowy
  '#540000', '#540000', '#790025', '#790025', '#9A1B46', '#9A1B46', '#BF406B', '#BF406B',
  '#D85983', '#D85983', '#FC7DA8', '#FC7DA8', '#FF9FCA', '#FF9FCA', '#FFC3EE', '#FFC3EE',

  // Hue 4: różowo-czerwony
  '#4F0032', '#4F0032', '#740057', '#740057', '#961478', '#961478', '#BA399D', '#BA399D',
  '#D351B6', '#D351B6', '#F876DA', '#F876DA', '#FF97FC', '#FF97FC', '#FFBCFF', '#FFBCFF',

  // Hue 5: purpurowy
  '#3E0066', '#3E0066', '#62008B', '#62008B', '#8413AD', '#8413AD', '#A837D1', '#A837D1',
  '#C150EA', '#C150EA', '#E675FF', '#E675FF', '#FF96FF', '#FF96FF', '#FFBBFF', '#FFBBFF',

  // Hue 6: fioletowy
  '#22008A', '#22008A', '#4600AE', '#4600AE', '#681AD0', '#681AD0', '#8C3FF5', '#8C3FF5',
  '#A558FF', '#A558FF', '#CA7CFF', '#CA7CFF', '#EB9EFF', '#EB9EFF', '#FFC2FF', '#FFC2FF',

  // Hue 7: niebiesko-fioletowy
  '#00008A', '#00008A', '#031BAE', '#031BAE', '#253CD0', '#253CD0', '#4961F5', '#4961F5',
  '#627AFF', '#627AFF', '#869EFF', '#869EFF', '#A8C0FF', '#A8C0FF', '#CDE5FF', '#CDE5FF',

  // Hue 8: niebieski
  '#000C67', '#000C67', '#00308B', '#00308B', '#0852AD', '#0852AD', '#2D76D1', '#2D76D1',
  '#468FEA', '#468FEA', '#6AB4FF', '#6AB4FF', '#8CD5FF', '#8CD5FF', '#B1FAFF', '#B1FAFF',

  // Hue 9: niebiesko-cyjanowy
  '#001F32', '#001F32', '#004357', '#004357', '#006578', '#006578', '#1B899D', '#1B899D',
  '#34A2B6', '#34A2B6', '#59C7DA', '#59C7DA', '#7AE8FC', '#7AE8FC', '#9FFFFF', '#9FFFFF',

  // Hue A (10): cyjanowy
  '#002B00', '#002B00', '#004F25', '#004F25', '#007146', '#007146', '#17966B', '#17966B',
  '#2FAE84', '#2FAE84', '#54D3A8', '#54D3A8', '#76F4CA', '#76F4CA', '#9AFFEE', '#9AFFEE',

  // Hue B (11): niebiesko-zielony
  '#003300', '#003300', '#005800', '#005800', '#087900', '#087900', '#2D9E04', '#2D9E04',
  '#46B71D', '#46B71D', '#6ADB42', '#6ADB42', '#8CFD63', '#8CFD63', '#B1FF88', '#B1FF88',

  // Hue C (12): zielony
  '#002C00', '#002C00', '#035000', '#035000', '#257200', '#257200', '#499700', '#499700',
  '#62AF00', '#62AF00', '#86D41E', '#86D41E', '#A8F540', '#A8F540', '#CDFF64', '#CDFF64',

  // Hue D (13): żółto-zielony
  '#001D00', '#001D00', '#254200', '#254200', '#466300', '#466300', '#6B8800', '#6B8800',
  '#83A100', '#83A100', '#A8C512', '#A8C512', '#CAE733', '#CAE733', '#EEFF58', '#EEFF58',

  // Hue E (14): żółty
  '#220A00', '#220A00', '#462E00', '#462E00', '#685000', '#685000', '#8C7400', '#8C7400',
  '#A58D00', '#A58D00', '#CAB21E', '#CAB21E', '#EBD340', '#EBD340', '#FFF864', '#FFF864',

  // Hue F (15): żółto-pomarańczowy
  '#3E0000', '#3E0000', '#621900', '#621900', '#843B00', '#843B00', '#A85F04', '#A85F04',
  '#C1781D', '#C1781D', '#E69D42', '#E69D42', '#FFBE63', '#FFBE63', '#FFE388', '#FFE388',
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

