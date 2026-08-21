import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Grid } from 'lucide-react';
import { useAppStore } from '../../store/appStore';
import { CharsetSheetRenderer, CharsetViewRange } from '../../core/renderers/CharsetSheetRenderer';
import { atariByteToHex } from '../../utils/atariColorLUT';

export const CharsetSheet: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoverCode, setHoverCode] = useState<number | null>(null);
  const [viewRange, setViewRange] = useState<CharsetViewRange>('standard');

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
  const isMulticolor = activeRowMode !== 2;
  const scale = 2;

  const isFull256 = viewRange === 'full256';
  const totalRows = isFull256 ? 16 : 8;

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
      viewRange,
      isInverseActive,
    });
  }, [activeBank, activeRowMode, colorRegisters, selectedCharIndex, viewRange, isInverseActive, revision]);

  useEffect(() => {
    renderSheet();
  }, [renderSheet]);

  const getCharCodeFromEvent = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    const cellWidth = rect.width / 16;
    const cellHeight = rect.height / totalRows;

    const col = Math.floor(clientX / cellWidth);
    const row = Math.floor(clientY / cellHeight);

    if (col >= 0 && col < 16 && row >= 0 && row < totalRows) {
      const idx = row * 16 + col;
      if (viewRange === 'inverse') {
        return idx + 128;
      }
      return idx; // 0..127 or 0..255 for full256
    }
    return null;
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const code = getCharCodeFromEvent(e);
    if (code !== null) {
      const glyphIndex = code % 128;
      const isInv = code >= 128;
      setSelectedCharIndex(glyphIndex);
      setIsInverseActive(isInv);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const code = getCharCodeFromEvent(e);
    setHoverCode(code);
  };

  const handleMouseLeave = () => {
    setHoverCode(null);
  };

  const activeDisplayCode = hoverCode !== null
    ? hoverCode
    : (selectedCharIndex + (isInverseActive || viewRange === 'inverse' ? 128 : 0));

  const activeGlyphIndex = activeDisplayCode % 128;
  const isDisplayInverse = activeDisplayCode >= 128;

  // Active color for pair 11
  const pair11Register = isDisplayInverse ? 'COLPF3' : 'COLPF2';
  const pair11Color = isDisplayInverse ? colorRegisters.COLPF3 : colorRegisters.COLPF2;

  return (
    <div className="glass-panel rounded-xl p-4 flex flex-col gap-3 shadow-lg border border-zinc-800">
      {/* Header with Title & Range Switcher Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800 pb-2.5">
        <div className="flex items-center gap-2">
          <Grid className="w-4 h-4 text-amber-400" />
          <h2 className="text-sm font-semibold text-zinc-100 uppercase tracking-wide">
            Zestaw Znaków i Paleta
          </h2>
        </div>

        {/* View Range Tabs */}
        <div className="flex items-center bg-zinc-900/90 p-1 rounded-lg border border-zinc-800">
          <button
            onClick={() => {
              setViewRange('standard');
              setIsInverseActive(false);
            }}
            title={isMulticolor ? 'Znaki 0-127: Para 11 -> COLPF2' : 'Znaki 0-127: Normalny'}
            className={`px-2.5 py-1 rounded text-xs font-mono font-medium transition ${
              viewRange === 'standard'
                ? 'bg-amber-500 text-zinc-950 font-bold shadow'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            0–127 {isMulticolor ? '(COLPF2)' : '(Norm)'}
          </button>
          <button
            onClick={() => {
              setViewRange('inverse');
              setIsInverseActive(true);
            }}
            title={isMulticolor ? 'Znaki 128-255: Para 11 -> COLPF3 (5. Kolor)' : 'Znaki 128-255: Inwersja wideo'}
            className={`px-2.5 py-1 rounded text-xs font-mono font-medium transition ${
              viewRange === 'inverse'
                ? 'bg-amber-500 text-zinc-950 font-bold shadow'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            128–255 {isMulticolor ? '(5. Kolor COLPF3)' : '(Inwersja)'}
          </button>
          <button
            onClick={() => setViewRange('full256')}
            title="Pełny zestaw 256 kodów ekranowych (0-127 + 128-255)"
            className={`px-2.5 py-1 rounded text-xs font-mono font-medium transition ${
              viewRange === 'full256'
                ? 'bg-amber-500 text-zinc-950 font-bold shadow'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Wszystkie 256
          </button>
        </div>
      </div>

      {/* Mode & Palette Indicator */}
      <div className="flex items-center justify-between text-xs px-2 py-1 bg-zinc-900/60 rounded border border-zinc-800/60 font-mono">
        <span className="text-zinc-400">
          Tryb:{' '}
          <strong className="text-amber-400 font-bold">
            {activeRowMode === 2 ? 'Antic 2 (Hires)' : activeRowMode === 4 ? 'Antic 4 (Multicolor)' : 'Antic 5 (Double)'}
          </strong>
        </span>

        {isMulticolor ? (
          <div className="flex items-center gap-2 text-[11px]">
            <span className="text-zinc-400">Para "11" wyświetla:</span>
            <span className="flex items-center gap-1 font-bold text-zinc-200">
              <span
                className="w-3 h-3 rounded-full border border-white/20"
                style={{ backgroundColor: atariByteToHex(pair11Color) }}
              />
              <span className={isDisplayInverse ? 'text-fuchsia-400' : 'text-sky-400'}>
                {pair11Register} (${pair11Color.toString(16).toUpperCase()})
                {isDisplayInverse ? ' [5. Kolor]' : ''}
              </span>
            </span>
          </div>
        ) : (
          <span className="text-[11px] text-zinc-400">
            Stan:{' '}
            <strong className={isDisplayInverse ? 'text-amber-400' : 'text-zinc-300'}>
              {isDisplayInverse ? 'Inwersja Wideo (Odwrócone tło/znak)' : 'Normalny'}
            </strong>
          </span>
        )}
      </div>

      {/* Canvas Sheet */}
      <div className="flex justify-center p-2 bg-zinc-950 rounded-lg border border-zinc-800/80 shadow-inner">
        <canvas
          ref={canvasRef}
          width={16 * 8 * scale}
          height={totalRows * 8 * scale}
          onClick={handleCanvasClick}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="cursor-pointer border border-zinc-800 hover:border-amber-500/40 rounded transition"
          style={{
            width: '100%',
            maxWidth: isFull256 ? '420px' : '384px',
            imageRendering: 'pixelated',
          }}
        />
      </div>

      {/* Info Bar */}
      <div className="flex items-center justify-between bg-zinc-900/90 px-3 py-2 rounded-lg border border-zinc-800 text-xs font-mono">
        <div className="flex items-center gap-3">
          <span className="text-zinc-400">
            Kod Ekranowy:{' '}
            <strong className="text-amber-400 font-bold">#{activeDisplayCode}</strong>
          </span>
          <span className="text-zinc-400">
            HEX:{' '}
            <strong className="text-sky-400">
              ${activeDisplayCode.toString(16).toUpperCase().padStart(2, '0')}
            </strong>
          </span>
          <span className="text-zinc-400">
            Glif:{' '}
            <strong className="text-emerald-400">#{activeGlyphIndex}</strong>
          </span>
        </div>
        <div className="text-zinc-500 text-[11px]">
          {hoverCode !== null ? 'Kliknij, aby wybrać' : 'Aktywny znak'}
        </div>
      </div>

      {/* Quick Jump Category Buttons */}
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
            onClick={() => {
              setSelectedCharIndex(cat.start);
              if (viewRange === 'inverse') {
                setIsInverseActive(true);
              }
            }}
            className="px-2 py-1 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-[11px] text-zinc-300 hover:text-amber-400 transition"
          >
            {cat.label}
          </button>
        ))}
      </div>
    </div>
  );
};
