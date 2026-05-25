# PROTOCOL.md — Quran-Flash-System  
**Standard Kod, Protokol Pembangunan, dan Peraturan Integriti Sistem**

## 1. Prinsip Teras (Tidak Boleh Dikompromi)

| Prinsip | Penguatkuasaan |
|--------|----------------|
| **Vanilla First** | Semua logik aplikasi menggunakan JavaScript ES6+ tulen. Sebarang pustaka luaran (jQuery, React, Vue, Lodash, dsb.) adalah DILARANG kecuali diluluskan secara bertulis oleh arkitek. Tiada kebergantungan *runtime*. |
| **Zero Server Dependency** | Aplikasi mesti berfungsi sepenuhnya tanpa pelayan di belakang. Semua data berasal dari fail statik `data/*.json` dan dicache oleh Service Worker. Tiada panggilan ke `localhost`, API awan, atau pangkalan data. |
| **Read-Only Data Sanctity** | Direktori `data/` adalah suci. Kod *runtime* TIDAK PERNAH menulis, mengubah suai, atau menjana semula sebarang fail di dalamnya. Skema JSON (lihat `ARCHITECTURE.md`) adalah beku. |
| **Minimalist Footprint** | Kod hendaklah padat, langsung, dan bebas daripada abstraksi berlebihan. Fungsi yang melebihi 25 baris (tanpa komen) wajar disemak semula. Fail baharu hanya dibuat jika benar‑benar tidak dapat dimuatkan dalam fail sedia ada. |
| **Offline-First** | Semua ciri utama (baca, navigasi, penanda, sejarah) mesti berfungsi dalam mod luar talian selepas lawatan pertama. Rujuk `sw.js` – **cache-first dengan fallback halaman luar talian**. |
| **Non-Destructive Evolution** | Sebarang penambahan ciri tidak dibenarkan mengubah struktur `data/*.json` atau memecahkan fungsi sedia ada. Tambahan adalah *append-only* – lihat `ARCHITECTURE.md` Peraturan 2. |

---

## 2. Konvensyen Kod (Code Conventions)

### 2.1 Penamaan
- `camelCase` untuk semua pembolehubah dan fungsi.  
  Contoh: `loadSurah()`, `currentSurah`, `ayahCount`.
- Pemalar global (versi cache, nama kunci `localStorage`) ditulis `UPPER_SNAKE_CASE`.  
  Contoh: `CACHE_NAME`, `KEY_READ_LOG`.
- Fail JSON menggunakan nombor surah sebagai nama (`001.json` hingga `114.json`). Tiada pengecualian.

### 2.2 Pengurusan Ralat (Contoh Wajib)
Setiap operasi `fetch()` yang memuatkan fail JSON **MESTI** dibalut dalam blok `try/catch`:
```js
async loadSurah(id) {
  try {
    const res = await fetch(`data/${String(id).padStart(3, '0')}.json`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (e) {
    console.error(`Gagal muat surah ${id}:`, e);
    this.showToast('Surah tidak dapat dimuatkan.');
    return null;
  }
}
```
Aplikasi tidak boleh *crash* senyap; sebarang ralat mesti dipaparkan kepada pengguna melalui UI (bukan `alert()`), contohnya teks merah pada kad.

### 2.3 Delegasi Peristiwa (Event Delegation)
Elakkan melekatkan pendengar pada setiap elemen secara individu. Gunakan delegasi pada kontena kekal (`#chat` atau `document`):
```js
document.getElementById('chat').addEventListener('click', (e) => {
  if (e.target.classList.contains('mark-read')) {
    this.markAyahRead(e.target.dataset.surah, e.target.dataset.ayah);
  }
});
```
Ini menjimatkan memori dan memastikan elemen yang dijana semula (selepas render) masih responsif.

### 2.4 Manipulasi DOM
- Hasilkan HTML menggunakan *template literal* ES6 untuk kejelasan dan prestasi.
- **JANGAN** gunakan `innerHTML` untuk memasukkan data pengguna; data daripada `data/*.json` dianggap selamat (teks Al-Quran), namun jika ciri carian melibatkan input pengguna, teks tersebut mesti *escaped* dengan `textContent` atau fungsi sanitasi.
- Selepas `innerHTML` diisi, komponen UI yang memerlukan rujukan langsung boleh di-*cache* dalam pembolehubah (elakkan `querySelector` berulang dalam gelung).

