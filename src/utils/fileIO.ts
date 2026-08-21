/**
 * File I/O utilities for importing and exporting Atari .fnt raw binary files.
 */

export function exportFontBinary(bankData: Uint8Array, filename: string = 'charset.fnt'): void {
  // Always ensure exactly 1024 bytes (or 2048 if double bank)
  const bufferCopy = new Uint8Array(bankData.buffer.slice(bankData.byteOffset, bankData.byteOffset + bankData.byteLength));
  const blob = new Blob([bufferCopy.buffer as ArrayBuffer], { type: 'application/octet-stream' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.fnt') ? filename : `${filename}.fnt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export async function importFontBinary(file: File): Promise<Uint8Array> {
  const arrayBuffer = await file.arrayBuffer();
  const rawBytes = new Uint8Array(arrayBuffer);

  if (rawBytes.length === 0) {
    throw new Error('Plik jest pusty.');
  }

  // Create a standard 1024-byte buffer (or up to 2048 if large font)
  const targetLength = rawBytes.length >= 2048 ? 2048 : 1024;
  const result = new Uint8Array(targetLength);

  const bytesToCopy = Math.min(rawBytes.length, targetLength);
  result.set(rawBytes.subarray(0, bytesToCopy));

  return result;
}
