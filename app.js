const KEY_READ_LOG = 'quran_read_log';
const KEY_PREFS = 'quran_prefs';

const prefs = JSON.parse(localStorage.getItem(KEY_PREFS) || '{}');

const THEME_ICONS = { dark: '\uD83C\uDF19', day: '\u2600\uFE0F', coffee: '\u2615' };
const THEME_CYCLE = ['dark', 'day', 'coffee'];

function applyTheme(name) {
  document.documentElement.classList.remove('theme-dark', 'theme-day', 'theme-coffee');
  document.documentElement.classList.add('theme-' + name);
  prefs.theme = name;
  localStorage.setItem(KEY_PREFS, JSON.stringify(prefs));
  const btn = document.getElementById('themeToggle');
  if (btn) btn.textContent = THEME_ICONS[name];
}

function cycleTheme() {
  const current = prefs.theme || 'dark';
  const next = THEME_CYCLE[(THEME_CYCLE.indexOf(current) + 1) % THEME_CYCLE.length];
  applyTheme(next);
}

function loadTheme() {
  const saved = prefs.theme || 'dark';
  applyTheme(saved);
}

const TAFSIR_EDITIONS = { 'tafsir-muyassar': 'muyassar', 'tafsir-jalalayn': 'jalalayn', 'tafsir-ar-ibn-kathir': 'ar-ibn-kathir', 'tafsir-en-ibn-kathir': 'en-ibn-kathir' };

const state = {
  currentSurah: 1,
  fromAyah: 1,
  toAyah: 7,
  lang: 'ms',
  verses: [],
  tafsirVerses: [],
  surahList: [],
  surahs: {},
  readLog: JSON.parse(localStorage.getItem(KEY_READ_LOG) || '{}'),
  tab: 'read',
};

const $ = id => document.getElementById(id);

function loadReadLog() {
  state.readLog = JSON.parse(localStorage.getItem(KEY_READ_LOG) || '{}');
}

function saveReadLog() {
  localStorage.setItem(KEY_READ_LOG, JSON.stringify(state.readLog));
}

function isAyahRead(surah, ayah) {
  return !!state.readLog[`${surah}:${ayah}`];
}

function markAyahRead(surah, ayah) {
  state.readLog[`${surah}:${ayah}`] = true;
  saveReadLog();
  renderVerses();
  updateUI();
}

