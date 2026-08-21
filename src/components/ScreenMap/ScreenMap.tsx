import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  Tv,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Type,
  Brush,
  Layers,
  CheckCheck,
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
      className="cursor-crosshair block"
      style={{
        width: '640px',
        maxWidth: '100%',
        imageRendering: 'pixelated',
        height: `${height}px`,
      }}
    />
  );
};

export const ScreenMap: React.FC = () => {
  const [textInput, setTextInput] = useState('');
  const [viewTab, setViewTab] = useState<'screen' | 'displayList'>('screen');
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
    setAllRowsModeAndBank,
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

        {/* View Switch & Tools */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Tab View Toggle */}
          <div className="flex items-center bg-zinc-900 p-0.5 rounded-lg border border-zinc-800 text-xs">
            <button
              onClick={() => setViewTab('screen')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded transition font-medium ${
                viewTab === 'screen'
                  ? 'bg-zinc-800 text-amber-400 font-semibold shadow'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Tv className="w-3.5 h-3.5" />
              <span>Ekran CRT (Kompaktowy)</span>
            </button>
            <button
              onClick={() => setViewTab('displayList')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded transition font-medium ${
                viewTab === 'displayList'
                  ? 'bg-zinc-800 text-amber-400 font-semibold shadow'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Display List (Lista)</span>
            </button>
          </div>

          {/* Tools: Paint Mode / Text Mode */}
          <div className="flex items-center bg-zinc-900 p-0.5 rounded-lg border border-zinc-800">
            <button
              onClick={() => setScreenPaintMode('glyph')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition ${
                screenPaintMode === 'glyph'
                  ? 'bg-amber-500 text-zinc-950 font-bold shadow'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Brush className="w-3.5 h-3.5" />
              <span>Pędzel</span>
            </button>
            <button
              onClick={() => setScreenPaintMode('text')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition ${
                screenPaintMode === 'text'
                  ? 'bg-amber-500 text-zinc-950 font-bold shadow'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Type className="w-3.5 h-3.5" />
              <span>Tekst</span>
            </button>
          </div>

          <button
            onClick={() => addRow()}
            title="Dodaj nowy wiersz na końcu ekranu"
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-medium text-amber-400 transition"
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

      {/* VIEW TAB 1: COMPACT SEAMLESS SCREEN VIEW (ZERO GAPS BETWEEN ROWS) */}
      {viewTab === 'screen' && (
        <div className="flex flex-col bg-black/90 p-2.5 rounded-lg border border-zinc-800 shadow-inner overflow-x-auto items-center">
          <div className="flex border border-zinc-800 rounded bg-black overflow-hidden relative shadow-2xl">
            {/* Gutter / Row Numbers */}
            <div className="flex flex-col select-none bg-zinc-950/90 border-r border-zinc-800 shrink-0 w-11">
              {screenRows.map((row, idx) => {
                const rowHeight = (row.mode === 5 ? 16 : 8) * 2;
                const isSelected = selectedRowIndex === idx;
                return (
                  <button
                    key={row.id}
                    onClick={() => setSelectedCell(idx, selectedColIndex)}
                    title={`Wiersz #${idx} — Kliknij, aby wybrać (Tryb Antic ${row.mode})`}
                    style={{ height: `${rowHeight}px` }}
                    className={`flex items-center justify-between px-1 font-mono text-[9px] border-b border-zinc-900/50 transition-colors leading-none ${
                      isSelected
                        ? 'bg-amber-500 text-zinc-950 font-bold'
                        : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/60'
                    }`}
                  >
                    <span>{idx.toString().padStart(2, '0')}</span>
                    <span
                      className={`text-[8px] px-0.5 rounded font-mono ${
                        isSelected ? 'bg-zinc-950 text-amber-400' : 'text-zinc-600'
                      }`}
                    >
                      {row.mode === 5 ? 'A5' : row.mode === 4 ? 'A4' : 'A2'}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Seamless Canvas Stack (Strict 0px Vertical Gap) */}
            <div className="flex flex-col bg-black scanlines relative">
              {screenRows.map((row, idx) => {
                const isSelected = selectedRowIndex === idx;
                return (
                  <div
                    key={row.id}
                    onClick={() => setSelectedCell(idx, selectedColIndex)}
                    className={`relative leading-none block p-0 m-0 ${
                      isSelected ? 'ring-1 ring-inset ring-amber-400/70 z-10' : ''
                    }`}
                  >
                    <RowCanvas rowIndex={idx} />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* VIEW TAB 2: DETAILED DISPLAY LIST ROW EDITOR */}
      {viewTab === 'displayList' && (
        <div className="flex flex-col gap-1 max-h-[500px] overflow-y-auto pr-1 bg-black/70 p-2.5 rounded-lg border border-zinc-800 scanlines shadow-inner">
          {screenRows.map((row, idx) => (
            <div
              key={row.id}
              onClick={() => setSelectedCell(idx, selectedColIndex)}
              className={`flex items-center gap-2 p-1.5 rounded transition-colors ${
                selectedRowIndex === idx
                  ? 'bg-zinc-800/90 border border-amber-500/40 shadow'
                  : 'bg-zinc-950/60 border border-zinc-900 hover:border-zinc-800'
              }`}
            >
              {/* Row Number & Display List Controls */}
              <div className="flex items-center gap-1.5 w-56 shrink-0">
                <span className="font-mono text-[11px] text-zinc-400 w-5 text-right font-bold">
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
      )}

      {/* Active Row Inspector & Quick Actions Bar */}
      {activeRow && (
        <div className="flex flex-wrap items-center justify-between gap-3 bg-zinc-900/90 p-2.5 rounded-lg border border-zinc-800 text-xs">
          {/* Active Row Info & Mode/Bank Selectors */}
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-zinc-300 font-medium">
              Aktywny wiersz: <strong className="text-amber-400 font-mono">#{selectedRowIndex}</strong>{' '}
              <span className="text-zinc-500">(Kolumna {selectedColIndex})</span>
            </span>

            {/* Quick Mode Changer for Active Row */}
            <div className="flex items-center gap-1.5 bg-zinc-950 px-2 py-1 rounded border border-zinc-800">
              <span className="text-[11px] text-zinc-400 font-mono">Tryb ANTIC:</span>
              <select
                value={activeRow.mode}
                onChange={(e) => setRowMode(selectedRowIndex, Number(e.target.value) as AnticMode)}
                className="bg-zinc-900 border border-zinc-700 text-zinc-200 text-xs font-mono rounded px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
              >
                <option value={2}>Antic 2 (Hires 1.5-color, 8px)</option>
                <option value={4}>Antic 4 (Multi 4-color, 8px)</option>
                <option value={5}>Antic 5 (Multi 4-color, 16px)</option>
              </select>
            </div>

            {/* Quick Bank Changer for Active Row */}
            <div className="flex items-center gap-1.5 bg-zinc-950 px-2 py-1 rounded border border-zinc-800">
              <span className="text-[11px] text-zinc-400 font-mono">Bank:</span>
              <select
                value={activeRow.bankId}
                onChange={(e) => setRowBank(selectedRowIndex, e.target.value)}
                className="bg-zinc-900 border border-zinc-700 text-zinc-200 text-xs rounded px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
              >
                {Object.values(banks).map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Apply Mode & Bank to all rows */}
            <button
              onClick={() => setAllRowsModeAndBank(activeRow.mode, activeRow.bankId)}
              title={`Ustaw tryb Antic ${activeRow.mode} oraz bank "${banks[activeRow.bankId]?.name || activeRow.bankId}" dla wszystkich wierszy ekranu`}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 hover:text-amber-200 border border-amber-500/30 text-xs font-medium transition cursor-pointer"
            >
              <CheckCheck className="w-3.5 h-3.5 text-amber-400" />
              <span>Zastosuj dla wszystkich</span>
            </button>
          </div>

          {/* Row Action Buttons */}
          <div className="flex flex-wrap items-center gap-1.5">
            {/* Move Up/Down */}
            <button
              onClick={() => moveRow(selectedRowIndex, 'up')}
              disabled={selectedRowIndex === 0}
              title="Przenieś wiersz w górę"
              className="p-1 px-2 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 disabled:opacity-30 transition flex items-center gap-1"
            >
              <ArrowUp className="w-3.5 h-3.5" />
              <span className="text-[11px]">W górę</span>
            </button>
            <button
              onClick={() => moveRow(selectedRowIndex, 'down')}
              disabled={selectedRowIndex === screenRows.length - 1}
              title="Przenieś wiersz w dół"
              className="p-1 px-2 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 disabled:opacity-30 transition flex items-center gap-1"
            >
              <ArrowDown className="w-3.5 h-3.5" />
              <span className="text-[11px]">W dół</span>
            </button>

            {/* Insert Row After */}
            <button
              onClick={() => addRow(selectedRowIndex)}
              title="Wstaw wiersz poniżej bieżącego"
              className="p-1 px-2 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-amber-400 transition flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="text-[11px]">Wstaw pod spodem</span>
            </button>

            {/* Fill Row */}
            <button
              onClick={() => fillRow(selectedRowIndex, isInverseActive ? selectedCharIndex | 0x80 : selectedCharIndex)}
              className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-amber-400 transition"
              title="Wypełnij cały wiersz aktywnym znakiem"
            >
              Wypełnij #{selectedCharIndex}
            </button>

            {/* Clear Row */}
            <button
              onClick={() => clearRow(selectedRowIndex)}
              className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-red-400 transition"
              title="Wyczyść cały wiersz (spacje)"
            >
              Wyczyść
            </button>

            {/* Delete Row */}
            {screenRows.length > 1 && (
              <button
                onClick={() => deleteRow(selectedRowIndex)}
                title="Usuń ten wiersz"
                className="p-1 px-2 rounded bg-zinc-800 hover:bg-red-950/60 text-zinc-400 hover:text-red-400 border border-transparent hover:border-red-800/40 transition flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="text-[11px]">Usuń</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