### 2.5 Keadaan Aplikasi (State)
Gunakan satu objek `state` global di dalam `app.js` (atau modul setara) yang diisytihar di bahagian atas:
```js
const state = {
  currentSurah: 1,
  fromAyah: 1,
  toAyah: 7,
  lang: 'ms',            // 'ms' | 'en' | 'ar'
  verses: [],            // cache ayat semasa
};
```
Sebarang bacaan/tulisan ke `localStorage` dilakukan melalui fungsi pembantu (`loadReadLog()`, `saveReadLog()`, dsb.), bukan terus merata kod.

---

## 3. Protokol Data (Data Protocols)

### 3.1 Integriti JSON
- **Baca sahaja (`read-only`).** Fungsi aplikasi hanya menggunakan `fetch('data/...')`. Tiada `fs.writeFile`, tiada `import` yang mengubah suai objek, dan tiada penyimpanan semula ke fail.
- **Pemalar skema (data/).** Skema fail di `data/` adalah beku — lihat `ARCHITECTURE.md` untuk definisi medan.
- **Data tafsir (data-tafsir/).** Semua data tafsir diletakkan di direktori berasingan `data-tafsir/{edition}/{id}.json` dan **tidak** menambah kunci pada fail `data/*.json`. Edisi yang diiktiraf:
  - `muyassar/` — Tafsir Al-Muyassar (Arab moden, ringkas)
  - `jalalayn/` — Tafsir Al-Jalalayn (Arab klasik)
  - `ar-ibn-kathir/` — Tafsir Ibn Kathir (Arab, daripada Quran.com API v4)
  - `en-ibn-kathir/` — Tafsir Ibn Kathir (Inggeris, daripada Quran.com API v4)
- Peta tafsir disimpan dalam pemalar `TAFSIR_EDITIONS` di `app.js`.
- **Pengesahan semasa pembinaan.** Skrip binaan (`scripts/export_*.py`) bertanggungjawab memastikan setiap fail JSON sah. Kod runtime tidak perlu mengulangi pengesahan skema (kecuali untuk memeriksa kehadiran kunci minimum).

### 3.2 Ketekalan Keadaan Pengguna (Kunci Sah)
- Semua progres bacaan dan keutamaan pengguna dipegang dalam **`localStorage`** di bawah tiga kunci yang ditakrifkan dalam `ARCHITECTURE.md`.
- **Tidak dibenarkan** menggunakan `sessionStorage` untuk data yang perlu kekal merentas sesi.
- Jangan sekali-kali menulis data progres kembali ke fail `data/` – ini adalah pelanggaran mutlak.
- Hanya tiga kunci berikut dibenarkan dalam `localStorage`:
  - `quran_read_log` – Objek `{ "surah:ayah": true }`. Elakkan tatasusunan atau struktur bersarang.
  - `quran_last_session` – Objek `{ surah, from, to, lang }`.
  - `quran_prefs` – Objek `{ lang, theme }`.
- Sebarang kunci lain dalam `localStorage` adalah pelanggaran protokol.

### 3.3 Migrasi Data
- Apabila struktur `localStorage` berubah (jarang sekali), sediakan fungsi migrasi dalam `app.js` yang berjalan **sekali** semasa permulaan dan menukar format lama ke baharu.
- Versi skema `localStorage` boleh disimpan dalam kunci `quran_storage_version`. Jika versi tidak sepadan, jalankan migrasi.

---

## 4. Peraturan Pelaksanaan UI/UX

### 4.1 Penggayaan
- Gunakan **CSS Grid** atau **Flexbox** untuk susun atur. Jangan gunakan kerangka CSS luaran (Bootstrap, Tailwind).
- Semua nilai warna mesti diambil daripada pembolehubah CSS (`:root`) yang dinamakan mengikut peranan (contoh: `--clr-bg`, `--clr-text-primary`, `--clr-gold`). Tiada kod warna keras.
- Transisi dan animasi terhad kepada `transition: opacity 0.3s ease, transform 0.3s ease`. Tiada animasi yang mengganggu tumpuan.
- Tipografi: Teks Arab menggunakan fon `UthmanicHafs` atau `Amiri`; teks terjemahan dan UI menggunakan fon monospace (contoh: `'JetBrains Mono', monospace`). Saiz dan *line-height* selaras dengan `DESIGN.md`.

