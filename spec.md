# Atari 8-bit Charset Studio - Agent Specification

## 1. Architektura i Stos Technologiczny
* **Środowisko:** Webowa aplikacja Single Page Application (SPA), całkowity brak backendu (klient w 100% offline).
* **Język:** TypeScript (Strict Mode).
* **Renderowanie:** Oparte na HTML5 `<canvas>` z wyłączonym wygładzaniem pikseli (`imageSmoothingEnabled = false`) dla maksymalnej wydajności i ostrej grafiki retro.
* **Zarządzanie Stanem:** Reaktywny magazyn stanu (State Store) operujący bezpośrednio na `Typed Arrays` (`Uint8Array`), odzwierciedlający sprzętową organizację pamięci Atari 8-bit.

---

## 2. Struktura Stanu i Pamięci (Data Models)

### Banki Znaków (Character Banks)
* Słownik / mapa obiektów banków (`Record<string, CharacterBank>`).
* Każdy bank zawiera surowy bufor `data: Uint8Array(1024)` przetrzymujący 128 znaków (8 bajtów na znak, glif o wymiarach 8x8 bitów).
* Aplikacja wspiera przełączanie i tworzenie wielu niezależnych banków w projekcie.

### Rejestry Kolorów i Paleta Atari (Color Registers & LUT)
* Stan przechowuje wartości rejestrów Atari GTIA/ANTIC (zakres 0–255, kodowanie `$00`–`$FF` w formacie Hue/Luma):
  * `COLBAK` (np. domyślnie `$00` / czerń)
  * `COLPF0` (np. domyślnie `$28` / brąz/złoto)
  * `COLPF1` (np. domyślnie `$CA` / zieleń)
  * `COLPF2` (np. domyślnie `$94` / błękit)
  * `COLPF3` (np. domyślnie `$46` / czerwień/róż)
* **Atari Color LUT:** Wbudowana 256-kolorowa tablica konwersji (np. standardowa paleta NTSC/Altirra) tłumacząca bajt koloru Atari na format RGB/HEX dla renderera Canvas.

### Mapa Ekranu (Screen View Map)
* Symulacja Display List jako tablicy wierszy (`ScreenRow[]`):
  * Domyślny rozmiar: 24 wiersze (standardowy ekran 40x24), z możliwością dynamicznego dodawania, usuwania i zmiany kolejności wierszy.
  * Każdy wiersz posiada strukturę:
    * `mode`: tryb wyświetlania ANTIC (Antic 2, Antic 4 lub Antic 5).
    * `bankId`: identyfikator banku znaków przypisanego do danego wiersza.
    * `charData`: bufor `Uint8Array(40)` zawierający kody znaków (0–255) dla 40 kolumn wiersza.

---

## 3. Logika Renderowania i Tryby ANTIC

### Obsługa Trybów Znakowych
* **Antic 2 (Hires Text - 40 kolumn, 8x8 pikseli na znak):**
  * 1 bit = 1 piksel (rozdzielczość znaku 8x8).
  * Bit `0` -> kolor tła (`COLBAK`).
  * Bit `1` -> kolor znaku (`COLPF2` lub `COLPF1` w zależności od konfiguracji rejestrów).
  * Kody znaków 128–255 (z ustawionym bitem 7): inwersja wideo (odwrócenie kolorów tła i znaku).
* **Antic 4 (Multicolor Text - 40 kolumn, 4x8 pikseli na znak):**
  * 2 bity = 1 piksel o podwójnej szerokości (rozdzielczość znaku 4x8).
  * Pary bitów:
    * `00` -> `COLBAK` (tło)
    * `01` -> `COLPF0`
    * `10` -> `COLPF1`
    * `11` -> `COLPF2` (gdy kod znaku < 128) lub `COLPF3` (gdy kod znaku >= 128, tzw. 5. kolor / inwersja)
* **Antic 5 (Multicolor Double-Height Text - 40 kolumn, 4x16 pikseli na znak):**
  * Identyczne mapowanie 2-bitowych par kolorów jak w Antic 4, ale każdy z 8 bajtów znaku jest renderowany dwukrotnie w pionie (wysokość linii = 16 linii skanowania).

