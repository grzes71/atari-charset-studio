/**
 * Standard Atari 8-bit XL/XE ROM character set (1024 bytes).
 * 128 characters, 8 bytes per character in ANTIC screen code order (0..127):
 * - 0..31: Space, punctuation, digits 0-9, operators
 * - 32..63: Uppercase characters @, A-Z, brackets, symbols
 * - 64..95: Graphics characters, control symbols, uppercase special
 * - 96..127: Lowercase characters a-z, special symbols
 */

// Base64 encoded 1024 bytes of standard Atari 800/XL/XE character generator ROM
const ATARI_ROM_FONT_B64 =
  "AAAAAAAAAAAAGBgYGAAYAABmZmYAAAAAAGb/Zmb/ZgAYPmA8BnwYAABmbBgwZkYAHDYcOG9mOwAAGBgY" +
  "AAAAAAAOHBgYHA4AAHA4GBg4cAAAZjz/PGYAAAAYGH4YGAAAAAAAAAAYGDAAAAB+AAAAAAAAAAAAGBgA" +
  "AAYMGDBgQAAAPGZudmY8AAAYOBgYGH4AADxmDBgwfgAAfgwYDGY8AAAMHDxsfgwAAH5gfAZmPAAAPGB8" +
  "ZmY8AAB+BgwYMDAAADxmPGZmPAAAPGY+Bgw4AAAAGBgAGBgAAAAYGAAYGDAGDBgwGAwGAAAAfgAAfgAA" +
  "YDAYDBgwYAAAPGYMGAAYAAA8Zm5uYD4AABg8ZmZ+ZgAAfGZ8ZmZ8AAA8ZmBgZjwAAHhsZmZseAAAfmB8" +
  "YGB+AAB+YHxgYGAAAD5gYG5mPgAAZmZ+ZmZmAAB+GBgYGH4AAAYGBgZmPAAAZmx4eGxmAABgYGBgYH4A" +
  "AGN3f2tjYwAAZnZ+fm5mAAA8ZmZmZjwAAHxmZnxgYAAAPGZmZmw2AAB8ZmZ8bGYAADxgPAYGPAAAfhgY" +
  "GBgYAABmZmZmZn4AAGZmZmY8GAAAY2Nrf3djAABmZjw8ZmYAAGZmPBgYGAAAfgwYMGB+AAAeGBgYGB4A" +
  "AEBgMBgMBgAAeBgYGBh4AAAIHDZjAAAAAAAAAAAA/wAANn9/PhwIABgYGB8fGBgYAwMDAwMDAwMYGBj4" +
  "+AAAABgYGPj4GBgYAAAA+PgYGBgDBw4cOHDgwMDgcDgcDgcDAQMHDx8/f/8AAAAADw8PD4DA4PD4/P7/" +
  "Dw8PDwAAAADw8PDwAAAAAP//AAAAAAAAAAAAAAAA//8AAAAA8PDw8AAcHHd3CBwAAAAAHx8YGBgAAAD/" +
  "/wAAABgYGP//GBgYAAA8fn5+PAAAAAAA/////8DAwMDAwMDAAAAA//8YGBgYGBj//wAAAPDw8PDw8PDw" +
  "GBgYHx8AAAB4YHhgfhgeAAAYPH4YGBgAABgYGH48GAAAGDB+MBgAAAAYDH4MGAAAABg8fn48GAAAADwG" +
  "PmY+AABgYHxmZnwAAAA8YGBgPAAABgY+ZmY+AAAAPGZ+YDwAAA4YPhgYGAAAAD5mZj4GfABgYHxmZmYA" +
  "ABgAOBgYPAAABgAGBgYGPABgYGx4bGYAADgYGBgYPAAAAGZ/f2tjAAAAfGZmZmYAAAA8ZmZmPAAAAHxm" +
  "ZnxgYAAAPmZmPgYGAAB8ZmBgYAAAAD5gPAZ8AAAYfhgYGA4AAABmZmZmPgAAAGZmZjwYAAAAY2t/PjYA" +
  "AABmPBg8ZgAAAGZmZj4MeAAAfgwYMH4AABg8fn4YPAAYGBgYGBgYGAB+eHxuZgYACBg4eDgYCAAQGBwe" +
  "HBgQAA==";

function buildRomFont(): Uint8Array {
  const font = new Uint8Array(1024);
  try {
    const binaryStr = atob(ATARI_ROM_FONT_B64);
    for (let i = 0; i < binaryStr.length && i < 1024; i++) {
      font[i] = binaryStr.charCodeAt(i);
    }
  } catch (err) {
    console.error('Failed to decode Atari ROM font:', err);
  }
  return font;
}

export const DEFAULT_ATARI_ROM_FONT: Uint8Array = buildRomFont();

/**
 * Returns a fresh copy of the default Atari ROM font buffer.
 */
export function getDefaultRomFontCopy(): Uint8Array {
  return new Uint8Array(DEFAULT_ATARI_ROM_FONT);
}
