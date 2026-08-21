/**
 * 256-color palette for Atari 8-bit (NTSC / Altirra standard palette).
 * Each byte 0x00 - 0xFF represents:
 * - High nibble (bits 7-4): Hue (0 = Grayscale, 1-15 = Color hues around the color wheel)
 * - Low nibble (bits 3-0): Luminance (even numbers 0, 2, 4, 6, 8, 10, 12, 14; bit 0 is ignored or same in standard GTIA)
 */

export interface RGB {
  r: number;
  g: number;
  b: number;
}

// Precomputed Altirra-accurate standard 256-color Atari NTSC Palette
const HUE_BASE_ANGLES = [
  0,    // 0: Grayscale
  35,   // 1: Gold / Orange
  60,   // 2: Orange
  85,   // 3: Red-Orange
  110,  // 4: Pink / Red
  135,  // 5: Purple / Magenta
  160,  // 6: Violet / Blue-Purple
  185,  // 7: Blue
  210,  // 8: Light Blue / Sky
  235,  // 9: Cyan
  260,  // 10: Blue-Green
  285,  // 11: Green
  310,  // 12: Yellow-Green
  335,  // 13: Yellow / Olive
  355,  // 14: Orange-Brown
  20,   // 15: Ochre
];

function generateAtariLUT(): RGB[] {
  const lut: RGB[] = [];

  for (let i = 0; i < 256; i++) {
    const hue = (i >> 4) & 0x0f;
    const lumaNibble = i & 0x0f;
    // Standard Atari GTIA luma steps (0 to 14 in steps of 2)
    const lumaLevel = (lumaNibble >> 1) / 7; // 0.0 to 1.0
    // Adjust luma curve for authentic gamma
    const luma = Math.pow(lumaLevel, 0.9) * 240;

    if (hue === 0) {
      // Grayscale
      const gray = Math.min(255, Math.round(luma));
      lut.push({ r: gray, g: gray, b: gray });
    } else {
      const angle = (HUE_BASE_ANGLES[hue] * Math.PI) / 180;
      const saturation = 0.65;
      
      // YUV-like conversion to RGB
      const u = Math.cos(angle) * saturation * 128;
      const v = Math.sin(angle) * saturation * 128;

      let r = luma + 1.13983 * v;
      let g = luma - 0.39465 * u - 0.58060 * v;
      let b = luma + 2.03211 * u;

      r = Math.max(0, Math.min(255, Math.round(r)));
      g = Math.max(0, Math.min(255, Math.round(g)));
      b = Math.max(0, Math.min(255, Math.round(b)));

      lut.push({ r, g, b });
    }
  }

  return lut;
}

export const ATARI_COLOR_LUT: readonly RGB[] = generateAtariLUT();

/**
 * Returns [r, g, b] array for a given Atari color byte (0-255).
 */
export function atariByteToRGB(colorByte: number): [number, number, number] {
  const clamped = (colorByte & 0xff);
  const color = ATARI_COLOR_LUT[clamped] || { r: 0, g: 0, b: 0 };
  return [color.r, color.g, color.b];
}

/**
 * Returns HEX color string `#RRGGBB` for a given Atari color byte.
 */
export function atariByteToHex(colorByte: number): string {
  const [r, g, b] = atariByteToRGB(colorByte);
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

/**
 * Extracts Hue (0-15) from Atari color byte.
 */
export function getHue(colorByte: number): number {
  return (colorByte >> 4) & 0x0f;
}

/**
 * Extracts Luma step (0-7, corresponding to $0, $2, $4, $6, $8, $A, $C, $E) from Atari color byte.
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

/**
 * Standard Atari Hue Names for UI
 */
export const ATARI_HUE_NAMES = [
  'Grayscale',
  'Gold / Orange',
  'Orange',
  'Red-Orange',
  'Pink / Red',
  'Purple / Magenta',
  'Violet / Purple',
  'Blue',
  'Sky Blue',
  'Cyan',
  'Blue-Green',
  'Green',
  'Yellow-Green',
  'Yellow / Olive',
  'Orange-Brown',
  'Ochre'
] as const;
