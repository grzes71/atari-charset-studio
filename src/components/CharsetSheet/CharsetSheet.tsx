import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Grid, Eye } from 'lucide-react';
import { useAppStore } from '../../store/appStore';
import { CharsetSheetRenderer } from '../../core/renderers/CharsetSheetRenderer';

export const CharsetSheet: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const {
    banks,
    activeBankId,
    selectedCharIndex,
    setSelectedCharIndex,
    screenRows,
    selectedRowIndex,
    colorRegisters,
    isInverseActive,
    setIsInverseActive,
    revision,
  } = useAppStore();

  const activeBank = banks[activeBankId];
  const activeRowMode = screenRows[selectedRowIndex]?.mode || 2;
  const scale = 2; // Each 8x8 character is rendered as 16x16 px on canvas (total 256x128)

  const renderSheet = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !activeBank) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    CharsetSheetRenderer.render({
      ctx,
      bankData: activeBank.data,
      mode: activeRowMode,
      registers: colorRegisters,
      selectedIndex: selectedCharIndex,
      scale,
      isInverse: isInverseActive,
    });
  }, [activeBank, activeRowMode, colorRegisters, selectedCharIndex, isInverseActive, revision]);

  useEffect(() => {
    renderSheet();
  }, [renderSheet]);

  const getCharIndexFromEvent = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    const charSize = 8 * scale * (rect.width / (16 * 8 * scale));
    const col = Math.floor(clientX / charSize);
    const row = Math.floor(clientY / charSize);

    if (col >= 0 && col < 16 && row >= 0 && row < 8) {
      const idx = row * 16 + col;
      return idx >= 0 && idx < 128 ? idx : null;
    }
    return null;
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const idx = getCharIndexFromEvent(e);
    if (idx !== null) {
      setSelectedCharIndex(idx);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const idx = getCharIndexFromEvent(e);
    setHoverIndex(idx);
  };

  const handleMouseLeave = () => {
    setHoverIndex(null);
  };

  const displayIndex = hoverIndex !== null ? hoverIndex : selectedCharIndex;

  return (
    <div className="glass-panel rounded-xl p-4 flex flex-col gap-3 shadow-lg border border-zinc-800">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
        <div className="flex items-center gap-2">
          <Grid className="w-4 h-4 text-amber-400" />
          <h2 className="text-sm font-semibold text-zinc-100 uppercase tracking-wide">
            Zestaw Znaków (Bank 128 Glifów)
          </h2>
        </div>

        {/* Inverse toggle */}
        <button
          onClick={() => setIsInverseActive(!isInverseActive)}
          title="Przełącz podgląd z bitem inwersji (kody 128-255 / 5. kolor)"
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono font-medium transition border ${
            isInverseActive
              ? 'border-amber-400 bg-amber-500/20 text-amber-300'
              : 'border-zinc-700 bg-zinc-900 text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Eye className="w-3.5 h-3.5" />
          <span>Inwersja (+128)</span>
        </button>
      </div>

      {/* Canvas Sheet */}
      <div className="flex justify-center p-2 bg-zinc-950 rounded-lg border border-zinc-800/80 shadow-inner">
        <canvas
          ref={canvasRef}
          width={16 * 8 * scale}
          height={8 * 8 * scale}
          onClick={handleCanvasClick}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="cursor-pointer border border-zinc-800 hover:border-amber-500/40 rounded transition"
          style={{ width: '100%', maxWidth: '384px', imageRendering: 'pixelated' }}
        />
      </div>

      {/* Info Bar */}
      <div className="flex items-center justify-between bg-zinc-900/90 px-3 py-2 rounded-lg border border-zinc-800 text-xs font-mono">
        <div className="flex items-center gap-3">
          <span className="text-zinc-400">
            Znak:{' '}
            <strong className="text-amber-400 font-bold">#{displayIndex}</strong>
          </span>
          <span className="text-zinc-400">
            HEX:{' '}
            <strong className="text-sky-400">
              ${displayIndex.toString(16).toUpperCase().padStart(2, '0')}
            </strong>
          </span>
          <span className="text-zinc-400">
            Internal:{' '}
            <strong className="text-emerald-400">
              {displayIndex + (isInverseActive ? 128 : 0)}
            </strong>
          </span>
        </div>
        <div className="text-zinc-500 text-[11px]">
          {hoverIndex !== null ? 'Kliknij, aby edytować' : 'Wybrany do edycji'}
        </div>
      </div>

      {/* Character Category Quick Jump Buttons */}
      <div className="flex flex-wrap gap-1.5 pt-1 border-t border-zinc-800">
        {[
          { label: 'Spacje/Symbole (0-31)', start: 0 },
          { label: 'Cyfry (16-25)', start: 16 },
          { label: 'Litery A-Z (33-58)', start: 33 },
          { label: 'Litery a-z (97-122)', start: 97 },
          { label: 'Grafika (64-95)', start: 64 },
        ].map((cat) => (
          <button
            key={cat.label}
            onClick={() => setSelectedCharIndex(cat.start)}
            className="px-2 py-1 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-[11px] text-zinc-300 hover:text-amber-400 transition"
          >
            {cat.label}
          </button>
        ))}
      </div>
    </div>
  );
};