### 4.2 Interaksi
- Semua interaksi (klik, dua kali klik, tekan kekunci) mesti mempunyai maklum balas visual segera (contoh: perubahan ikon, perubahan warna, `scale(1.02)` dalam masa 200ms).
- Pengendali kekunci `ArrowLeft`, `ArrowRight`, `Space` didaftarkan pada `document`, tetapi **mesti** menyemak bahawa fokus bukan pada elemen input (contoh: `<input>` carian) untuk mengelak konflik.
- Butang "Selesai" dinyahtifkan sementara (300ms) selepas ditekan untuk mengelakkan log berganda.

### 4.3 Mod Luar Talian
- Indikator status sambungan **tidak wajib** kerana aplikasi berfungsi 100% luar talian. Namun jika dikehendaki, ia boleh ditambah sebagai penunjuk kecil yang tidak mengganggu (contoh: ikon Wi‑Fi di penjuru).
- Jika `fetch` gagal dan data tiada dalam cache, paparkan kad dengan mesej "Surah tidak dapat dimuatkan. Sila cuba lagi apabila dalam talian." – jangan gunakan `alert`.

---

## 5. Protokol Service Worker & PWA

### 5.1 Strategi Cache
- **Cache-First** untuk semua aset statik: HTML, CSS, JS, JSON, fon.
- **Precache semasa `install`**: `index.html`, `style.css`, `app.js`, `sw.js` sendiri, `surah_list.json`, dan surah-surah Juz 30 (pilihan). Fail lain dicache semasa lawatan pertama.
- Nama cache mengikut corak `quran-v{MAJOR}` (contoh: `quran-v1`). Nombor `MAJOR` ditambah apabila skema JSON berubah atau berlaku perubahan besar pada cangkerang aplikasi.

### 5.2 Pengurusan Versi
- `sw.js` MESTI mengandungi pemalar `CACHE_NAME` yang dikemas kini secara manual apabila aset berubah.
- Dalam event `activate`, padam semua cache yang tidak sepadan dengan `CACHE_NAME` semasa.
- Jangan sekali-kali menukar `CACHE_NAME` secara dinamik semasa runtime.

### 5.3 Fallback Luar Talian
- Jika permintaan gagal dan tiada dalam cache, SW boleh menyajikan halaman `/offline.html` yang ringkas (jika ada), atau sekadar membiarkan ralat disebarkan ke `fetch` untuk dikendalikan oleh `app.js`.
- Pendaftaran SW dalam `index.html` mesti menggunakan `navigator.serviceWorker.register('sw.js')` dengan pengendalian ralat.

---

## 6. Struktur Fail dan Penamaan

Struktur minimum projek (selain `README.md`, `CHANGELOG.md`):

```
/
├── index.html
├── style.css
├── app.js
├── sw.js
├── manifest.json
├── data/                    (Quran + terjemahan — skema beku)
│   ├── surah_list.json      (metadata 114 surah)
│   └── 001..114.json        (6,236 ayat × 3 bahasa)
├── data-tafsir/             (tafsir — dimuat on-demand, tidak precache)
│   ├── muyassar/
│   │   └── 001..114.json    (Tafsir Al-Muyassar Arab)
│   └── jalalayn/
│       └── 001..114.json    (Tafsir Al-Jalalayn Arab)
├── scripts/                 (alat binaan sekali, tidak digunakan runtime)
│   ├── export_quran_json.py (data utama)
│   └── export_tafsir_json.py (data tafsir)
├── assets/
│   ├── fonts/               (fon tempatan)
│   └── icons/               (PWA icons)
└── CHANGELOG.md
```

Tiada subdirektori untuk komponen atau modul – semuanya diakar untuk kesederhanaan. Jika aplikasi berkembang melebihi ~500 baris JS, barulah dibenarkan pemisahan modul dengan `type="module"`, tetapi masih tanpa *bundler*.

---

