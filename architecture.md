Na podstawie dostarczonej specyfikacji, oto proponowana **architektura aplikacji Atari 8-bit Charset Studio** w formie szczegółowego diagramu i opisu warstw.

## 🏛️ Architektura Warstwowa (Layered Architecture)

```
┌─────────────────────────────────────────────────────────────────────┐
│                         UI Layer (React)                          │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ │
│  │   Toolbar   │ │ Glyph Editor│ │ Charset     │ │ Screen Map  │ │
│  │  Component  │ │  Component  │ │ Sheet       │ │  Component  │ │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘ │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │              Color Palette & Registers Component               │ │
│  └─────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                   Presentation Layer (Hooks/Custom)               │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │  useGlyphEditor  │  useScreenMap  │  useCharsetSheet          │ │
│  │  useColorPalette │  useFileIO     │  useKeyboardInput         │ │
│  └─────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    State Management Layer (Store)                 │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │                    AppStore (Zustand / Jotai)                  │ │
│  │  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐ │ │
│  │  │ Character  │ │  Screen    │ │  Color     │ │   UI       │ │
│  │  │ Banks      │ │  Map       │ │  Registers │ │  State     │ │
│  │  │ (Record)   │ │ (ScreenRow)│ │  (COLxxx)  │ │ (Selected) │ │
│  │  └────────────┘ └────────────┘ └────────────┘ └────────────┘ │ │
│  └─────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     Core Domain Layer (Pure TS)                   │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │                    Domain Models & Services                    │ │
│  │  ┌────────────────────┐ ┌─────────────────────────────────┐   │ │
│  │  │   Memory Models    │ │   Business Logic Services        │   │ │
│  │  │  - CharacterBank   │ │  - GlyphManipulator             │   │ │
│  │  │  - ScreenRow       │ │  - ScreenMapManager             │   │ │
│  │  │  - ColorRegisters  │ │  - CharacterBankManager         │   │ │
│  │  │  - AnticMode       │ │  - ColorConverter              │   │ │
│  │  └────────────────────┘ └─────────────────────────────────┘   │ │
│  │  ┌────────────────────────────────────────────────────────────┐│ │
│  │  │           Renderers (Canvas Draw Functions)               ││ │
│  │  │  - GlyphRenderer (8x8 / 4x8 / 4x16)                      ││ │
│  │  │  - CharsetSheetRenderer                                   ││ │
│  │  │  - ScreenMapRenderer                                      ││ │
│  │  └────────────────────────────────────────────────────────────┘│ │
│  └─────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     Utility & Infrastructure Layer                 │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │  - Atari Color LUT (256-color table)                          │ │
│  │  - Bitwise Helpers (setPixel, getPixel, shift, flip, etc.)   │ │
│  │  - File I/O Helpers (import/export .fnt)                     │ │
│  │  - Default ROM Font (Uint8Array 1024)                        │ │
│  └─────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 📦 Szczegółowy Opis Warstw

### 1. **UI Layer (React)**
- Komponenty funkcyjne z wykorzystaniem React Hooks.
- Użycie `useRef` dla bezpośredniego dostępu do Canvas, `useEffect` do renderowania.
- Brak stanu wewnętrznego w komponentach – wszystko zarządzane przez Store.

### 2. **Presentation Layer (Custom Hooks)**
- **useGlyphEditor**: zarządza edycją aktywnego znaku (rysowanie, przesuwanie, flip, copy/paste).
- **useScreenMap**: obsługuje interakcje z mapą ekranu (malowanie, klawiatura).
- **useCharsetSheet**: zarządza podglądem banku i wyborem znaku.
- **useColorPalette**: obsługuje wybór kolorów i pary bitów dla trybów multi-color.
- **useFileIO**: obsługa drag&drop, import/export.
- **useKeyboardInput**: mapowanie klawiszy na kody ATASCII/Internal.

### 3. **State Management Layer (Store)**
- **Store**: użycie **Zustand** (lekki, reaktywny) z `immer` dla łatwych mutacji.
- **Struktura Store:**
  ```typescript
  interface AppState {
    // Character Banks
    banks: Record<string, CharacterBank>;
    activeBankId: string;
    
    // Screen Map
    screenRows: ScreenRow[];
    
    // Color Registers
    colorRegisters: {
      COLBAK: number;
      COLPF0: number;
      COLPF1: number;
      COLPF2: number;
      COLPF3: number;
    };
    
    // UI State
    selectedCharIndex: number;
    selectedRowIndex: number;
    selectedMode: AnticMode;
    paintMode: 'glyph' | 'text';
    invertMode: boolean;
    
    // Actions
    actions: StoreActions;
  }
  ```

### 4. **Core Domain Layer (Pure TypeScript)**
- **Wszystkie operacje na danych są czystymi funkcjami** – bez efektów ubocznych, łatwe do testowania.

#### 📁 Memory Models:
```typescript
interface CharacterBank {
  id: string;
  name: string;
  data: Uint8Array; // 1024 bytes
}

interface ScreenRow {
  mode: AnticMode; // 2 | 4 | 5
  bankId: string;
  charData: Uint8Array; // 40 bytes
}

