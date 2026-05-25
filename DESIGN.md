# DESIGN.md — Quran-Flash-System  
**Falsafah Reka Bentuk & Spesifikasi Visual untuk Pengalaman Tadabbur Minimalis**

---

## 0. Nota Versi (Design v2.0)

Dokumen ini adalah **gabungan penuh** DESIGN.md asal (v1.0) dengan penambahan **sistem tiga mod tema** (Day-Light, Dark-Night, Coffee-Beige). Semua prinsip asal dikekalkan dan diperluaskan untuk menyokong pertukaran tema dinamik tanpa menjejaskan prestasi, struktur data, atau keupayaan luar talian.

**Prinsip panduan:**  
> *"Semakin sedikit gangguan visual, semakin dalam hubungan dengan teks wahyu."*

---

## 1. Falsafah Teras

Reka bentuk ini lahir daripada satu keyakinan:  
Setiap elemen antara muka mesti **tunduk kepada Al-Quran**. Tiada hiasan yang mencuri perhatian, tiada animasi yang memecah tumpuan. Matlamatnya adalah **keheningan digital** – ruang yang membolehkan mata dan minda berehat semata-mata pada ayat.

Tiga mod tema disediakan bukan sebagai variasi kosmetik, tetapi sebagai **respons kepada konteks pengguna**:

| Mod | Konteks | Niat Reka Bentuk |
|-----|---------|------------------|
| 🌙 **Dark-Night** | Malam, tadabbur sunyi, cahaya malap | Kontras rendah, emas sufi menyala lembut di atas hitam pekat — menyerupai cahaya lampu minyak di atas rehal. |
| ☀️ **Day-Light** | Siang, pencahayaan penuh, bacaan pantas | Kertas mushaf putih kekuningan dengan dakwat hijau tua — kontras tinggi, selesa untuk bacaan panjang. |
| ☕ **Coffee-Beige** | Senja, kafe, mood tenang, bacaan santai | Hangat seperti kopi susu — beige lembut, coklat tanah, emas tembaga. Ketenangan tanpa silau. |

Setiap tema adalah **ekspresi kepada satu falsafah yang sama** — keheningan — hanya disesuaikan dengan cahaya persekitaran.

---

## 2. Seni Bina Warna — CSS Custom Properties

Untuk menyokong tiga mod tema tanpa menambah fail CSS baharu atau memerlukan pemprosesan pelayan, semua warna diungkapkan sebagai **CSS Custom Properties** yang ditakrifkan pada `:root` dan ditimbal oleh kelas tema pada `<html>`.

### 2.1 Senarai Pembolehubah Warna

```css
:root {
  /* Warna-warna ini akan ditimbal oleh kelas tema */
  --bg-primary:        /* Latar utama seluruh aplikasi */
  --bg-card:           /* Latar belakang kad flashcard */
  --bg-card-read:      /* Latar kad yang telah ditandai selesai */
  --text-primary:      /* Teks UI utama (header, label) */
  --text-secondary:    /* Teks sekunder (metadata, footer) */
  --text-translation:  /* Teks terjemahan ayat */
  --gold:              /* Warna emas/aksen utama */
  --gold-muted:        /* Emas yang dilembutkan (badge, border) */
  --arabic:            /* Warna teks Arab (boleh berbeza dari emas) */
  --border-light:      /* Sempadan halus (garisan pemisah) */
  --border-card:       /* Sempadan kad */
  --shadow:            /* Bayang kotak (box-shadow) */
  --overlay:           /* Latar belakang separa lutsinar (hover, toast) */
  --check-done:        /* Warna ikon tanda selesai */
  --check-done-bg:     /* Latar belakang ikon selesai */
}
```

### 2.2 Palet Tema

#### 🌙 Tema `theme-dark` (Dark-Night) — Lalai

Inspirasi: Malam sufi, lampu minyak, terminal Linux yang gelap dan selesa.

