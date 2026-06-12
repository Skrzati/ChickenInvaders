# Chicken Invaders: Retro Force 🚀

Gra wzorowana na klasycznej zręcznościowej strzelance **Chicken Invaders**, napisana w technologii **React** oraz **HTML5 Canvas** dla płynnego renderowania 60 FPS w przeglądarce. Do generowania efektów dźwiękowych w locie wykorzystano **Web Audio API**.

---

## 🛠️ Wymagania wstępne

Do uruchomienia projektu potrzebujesz zainstalowanego środowiska **Node.js** (zalecana wersja 18 lub nowsza). Możesz pobrać je z [oficjalnej strony Node.js](https://nodejs.org/).

---

## 🚀 Jak uruchomić projekt od zera

Postępuj zgodnie z poniższymi krokami, aby zainstalować i włączyć grę lokalnie:

### 1. Pobierz zależności
Otwórz terminal w głównym katalogu projektu i zainstaluj potrzebne biblioteki:
```bash
npm install
```

### 2. Uruchom serwer deweloperski
Uruchom lokalny serwer testowy poleceniem:
```bash
npm run dev
```

### 3. Otwórz grę w przeglądarce
Po uruchomieniu serwera w terminalu wyświetli się lokalny adres. Domyślnie jest to:
👉 **[http://localhost:5173](http://localhost:5173)**

Kliknij ten link lub wpisz go ręcznie w przeglądarce, aby rozpocząć grę!

---

## 🏗️ Budowanie wersji produkcyjnej

Jeśli chcesz skompilować grę do gotowych, zoptymalizowanych plików statycznych (np. do wrzucenia na hosting), uruchom:
```bash
npm run build
```
Skompilowana gra zostanie zapisana w folderze `/dist/`.

---

## 🎮 Zasady gry i sterowanie

Twoim zadaniem jest odparcie inwazji kurczaków z kosmosu. Unikaj spadających jajek, zbieraj ulepszenia i staw czoła ostatecznemu Bossowi!

Możesz wybrać preferowany sposób sterowania w **Ustawieniach** w Menu Głównym:

### Opcja 1: Sterowanie myszką (Domyślne)
* **Ruch:** Poruszaj myszką, aby przemieszczać statek.
* **Strzał:** Przytrzymaj lub klikaj lewy przycisk myszy (LPM).

### Opcja 2: Sterowanie klawiaturą
* **Ruch:** Używaj strzałek `←` / `→` / `↑` / `↓` lub klawiszy `W` `A` `S` `D`.
* **Strzał:** Przytrzymaj `Spację`.

### Elementy na planszy:
* **Prezenty (Ulepszenia broni):** Zbieraj spadające kolorowe paczki, aby ulepszyć swój laser (od zwykłego lasera po potężne kule plazmowe, łącznie 4 poziomy broni).
* **Udka kurczaka:** Zbieraj pieczone udka z zabitych kurczaków, aby otrzymać dodatkowe punkty (`+500` pkt).

---

## 💻 Struktura techniczna projektu

* `src/main.jsx` – Punkt wejścia aplikacji React.
* `src/App.jsx` – Główny komponent zarządzający stanami gry (`MENU`, `PLAYING`, `GAMEOVER`, `VICTORY`) oraz animowanym tłem kosmosu.
* `src/components/GameCanvas.jsx` – Serce gry. Kontroluje pętlę renderowania 2D Canvas, fizykę lotu, wykrywanie kolizji, fale kurczaków oraz algorytmy walki z bossem.
* `src/components/HUD.jsx` – Pasek stanu gracza wyświetlający aktualny wynik, falę, liczbę żyć oraz zdrowie bossa.
* `src/components/MainMenu.jsx` – Ekran startowy z opcjami zmiany sterowania, wyciszenia i instrukcją.
* `src/components/GameOver.jsx` / `Victory.jsx` – Ekrany końca gry.
* `src/utils/audio.js` – Syntetyzator dźwięków działający w czasie rzeczywistym przy użyciu Web Audio API.
* `public/assets/` – Katalog zawierający grafiki PNG (statek, kurczaki, boss, udko, prezent, jajko oraz tło kosmiczne).
