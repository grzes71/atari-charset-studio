import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  Trash2,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  FlipHorizontal,
  FlipVertical,
  Copy,
  ClipboardPaste,
  Sparkles,
  Eraser,
  PenTool,
} from 'lucide-react';
import { useAppStore } from '../../store/appStore';
import { GlyphRenderer } from '../../core/renderers/GlyphRenderer';
import { AnticMode, BitPair } from '../../types';
import { atariByteToHex } from '../../utils/atariColorLUT';

export const GlyphEditor: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawValue, setDrawValue] = useState<number | null>(null);
  const [hoverPixel, setHoverPixel] = useState<{ x: number; y: number } | null>(null);
  const [wrapShift, setWrapShift] = useState(true);

  const {
    banks,
    activeBankId,
    selectedCharIndex,
    screenRows,
    selectedRowIndex,
    setRowMode,
    colorRegisters,
    activeColorBitPair,
    setActiveColorBitPair,
    paintTool,
    setPaintTool,
    setGlyphPixel,
    clearGlyph,
    invertGlyph,
    shiftGlyph,
    flipGlyphHorizontal,
    flipGlyphVertical,
    copyGlyph,
    pasteGlyph,
    clipboard,
    snapshotHistory,
    revision,
  } = useAppStore();

  const activeBank = banks[activeBankId];
  const activeRowMode = screenRows[selectedRowIndex]?.mode || 2;
  const isMulticolor = activeRowMode !== 2;
  const cols = isMulticolor ? 4 : 8;
  const rows = 8;

  // Render magnified glyph
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !activeBank) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const offset = selectedCharIndex * 8;
    const glyphBytes = activeBank.data.subarray(offset, offset + 8);

    GlyphRenderer.render({
      ctx,
      glyphBytes,
      mode: activeRowMode,
      registers: colorRegisters,
      width: canvas.width,
      height: canvas.height,
      showGrid: true,
      hoverPixel,
    });

    // Render 1:1 and 2:1 mini preview
    const previewCanvas = previewCanvasRef.current;
    if (previewCanvas) {
      const pCtx = previewCanvas.getContext('2d');
      if (pCtx) {
        GlyphRenderer.render({
          ctx: pCtx,
          glyphBytes,
          mode: activeRowMode,
          registers: colorRegisters,
          width: previewCanvas.width,
          height: previewCanvas.height,
          showGrid: false,
        });
      }
    }
  }, [activeBank, selectedCharIndex, activeRowMode, colorRegisters, hoverPixel, revision]);

  useEffect(() => {
    renderCanvas();
  }, [renderCanvas]);

  // Pixel calculation from mouse event
  const getPixelCoordinates = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    const cellWidth = rect.width / cols;
    const cellHeight = rect.height / rows;

    const x = Math.floor(clientX / cellWidth);
    const y = Math.floor(clientY / cellHeight);

    if (x >= 0 && x < cols && y >= 0 && y < rows) {
      return { x, y };
    }
    return null;
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const coords = getPixelCoordinates(e);
    if (!coords) return;

    snapshotHistory();
    setIsDrawing(true);

    // Left click draws selected color, Right click acts as eraser/background
    let val: number;
    if (e.button === 2 || paintTool === 'erase') {
      val = 0;
    } else {
      val = isMulticolor ? activeColorBitPair : 1;
    }

    setDrawValue(val);
    setGlyphPixel(coords.x, coords.y, val);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const coords = getPixelCoordinates(e);
    setHoverPixel(coords);

    if (isDrawing && coords && drawValue !== null) {
      setGlyphPixel(coords.x, coords.y, drawValue);
    }
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
    setDrawValue(null);
  };

  const handleMouseLeave = () => {
    setIsDrawing(false);
    setDrawValue(null);
    setHoverPixel(null);
  };

  return (
    <div className="glass-panel rounded-xl p-4 flex flex-col gap-4 shadow-lg border border-zinc-800">
      {/* Header with Title & Char info */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
        <div className="flex items-center gap-2">
          <PenTool className="w-4 h-4 text-amber-400" />
          <h2 className="text-sm font-semibold text-zinc-100 uppercase tracking-wide">
            Edytor Znaku #{selectedCharIndex}
          </h2>
          <span className="font-mono text-xs px-2 py-0.5 rounded bg-zinc-800 text-amber-400 border border-zinc-700">
            ${selectedCharIndex.toString(16).toUpperCase().padStart(2, '0')}
          </span>
        </div>

        {/* Mini Preview Box */}
        <div className="flex items-center gap-2 bg-zinc-900 px-2 py-1 rounded-lg border border-zinc-800">
          <span className="text-[10px] text-zinc-400 font-mono">Podgląd:</span>
          <canvas
            ref={previewCanvasRef}
            width={32}
            height={32}
            className="border border-zinc-700 rounded bg-black"
          />
        </div>
      </div>

      {/* Mode Switcher Tabs */}
      <div className="flex items-center justify-between bg-zinc-900/90 p-1.5 rounded-lg border border-zinc-800">
        <span className="text-xs text-zinc-400 font-medium ml-1">Tryb ANTIC:</span>
        <div className="flex items-center gap-1">
          {[
            { mode: 2, label: 'Antic 2 (Hires 8x8)', desc: '1 bit / piksel (2 kolory)' },
            { mode: 4, label: 'Antic 4 (Multi 4x8)', desc: '2 bity / piksel (do 5 kolorów)' },
            { mode: 5, label: 'Antic 5 (Double 4x16)', desc: '2 bity / piksel (podwójna wysokość)' },
          ].map((m) => (
            <button
              key={m.mode}
              onClick={() => setRowMode(selectedRowIndex, m.mode as AnticMode)}
              title={m.desc}
              className={`px-2.5 py-1 rounded text-xs font-mono font-medium transition ${
                activeRowMode === m.mode
                  ? 'bg-amber-500 text-zinc-950 font-bold shadow'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
              }`}
            >
              {m.label.split(' ')[0]} {m.label.split(' ')[1]}
            </button>
          ))}
        </div>
      </div>

      {/* Main Drawing Canvas & Color Palette for Multicolor */}
      <div className="flex flex-col items-center gap-3">
        <div className="relative group">
          <canvas
            ref={canvasRef}
            width={288}
            height={288}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
            onContextMenu={(e) => e.preventDefault()}
            className="border-2 border-zinc-700 hover:border-amber-500/60 rounded-lg shadow-2xl bg-zinc-950 cursor-crosshair transition-colors"
          />
          <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-zinc-900/90 border border-zinc-700 text-[10px] font-mono text-zinc-400 pointer-events-none">
            {isMulticolor ? '4x8 (2bpp)' : '8x8 (1bpp)'}
          </div>
        </div>

        {/* Color / Bit pair selector */}
        {isMulticolor ? (
          <div className="w-full bg-zinc-900/90 p-2 rounded-lg border border-zinc-800 flex items-center justify-between gap-2">
            <span className="text-xs text-zinc-400 font-medium">Para bitów / Kolor:</span>
            <div className="flex items-center gap-1.5">
              {[
                { pair: 0, label: '00', reg: colorRegisters.COLBAK, name: 'COLBAK' },
                { pair: 1, label: '01', reg: colorRegisters.COLPF0, name: 'COLPF0' },
                { pair: 2, label: '10', reg: colorRegisters.COLPF1, name: 'COLPF1' },
                { pair: 3, label: '11', reg: colorRegisters.COLPF2, name: 'COLPF2' },
              ].map(({ pair, label, reg, name }) => (
                <button
                  key={pair}
                  onClick={() => {
                    setActiveColorBitPair(pair as BitPair);
                    setPaintTool('draw');
                  }}
                  className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs font-mono font-bold transition border ${
                    activeColorBitPair === pair && paintTool === 'draw'
                      ? 'border-amber-400 ring-2 ring-amber-500/40 bg-zinc-800'
                      : 'border-zinc-700 hover:border-zinc-600 bg-zinc-950'
                  }`}
                  title={`${name} ($${reg.toString(16).toUpperCase()})`}
                >
                  <span
                    className="w-3.5 h-3.5 rounded-full border border-white/20 shadow-sm"
                    style={{ backgroundColor: atariByteToHex(reg) }}
                  />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="w-full bg-zinc-900/90 p-2 rounded-lg border border-zinc-800 flex items-center justify-between text-xs">
            <span className="text-zinc-400">Tryb Hires (Antic 2):</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPaintTool('draw')}
                className={`flex items-center gap-1 px-2 py-1 rounded border font-medium ${
                  paintTool === 'draw'
                    ? 'border-amber-400 bg-zinc-800 text-amber-300'
                    : 'border-zinc-700 text-zinc-400'
                }`}
              >
                <PenTool className="w-3 h-3" /> Piksel
              </button>
              <button
                onClick={() => setPaintTool('erase')}
                className={`flex items-center gap-1 px-2 py-1 rounded border font-medium ${
                  paintTool === 'erase'
                    ? 'border-amber-400 bg-zinc-800 text-amber-300'
                    : 'border-zinc-700 text-zinc-400'
                }`}
              >
                <Eraser className="w-3 h-3" /> Gumka
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Editing Toolbar */}
      <div className="flex flex-col gap-2 pt-2 border-t border-zinc-800">
        <div className="flex items-center justify-between text-xs text-zinc-400">
          <span className="font-semibold uppercase tracking-wider text-[11px]">Narzędzia Glifu</span>
          <label className="flex items-center gap-1.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={wrapShift}
              onChange={(e) => setWrapShift(e.target.checked)}
              className="rounded bg-zinc-800 border-zinc-700 text-amber-500 focus:ring-amber-500 w-3.5 h-3.5"
            />
            <span>Zawijaj (Wrap)</span>
          </label>
        </div>

        {/* Direction shifts */}
        <div className="grid grid-cols-4 gap-1.5">
          <button
            onClick={() => shiftGlyph('up', wrapShift)}
            title="Przesuń w górę"
            className="flex items-center justify-center p-2 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-amber-400 transition"
          >
            <ArrowUp className="w-4 h-4" />
          </button>
          <button
            onClick={() => shiftGlyph('down', wrapShift)}
            title="Przesuń w dół"
            className="flex items-center justify-center p-2 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-amber-400 transition"
          >
            <ArrowDown className="w-4 h-4" />
          </button>
          <button
            onClick={() => shiftGlyph('left', wrapShift)}
            title="Przesuń w lewo"
            className="flex items-center justify-center p-2 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-amber-400 transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => shiftGlyph('right', wrapShift)}
            title="Przesuń w prawo"
            className="flex items-center justify-center p-2 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-amber-400 transition"
          >
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Flips, Invert, Clear, Copy/Paste */}
        <div className="grid grid-cols-3 gap-1.5">
          <button
            onClick={flipGlyphHorizontal}
            title="Odbicie lustrzane w poziomie"
            className="flex items-center justify-center gap-1 py-1.5 px-2 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-medium text-zinc-300 hover:text-amber-400 transition"
          >
            <FlipHorizontal className="w-3.5 h-3.5" />
            <span>Odbij H</span>
          </button>
          <button
            onClick={flipGlyphVertical}
            title="Odbicie lustrzane w pionie"
            className="flex items-center justify-center gap-1 py-1.5 px-2 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-medium text-zinc-300 hover:text-amber-400 transition"
          >
            <FlipVertical className="w-3.5 h-3.5" />
            <span>Odbij V</span>
          </button>
          <button
            onClick={invertGlyph}
            title="Odwróć bity znaku"
            className="flex items-center justify-center gap-1 py-1.5 px-2 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-medium text-zinc-300 hover:text-amber-400 transition"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Odwróć</span>
          </button>
        </div>

        <div className="grid grid-cols-3 gap-1.5">
          <button
            onClick={copyGlyph}
            title="Kopiuj znak do schowka"
            className="flex items-center justify-center gap-1 py-1.5 px-2 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-medium text-zinc-300 hover:text-sky-400 transition"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Kopiuj</span>
          </button>
          <button
            onClick={pasteGlyph}
            disabled={!clipboard}
            title="Wklej znak ze schowka"
            className="flex items-center justify-center gap-1 py-1.5 px-2 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-medium text-zinc-300 hover:text-sky-400 disabled:opacity-30 disabled:cursor-not-allowed transition"
          >
            <ClipboardPaste className="w-3.5 h-3.5" />
            <span>Wklej</span>
          </button>
          <button
            onClick={clearGlyph}
            title="Wyczyść cały znak"
            className="flex items-center justify-center gap-1 py-1.5 px-2 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-medium text-zinc-300 hover:text-red-400 transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Wyczyść</span>
          </button>
        </div>
      </div>
    </div>
  );
};