type AnticMode = 2 | 4 | 5;
```

#### 📁 Business Logic Services:
- **GlyphManipulator**: 
  - `setPixel(bank, charIndex, x, y, bitValue)`
  - `clearGlyph(bank, charIndex)`
  - `invertGlyph(bank, charIndex)`
  - `shiftGlyph(bank, charIndex, direction, wrap)`
  - `flipGlyph(bank, charIndex, axis)`
  - `copyGlyph(bank, charIndex)`
  - `pasteGlyph(bank, charIndex, clipboard)`

- **ScreenMapManager**:
  - `setScreenChar(bankId, rowIndex, colIndex, charCode)`
  - `insertRow(index, mode, bankId)`
  - `deleteRow(index)`
  - `moveRow(index, direction)`

- **CharacterBankManager**:
  - `createBank(name)`
  - `duplicateBank(id)`
  - `deleteBank(id)`
  - `loadBankData(id, data)`

- **ColorConverter**:
  - `atariToRGB(atariValue: number): [r, g, b]`
  - `getColorForBitPair(bitPair, charCode, registers)`

#### 📁 Renderers (Canvas Draw Functions):
- Każdy renderer przyjmuje kontekst Canvas + dane stanu i rysuje.
- **GlyphRenderer**: renderuje pojedynczy znak (8x8, 4x8, 4x16).
- **CharsetSheetRenderer**: renderuje siatkę 128 znaków.
- **ScreenMapRenderer**: renderuje cały ekran 40x24.

### 5. **Utility & Infrastructure Layer**
- **Atari Color LUT**: statyczna tablica `[r, g, b]` dla 256 wartości Atari.
- **Bitwise Helpers**: funkcje do manipulacji bitami w `Uint8Array`.
- **File I/O**: import/export `.fnt` (czytanie/writing `ArrayBuffer`).
- **Default ROM Font**: domyślny font Atari XL/XE w formie `Uint8Array(1024)`.

---

## 🔄 Przepływ Danych (Data Flow)

```
1. User interakcja (kliknięcie na Canvas)
         ↓
2. Custom Hook (np. useGlyphEditor) wykrywa zdarzenie
         ↓
3. Hook wywołuje akcję w Store (np. setGlyphPixel)
         ↓
4. Store aktualizuje stan (mutacja Uint8Array)
         ↓
5. Store wywołuje re-render odpowiednich komponentów
         ↓
6. Komponent używa renderera do odświeżenia Canvas
```

---

## 🛠️ Rekomendowane Biblioteki i Narzędzia

| Warstwa | Biblioteka | Cel |
|--------|-----------|-----|
| UI | **React 18+** | Framework UI |
| State | **Zustand** + **Immer** | Reaktywne zarządzanie stanem |
| Canvas | **React-Use** (useCanvas) | Ułatwienie pracy z Canvas |
| Style | **Tailwind CSS** | Szybkie stylowanie retro UI |
| Klawiatura | **React-Use** (useKeyboard) | Obsługa klawiatury |
| Drag&Drop | **React-Use** (useDrop) | Obsługa przeciągania plików |
| Testy | **Vitest** + **React Testing Library** | Testowanie jednostkowe i integracyjne |
| Typy | **TypeScript 5.0+** (strict mode) | Bezpieczeństwo typów |

---

## ✅ Zalety tej architektury

1. **Czysta separacja odpowiedzialności** – każda warstwa ma jasno określoną rolę.
2. **Wysoka testowalność** – logika biznesowa jest odizolowana od UI.
3. **Reaktywność** – zmiany w `Typed Arrays` automatycznie odświeżają widoki.
4. **Skalowalność** – łatwo dodawać nowe tryby ANTIC czy narzędzia.
5. **Offline-first** – cały stan w przeglądarce, brak zależności serwerowych.
6. **Wydajność** – bezpośrednie operacje na `Uint8Array` i Canvas, minimalny overhead.

---

## 📂 Proponowana Struktura Katalogów

```
src/
├── components/
│   ├── Toolbar/
│   ├── GlyphEditor/
│   ├── CharsetSheet/
│   ├── ScreenMap/
│   └── ColorPalette/
├── hooks/
│   ├── useGlyphEditor.ts
│   ├── useScreenMap.ts
│   ├── useCharsetSheet.ts
│   ├── useColorPalette.ts
│   └── useFileIO.ts
├── store/
│   ├── appStore.ts
│   └── types.ts
├── core/
│   ├── models/
│   │   ├── CharacterBank.ts
│   │   ├── ScreenRow.ts
│   │   └── AnticMode.ts
│   ├── services/
│   │   ├── GlyphManipulator.ts
│   │   ├── ScreenMapManager.ts
│   │   ├── CharacterBankManager.ts
│   │   └── ColorConverter.ts
│   └── renderers/
│       ├── GlyphRenderer.ts
│       ├── CharsetSheetRenderer.ts
│       └── ScreenMapRenderer.ts
├── utils/
│   ├── atariColorLUT.ts
│   ├── bitwiseHelpers.ts
│   ├── fileIO.ts
│   └── defaultRomFont.ts
├── types/
│   └── index.ts
└── App.tsx
```

---

Ta architektura zapewnia **maksymalną czytelność, utrzymywalność i wydajność** aplikacji, jednocześnie wiernie odwzorowując sprzętową specyfikację Atari 8-bit.