import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  Tv,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Type,
  Brush,
} from 'lucide-react';
import { useAppStore } from '../../store/appStore';
import { ScreenMapRenderer } from '../../core/renderers/ScreenMapRenderer';
import { AnticMode } from '../../types';

interface RowCanvasProps {
  rowIndex: number;
}

const RowCanvas: React.FC<RowCanvasProps> = ({ rowIndex }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isPainting, setIsPainting] = useState(false);

  const {
    screenRows,
    banks,
    colorRegisters,
    selectedCharIndex,
    isInverseActive,
    selectedRowIndex,
    selectedColIndex,
    setSelectedCell,
    setScreenChar,
    screenPaintMode,
    revision,
    snapshotHistory,
  } = useAppStore();

  const row = screenRows[rowIndex];
  const bank = banks[row?.bankId] || Object.values(banks)[0];
  const isSelectedRow = selectedRowIndex === rowIndex;
  const scale = 2;

  const renderRow = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !row || !bank) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ScreenMapRenderer.renderRow({
      ctx,
      row,
      bank,
      registers: colorRegisters,
      scale,
      selectedCol: isSelectedRow ? selectedColIndex : null,
      cursorVisible: isSelectedRow,
    });
  }, [row, bank, colorRegisters, isSelectedRow, selectedColIndex, revision]);

  useEffect(() => {
    renderRow();
  }, [renderRow]);

  const getColFromEvent = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const colWidth = rect.width / 40;
    const col = Math.floor(clientX / colWidth);
    return col >= 0 && col < 40 ? col : null;
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const col = getColFromEvent(e);
    if (col === null) return;

    setSelectedCell(rowIndex, col);
    snapshotHistory();
    setIsPainting(true);

    if (screenPaintMode === 'glyph') {
      const charCode = isInverseActive ? selectedCharIndex | 0x80 : selectedCharIndex;
      setScreenChar(rowIndex, col, charCode);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isPainting || screenPaintMode !== 'glyph') return;
    const col = getColFromEvent(e);
    if (col === null) return;

    setSelectedCell(rowIndex, col);
    const charCode = isInverseActive ? selectedCharIndex | 0x80 : selectedCharIndex;
    setScreenChar(rowIndex, col, charCode);
  };

  const handleMouseUp = () => setIsPainting(false);
  const handleMouseLeave = () => setIsPainting(false);

  if (!row || !bank) return null;

  const height = (row.mode === 5 ? 16 : 8) * scale;
  const width = 40 * 8 * scale; // 640px

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      className={`cursor-crosshair rounded-xs transition-all ${
        isSelectedRow ? 'ring-1 ring-amber-500/50 shadow-md' : ''
      }`}
      style={{
        width: '100%',
        maxWidth: '640px',
        imageRendering: 'pixelated',
        height: `${height}px`,
      }}
    />
  );
};