```css
.theme-dark {
  --bg-primary:        #080808;
  --bg-card:           #0d0d0d;
  --bg-card-read:      #0a120a;
  --text-primary:      #dddddd;
  --text-secondary:    #555555;
  --text-translation:  #999999;
  --gold:              #c9a86c;
  --gold-muted:        #c9a86c22;
  --arabic:            #c9a86c;
  --border-light:      #141414;
  --border-card:       #161616;
  --shadow:            0 20px 40px rgba(0,0,0,0.6);
  --overlay:           rgba(0,0,0,0.7);
  --check-done:        #22c55e;
  --check-done-bg:     #22c55e11;
}
```

#### ☀️ Tema `theme-day` (Day-Light)

Inspirasi: Halaman mushaf fizikal, dakwah di bawah cahaya matahari, kertas putih kekuningan.

```css
.theme-day {
  --bg-primary:        #faf8f2;
  --bg-card:           #ffffff;
  --bg-card-read:      #f0f7f0;
  --text-primary:      #1a1a1a;
  --text-secondary:    #888888;
  --text-translation:  #555555;
  --gold:              #9b7b3a;
  --gold-muted:        #9b7b3a18;
  --arabic:            #1e3a2f;
  --border-light:      #e8e5dc;
  --border-card:       #e0dcd0;
  --shadow:            0 4px 20px rgba(0,0,0,0.06);
  --overlay:           rgba(255,255,255,0.85);
  --check-done:        #16a34a;
  --check-done-bg:     #16a34a10;
}
```

#### ☕ Tema `theme-coffee` (Coffee-Beige)

Inspirasi: Kopi susu pagi, kafe senyap, suasana *cottagecore* Islamik. Ketenangan tanpa silau.

```css
.theme-coffee {
  --bg-primary:        #e8d9c8;
  --bg-card:           #f3eade;
  --bg-card-read:      #e8f0e3;
  --text-primary:      #3b2e21;
  --text-secondary:    #8a7560;
  --text-translation:  #5c4a38;
  --gold:              #a67c3d;
  --gold-muted:        #a67c3d1a;
  --arabic:            #5d3a1a;
  --border-light:      #d4c8b4;
  --border-card:       #ccc0aa;
  --shadow:            0 4px 16px rgba(98,70,40,0.08);
  --overlay:           rgba(232,217,200,0.85);
  --check-done:        #4d7c3b;
  --check-done-bg:     #4d7c3b12;
}
```

---

## 3. Tipografi – Hierarki Ketenangan

Semua fon dimuatkan secara tempatan daripada `assets/fonts/`. Tiada CDN luaran — patuh sepenuhnya kepada prinsip *offline-first*.

### 3.1 Fon Arab (Uthmani)
- **Fon utama:** `"Amiri"` — dimuat dari `assets/fonts/Amiri-Regular.ttf`.
- **Fon sandaran (fallback):** `'Traditional Arabic', 'Scheherazade New', 'Noto Naskh Arabic', serif`.
- **Saiz:** `21px` pada desktop, `18px` pada mudah alih.
- **Line-height:** `1.9`.
- **Arah teks:** RTL (`direction: rtl`).
- **Word-spacing:** Sedikit renggang (`0.1em`).

### 3.2 Fon Rumi / Terjemahan
- **Fon utama:** `'Courier New', Courier, monospace`.
- **Saiz:** `12px`.
- **Warna:** `var(--text-translation)`.
- **Pemisah:** Garisan halus `1px solid var(--border-light)` di atas blok terjemahan.

### 3.3 Fon UI & Navigasi
- **Fon utama:** `'Courier New', Courier, monospace`.
- **Saiz:** `10px`–`14px` bergantung pada elemen.
- **Gaya:** *Uppercase*, `letter-spacing: 0.5px`–`0.8px`.
- **Warna:** `var(--text-secondary)` untuk label dan metadata.

