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
  FileCode,
} from 'lucide-react';
import { useAppStore } from '../../store/appStore';
import { exportFontBinary, importFontBinary } from '../../utils/fileIO';
import { exportAtrViewFile, importAtrViewFile } from '../../utils/atrviewIO';

export const HeaderToolbar: React.FC = () => {
  const {
    banks,
    activeBankId,
    screenRows,
    colorRegisters,
    setActiveBank,
    createBank,
    duplicateBank,
    deleteBank,
    loadRomFont,
    importFont,
    importAtrViewProject,
    undo,
    redo,
    undoStack,
    redoStack,
  } = useAppStore();

  const fntInputRef = useRef<HTMLInputElement>(null);
  const atrviewInputRef = useRef<HTMLInputElement>(null);

  // Export active font as raw .fnt (1024B)
  const handleExportFnt = () => {
    const activeBank = banks[activeBankId];
    if (activeBank) {
      const sanitizedName = activeBank.name.replace(/[^a-z0-9_-]/gi, '_').toLowerCase();
      exportFontBinary(activeBank.data, `${sanitizedName || 'atari_charset'}.fnt`);
    }
  };

  // Export entire project as Atari FontMaker .atrview
  const handleExportAtrView = () => {
    const activeBank = banks[activeBankId];
    const baseName = activeBank ? activeBank.name.replace(/[^a-z0-9_-]/gi, '_').toLowerCase() : 'atari_project';
    exportAtrViewFile(
      {
        banks,
        screenRows,
        colorRegisters,
        activeBankId,
      },
      `${baseName}.atrview`
    );
  };

  // Handle .fnt file selection
  const handleFntFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      try {
        const file = files[0];
        const data = await importFontBinary(file);
        const bankName = file.name.replace(/\.[^/.]+$/, '');
        importFont(data, bankName);
      } catch (err: unknown) {
        alert(err instanceof Error ? err.message : 'Błąd podczas importu pliku .fnt.');
      }
      e.target.value = '';
    }
  };

  // Handle .atrview file selection
  const handleAtrViewFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      try {
        const file = files[0];
        const parsed = await importAtrViewFile(file);
        importAtrViewProject(parsed);
      } catch (err: unknown) {
        alert(err instanceof Error ? err.message : 'Błąd podczas importu projektu .atrview.');
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
      <div className="flex items-center flex-wrap gap-2">
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
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-medium text-zinc-300 hover:text-amber-400 transition"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span className="hidden lg:inline">Załaduj ROM</span>
        </button>

        {/* Import Group */}
        <div className="flex items-center bg-zinc-900/80 p-0.5 rounded-lg border border-zinc-800">
          <button
            onClick={() => atrviewInputRef.current?.click()}
            title="Wczytaj kompletny projekt Atari FontMaker (.atrview)"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded hover:bg-zinc-800 text-xs font-medium text-emerald-400 hover:text-emerald-300 transition"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>.atrview</span>
          </button>
          <span className="text-zinc-700">|</span>
          <button
            onClick={() => fntInputRef.current?.click()}
            title="Importuj pojedynczy plik binarny .fnt / .rom (1024B)"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded hover:bg-zinc-800 text-xs font-medium text-sky-400 hover:text-sky-300 transition"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>.fnt</span>
          </button>
        </div>

        <input
          ref={atrviewInputRef}
          type="file"
          accept=".atrview,.json"
          onChange={handleAtrViewFileChange}
          className="hidden"
        />
        <input
          ref={fntInputRef}
          type="file"
          accept=".fnt,.rom,.bin"
          onChange={handleFntFileChange}
          className="hidden"
        />

        {/* Export Group */}
        <div className="flex items-center bg-zinc-900/80 p-0.5 rounded-lg border border-zinc-800">
          <button
            onClick={handleExportAtrView}
            title="Zapisz kompletny projekt (.atrview) dla Atari FontMaker"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 hover:text-emerald-200 border border-emerald-500/30 text-xs font-medium transition"
          >
            <FileCode className="w-3.5 h-3.5 text-emerald-400" />
            <span>Zapisz .atrview</span>
          </button>
          <button
            onClick={handleExportFnt}
            title="Pobierz aktywny bank jako surowy plik .fnt (1024B)"
            className="flex items-center gap-1.5 px-3 py-1.5 ml-1 rounded-md bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-semibold text-xs shadow-lg shadow-amber-500/20 transition transform active:scale-95"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Pobierz .fnt</span>
          </button>
        </div>
      </div>
    </header>
  );
};