function markRangeRead(surah, from, to) {
  for (let a = from; a <= to; a++) {
    state.readLog[`${surah}:${a}`] = true;
  }
  saveReadLog();
  renderVerses();
  updateUI();
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function getReadHistory() {
  const entries = [];
  for (const [key] of Object.entries(state.readLog)) {
    const [surah, ayah] = key.split(':').map(Number);
    entries.push({ surah, ayah, key });
  }
  entries.sort((a, b) => {
    if (a.surah !== b.surah) return a.surah - b.surah;
    return a.ayah - b.ayah;
  });
  return entries;
}

function getReadCount() {
  return Object.keys(state.readLog).length;
}

function getUniqueSurahsRead() {
  const set = new Set();
  for (const key of Object.keys(state.readLog)) {
    set.add(key.split(':')[0]);
  }
  return set.size;
}

function getReadDays() {
  return 1;
}

function getTopSurahs() {
  const counts = {};
  for (const key of Object.keys(state.readLog)) {
    const surah = key.split(':')[0];
    counts[surah] = (counts[surah] || 0) + 1;
  }
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
}

function updateUI() {
  const s = state.surahs[state.currentSurah];
  const name = s ? `${s.nameAr} (${s.name})` : `Surah ${state.currentSurah}`;
  const maxAyat = s?.versesCount || Infinity;

  $('surahName').textContent = name;
  $('ayahInfo').textContent = `Ayat ${state.fromAyah}-${Math.min(state.toAyah, maxAyat)}`;
  $('revelation').textContent = s ? s.revelation : '';
  $('surahInput').value = state.currentSurah;
  $('ayahFrom').value = state.fromAyah;
  $('ayahTo').value = state.toAyah;
  $('langSelect').value = state.lang;
  $('readCount').textContent = getReadCount();
}

async function loadSurahList() {
  try {
    const res = await fetch('data/surah_list.json');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    state.surahList = await res.json();
    state.surahs = {};
    for (const s of state.surahList) {
      state.surahs[s.id] = s;
    }
    return true;
  } catch (err) {
    console.error('Gagal muat surah_list.json:', err);
    return false;
  }
}

function isTafsirMode() {
  return state.lang in TAFSIR_EDITIONS;
}

async function loadVerses() {
  state.verses = [];
  state.tafsirVerses = [];
  const id = String(state.currentSurah).padStart(3, '0');
  $('selesaiBtn').disabled = true;

  try {
    const [ayahRes] = await Promise.all([
      fetch(`data/${id}.json`),
      isTafsirMode()
        ? fetch(`data-tafsir/${TAFSIR_EDITIONS[state.lang]}/${id}.json`).catch(() => null)
        : Promise.resolve(null),
    ]);

    if (!ayahRes.ok) throw new Error(`HTTP ${ayahRes.status}`);
    state.verses = await ayahRes.json();

    if (isTafsirMode()) {
      const tafsirRes = await fetch(`data-tafsir/${TAFSIR_EDITIONS[state.lang]}/${id}.json`);
      if (tafsirRes.ok) {
        state.tafsirVerses = await tafsirRes.json();
      }
    }

    updateUI();
    renderVerses();
    $('selesaiBtn').disabled = false;
  } catch (err) {
    console.error(`Gagal muat data/${id}.json:`, err);
    $('chat').innerHTML = `<div class="empty"><span>⚠</span><p>Gagal muat ayat.<br><small>${err.message}</small></p></div>`;
  }
}

function renderVerses() {
  const chat = $('chat');
  chat.innerHTML = '';
  if (state.verses.length === 0) {
    chat.innerHTML = '<div class="empty"><span>📖</span><p>Tiada ayat. Pilih surah lain.</p></div>';
    return;
  }

  const from = state.fromAyah;
  const to = state.toAyah;
  const s = state.surahs[state.currentSurah];
  const maxAyat = s?.versesCount || Infinity;
  const actualTo = Math.min(to, maxAyat);

  for (let i = from - 1; i < actualTo && i < state.verses.length; i++) {
    const v = state.verses[i];
    const ayahNum = v.ayah;
    const key = `${state.currentSurah}:${ayahNum}`;
    const read = isAyahRead(state.currentSurah, ayahNum);

    const card = document.createElement('div');
    card.className = 'card' + (read ? ' card-read' : '');
    card.dataset.key = key;
    card.dataset.surah = state.currentSurah;
    card.dataset.ayah = ayahNum;

    const translation = state.lang === 'none' ? '' :
      (state.lang === 'en' ? v.translationEn :
       isTafsirMode() ? (state.tafsirVerses[i]?.tafsir || '') :
       v.translationMs);

    card.innerHTML = `
      <div class="card-meta">
        <span class="badge">${state.currentSurah}:${ayahNum}</span>
        <span class="check-btn${read ? ' checked' : ''}" data-key="${key}">${read ? '\u2713' : '\u25CB'}</span>
      </div>
      <div class="arabic">${v.arabic}</div>
      ${translation ? `<div class="translation">${translation}</div>` : ''}
    `;

    chat.appendChild(card);
  }

  chat.scrollTop = 0;
}

function switchTab(tab) {
  $('readTab').style.display = tab === 'read' ? 'flex' : 'none';
  $('historyTab').style.display = tab === 'history' ? 'block' : 'none';
  $('statsTab').style.display = tab === 'stats' ? 'block' : 'none';
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
  state.tab = tab;
  if (tab === 'history') renderHistory();
  if (tab === 'stats') renderStats();
}

function renderHistory() {
  const panel = $('historyPanel');
  const entries = getReadHistory();
  if (entries.length === 0) {
    panel.innerHTML = '<div class="empty"><span>📭</span><p>Belum ada sejarah bacaan.</p></div>';
    return;
  }

  const grouped = {};
  for (const e of entries) {
    const label = `${e.surah}:${e.ayah}`;
    if (!grouped[label]) grouped[label] = [];
    grouped[label].push(e);
  }

  let html = '';
  const labels = Object.keys(grouped).sort((a, b) => {
    const [sa, aa] = a.split(':').map(Number);
    const [sb, ab] = b.split(':').map(Number);
    return sa !== sb ? sa - sb : aa - ab;
  }).reverse();

  for (const label of labels.slice(0, 200)) {
    const [surahId, ayahNum] = label.split(':').map(Number);
    const name = state.surahs[surahId]?.name || `Surah ${surahId}`;
    html += `<div class="hist-item">
      <span class="hist-badge">${surahId}:${ayahNum}</span>
      <span class="hist-name">${name}</span>
    </div>`;
  }
  panel.innerHTML = html;
}

function renderStats() {
  const panel = $('statsPanel');
  const totalAyat = getReadCount();
  const uniqueSurahs = getUniqueSurahsRead();
  const totalDays = getReadDays();
  const topSurah = getTopSurahs();

  let html = `<div class="stats-grid">
    <div class="stat-card"><span class="stat-num">${totalAyat}</span><span class="stat-label">Ayat dibaca</span></div>
    <div class="stat-card"><span class="stat-num">${uniqueSurahs}</span><span class="stat-label">Surah</span></div>
    <div class="stat-card"><span class="stat-num">${totalDays}</span><span class="stat-label">Hari</span></div>
  </div>`;
  if (topSurah.length > 0) {
    html += '<div class="stat-list"><h4>Top Surah:</h4>';
    for (const [s, c] of topSurah) {
      const name = state.surahs[parseInt(s)]?.name || `Surah ${s}`;
      html += `<div class="stat-row"><span>${name}</span><span>${c} ayat</span></div>`;
    }
    html += '</div>';
  }
  panel.innerHTML = html;
}

function handleChatClick(e) {
  const btn = e.target.closest('.check-btn');
  if (btn) {
    const key = btn.dataset.key;
    const [surah, ayah] = key.split(':').map(Number);
    if (!isAyahRead(surah, ayah)) {
      markAyahRead(surah, ayah);
      showToast(`\u2713 ${key}`, 'ok');
    }
  }
}

function handleSelesai() {
  if ($('selesaiBtn').disabled) return;
  const s = state.surahs[state.currentSurah];
  const maxAyat = s?.versesCount || Infinity;
  const to = Math.min(state.toAyah, maxAyat);
  markRangeRead(state.currentSurah, state.fromAyah, to);
  const count = to - state.fromAyah + 1;
  $('selesaiBtn').disabled = true;
  showToast(`\u2713 ${count} ayat direkodkan`, 'ok');
  setTimeout(() => { $('selesaiBtn').disabled = false; }, 300);
}

function searchSurah(q) {
  const ql = q.toLowerCase();
  for (const s of state.surahList) {
    if (s.name.toLowerCase().includes(ql) || s.nameAr.includes(q) || String(s.id) === q) {
      state.currentSurah = s.id;
      state.fromAyah = 1;
      state.toAyah = Math.min(7, s.versesCount);
      loadVerses();
      $('searchInput').value = '';
      return;
    }
  }
  showToast('Surah tidak dijumpai', 'err');
}

function showToast(msg, type) {
  const el = $('toast');
  el.textContent = msg;
  el.className = 'toast ' + (type || '');
  el.classList.add('show');
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove('show'), 2200);
}