### 3.4 Deklarasi `@font-face`
```css
@font-face {
  font-family: 'Amiri';
  src: url('assets/fonts/Amiri-Regular.ttf') format('truetype');
  font-weight: 400;
  font-style: normal;
  font-display: swap; /* Elak FOIT (Flash of Invisible Text) */
}
```

---

## 4. Komposisi Ruang – Pernafasan Visual

### 4.1 Susun Atur Global
- **Lebar maksimum:** `700px` — dipusatkan secara automatik (`margin: 0 auto`).
- **Sempadan kiri/kanan:** `1px solid var(--border-light)`.
- **Latar aplikasi:** `var(--bg-primary)`.
- **Skrol:** Kawasan kad boleh diskrol secara menegak. Tiada halangan paksa.

### 4.2 Kad Flashcard
- **Latar:** `var(--bg-card)`.
- **Sempadan:** `1px solid var(--border-card)`.
- **Border-radius:** `14px`.
- **Padding:** `16px 18px 12px`.
- **Jarak antara kad:** `12px`.
- **Kesan kaca (hanya tema `theme-dark`):** `backdrop-filter: blur(12px)` untuk kad yang menggunakan `rgba` separa lutsinar pada tema gelap. Pada tema lain, latar legap digunakan untuk kontras lebih baik.

### 4.3 Footer & Kawalan
- **Pemisah:** `border-top: 1px solid var(--border-light)`.
- **Input dan butang:** Gaya seragam — latar telus, sempadan `var(--gold-muted)`, teks `var(--text-primary)`.

---

## 5. Gerakan – Lembut & Bernyawa

Semua animasi menggunakan **CSS transitions** asli sahaja. Tiada JavaScript untuk animasi. Tiada pustaka seperti GSAP atau Anime.js.

### 5.1 Peraturan Am
- `transition: all 0.2s ease` untuk butang dan elemen interaktif.
- `transition: border-color 0.25s, background 0.25s` untuk kad.
- **Dilarang:** `@keyframes` yang berjalan tanpa henti (contoh: berkelip, bergerak, bernafas). Semua animasi mesti dicetuskan oleh tindakan pengguna.

### 5.2 Maklum Balas Interaksi

| Elemen | Tindakan | Kesan |
|--------|----------|-------|
| Butang navigasi (`‹` `›`) | Hover / Fokus | Warna bertukar ke `var(--gold)` |
| Butang "Selesai Baca" | Hover | `transform: scale(1.03)` |
| Butang semak (○) | Klik / Tandai selesai | Bertukar kepada ✓, warna `var(--check-done)`, latar `var(--check-done-bg)` |
| Kad ditandai selesai | Selepas butang diklik | Sempadan bertukar warna ke `var(--check-done)` dengan kelegapan rendah |
| Butang tema | Klik | Tiada animasi — hanya pertukaran kelas segera pada `<html>` |

---

## 6. Sistem Tiga Mod Tema — Pelaksanaan Teknikal

### 6.1 Strategi Pelaksanaan
- Semua warna dalam `style.css` menggunakan rujukan `var(--nama)`.
- Tiada kod warna keras (`#hex`) kecuali dalam definisi `:root` dan kelas tema.
- Tema lalai (`theme-dark`) digunakan jika tiada pilihan disimpan.
- Pilihan tema disimpan dalam `localStorage` → `quran_prefs.theme`.

### 6.2 Fungsi JavaScript (dalam `app.js`)

```js
function applyTheme(name) {
  document.documentElement.classList.remove('theme-day', 'theme-dark', 'theme-coffee');
  document.documentElement.classList.add(`theme-${name}`);
  prefs.theme = name;
  localStorage.setItem('quran_prefs', JSON.stringify(prefs));
}

function cycleTheme() {
  const themes = ['dark', 'day', 'coffee'];
  const current = prefs.theme || 'dark';
  const next = themes[(themes.indexOf(current) + 1) % themes.length];
  applyTheme(next);
  updateThemeButton(next);
}
```

