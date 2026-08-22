import React, { useState } from 'react';
import { Palette, Sliders } from 'lucide-react';
import { useAppStore } from '../../store/appStore';
import { ColorRegisters } from '../../types';
import {
  atariByteToHex,
  getHue,
  getLuma,
  ATARI_HUE_NAMES,
  LUMA_STEPS,
} from '../../utils/atariColorLUT';

export const ColorPalette: React.FC = () => {
  const {
    colorRegisters,
    setColorRegister,
    paletteApplyMode,
    setPaletteApplyMode,
    applyCurrentPalette,
    selectedRowIndex,
    screenRows,
    banks,
  } = useAppStore();
  const [activeReg, setActiveReg] = useState<keyof ColorRegisters>('COLPF2');

  const currentVal = colorRegisters[activeReg];
  const currentHue = getHue(currentVal);
  const currentLuma = getLuma(currentVal);

  const activeRow = screenRows[selectedRowIndex];
  const activeBank = activeRow ? banks[activeRow.bankId] : null;

  const registersList: { key: keyof ColorRegisters; label: string; desc: string }[] = [
    { key: 'COLBAK', label: 'COLBAK ($00)', desc: 'Tło (Background / Bit 00)' },
    { key: 'COLPF0', label: 'COLPF0 ($01)', desc: 'Kolor pola 0 (Bit 01)' },
    { key: 'COLPF1', label: 'COLPF1 ($02)', desc: 'Kolor pola 1 (Bit 10)' },
    { key: 'COLPF2', label: 'COLPF2 ($03)', desc: 'Kolor pola 2 (Bit 11 / Hires)' },
    { key: 'COLPF3', label: 'COLPF3 ($04)', desc: 'Kolor pola 3 (5. kolor)' },
  ];

  // Presets
  const applyPreset = (preset: ColorRegisters) => {
    Object.entries(preset).forEach(([key, val]) => {
      setColorRegister(key as keyof ColorRegisters, val);
    });
  };

  const presets: { name: string; registers: ColorRegisters }[] = [
    {
      name: 'Klasyczny Atari Blue',
      registers: { COLBAK: 0x90, COLPF0: 0x28, COLPF1: 0x9a, COLPF2: 0x94, COLPF3: 0x46 },
    },
    {
      name: 'Retro Dark Studio',
      registers: { COLBAK: 0x00, COLPF0: 0x28, COLPF1: 0xca, COLPF2: 0x94, COLPF3: 0x46 },
    },
    {
      name: 'Green Phosphor Matrix',
      registers: { COLBAK: 0x00, COLPF0: 0xc4, COLPF1: 0xcc, COLPF2: 0xca, COLPF3: 0xce },
    },
    {
      name: 'Amber CRT',
      registers: { COLBAK: 0x00, COLPF0: 0x14, COLPF1: 0x1c, COLPF2: 0x18, COLPF3: 0x26 },
    },
  ];

  return (
    <div className="glass-panel rounded-xl p-4 flex flex-col gap-4 shadow-lg border border-zinc-800">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 pb-2.5">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Palette className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-semibold text-zinc-100 uppercase tracking-wide">
              Rejestry Kolorów Atari (GTIA)
            </h2>
          </div>

          {/* Palette Scope Dropdown Selector */}
          <div className="flex items-center gap-1.5 bg-zinc-900 px-2.5 py-1 rounded-lg border border-zinc-700 shadow-sm">
            <span className="text-xs font-semibold text-amber-400 whitespace-nowrap">
              Paleta:
            </span>
            <select
              value={paletteApplyMode}
              onChange={(e) => {
                const mode = e.target.value as 'currentRow' | 'all' | 'bankRows';
                setPaletteApplyMode(mode);
                applyCurrentPalette(mode);
              }}
              className="bg-zinc-950 border border-zinc-700 text-zinc-100 text-xs font-medium rounded px-2 py-0.5 focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
              title="Wybierz tryb zastosowania palety kolorów"
            >
              <option value="currentRow">dla aktualnej linii</option>
              <option value="all">dla całości</option>
              <option value="bankRows">dla wierszy tego banku</option>
            </select>

            <span className="text-[10px] text-zinc-400 font-mono hidden md:inline ml-1">
              {paletteApplyMode === 'currentRow' && `(#${selectedRowIndex})`}
              {paletteApplyMode === 'all' && `(wszystkie ${screenRows.length})`}
              {paletteApplyMode === 'bankRows' && activeBank && `(${activeBank.name})`}
            </span>
          </div>
        </div>

        {/* Preset selector */}
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-zinc-400">Presety:</span>
          {presets.map((p) => (
            <button
              key={p.name}
              onClick={() => applyPreset(p.registers)}
              className="px-2 py-0.5 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-[10px] text-zinc-300 hover:text-amber-400 transition"
              title={p.name}
            >
              {p.name.split(' ')[0]}
            </button>
          ))}
        </div>
      </div>

      {/* Registers Selection Buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {registersList.map(({ key, desc }) => {
          const val = colorRegisters[key];
          const hex = atariByteToHex(val);
          const isSelected = activeReg === key;

          return (
            <button
              key={key}
              onClick={() => setActiveReg(key)}
              className={`flex flex-col p-2 rounded-lg border text-left transition ${
                isSelected
                  ? 'border-amber-400 bg-amber-500/10 ring-1 ring-amber-500/30'
                  : 'border-zinc-800 bg-zinc-900/80 hover:border-zinc-700'
              }`}
            >
              <div className="flex items-center justify-between gap-1 mb-1">
                <span className="font-mono font-bold text-xs text-zinc-200">{key}</span>
                <span className="font-mono text-[11px] text-amber-400">
                  ${val.toString(16).toUpperCase().padStart(2, '0')}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className="w-full h-5 rounded border border-white/20 shadow-inner"
                  style={{ backgroundColor: hex }}
                />
              </div>
              <span className="text-[9px] text-zinc-400 mt-1 truncate">{desc}</span>
            </button>
          );
        })}
      </div>

      {/* Active Register Palette Picker Grid (16 Hues x 16 Lumas) */}
      <div className="bg-zinc-900/90 p-3 rounded-lg border border-zinc-800 flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-zinc-300 font-medium flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-amber-400" />
            Edycja <strong className="text-amber-400">{activeReg}</strong>: Hue{' '}
            <strong className="text-sky-400">{ATARI_HUE_NAMES[currentHue]} (${currentHue.toString(16).toUpperCase()})</strong>, Luma{' '}
            <strong className="text-emerald-400">${currentLuma.toString(16).toUpperCase()}</strong>
          </span>
          <span className="font-mono text-zinc-400">
            Wartość: ${currentVal.toString(16).toUpperCase().padStart(2, '0')} (Dec {currentVal})
          </span>
        </div>

        {/* 16 x 8 Color Grid (Tylko parzyste luminancje) */}
        <div className="grid grid-cols-16 gap-0.5 p-1.5 bg-black rounded border border-zinc-800 overflow-x-auto">
          {Array.from({ length: 16 }).map((_, hue) => (
            <div key={hue} className="flex flex-col gap-0.5">
              {LUMA_STEPS.map((luma) => {
                const atariByte = ((hue & 0x0f) << 4) | luma;
                const hex = atariByteToHex(atariByte);
                const isCurrent = (currentVal & 0xfe) === atariByte;

                return (
                  <button
                    key={luma}
                    onClick={() => setColorRegister(activeReg, atariByte)}
                    title={`Hue: ${hue} (${ATARI_HUE_NAMES[hue]}), Luma: $${luma.toString(16).toUpperCase()} ($${atariByte.toString(16).toUpperCase().padStart(2, '0')})`}
                    className={`w-4 h-4 sm:w-5 sm:h-5 rounded-xs transition-transform hover:scale-125 hover:z-10 relative ${
                      isCurrent ? 'ring-2 ring-white z-20 scale-110 shadow-lg' : ''
                    }`}
                    style={{ backgroundColor: hex }}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
