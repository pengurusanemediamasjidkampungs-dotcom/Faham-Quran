# ARCHITECTURE.md — Quran-Flash-System  
**Static JSON + PWA | Offline-First | Zero-Server Runtime**

## 1. Data Flow & Data Constraints

### 1.1 Aliran Data

Semua teks Al-Quran (Arab, terjemahan Bahasa Melayu, terjemahan Bahasa Inggeris) dibekukan dalam fail JSON statik di dalam direktori `data/`. Tiada pangkalan data pelayan. Proses pembinaan dilakukan sekali (one-time build) melalui skrip eksport yang menghasilkan struktur berikut:

```
[Al-Quran Cloud API]
        |
scripts/export_quran_json.py   (menghasilkan fail statik)
        |
/data/
  surah_list.json              metadata 114 surah
  001.json ... 114.json        ayat penuh setiap surah
        |
Service Worker (sw.js)         intercept semua fetch, strategi cache-first
        |
app.js                         fetch & parse JSON, simpan di state.verses
        |
renderCard()                   suntikan DOM ke #chat
```

Aliran runtime:
1. Halaman dibuka → `app.js` membaca `localStorage` untuk sesi terakhir, menetapkan `state.currentSurah`.
2. `loadSurah(id)` memanggil `fetch('data/{id}.json')`.
3. `sw.js` menyampuk permintaan; jika ada dalam cache, pulangkan serta-merta; jika tiada, ambil dari rangkaian dan simpan ke cache.
4. JSON yang diterima distrukturkan semula ke dalam `state.verses` (array objek ayat dengan kunci `ayah`, `arabic`, `ms`, `en`).
5. `renderCard()` menjana kad ayat berdasarkan `state.verses` dan bahasa yang dipilih, dengan penanda status baca dari `localStorage`.

### 1.2 Kekangan Data (Read-Only Immutable)

- **Semua fail dalam `data/` adalah sumber kebenaran kanun (canonical source of truth) dan bersifat baca sahaja.**  
  Tiada fungsi aplikasi – sama ada `app.js`, `sw.js`, atau mana-mana modul masa depan – dibenarkan menulis, mengubah, atau menstruktur semula sebarang fail di bawah `data/`. Fail-fail ini dianggap kekal selepas eksport awal.

- **Skema JSON adalah beku (frozen).**  
  Struktur berikut tidak boleh diubah oleh kod masa jalan:
  ```json
  {
    "id": <nombor>,
    "name": "<nama Arab>",
    "name_en": "<nama Rumi>",
    "revelation": "Meccan | Medinan",
    "ayat": [
      { "ayah": <nombor>, "arabic": "...", "ms": "...", "en": "..." }
    ]
  }
  ```
  Sebarang keperluan untuk data terbitan (contoh: penapisan ayat, penggabungan terjemahan tambahan) mesti dilaksanakan dalam ingatan (in-memory) atau dalam `sessionStorage`, dan tidak boleh disimpan semula ke dalam fail asal.

- **Aplikasi mesti berfungsi sepenuhnya tanpa panggilan API luaran semasa runtime.**  
  Semua kandungan Al-Quran telah dibakar ke dalam bundel JSON. Sistem tidak dibenarkan bergantung kepada perkhidmatan luar untuk teks utama. Semua ciri bacaan, navigasi, carian, dan statistik beroperasi hanya menggunakan data dari `data/`.

## 2. Component Structure

Sistem terdiri daripada empat fail teras yang sempadan tanggungjawabnya dipisahkan secara ketat:

| Fail | Tanggungjawab | Tidak Pernah Menyentuh |
|------|---------------|------------------------|
| `index.html` | Struktur DOM, meta tag, `<link>` ke CSS, `<script>` ke JS, pendaftaran Service Worker | Logik perniagaan, penggayaan, pengurusan cache |
| `style.css` | Semua persembahan visual – palet warna, tipografi, jarak, transisi, titik putus responsif. Mematuhi `DESIGN.md` sepenuhnya. | Struktur DOM, pemuatan data, pengendalian acara |
| `app.js` | Keadaan aplikasi (`state`), pemuatan JSON (`loadSurah()`), pemaparan (`renderCard()`), pengendali acara, bacaan/tulis `localStorage`, pintasan papan kekunci | Fail JSON pada cakera, kelas CSS (hanya menogol), pengurusan cache SW |
| `sw.js` | Pemeriksaan permintaan rangkaian, strategi cache-first, pra-cache, versi cache (`quran-v{n}`) | Manipulasi DOM, keadaan aplikasi, `localStorage` |