---

## 4. Interfejs Użytkownika (UI Layout)

1. **Pasek Główny (Header / Toolbar):**
   * Przyciski *Nowy Projekt*, *Załaduj ROM Font*, *Importuj .fnt*, *Eksportuj .fnt*.
   * Przełącznik aktywnego banku znaków i zarządzanie bankami (Dodaj/Usuń/Duplikuj).

2. **Edytor Znaku (Glyph Pixel Grid):**
   * Centralny interaktywny Canvas powiększonego znaku:
     * Siatka 8x8 dla trybu Antic 2 (rysowanie lewym przyciskiem myszy / gumka prawym).
     * Siatka 4x8 z selektorem aktywnego koloru/pary bitów (`00`, `01`, `10`, `11`) dla trybów Antic 4 i 5.
   * **Pasek narzędzi edycji znaku:**
     * *Wyczyść (Clear)*, *Odwróć (Invert)*.
     * *Przesunięcia (Shift Up / Down / Left / Right)* z zawijaniem lub bez.
     * *Odbicie lustrzane (Flip Horizontal / Flip Vertical)*.
     * *Kopiuj / Wklej* do schowka znaków.

3. **Podgląd Banku Znaków (Charset Sheet):**
   * Panel boczny wyświetlający siatkę 128 znaków (16 kolumn x 8 wierszy) wybranego banku.
   * Renderowany w czasie rzeczywistym z uwzględnieniem aktywnych rejestrów kolorów.
   * Kliknięcie wybiera aktywny znak do edycji i malowania na mapie ekranu.
   * Wyświetlanie indeksu znaku (dziesiętnie `$HEX` oraz kod znaku ATASCII/Internal).

4. **Panel Palety i Rejestrów Kolorów:**
   * Wizualne próbniki kolorów dla rejestrów `COLBAK`, `COLPF0`, `COLPF1`, `COLPF2`, `COLPF3`.
   * Interaktywny selektor barwy (16 odcieni Atari) i jasności (8 poziomów luma), pozwalający na łatwy wybór wartości `$00`–`$FF`.

5. **Edytor Ekranu (View Map / Display List Editor):**
   * Główny obszar roboczy reprezentujący ekran Atari.
   * Po lewej stronie każdego wiersza:
     * Dropdown wyboru trybu (`Antic 2`, `Antic 4`, `Antic 5`).
     * Dropdown wyboru banku (`bankId`).
     * Przyciski zarządzania wierszem (dodaj poniżej, usuń, przenieś w górę/dół).
   * Interakcja z mapą ekranu:
     * Tryb pędzla: kliknięcie/przeciągnięcie stawia aktualnie wybrany znak (lub znak z bitem inwersji).
     * Tryb tekstu: możliwość wpisywania znaków z klawiatury bezpośrednio do aktywnego wiersza.

---

## 5. Wymagania Funkcjonalne i Operacje Wejścia/Wyjścia

* **Przeliczanie Pikseli:** Zmiany na siatce edytora znaku są natychmiast tłumaczone za pomocą operacji bitowych na bajty w buforze `Uint8Array(1024)`.
* **Reaktywny Render:** Jakakolwiek zmiana w `Uint8Array` lub rejestrach kolorów natychmiast wyzwala odświeżenie Canvasu edytora znaku, podglądu banku oraz powiązanych wierszy na mapie ekranu.
* **Stan Początkowy:** Aplikacja startuje z wbudowanym, predefiniowanym zestawem znaków Atari 8-bit ROM (standardowy font systemowy XL/XE) oraz domyślnym układem 24 wierszy.
* **Import:**
  * Obsługa wczytywania plików binarnych `.fnt` / `.rom` (1024 bajty dla 128 znaków lub 2048 bajtów dla 256 znaków) poprzez przeciągnij-i-upuść (Drag & Drop) lub okno wyboru pliku.
* **Eksport:**
  * Generowanie i natychmiastowe pobieranie surowego pliku binarnego `.fnt` (`Blob` `application/octet-stream`) o rozmiarze dokładnie 1024 bajtów dla wybranego banku, bez żadnych nagłówków ani metadanych.