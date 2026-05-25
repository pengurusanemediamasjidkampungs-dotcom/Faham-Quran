# Changelog

## 1.1.0 (2026-05-26)

- Added Tafsir Ibn Kathir (Arabic + English) from Quran.com v4 API.
- New tafsir editions: `ar-ibn-kathir` (6,205 ayah), `en-ibn-kathir` (6,236 ayah).

## 1.0.0 (2026-05-26)

- Initial release — Static JSON + PWA architecture.
- 114 surah, 6236 ayah with Arabic (Uthmani), Malay (Basmeih), English (Asad).
- Offline-first: all data served from local `data/*.json` files via Service Worker.
- Dark theme, monospace font, gold accent.
- Instagram-style flashcard UI with ayah-level read logging.
- Keyboard navigation (ArrowLeft, ArrowRight, Space).
- Search surah by name or number.
- Read history and statistics tabs.
- Zero runtime server dependencies.