## 7. Senarai Semak Ujian & Penghantaran

Sebelum kod dihantar atau digabungkan:

1. **Ujian Minimalis**  
   - Adakah terdapat kebergantungan baharu? Jika ya, adakah ia benar‑benar perlu?  
   - Bolehkah fungsi itu ditulis dalam < 30 baris vanilla?

2. **Integriti Data**  
   - Adakah kod runtime cuba menulis ke `data/`? (Cari `fs`, `write`, `import` yang meminda)  
   - Adakah semua progres disimpan di `localStorage` dengan kunci yang diiktiraf?

3. **Kefungsian Luar Talian**  
   - Putuskan sambungan internet, muat semula halaman. Adakah bacaan, navigasi, dan penanda berfungsi?  
   - Semak dalam DevTools > Application > Cache Storage – adakah cache mengandungi fail JSON yang diperlukan?

4. **Pematuhan UI**  
   - Adakah transisi menggunakan `0.3s` atau seperti yang ditetapkan?  
   - Adakah tema gelap digunakan tanpa kebocoran mod terang?  
   - Adakah semua teks menggunakan fon monospace yang betul?

5. **Dokumentasi**  
   - Jika ciri baharu, `CHANGELOG.md` dikemaskini dengan ringkasan perubahan.  
   - Jika perubahan mempengaruhi `ARCHITECTURE.md` atau `PROTOCOL.md`, kemas kini dokumen tersebut dalam cabang yang sama.

---

## 8. Protokol Pengemaskinian dan Pengedaran

- Versi cache (`CACHE_NAME`) di dalam `sw.js` mesti dinaikkan secara manual apabila:
  - Sebarang fail di bawah `data/` berubah.
  - `index.html`, `style.css`, atau `app.js` menerima perubahan ketara.
- Elakkan pengemaskinian automatik (contoh: *hash* dalam nama fail) kerana kita ingin mengekalkan kesederhanaan.
- Pengedaran boleh dilakukan dengan hanya menyalin keseluruhan direktori ke pelayan statik. Tiada proses CI/CD kompleks diperlukan.

---

## 9. Etika Kod dan Larangan Tegas

- **DILARANG** memasukkan *API key*, token, atau kata laluan dalam mana-mana fail sumber. Projek ini menggunakan data awam.
- **DILARANG** menggunakan `eval()`, `new Function()`, atau kaedah pelaksanaan kod dinamik.
- **DILARANG** menggunakan `document.write()`.
- **DILARANG** memaut ke mana-mana CDN luaran untuk fon atau aset – semua mesti disertakan tempatan dalam `assets/`.
- **DILARANG** menambah pustaka analitis, pengiklanan, atau penjejak. Fokus mutlak pada pembaca Al-Quran yang bersih.

---

*Protokol ini adalah kontrak sosial projek. Setiap pembangun bertanggungjawab mematuhinya dan menegakkannya dalam ulasan kod (code review). Sebarang pelanggaran yang disengajakan adalah alasan untuk penolakan sumbangan.*  

*Rujuk `ARCHITECTURE.md` untuk butiran aliran data dan `DESIGN.md` untuk falsafah reka bentuk.*

---

## 10. Prosedur Penilaian Ciri Baharu

Sebelum menulis kod untuk ciri baharu, jawab soalan berikut:

1. **Adakah ia memerlukan fail JSON baharu dalam `data/`?**  
   Jika ya, adakah skrip binaan (`scripts/export_quran_json.py`) telah dikemas kini?

2. **Adakah ia memerlukan kebergantungan pelayan?**  
   Jika ya, ia mesti *opt-in* (dimatikan secara lalai) dan merosot dengan anggun (*graceful degradation*).

3. **Adakah ia menambah lebih 30 baris ke `app.js`?**  
   Jika ya, bolehkah ia diasingkan ke modul berasingan? (Nota: pemisahan modul hanya dibenarkan jika `app.js` melebihi ~500 baris.)

4. **Adakah ia mematuhi `DESIGN.md`?**  
   Jika tidak, dapatkan kelulusan bertulis daripada arkitek sebelum meneruskan.

Hanya selepas keempat-empat soalan dijawab dengan memuaskan, pembangunan boleh dimulakan.