### Hubungan Antara Komponen
- `index.html` menyediakan cangkerang; ia tidak mengandungi logik perniagaan. Pendaftaran SW berlaku dalam `<script>` kecil sebaris.
- `app.js` adalah pengawal tunggal: ia membaca `state` dari `localStorage`, memuatkan surah melalui `fetch()`, memanggil fungsi pemaparan, dan memasang pendengar acara pada butang dan papan kekunci.
- `style.css` menggunakan kelas untuk tema gelap monokrom; `app.js` hanya menogol kelas (contoh: `surah-completed`) tanpa menghasilkan gaya sebaris.
- `sw.js` bertindak sebagai proksi telus: ia tidak tahu apa-apa tentang kandungan aplikasi selain URL yang perlu dicache. Versi cache ditentukan oleh pemalar di dalam `sw.js`.

## 3. State Integrity (Keutuhan Keadaan)

Semua keadaan pengguna dipegang secara eksklusif dalam `localStorage` di bawah tiga kunci berikut. Tiada data kemajuan dihantar ke pelayan.

| Kunci | Jenis | Keterangan |
|-------|-------|------------|
| `quran_read_log` | `Record<"surah:ayah", boolean>` | Penanda ayat yang telah selesai dibaca (contoh: `"1:5": true`) |
| `quran_last_session` | `{ surah, from, to, lang }` | Memulihkan paparan terakhir semasa halaman dibuka semula |
| `quran_prefs` | `{ lang, theme }` | Keutamaan pengguna (tema sentiasa `dark`, tetapi disimpan untuk kemungkinan penambahan masa depan) |

### Jaminan Keutuhan

1. **`localStorage` adalah lapisan ketekalan tunggal.**  
   Data progres tidak pernah mengubah suai fail JSON asal. Log bacaan adalah tindanan (overlay) berasingan – ia tidak menambah atau mengubah suai teks Quran dalam ingatan.

2. **Pemulihan sesi adalah tanpa keadaan (stateless).**  
   Apabila `DOMContentLoaded`, `app.js` membaca `quran_last_session`, menetapkan `state`, lalu memanggil `loadSurah()`. JSON dimuatkan semula (dari cache SW), dan kad dipaparkan. Fail asal tidak disentuh.

3. **Log bacaan tidak mencemari data kanun.**  
   Fungsi `isAyahRead(surah, ayah)` hanya menyemak kewujudan kunci di dalam objek `quran_read_log`. Objek `state.verses` tidak pernah diubah untuk mengandungi bendera "dibaca". Penanda visual (tanda semak emas) dijana oleh `renderCard()` dengan menyemak `localStorage` – ini adalah pemisahan rapi antara data dan persembahan.

4. **Tiada risiko migrasi data.**  
   Menghapuskan `localStorage` hanya menetapkan semula kemajuan pengguna; ia tidak menjejaskan integriti Al-Quran yang disimpan di `data/`. Memulihkan kemajuan bermakna hanya membaca semula fail statik – tanpa langkah pemulihan pangkalan data.

## 4. PWA / Offline Architecture

### Strategi Service Worker: Cache-First

```
Permintaan aset ──> Cache API ──> dijumpai ──> respons segera (<5ms)
                         |
                       tiada
                         |
                    fetch(rangkaian) ──> berjaya ──> klon ke cache + respons
                         |
                        gagal
                         |
                   halaman luar talian (fallback)
```

Semua aset statik (HTML, CSS, JS, JSON, fon) dihidangkan melalui strategi ini. Fail surah JSON dianggap sebagai aset statik dan oleh itu disimpan dalam cache selepas lawatan pertama, membolehkan bacaan luar talian sepenuhnya.

