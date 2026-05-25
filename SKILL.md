# Quran-Flash-System — Technical Architecture (Static JSON + PWA)
**Pendekatan tanpa pelayan pangkalan data. Fokus pada kelajuan, ketenangan, dan tadabbur luar talian.**

## 1. Data Architecture – Dari PostgreSQL ke Fail JSON Statik
Kami meninggalkan PostgreSQL sepenuhnya demi **static JSON API** – setiap surah disimpan sebagai fail tersendiri di dalam direktori `data/`. Pendekatan ini menghapuskan keperluan pelayan pangkalan data, membolehkan aplikasi berfungsi sepenuhnya sebagai laman statik.

### Struktur Fail
```
/data/
  surah_list.json        # Metadata ringkas 114 surah (nama, nombor, bilangan ayat)
  001.json               # Surah Al-Fatihah
  002.json               # Surah Al-Baqarah
  ...
  114.json               # Surah An-Nas
```

### Skema Data Setiap Fail Surah
```json
{
  "id": 1,
  "name": "الفاتحة",
  "name_en": "Al-Fatiha",
  "revelation": "Meccan",
  "ayat": [
    {
      "ayah": 1,
      "arabic": "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ",
      "ms": "Dengan nama Allah, Yang Maha Pemurah lagi Maha Mengasihani.",
      "en": "In the name of God, the Most Gracious, the Most Merciful."
    }
  ]
}
```
- Fail `surah_list.json` dimuatkan **sekali sahaja** semasa permulaan aplikasi.
- Fail surah individu dimuatkan secara **lazy** hanya apabila diperlukan (navigasi ke surah baharu).

### Kelebihan
- **Tiada panggilan API rangkaian:** Semua data di-cache oleh Service Worker selepas muatan pertama.
- **Pemasangan PWA:** Keseluruhan Quran dalam format JSON muat dalam storan peranti tanpa memerlukan pelayan.
- **Mudah dikemas kini:** Gantikan fail JSON secara atomik tanpa migrasi pangkalan data.

## 2. Performance Layer – Service Worker & Strategi Cache-First
`sw.js` bertindak sebagai tulang belakang prestasi dan keupayaan luar talian.

### Strategi Caching
```js
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(cached => {
      return cached || fetch(event.request).then(response => {
        // Simpan salinan untuk kegunaan luar talian
        return caches.open('quran-v1').then(cache => {
          cache.put(event.request, response.clone());
          return response;
        });
      });
    })
  );
});
```
- **Cache-First:** Untuk semua aset statik (HTML, CSS, JS, JSON, fon).
- **Network-first untuk `/api/`?** Tidak wujud – tiada panggilan API langsung; data JSON dianggap aset statik.

### Proses Pemasangan Service Worker
- Senarai fail JSON surah (semasa `install` event) dimuatkan secara progresif. Hanya surah yang kerap diakses di-*precache* (contoh: Juz 30) untuk pengalaman pertama yang lebih pantas.
- Muatan penuh 114 surah hanya berlaku apabila pengguna menjelajah aplikasi, sambil SW menyimpan setiap fail yang dilawati.

### Impak Prestasi
- **Masa muat ayat:** < 100ms dari cache, tiada latency rangkaian.
- **Luar talian sepenuhnya:** Aplikasi berfungsi 100% tanpa internet selepas cache awal, sesuai untuk suasana tadabbur tanpa gangguan.

## 3. UI/UX Implementation – Bagaimana `app.js` Menghidupkan `DESIGN.md`
Komponen antara muka dibina sepenuhnya dalam Vanilla JS dengan falsafah "setiap piksel melayani teks".

### Navigasi dan State
```js
let state = {
  currentSurah: 1,
  fromAyah: 1,
  toAyah: 7,
  lang: 'ms',          // 'ms' | 'en' | 'ar'
  verses: [],          // cache ayat yang sedang dipaparkan
  readLog: {}          // objek { "1:1": true } dari localStorage
};
```
- `loadSurah(surahId)` mengambil fail JSON yang sepadan (jika belum dalam memori), mengisi `state.verses`, dan memanggil `renderCard()`.
- **Transisi lembut:** `renderCard()` menggunakan `opacity` dan `transform: translateY` yang ditukar melalui kelas CSS, selari dengan DESIGN.md – tiada animasi mengejut.
- **Navigasi papan kekunci (Arrow, Space):** Didaftarkan secara global, mengubah `state.fromAyah`/`toAyah` atau surah secara automatik. Kesan "floating card" dicapai dengan `container.innerHTML` yang hanya memaparkan kad aktif tanpa skrol.
- **Indikator Selesai:** Ketukan dua kali atau ruang menukar ikon kepada tanda semak emas dengan `transform: scale(1.05)` selama 200ms – maklum balas fizikal halus yang tidak mengganggu.

### Sokongan kepada Estetika Minimalis
- Tiada elemen UI yang tidak perlu. Butang navigasi muncul hanya pada hover atau fokus (jika diingini).
- Background hitam sepenuhnya, teks monospace untuk terjemahan, dan font Uthmani yang dimuatkan melalui `@font-face`. Semua gaya diletakkan dalam CSS tunggal tanpa rangka kerja luaran.

## 4. State Persistence – `localStorage` untuk Pengalaman Seamless
Progres bacaan dan keutamaan pengguna disimpan secara kekal di sisi klien tanpa sebarang panggilan pelayan.

### Skema localStorage
```
quran_read_log: {"1:1":true, "1:2":true, ...}
quran_last_session: {"surah":1, "from":1, "to":7, "lang":"ms"}
quran_prefs: {"lang":"ms","theme":"dark"}
```
- **Auto-save:** Setiap kali ayat ditandakan selesai (klik/double-click/space), objek `readLog` dikemaskini dan disimpan ke `localStorage` serta-merta.
- **Pemulihan sesi:** Semasa permulaan, aplikasi membaca `quran_last_session` dan terus memaparkan surah dan julat ayat terakhir. Pengguna tidak perlu menavigasi semula.
- **Sinkronisasi UI:** Fungsi `isAyahRead(surah, ayah)` memeriksa `readLog` untuk menayangkan ikon semak emas pada ayat yang telah dibaca, memberikan kepuasan visual tanpa kelewatan.

### Integriti Data
- Semua data progres adalah setempat. Tiada risiko kehilangan isyarat rangkaian.
- `localStorage` dianggap sumber utama; jika aplikasi dibuka di peranti lain, cache tempatan kekal bebas (selaras dengan prinsip minimalis tanpa pendaftaran pengguna).

## 5. Aliran Kerja Pembangun
1. **Sediakan fail JSON:** Skrip penukaran satu kali (dari pangkalan data asal atau API Al-Quran Cloud) menjana struktur `data/` di atas.
2. **Pasang PWA:** Letakkan fail di mana-mana pelayan statik (Netlify, GitHub Pages, atau `localhost`). `sw.js` akan didaftarkan secara automatik.
3. **Mulakan pembangunan:** Edit `app.js`, `style.css`, dan `sw.js` secara langsung. Tiada langkah binaan (no build step).

---

**Nota untuk Pembangun:**
*"SKILL.md ini adalah pelan tindakan teknikal. Setiap kod yang dihasilkan mesti mematuhi dua prinsip: data dari JSON statik, dan interaksi yang membawa ketenangan. Jika sebarang cadangan menambah kebergantungan baru atau melambatkan muat, ia perlu ditolak."*

*Arkitektur ini membuktikan bahawa aplikasi Al-Quran yang berkuasa tidak memerlukan kerumitan — hanya disiplin dan fokus.*
