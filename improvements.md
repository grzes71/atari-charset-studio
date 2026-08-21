# 🚀 Atari 8-bit Charset Studio — Room for Improvements & Roadmap

Niniejszy dokument przedstawia kompleksową analizę potencjalnych usprawnień, nowych funkcjonalności i kierunków rozwoju dla aplikacji **Atari 8-bit Charset Studio**.

Propozycje zostały podzielone na 6 kluczowych kategorii tematycznych:
1. [Eksport i Integracja z Narzędziami Deweloperskimi](#1-eksport-i-integracja-z-narzędziami-deweloperskimi)
2. [Zaawansowana Edycja Glifów i Meta-Kafli (Tiles)](#2-zaawansowana-edycja-glifów-i-meta-kafli-tiles)
3. [Zaawansowany Symulator Display List & DLI](#3-zaawansowany-symulator-display-list--dli)
4. [Symulacja Wideo, Kolorów i Efektów Retro](#4-symulacja-wideo-kolorów-i-efektów-retro)
5. [UX, Produktywność i Zarządzanie Projektem](#5-ux-produktywność-i-zarządzanie-projektem)
6. [Architektura Techniczna i Wydajność](#6-architektura-techniczna-i-wydajność)

---

## 1. Eksport i Integracja z Narzędziami Deweloperskimi

Obecnie aplikacja wspiera surowy eksport binarny `.fnt` (1024B). Twórcy gier i demosceny na Atari 8-bit potrzebują bezpośredniej integracji z kodem źródłowym.

* [ ] **Generator kodu Assembly (MADS / MAC/65 / ATASM):**
  * Eksport zaznaczonych znaków lub całego banku w formacie `.byte $00, $18, ...` lub `.he 00 18 3c ...`.
  * Generowanie gotowych etykiet (np. `FONT_CHAR_A: .byte ...`).
* [ ] **Generator kodu C / CC65 / FastBasic / Action!:**
  * Eksport do tablicy `const unsigned char charset[1024] = { ... };`.
  * Generowanie kodu FastBasic (`DATA` / `DPOKE 756, ...`).
  * Generowanie kodu Atari BASIC (`DATA 0, 24, 60, ...` z pętlą `READ`/`POKE`).
* [ ] **Eksport do pliku wykonywalnego Atari (.XEX):**
  * Automatyczne wygenerowanie małego pliku `.xex` (nagłówek `$FFFF`, minimalistyczny kod w assemblerze ustawiający rejestry `CHBASE`, `COLBAK`, `COLPFx` oraz Display List), który można bezpośrednio przeciągnąć do emulatora **Altirra** lub wgrać na prawdziwe Atari przez SIO2SD / FujiNet.
* [ ] **Zintegrowany emulator WebAltirra / Atari Emulation Web Preview:**
  * Możliwość uruchomienia podglądu jednym kliknięciem w miniaturowym emulatorze Atari 8-bit w technologii WebAssembly.

---

## 2. Zaawansowana Edycja Glifów i Meta-Kafli (Tiles)

* [ ] **Edytor Meta-Kafli (2x2 / 3x3 / 4x4 znaki):**
  * Narzędzie do projektowania większych sprajtów znakowych (ang. *software sprites / character tiles*) używanych w grach platformowych i labiryntowych (np. postacie 16x16 px złożone z 4 sąsiadujących znaków).
  * Możliwość rysowania po wspólnym płótnie 16x16 lub 32x32, które automatycznie tnie grafikę na 4 lub 9 znaków w banku.
* [ ] **Biblioteka wbudowanych klasycznych fontów retro:**
  * Gotowy katalog fontów do załadowania jednym kliknięciem:
    * Atari 400/800 Old OS Font
    * Atari ST 8x8 System Font
    * Commodore 64 Font (PETSCII)
    * ZX Spectrum Sinclair Font
    * Czcionki z klasycznych gier (np. *Boulder Dash*, *M.U.L.E.*, *River Raid*, *Montezuma's Revenge*).
* [ ] **Wsparcie dla pełnych fontów 2048B (256 unikalnych znaków):**
  * Obsługa 2KB banków zawierających jednocześnie małe i duże litery, symbole międzynarodowe oraz znaki graficzne w jednym pliku `.fnt`.
* [ ] **Narzędzia transformacji:**
  * Obrót glifu o 90° w lewo / w prawo.
  * Narzędzie *Wypełnianie (Flood Fill)* dla siatki pikseli.
  * Zastępowanie kolorów / par bitów (np. zamień wszystkie piksele `01` na `11`).
* [ ] **Wieloznakowe zaznaczanie i przeciąganie (Drag & Drop Swap):**
  * Możliwość zamiany miejscami dwóch znaków w banku (przeciągnij znak #10 na pozycję #25).
  * Kopiowanie i wklejanie zakresu wielu znaków naraz.

---

## 3. Zaawansowany Symulator Display List & DLI

* [ ] **Symulacja Display List Interrupts (DLI):**
  * Możliwość zdefiniowania przerwań DLI dla poszczególnych linii skanowania — zmiana kolorów tła (`COLBAK`) i znaków (`COLPF0..3`) na określonych wierszach (np. efekt tęczy, podział na strefę nieba i ziemi, inny zestaw kolorów dla paska statusu gry).
* [ ] **Puste linie i rozkazy ANTIC (Blank Scanlines):**
  * Obsługa pustych linii skanowania (Blank 1–8 scanlines, rozkazy `$00`–`$70` w Display List) jako separatorów wierszy.
* [ ] **Przesuwanie płynne (Fine Scrolling preview):**
  * Podgląd efektu rejestrów `HSCROL` i `VSCROL` (płynne przewijanie piksel po pikselu w pionie i poziomie).
* [ ] **Eksport Mapy Ekranu (.SCR / .MAP):**
  * Eksport bufora wideo (960 bajtów dla 40x24) do surowego pliku binarnego `.scr` lub struktury tablicy assemblerowej.
  * Import zrzutów pamięci ekranowej z emulatora.

---

## 4. Symulacja Wideo, Kolorów i Efektów Retro

* [ ] **Przełącznik systemów wideo (PAL vs NTSC):**
  * Różnice w fazie koloru i odcieniach między układami GTIA PAL i NTSC.
* [ ] **Symulacja artefaktów koloru (NTSC Color Artifacting):**
  * W trybie Hires (Antic 2 / Graphics 8) naprzemienne piksele 1bpp na układach NTSC tworzą iluzję dodatkowych kolorów (tzw. *artifact colors* — czerwienie, błękity, zielenie). Dodanie przełącznika podglądu artifactingu pozwoli projektować grafikę wykorzystującą tę unikalną cechę Atari.
* [ ] **CRT Shader & Postprocessing (WebGL):**
  * Opcjonalny, regulowany filtr retro: linie skanowania (scanlines), poświata kineskopu (bloom/glow), winieta i lekkie zakrzywienie ekranu CRT.

---

## 5. UX, Produktywność i Zarządzanie Projektem

* [ ] **Zapis i odczyt całego projektu (.ATSTUDIO / JSON):**
  * Zapisywanie kompletnego stanu pracy: wszystkich utworzonych banków znaków, mapy ekranu, konfiguracji Display List, rejestrów kolorów i historii w jednym pliku JSON.
  * Automatyczny zapis w `localStorage` / `IndexedDB` (odzyskiwanie sesji po odświeżeniu przeglądarki).
* [ ] **Mapowanie skrótów klawiaturowych (Hotkeys):**
  * `[` / `]` — Poprzedni / Następny znak w banku.
  * `B` — Pędzel / Rysowanie.
  * `E` — Gumka.
  * `I` — Odwrócenie bitów (Invert).
  * `Strzałki + Alt` — Przesuwanie pikseli glifu.
* [ ] **Aplikacja PWA (Progressive Web App):**
  * Dodanie `manifest.json` oraz `service-worker.js`, umożliwiające instalację aplikacji na pulpicie Windows / macOS / Linux jako samodzielnego programu desktopowego bez paska przeglądarki.
* [ ] **Lupa i siatka wektorowa w podglądzie ekranu:**
  * Możliwość powiększania widoku ekranu (Zoom 1x, 2x, 3x, 4x) z opcją siatki kafelków (Tile Grid).

---

## 6. Architektura Techniczna i Wydajność

* [ ] **Wielowątkowość z Web Workers:**
  * Przeniesienie generowania plików `.xex`, analizy dużych fontów i konwersji binarnych do Web Workera w tle.
* [ ] **OffscreenCanvas / WebGL Rendering Pipeline:**
  * Wykorzystanie `OffscreenCanvas` w połączeniu z WebGL do renderowania ekranu z zerowym narzutem na główny wątek interfejsu (gwarancja 120 FPS+).
* [ ] **Rozszerzenie pokrycia testami E2E:**
  * Testy integracyjne komponentów z użyciem Playwright/Cypress do automatycznej weryfikacji całego przepływu importu, edycji i eksportu.

---

## 📊 Matryca Priorytetów (Rekomendowany Plan Działań)

| Funkcjonalność | Wartość dla Użytkownika | Złożoność Implementacji | Rekomendowany Priorytet |
|---|:---:|:---:|:---:|
| **Eksport do kodu Assembly (MADS) & C (CC65)** | ⭐⭐⭐⭐⭐ | Niska | **P1 (Najwyższy)** |
| **Zapis projektu do pliku (.atstudio) + Auto-save** | ⭐⭐⭐⭐⭐ | Niska | **P1 (Najwyższy)** |
| **Katalog klasycznych fontów retro** | ⭐⭐⭐⭐ | Niska | **P1 (Najwyższy)** |
| **Obsługa pełnych fontów 2048B (256 znaków)** | ⭐⭐⭐⭐ | Średnia | **P2 (Wysoki)** |
| **Edytor Meta-Kafli (2x2 / 16x16 px)** | ⭐⭐⭐⭐⭐ | Średnia | **P2 (Wysoki)** |
| **Symulacja DLI (kolory per wiersz)** | ⭐⭐⭐⭐ | Średnia | **P2 (Wysoki)** |
| **Eksport do pliku wykonywalnego Atari .XEX** | ⭐⭐⭐⭐⭐ | Średnia | **P2 (Wysoki)** |
| **Skróty klawiaturowe & PWA** | ⭐⭐⭐⭐ | Niska | **P2 (Wysoki)** |
| **Symulacja NTSC Artifacting & CRT Shader** | ⭐⭐⭐ | Średnia | **P3 (Średni)** |
| **Zintegrowany emulator WebAssembly** | ⭐⭐⭐⭐ | Wysoka | **P3 (Przyszłość)** |
