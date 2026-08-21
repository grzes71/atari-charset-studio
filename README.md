# 🕹️ Atari 8-bit Charset Studio

> Profesjonalny, webowy edytor zestawów znaków (fontów) oraz map ekranu dla komputerów **Atari 8-bit (seria 400/800, XL, XE)**.  
> Aplikacja działa w 100% po stronie przeglądarki (SPA, Offline-first) z bezpośrednim odwzorowaniem sprzętowej pamięci retro w `Typed Arrays` i akcelerowanym renderowaniem na HTML5 `<canvas>`.

---

## 📑 Spis Treści
- [Główne Funkcjonalności](#-główne-funkcjonalności)
- [Wymagania i Uruchomienie](#-wymagania-i-uruchomienie)
- [Instrukcja Użytkowania](#-instrukcja-użytkowania)
  - [1. Pasek Główny i Zarządzanie Bankami](#1-pasek-główny-i-zarządzanie-bankami)
  - [2. Edytor Pojedynczego Glifu (Glyph Editor)](#2-edytor-pojedynczego-glifu-glyph-editor)
  - [3. Podgląd Banku (Charset Sheet)](#3-podgląd-banku-charset-sheet)
  - [4. Rejestry Kolorów Atari GTIA & Paleta](#4-rejestry-kolorów-atari-gtia--paleta)
  - [5. Edytor Mapy Ekranu (Display List View)](#5-edytor-mapy-ekranu-display-list-view)
  - [6. Import i Eksport plików .fnt](#6-import-i-eksport-plików-fnt)
- [Architektura Techniczna i Zgodność ze Sprzętem](#-architektura-techniczna-i-zgodność-ze-sprzętem)
  - [Obsługiwane Tryby Układu ANTIC](#obsługiwane-tryby-układu-antic)
  - [Struktura Pamięci](#struktura-pamięci)
- [Struktura Projektu](#-struktura-projektu)
- [Testy i Budowanie](#-testy-i-budowanie)
- [Uruchamianie Wersji Produkcyjnej (Asset z Release)](#-uruchamianie-wersji-produkcyjnej-asset-z-release)
- [Automatyzacja Wydań (GitHub Actions Release Workflow)](#-automatyzacja-wydań-github-actions-release-workflow)
- [Licencja](#-licencja)

---

## ✨ Główne Funkcjonalności

* 🚀 **Wierność sprzętowa Atari 8-bit:** Operacje na surowych buforach `Uint8Array(1024)` (128 glifów x 8 bajtów) i `Uint8Array(40)` na wiersz ekranu.
* 🎨 **Wsparcie dla 3 trybów ANTIC:**
  * **Antic 2:** Hires Text 40x24 (1 bit/piksel, 8x8 px).
  * **Antic 4:** Multicolor Text 40x24 (2 bity/piksel, 4x8 px, do 5 kolorów).
  * **Antic 5:** Multicolor Double-Height Text 40x12 (2 bity/piksel, 4x16 px, podwójna wysokość linii).
* 🌈 **Autentyczna paleta kolorów Atari GTIA:**
  * 256-kolorowa tablica konwersji Atari NTSC/Altirra LUT na RGB.
  * Interaktywny selektor rejestrów: `COLBAK`, `COLPF0`, `COLPF1`, `COLPF2`, `COLPF3`.
  * Presety kolorystyczne (*Klasyczny Atari Blue*, *Retro Dark Studio*, *Green Phosphor*, *Amber CRT*).
* 🛠️ **Zaawansowane narzędzia edycji glifu:**
  * Przesuwanie w 4 kierunkach z opcjonalnym zawijaniem (Wrap).
  * Odbicia lustrzane (Flip Horizontal / Flip Vertical).
  * Odwracanie bitów (Invert), czyszczenie (Clear), kopiowanie i wklejanie (Copy/Paste).
  * Podgląd glifu w skali 1:1 oraz powiększeniu 2:1.
* 📺 **Symulator Display List (Mapa Ekranu):**
  * Konfiguracja trybu ANTIC (2, 4, 5) oraz banku znaków niezależnie dla każdego wiersza.
  * Tryb malowania pędzlem wybranego znaku oraz bezpośrednie wpisywanie tekstu z klawiatury.
  * Dynamiczne dodawanie, usuwanie, przestawianie i wypełnianie wierszy.
* 💾 **Pliki i schowek:**
  * Eksport i import surowych plików binarnych `.fnt` / `.rom` (1024 bajty) bez nagłówków.
  * Obsługa metody **Drag & Drop** (przeciągnij plik `.fnt` na okno aplikacji).
  * Wbudowany standardowy zestaw znaków Atari XL/XE OS ROM.
  * Pełna historia operacji **Undo / Redo** (`Ctrl+Z` / `Ctrl+Y`).

---

## 📦 Wymagania i Uruchomienie

### Wymagania wstępne
* **Node.js** w wersji 18+ (zalecana wersja 20 lub 24)
* Menedżer pakietów **npm** lub **pnpm**

### Instalacja zależności
```bash
npm install
```

### Uruchomienie serwera deweloperskiego
```bash
npm run dev
```
Aplikacja uruchomi się lokalnie pod adresem: **[http://localhost:3000](http://localhost:3000)**.

---

## 📖 Instrukcja Użytkowania

### 1. Pasek Główny i Zarządzanie Bankami
* **Wybór Banku:** Z rozwijanej listy wybierz aktywny zestaw znaków.
* **Nowy Bank (+):** Tworzy nowy, pusty bank znaków w projekcie.
* **Duplikuj Bank:** Tworzy kopię bieżącego banku do dalszych modyfikacji.
* **Załaduj ROM:** Przywraca standardowy font systemowy Atari XL/XE w aktywnym banku.
* **Cofnij / Ponów:** Przyciski historii operacji (dostępne również pod skrótami `Ctrl+Z` oraz `Ctrl+Y`).

### 2. Edytor Pojedynczego Glifu (Glyph Editor)
* **Siatka pikseli:** 
  * Kliknij lub przeciągnij **lewym przyciskiem myszy**, aby malować aktywnym kolorem / bitem.
  * Kliknij **prawym przyciskiem myszy**, aby użyć gumki (wstawić tło / 0).
* **Wybór par bitów (dla trybów Antic 4 i 5):**
  * `00` -> Kolor tła `COLBAK`
  * `01` -> Kolor pola `COLPF0`
  * `10` -> Kolor pola `COLPF1`
  * `11` -> Kolor pola `COLPF2` (lub `COLPF3` przy włączonej inwersji)
* **Narzędzia transformacji:**
  * Strzałki: przesunięcie pikseli w górę/dół/lewo/prawo (zaznacz opcję *Zawijaj*, aby piksele wychodzące za krawędź pojawiały się z drugiej strony).
  * *Odbij H / Odbij V*: lustrzane odbicie w poziomie lub pionie.
  * *Odwróć*: negacja wszystkich pikseli (NOT).
  * *Kopiuj / Wklej*: kopiowanie 8 bajtów glifu do schowka aplikacji.

### 3. Podgląd Banku (Charset Sheet)
* Wyświetla 128 znaków banku w siatce 16x8.
* Kliknięcie na dowolny znak wybiera go jako aktywny do edycji oraz do malowania na mapie ekranu.
* Pasek informacyjny wyświetla numer znaku, wartość szesnastkową (`$00`–`$7F`) oraz kod wewnętrzny.
* Przycisk **Inwersja (+128)** przełącza podgląd znaków z ustawionym 7. bitem (inwersja wideo w trybie 2 / 5. kolor w trybach 4 i 5).

### 4. Rejestry Kolorów Atari GTIA & Paleta
* Kliknij w jeden z 5 rejestrów (`COLBAK`, `COLPF0`, `COLPF1`, `COLPF2`, `COLPF3`), aby go aktywować.
* Wybierz kolor z 256-polowej matrycy (16 odcieni Hue w kolumnach x 8 poziomów jasności Luma w wierszach).
* Możesz skorzystać z gotowych presetów kolorystycznych umieszczonych w nagłówku panelu.

### 5. Edytor Mapy Ekranu (Display List View)
* Symuluje ekran Atari złożony z wierszy o szerokości 40 kolumn.
* **Kontrolki przy każdym wierszu:**
  * Wybór trybu graficznego: `Antic 2 (Hires)`, `Antic 4 (Multi)` lub `Antic 5 (Double)`.
  * Przypisanie banku znaków do danej linii tekstu.
  * Przenoszenie wiersza w górę / w dół oraz usuwanie wiersza.
* **Tryb Malowania (Pędzel Glifu):** Klikaj i przeciągaj po wierszach ekranu, aby stawiać wybrany z banku znak.
* **Tryb Wpisywania Tekstu:** Wpisz tekst w polu tekstowym i kliknij *Wstaw* — litery zostaną automatycznie przekonwertowane na kody ekranowe Atari i umieszczone w wybranym wierszu.
* **Wypełnij / Wyczyść:** Przyciski szybkiego wypełnienia wiersza aktywnym znakiem lub wyczyszczenia spacjami.

### 6. Import i Eksport plików .fnt
* **Eksport (.fnt):** Kliknij przycisk *Eksportuj .fnt* w prawym górnym rogu. Przeglądarka pobierze surowy plik binarny o rozmiarze dokładnie **1024 bajtów** (128 znaków x 8 bajtów), gotowy do natychmiastowego użycia w assemblerze Atari (np. MADS, Mac/65, CC65) lub emulatorze Altirra.
* **Import (.fnt / .rom):** Kliknij *Importuj .fnt* lub po prostu **przeciągnij i upuść plik** na okno przeglądarki. Zostanie utworzony nowy bank z wczytanym fontem.

---

## 🏛️ Architektura Techniczna i Zgodność ze Sprzętem

### Obsługiwane Tryby Układu ANTIC

| Tryb ANTIC | Typ | Kolumny x Wiersze | Rozdzielczość Znaku | Liczba Kolorów | Odwzorowanie Bitów |
|---|---|---|---|---|---|
| **Antic 2** | Hires Text | 40 x 24 | 8 x 8 pikseli | 2 kolory | 1 bit/px (`0`=COLBAK, `1`=COLPF2). Bit 7 kodu znaku odwraca kolory. |
| **Antic 4** | Multicolor Text | 40 x 24 | 4 x 8 pikseli | do 5 kolorów | 2 bity/px (`00`=COLBAK, `01`=COLPF0, `10`=COLPF1, `11`=COLPF2/3). |
| **Antic 5** | Multicolor Double | 40 x 12 | 4 x 16 pikseli | do 5 kolorów | 2 bity/px, każda z 8 linii glifu rysowana dwukrotnie w pionie. |

### Struktura Pamięci
* **Bank Fontu:** Bufor `Uint8Array(1024)`. Znak `N` (0–127) zajmuje bajty od indeksu `N * 8` do `N * 8 + 7`.
* **Wiersz Ekranu:** Bufor `Uint8Array(40)` zawierający kody znaków (0–255).

---

## 📂 Struktura Projektu

```
atari-web-fonteditor/
├── src/
│   ├── components/            # Komponenty interfejsu React
│   │   ├── Toolbar/           # Główny pasek narzędzi, import/eksport, zarządzanie bankami
│   │   ├── GlyphEditor/       # Edytor powiększonego znaku i narzędzia transformacji
│   │   ├── CharsetSheet/      # Siatka podglądu 128 znaków banku
│   │   ├── ColorPalette/      # Selektor rejestrów GTIA i 256-kolorowa matryca
│   │   └── ScreenMap/         # Edytor mapy ekranu (Display List)
│   ├── core/                  # Czysta domena biznesowa retro (bez zależności od Reacta)
│   │   ├── renderers/         # Silniki renderowania Canvas (Glyph, Sheet, ScreenMap)
│   │   └── services/          # Manipulacja glifami i konwerter kolorów
│   ├── store/                 # Globalny magazyn stanu Zustand z historią Undo/Redo
│   ├── utils/                 # Pomocniki bitowe, Atari Color LUT, domyślny ROM font, File I/O
│   ├── types/                 # Definicje typów TypeScript
│   ├── App.tsx                # Główny layout i skróty klawiaturowe
│   └── index.css              # Style Tailwind CSS i motyw retro dark
├── tests/                     # Testy jednostkowe Vitest (bitwise, manipulator, LUT)
├── spec.md                    # Specyfikacja techniczna aplikacji
├── architecture.md            # Dokumentacja architektury
└── package.json               # Konfiguracja projektu i zależności
```

---

## 🧪 Testy i Budowanie

### Uruchomienie testów jednostkowych (Vitest)
```bash
npm run test:run
```

### Budowanie wersji produkcyjnej
```bash
npm run build
```
Zbudowane, zoptymalizowane pliki produkcyjne zostaną wygenerowane w katalogu `dist/`.

### Lokalny podgląd buildu produkcyjnego (Vite Preview)
```bash
npm run preview
```
Uruchomi lokalny serwer HTTP serwujący zawartość katalogu `dist/` (domyślnie pod adresem `http://localhost:4173`).

---

## 🚀 Uruchamianie Wersji Produkcyjnej (Asset z Release)

Aplikacja jest w pełni statyczną aplikacją SPA (Single Page Application). Każdy oficjalny GitHub Release zawiera gotową paczkę `atari-charset-studio-vX.Y.Z.zip` ze skompilowanym kodem (`index.html` oraz zasoby w katalogu `assets/`).

### Jak uruchomić pobraną paczkę zip:

1. **Pobierz i rozpakuj** plik `atari-charset-studio-vX.Y.Z.zip` ze strony [Releases w repozytorium](https://github.com/grzes71/atari-charset-studio/releases).
2. Ze względu na politykę bezpieczeństwa nowoczesnych przeglądarek dla modułów JavaScript (ES Modules / CORS), plików SPA nie należy otwierać bezpośrednio dwuklikiem protokołem `file://`. Wystarczy uruchomić prosty, lokalny serwer HTTP w rozpakowanym katalogu:

#### Opcja A: Poprzez Node.js (`npx`)
W rozpakowanym folderze wykonaj:
```bash
npx serve .
# lub
npx http-server .
```
Aplikacja otworzy się pod adresem wskazanym w konsoli (np. `http://localhost:3000` lub `http://localhost:8080`).

#### Opcja B: Poprzez Pythona 3 (bez konieczności posiadania Node.js)
W rozpakowanym folderze uruchom:
```bash
python -m http.server 8080
```
Następnie otwórz przeglądarkę pod adresem: **[http://localhost:8080](http://localhost:8080)**.

#### Opcja C: Rozszerzenie VS Code (Live Server)
Otwórz rozpakowany folder w VS Code, kliknij prawym przyciskiem myszy na plik `index.html` i wybierz **"Open with Live Server"**.

#### Opcja D: Dowolny hosting statyczny / serwer WWW
Zawartość rozpakowanego archiwum można bezpośrednio wgrać na dowolny serwer lub hosting statyczny (GitHub Pages, Cloudflare Pages, Netlify, Vercel, Nginx, Apache, Caddy).

---

## ⚙️ Automatyzacja Wydań (GitHub Actions Release Workflow)

W repozytorium skonfigurowany jest w pełni zautomatyzowany przepływ wydań CI/CD ([release-on-pr-merge.yml](.github/workflows/release-on-pr-merge.yml)):

1. **Wyzwalacz (Trigger):**
   * Workflow uruchamia się automatycznie po **scaleniu (merge) Pull Requesta** do gałęzi `main` lub `master`.
2. **Automatyczne wersjonowanie SemVer (Conventional Commits):**
   * Analizuje tytuł PR oraz historię commitów zawartych w PR:
     * `feat:` ➔ podbicie wersji **minor** (np. `v1.0.2` ➔ `v1.1.0`).
     * `fix:`, `perf:` ➔ podbicie wersji **patch** (np. `v1.0.2` ➔ `v1.0.3`).
     * `BREAKING CHANGE:` lub `!:` ➔ podbicie wersji **major** (np. `v1.0.2` ➔ `v2.0.0`).
     * Pozostałe (np. `docs:`, `chore:`, `style:`) ➔ brak podbicia wersji i pominięcie wydania.
3. **Aktualizacja wersji i rejestru zmian:**
   * Automatycznie podbija wersję w `package.json` oraz `package-lock.json`.
   * Generuje i dołącza nowy wpis w pliku `CHANGELOG.md` z listą wprowadzonych zmian.
   * Tworzy commit `chore: release vX.Y.Z [skip ci]` i wypycha go do gałęzi głównej.
4. **Weryfikacja, Budowanie i Pakowanie:**
   * Uruchamia zestaw testów jednostkowych (`npm run test:run`).
   * Buduje zoptymalizowaną wersję produkcyjną (`npm run build`).
   * Pakuje zawartość katalogu `dist/` do archiwum zip: `atari-charset-studio-vX.Y.Z.zip`.
5. **Publikacja GitHub Release:**
   * Tworzy nowy tag Git `vX.Y.Z` oraz oficjalny GitHub Release z automatycznie sformatowanymi Release Notes i dołączonym plikiem `.zip` jako gotowym do pobrania assetem.

---

## 📜 Licencja
Projekt udostępniony na licencji **MIT**. Dedykowany społeczności retrocomputingu i twórcom oprogramowania dla komputerów Atari 8-bit.

