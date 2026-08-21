import React, { useRef } from 'react';
import {
  Download,
  Upload,
  RotateCcw,
  Undo2,
  Redo2,
  Plus,
  Copy,
  Trash2,
  Layers,
} from 'lucide-react';
import { useAppStore } from '../../store/appStore';
import { exportFontBinary, importFontBinary } from '../../utils/fileIO';

export const HeaderToolbar: React.FC = () => {
  const {
    banks,
    activeBankId,
    setActiveBank,
    createBank,
    duplicateBank,
    deleteBank,
    loadRomFont,
    importFont,
    undo,
    redo,
    undoStack,
    redoStack,
  } = useAppStore();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const activeBank = banks[activeBankId];
    if (activeBank) {
      const sanitizedName = activeBank.name.replace(/[^a-z0-9_-]/gi, '_').toLowerCase();
      exportFontBinary(activeBank.data, `${sanitizedName || 'atari_charset'}.fnt`);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      try {
        const file = files[0];
        const data = await importFontBinary(file);
        const bankName = file.name.replace(/\.[^/.]+$/, '');
        importFont(data, bankName);
      } catch (err: unknown) {
        alert(err instanceof Error ? err.message : 'Błąd podczas importu pliku.');
      }
      e.target.value = '';
    }
  };

  const handleNewBank = () => {
    const name = prompt('Wpisz nazwę nowego banku znaków:', `Bank ${Object.keys(banks).length + 1}`);
    if (name !== null) {
      createBank(name);
    }
  };

  return (
    <header className="glass-panel sticky top-0 z-40 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 shadow-xl">
      {/* Brand & Logo */}
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-amber-500 via-red-500 to-fuchsia-600 p-0.5 flex items-center justify-center shadow-lg shadow-amber-500/20">
          <div className="h-full w-full bg-zinc-950 rounded-[7px] flex items-center justify-center font-pixel text-xs text-amber-400">
            A8
          </div>
        </div>
        <div>
          <h1 className="text-base font-bold tracking-tight bg-gradient-to-r from-amber-400 via-orange-400 to-amber-200 bg-clip-text text-transparent flex items-center gap-2">
            Atari Charset Studio
            <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-normal">
              XL/XE
            </span>
          </h1>
          <p className="text-xs text-zinc-400 hidden sm:block">
            Antic Modes 2, 4 & 5 Font & Screen Editor
          </p>
        </div>
      </div>

      {/* Bank Management & Select */}
      <div className="flex items-center gap-2 bg-zinc-900/80 p-1 rounded-lg border border-zinc-800">
        <Layers className="w-4 h-4 text-amber-400 ml-2" />
        <select
          value={activeBankId}
          onChange={(e) => setActiveBank(e.target.value)}
          className="bg-transparent text-xs font-medium text-zinc-200 py-1 px-2 rounded focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
        >
          {Object.values(banks).map((b) => (
            <option key={b.id} value={b.id} className="bg-zinc-900 text-zinc-100">
              {b.name} (128 glifów)
            </option>
          ))}
        </select>

        <button
          onClick={handleNewBank}
          title="Utwórz nowy pusty bank znaków"
          className="p-1.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-amber-400 transition"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => duplicateBank(activeBankId)}
          title="Zduplikuj aktywny bank znaków"
          className="p-1.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-amber-400 transition"
        >
          <Copy className="w-3.5 h-3.5" />
        </button>
        {Object.keys(banks).length > 1 && (
          <button
            onClick={() => deleteBank(activeBankId)}
            title="Usuń ten bank znaków"
            className="p-1.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-red-400 transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Action Tools: Undo, Redo, Load ROM, Import, Export */}
      <div className="flex items-center gap-2">
        {/* Undo / Redo */}
        <div className="flex items-center bg-zinc-900/80 p-1 rounded-lg border border-zinc-800">
          <button
            onClick={undo}
            disabled={undoStack.length === 0}
            title="Cofnij (Ctrl+Z)"
            className="p-1.5 rounded hover:bg-zinc-800 text-zinc-300 disabled:opacity-30 disabled:cursor-not-allowed transition"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            onClick={redo}
            disabled={redoStack.length === 0}
            title="Ponów (Ctrl+Y)"
            className="p-1.5 rounded hover:bg-zinc-800 text-zinc-300 disabled:opacity-30 disabled:cursor-not-allowed transition"
          >
            <Redo2 className="w-4 h-4" />
          </button>
        </div>

        {/* Load Default ROM font */}
        <button
          onClick={loadRomFont}
          title="Załaduj standardowy font Atari XL/XE ROM"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-medium text-zinc-300 hover:text-amber-400 transition"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Załaduj ROM</span>
        </button>

        {/* Import .fnt */}
        <button
          onClick={() => fileInputRef.current?.click()}
          title="Importuj surowy plik binarny .fnt / .rom (1024B)"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-medium text-zinc-300 hover:text-sky-400 transition"
        >
          <Upload className="w-3.5 h-3.5 text-sky-400" />
          <span>Importuj .fnt</span>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".fnt,.rom,.bin"
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Export .fnt */}
        <button
          onClick={handleExport}
          title="Pobierz surowy plik binarny .fnt (1024B)"
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-semibold text-xs shadow-lg shadow-amber-500/20 transition transform active:scale-95"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Eksportuj .fnt</span>
        </button>
      </div>
    </header>
  );
};