### Populasi Cache

| Fasa | Mekanisme | Kandungan |
|------|-----------|-----------|
| **Install** | `install` event dalam `sw.js` | Cangkerang HTML, CSS, JS, `surah_list.json`, semua fail surah Juz 30 (pilihan) |
| **Runtime** | `fetch` handler (cache-first) | Semua fail surah lain, dicache secara malas apabila dilawati |
| **Activate** | `activate` event | Membuang cache lama (contoh: `quran-v1`) apabila versi SW bertukar |

Cache dinamakan `quran-v{versi utama}` (contoh: `quran-v1`). Apabila sebarang perubahan penting pada skema JSON atau cangkerang aplikasi berlaku, nombor versi ditambah dalam `sw.js`. Event `activate` akan memadam semua cache yang tidak sepadan dengan versi semasa.

### Jaminan Luar Talian

Selepas satu lawatan penuh (semua 114 surah sekurang-kurangnya sekali diakses), keseluruhan aplikasi adalah mandiri sepenuhnya dalam Cache API. Tiada permintaan rangkaian diperlukan untuk sebarang ciri: membaca, menavigasi, mencari, melihat sejarah, atau mengubah keutamaan. Aplikasi berfungsi sama ada disambungkan ke internet atau tidak.

## 5. Integration Rules (Protokol Non-Destructive)

Sebarang penambahan ciri masa depan MESTI mematuhi peraturan berikut untuk mengekalkan kestabilan seni bina dan falsafah minimalis:

### Peraturan 1 — Data Mentah Tidak Boleh Diubah
Tiada fungsi, modul, atau langkah binaan boleh mengubah suai fail dalam `data/` selepas eksport awal. Jika data perlu diperkaya (contoh: menambah tafsir, pautan audio, atau terjemahan tambahan), ia mesti diletakkan dalam direktori baharu yang terpisah (contoh: `data-augmented/`, `audio/`) tanpa mengubah skema asal.

### Peraturan 2 — Ciri Tambahan Mesti Bersifat Tambahan (Append-Only)
- Komponen UI baru masuk ke dalam `index.html` sedia ada (tiada fail HTML tambahan).
- Varian gaya visual masuk ke dalam `style.css`.
- Sumber data baharu masuk sebagai fail JSON baru di bawah `data/` (jangan ubah yang sedia ada).
- Strategi cache baru hanya dalam `sw.js`, tidak memintas logik cache-first yang ada.

### Peraturan 3 — Tiada Kebergantungan Pelayan Wajib
Sebarang ciri yang memerlukan pelayan (API call, WebSocket, proses backend) mestilah bersifat pilihan (opt-in) dan merosot dengan anggun. Pengalaman membaca teras mesti kekal berfungsi sepenuhnya tanpa sambungan rangkaian. Ciri yang disokong pelayan – jika ada – harus dibolehkan melalui pemeriksaan keupayaan dalam `app.js`.

### Peraturan 4 — Tiada Langkah Binaan (Build Step)
Projek mesti kekal sebagai fail sumber yang boleh disampaikan terus (HTML, CSS, JS, JSON). Jika sesuatu ciri memerlukan kompilasi, penggabungan, atau penjanaan kod, ia mesti diasingkan ke dalam skrip di `scripts/` yang dijalankan secara manual (sekali sahaja) – bukan sebahagian daripada rantaian kebergantungan runtime.

### Peraturan 5 — localStorage Sebagai Sumber Tunggal Keadaan Pengguna
Semua keutamaan, kemajuan bacaan, dan data sesi pengguna mesti disimpan dalam `localStorage`. Tiada ciri yang memperkenalkan pangkalan data jauh, sistem akaun pengguna, atau penyegerakan awan sebagai keperluan utama. Jika penyegerakan ditambah kemudian, ia mestilah lapisan pilihan di atas `localStorage`, bukan pengganti.

---

*Dokumen ini adalah sumber kebenaran seni bina. Sebarang kod yang melanggar kekangan ini mesti ditolak semasa semakan.*