function bindInputs() {
  $('surahInput').addEventListener('change', () => {
    const v = parseInt($('surahInput').value) || 1;
    state.currentSurah = Math.max(1, Math.min(114, v));
    state.fromAyah = 1;
    const maxAyat = state.surahs[state.currentSurah]?.versesCount || 7;
    state.toAyah = Math.min(7, maxAyat);
    loadVerses();
  });

  $('ayahFrom').addEventListener('change', () => {
    const s = state.surahs[state.currentSurah];
    state.fromAyah = Math.max(1, parseInt($('ayahFrom').value) || 1);
    if (s) state.fromAyah = Math.min(state.fromAyah, s.versesCount);
    if (state.fromAyah > state.toAyah) state.toAyah = state.fromAyah;
    loadVerses();
  });

  $('ayahTo').addEventListener('change', () => {
    const s = state.surahs[state.currentSurah];
    state.toAyah = Math.max(state.fromAyah, parseInt($('ayahTo').value) || state.fromAyah);
    if (s) state.toAyah = Math.min(state.toAyah, s.versesCount);
    loadVerses();
  });

  $('langSelect').addEventListener('change', () => {
    const oldLang = state.lang;
    state.lang = $('langSelect').value;
    if (isTafsirMode() || oldLang in TAFSIR_EDITIONS) {
      loadVerses();
    } else {
      renderVerses();
    }
  });

  $('prevBtn').addEventListener('click', () => {
    const chunk = state.toAyah - state.fromAyah + 1;
    if (state.fromAyah > 1) {
      state.fromAyah = Math.max(1, state.fromAyah - chunk);
      const maxAyat = state.surahs[state.currentSurah]?.versesCount || state.toAyah;
      state.toAyah = Math.min(state.fromAyah + chunk - 1, maxAyat);
    } else if (state.currentSurah > 1) {
      state.currentSurah--;
      state.fromAyah = 1;
      state.toAyah = Math.min(7, state.surahs[state.currentSurah]?.versesCount || 7);
    }
    loadVerses();
  });

  $('nextBtn').addEventListener('click', () => {
    const s = state.surahs[state.currentSurah];
    const maxAyat = s?.versesCount || 7;
    const chunk = state.toAyah - state.fromAyah + 1;
    if (state.toAyah < maxAyat) {
      state.fromAyah = Math.min(state.toAyah + 1, maxAyat);
      state.toAyah = Math.min(state.fromAyah + chunk - 1, maxAyat);
    } else if (state.currentSurah < 114) {
      state.currentSurah++;
      state.fromAyah = 1;
      state.toAyah = Math.min(7, state.surahs[state.currentSurah]?.versesCount || 7);
    }
    loadVerses();
  });

  $('searchBtn').addEventListener('click', () => {
    const q = $('searchInput').value.trim();
    if (q) searchSurah(q);
  });

  $('searchInput').addEventListener('keydown', e => {
    if (e.key === 'Enter') $('searchBtn').click();
  });

  $('clearHistory').addEventListener('click', () => {
    if (confirm('Padam semua sejarah bacaan?')) {
      state.readLog = {};
      localStorage.removeItem(KEY_READ_LOG);
      $('readCount').textContent = '0';
      renderHistory();
      showToast('Sejarah dipadam', 'ok');
    }
  });

  document.addEventListener('keydown', e => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
    if (e.key === 'ArrowLeft') $('prevBtn').click();
    if (e.key === 'ArrowRight') $('nextBtn').click();
    if (e.key === ' ') { e.preventDefault(); handleSelesai(); }
  });

  document.getElementById('chat').addEventListener('click', handleChatClick);
}

async function init() {
  $('selesaiBtn').addEventListener('click', handleSelesai);

  document.querySelectorAll('.tab-btn').forEach(b => {
    b.addEventListener('click', () => switchTab(b.dataset.tab));
  });

  const ok = await loadSurahList();
  if (!ok) {
    $('surahName').textContent = '\u26A0 Data tidak tersedia';
    $('chat').innerHTML = '<div class="empty"><span>\u26A0</span><p>Gagal memuat data surah.<br><small>Pastikan data/surah_list.json wujud.</small></p></div>';
    return;
  }

  loadTheme();
  const toggleBtn = document.getElementById('themeToggle');
  if (toggleBtn) toggleBtn.addEventListener('click', cycleTheme);

  bindInputs();

  const s = state.surahs[state.currentSurah];
  if (s) state.toAyah = Math.min(7, s.versesCount);

  await loadVerses();
  updateUI();
}

document.addEventListener('DOMContentLoaded', init);