### 6.3 Butang Kawalan Tema (dalam `index.html`)
```html
<button id="themeToggle" class="theme-btn" title="Tukar tema">🌙</button>
```
- Ikon butang berubah mengikut tema aktif: 🌙 (dark) / ☀️ (day) / ☕ (coffee).
- Gaya butang: Monokrom, tiada latar, sempadan halus `var(--gold-muted)`, `border-radius: 50%`.

### 6.4 Kesan terhadap Prestasi
| Aspek | Impak |
|-------|-------|
| Muat turun tambahan | **Sifar** — semua CSS dalam satu fail |
| DOM | **Satu kelas** pada `<html>` ditukar |
| Service Worker | **Tiada perubahan** — cache berjalan seperti biasa |
| localStorage | **Tiada migrasi** — `quran_prefs` sedia ada dikembangkan |

---

## 7. PWA & Ikon Aplikasi

### 7.1 Ikon Aplikasi
- **Latar:** `#080808` (kekal malap untuk semua tema — ikon adalah identiti, bukan antara muka).
- **Teks:** "QFS" dalam warna emas `#c9a86c`.
- **Fon:** `Courier New`, tebal.
- **Saiz:** Dijana pada `192x192` dan `512x512`.

### 7.2 Meta Tema
```html
<meta name="theme-color" content="#080808">
```
Nilai `theme-color` kekal malap tanpa mengira mod tema aktif — ini adalah warna cangkerang pelayar (tab bar) yang sesuai dengan identiti gelap aplikasi.

---

## 8. Inspirasi Visual

- Terminal Linux yang gelap tetapi selesa (*cool-retro-term*).
- Reka bentuk *reader mode* Safari yang menyembunyikan seluruh UI.
- Suasana *mus-haf* fizikal di atas rehal kayu di bawah cahaya lampu malap.
- Aplikasi meditasi dan penulisan bebas gangguan (*zen mode*).
- Warna kopi susu waktu senja — *cottagecore* Islamik untuk tema Coffee-Beige.

---

## 9. Protokol Non-Destructive untuk Ciri Visual Masa Depan

Sebarang penambahan visual baharu MESTI mematuhi peraturan berikut:

1. **Dilarang menambah fail CSS baharu** — semua gaya masuk ke dalam `style.css` sedia ada.
2. **Dilarang menambah pustaka animasi** — hanya CSS transitions.
3. **Dilarang mengubah struktur DOM** untuk tujuan visual semata-mata.
4. **Semua warna mesti melalui pembolehubah CSS** — tiada kod warna keras di luar definisi tema.
5. **Setiap tema baharu mesti diuji pada ketiga-tiga mod sedia ada** untuk memastikan tiada kebocoran warna.

---

## 10. Senarai Semak Pelaksanaan Tema (Untuk Pembangun)

Sebelum menghantar kod yang melibatkan tema:

- [ ] Adakah semua warna dalam `style.css` menggunakan `var(--...)`?
- [ ] Adakah ketiga-tiga kelas tema (`.theme-dark`, `.theme-day`, `.theme-coffee`) mentakrifkan semua pembolehubah?
- [ ] Adakah `applyTheme()` dipanggil semasa permulaan aplikasi?
- [ ] Adakah butang tema berfungsi dan ikonnya berubah?
- [ ] Adakah tema disimpan dan dipulihkan dengan betul dari `localStorage`?
- [ ] Adakah kontras teks mencukupi pada ketiga-tiga tema? (Gunakan alat seperti WebAIM Contrast Checker)

---

*Dokumen ini adalah kompas visual untuk semua pembangun. Setiap piksel mesti diuji dengan satu soalan: Adakah ini menambah ketenangan atau mengurangkannya?*  
*Rujuk `ARCHITECTURE.md` untuk aliran data dan `PROTOCOL.md` untuk disiplin kod.*