export const ScreenMap: React.FC = () => {
  const [textInput, setTextInput] = useState('');
  const {
    screenRows,
    banks,
    selectedRowIndex,
    selectedColIndex,
    setSelectedCell,
    setRowMode,
    setRowBank,
    addRow,
    deleteRow,
    moveRow,
    clearRow,
    fillRow,
    selectedCharIndex,
    isInverseActive,
    screenPaintMode,
    setScreenPaintMode,
    typeScreenText,
  } = useAppStore();

  const activeRow = screenRows[selectedRowIndex];

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (textInput) {
      typeScreenText(textInput);
      setTextInput('');
    }
  };

  return (
    <div className="glass-panel rounded-xl p-4 flex flex-col gap-4 shadow-lg border border-zinc-800">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 pb-3">
        <div className="flex items-center gap-2">
          <Tv className="w-4 h-4 text-amber-400" />
          <h2 className="text-sm font-semibold text-zinc-100 uppercase tracking-wide">
            Mapa Ekranu (Display List & Screen View)
          </h2>
          <span className="font-mono text-xs px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
            {screenRows.length} wierszy (40 kolumn)
          </span>
        </div>

        {/* Tools: Paint Mode / Text Mode */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-zinc-900 p-1 rounded-lg border border-zinc-800">
            <button
              onClick={() => setScreenPaintMode('glyph')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition ${
                screenPaintMode === 'glyph'
                  ? 'bg-amber-500 text-zinc-950 font-bold shadow'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Brush className="w-3.5 h-3.5" />
              <span>Pędzel Glifu</span>
            </button>
            <button
              onClick={() => setScreenPaintMode('text')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition ${
                screenPaintMode === 'text'
                  ? 'bg-amber-500 text-zinc-950 font-bold shadow'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Type className="w-3.5 h-3.5" />
              <span>Wpisywanie Tekstu</span>
            </button>
          </div>

          <button
            onClick={() => addRow()}
            title="Dodaj nowy wiersz na końcu ekranu"
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-medium text-amber-400 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Dodaj Wiersz</span>
          </button>
        </div>
      </div>

      {/* Text Input Bar (when text mode active) */}
      {screenPaintMode === 'text' && (
        <form
          onSubmit={handleTextSubmit}
          className="flex items-center gap-2 bg-zinc-900/90 p-2.5 rounded-lg border border-amber-500/30"
        >
          <span className="text-xs text-amber-400 font-mono font-semibold whitespace-nowrap">
            Wpisz tekst do wiersza #{selectedRowIndex} (od kolumny {selectedColIndex}):
          </span>
          <input
            type="text"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder="Wpisz tekst..."
            className="flex-1 bg-zinc-950 border border-zinc-700 rounded px-3 py-1 text-xs text-zinc-100 focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono"
            autoFocus
          />
          <button
            type="submit"
            className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold rounded transition"
          >
            Wstaw
          </button>
        </form>
      )}

      {/* Screen Rows Container (Display List Rows) */}
      <div className="flex flex-col gap-1.5 max-h-[520px] overflow-y-auto pr-1 bg-black/70 p-3 rounded-lg border border-zinc-800 scanlines shadow-inner">
        {screenRows.map((row, idx) => (
          <div
            key={row.id}
            onClick={() => setSelectedCell(idx, selectedColIndex)}
            className={`flex items-center gap-2 p-1.5 rounded-md transition-colors ${
              selectedRowIndex === idx
                ? 'bg-zinc-800/90 border border-amber-500/40 shadow'
                : 'bg-zinc-950/60 border border-zinc-900 hover:border-zinc-800'
            }`}
          >
            {/* Row Number & Display List Controls */}
            <div className="flex items-center gap-1.5 w-52 shrink-0">
              <span className="font-mono text-[11px] text-zinc-500 w-5 text-right font-bold">
                {idx}
              </span>

              {/* Mode Selector */}
              <select
                value={row.mode}
                onChange={(e) => setRowMode(idx, Number(e.target.value) as AnticMode)}
                className="bg-zinc-900 border border-zinc-700 text-zinc-200 text-[11px] font-mono rounded px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
                title="Wybierz tryb graficzny ANTIC dla tego wiersza"
              >
                <option value={2}>Antic 2 (Hires)</option>
                <option value={4}>Antic 4 (Multi)</option>
                <option value={5}>Antic 5 (Double)</option>
              </select>

              {/* Bank Selector */}
              <select
                value={row.bankId}
                onChange={(e) => setRowBank(idx, e.target.value)}
                className="bg-zinc-900 border border-zinc-700 text-zinc-300 text-[10px] rounded px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer max-w-[70px] truncate"
                title="Wybierz zestaw znaków dla tego wiersza"
              >
                {Object.values(banks).map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>

              {/* Row Management Buttons */}
              <div className="flex items-center gap-0.5">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    moveRow(idx, 'up');
                  }}
                  disabled={idx === 0}
                  title="Przenieś wiersz w górę"
                  className="p-1 text-zinc-500 hover:text-zinc-200 disabled:opacity-20 transition"
                >
                  <ArrowUp className="w-3 h-3" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    moveRow(idx, 'down');
                  }}
                  disabled={idx === screenRows.length - 1}
                  title="Przenieś wiersz w dół"
                  className="p-1 text-zinc-500 hover:text-zinc-200 disabled:opacity-20 transition"
                >
                  <ArrowDown className="w-3 h-3" />
                </button>
                {screenRows.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteRow(idx);
                    }}
                    title="Usuń ten wiersz"
                    className="p-1 text-zinc-500 hover:text-red-400 transition"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            {/* Row Canvas Render */}
            <div className="flex-1 flex justify-center overflow-x-auto">
              <RowCanvas rowIndex={idx} />
            </div>
          </div>
        ))}
      </div>

      {/* Row Quick Action Toolbar */}
      {activeRow && (
        <div className="flex flex-wrap items-center justify-between gap-2 bg-zinc-900/80 p-2 rounded-lg border border-zinc-800 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-zinc-400">
              Aktywny wiersz: <strong className="text-amber-400">#{selectedRowIndex}</strong> (Kolumna {selectedColIndex})
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => fillRow(selectedRowIndex, isInverseActive ? selectedCharIndex | 0x80 : selectedCharIndex)}
              className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-amber-400 transition"
              title="Wypełnij cały wiersz aktywnym znakiem"
            >
              Wypełnij znakiem #{selectedCharIndex}
            </button>
            <button
              onClick={() => clearRow(selectedRowIndex)}
              className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-red-400 transition"
              title="Wyczyść cały wiersz (spacje)"
            >
              Wyczyść wiersz
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
