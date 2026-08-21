import React, { useEffect, useState } from 'react';
import { HeaderToolbar } from './components/Toolbar/HeaderToolbar';
import { GlyphEditor } from './components/GlyphEditor/GlyphEditor';
import { CharsetSheet } from './components/CharsetSheet/CharsetSheet';
import { ColorPalette } from './components/ColorPalette/ColorPalette';
import { ScreenMap } from './components/ScreenMap/ScreenMap';
import { useAppStore } from './store/appStore';
import { importFontBinary } from './utils/fileIO';
import { importAtrViewFile } from './utils/atrviewIO';
import { UploadCloud } from 'lucide-react';

export const App: React.FC = () => {
  const [isDragOver, setIsDragOver] = useState(false);
  const { undo, redo, importFont, importAtrViewProject } = useAppStore();

  // Global Keyboard Shortcuts (Undo / Redo)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        redo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  // Global Drag and Drop for .atrview and .fnt / .rom files
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      const fileNameLower = file.name.toLowerCase();

      try {
        if (fileNameLower.endsWith('.atrview') || fileNameLower.endsWith('.json')) {
          const parsed = await importAtrViewFile(file);
          importAtrViewProject(parsed);
        } else {
          const data = await importFontBinary(file);
          const bankName = file.name.replace(/\.[^/.]+$/, '');
          importFont(data, bankName);
        }
      } catch (err: unknown) {
        alert(err instanceof Error ? err.message : 'Błąd podczas wczytywania upuszczonego pliku.');
      }
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col relative"
    >
      {/* Drag & Drop Overlay */}
      {isDragOver && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center border-4 border-dashed border-amber-400 p-8">
          <UploadCloud className="w-16 h-16 text-amber-400 animate-bounce mb-4" />
          <h3 className="text-xl font-bold text-amber-300 font-pixel mb-2">
            Upuść plik projektu (.atrview) lub fontu (.fnt / .rom)
          </h3>
          <p className="text-zinc-400 text-sm">
            Projekty .atrview wczytują kompletny stan edytora (do 4 banków, ekran i kolory), a .fnt tworzy nowy bank znaków (1024B)
          </p>
        </div>
      )}

      {/* Header Toolbar */}
      <HeaderToolbar />

      {/* Main Studio Workspace */}
      <main className="flex-1 p-4 max-w-[1800px] w-full mx-auto grid grid-cols-1 xl:grid-cols-12 gap-5">
        {/* Left Column: Glyph Editor & Charset Sheet */}
        <div className="xl:col-span-5 flex flex-col gap-5">
          <GlyphEditor />
          <CharsetSheet />
        </div>

        {/* Right Column: Atari Color Palette & Display List Screen Map */}
        <div className="xl:col-span-7 flex flex-col gap-5">
          <ColorPalette />
          <ScreenMap />
        </div>
      </main>

      {/* Footer info */}
      <footer className="px-4 py-2.5 text-center text-xs text-zinc-600 border-t border-zinc-900 flex items-center justify-between">
        <span>Atari 8-bit Charset Studio — 100% Client-Side Retro SPA</span>
        <span className="font-mono text-[11px]">Strict Mode TS • Direct TypedArray Buffers • HTML5 Canvas</span>
      </footer>
    </div>
  );
};

export default App;
