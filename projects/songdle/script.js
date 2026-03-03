(function () {
  'use strict';

  var CLIP_DURATIONS = [0.1, 0.5, 2, 4, 8, 16]; // seconds per level
  var MAX_GUESSES = 6;
  var API_BASE = window.SONGDLE_API || (location.hostname === 'localhost' ? 'http://localhost:3000' : '');

  // ── DOM refs ─────────────────────────────────────────────────────────────────
  var slotsEl      = document.getElementById('guessSlots');
  var timelineEl   = document.getElementById('timeline');
  var labelEl      = document.getElementById('timelineLabel');
  var playBtn      = document.getElementById('playBtn');
  var searchInput  = document.getElementById('searchInput');
  var dropdownEl   = document.getElementById('autocompleteList');
  var skipBtn      = document.getElementById('skipBtn');
  var statusMsg    = document.getElementById('statusMsg');
  var resultBanner = document.getElementById('resultBanner');
  var resultTitle  = document.getElementById('resultTitle');
  var resultSong   = document.getElementById('resultSong');
  var genreTabs    = document.querySelectorAll('.tab');

  // ── State ─────────────────────────────────────────────────────────────────────
  var state = {
    genre:       'all',
    song:        null,   // { name, artist }
    songs:       [],     // [{name, artist, genre}] for autocomplete
    level:       0,      // 0–5
    guesses:     [],     // [{text, status}]
    done:        false,
    won:         false,
    today:       '',
    audio:       null,
    playing:     false,
    highlighted: -1,
  };

  // ── Helpers ───────────────────────────────────────────────────────────────────
  function getToday() {
    return new Date().toISOString().slice(0, 10);
  }

  function storageKey(genre) {
    return 'songdle_' + genre + '_' + state.today;
  }

  function saveState() {
    try {
      localStorage.setItem(storageKey(state.genre), JSON.stringify({
        level:      state.level,
        guesses:    state.guesses,
        done:       state.done,
        won:        state.won,
        songName:   state.song ? state.song.name   : null,
        songArtist: state.song ? state.song.artist : null,
      }));
    } catch (e) {}
  }

  function loadSavedState(genre) {
    try {
      var raw = localStorage.getItem('songdle_' + genre + '_' + state.today);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }

  function normalize(s) {
    return String(s).toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, ' ').trim();
  }

  function escHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function isCorrect(selected) {
    if (!state.song) return false;
    return normalize(selected.name)   === normalize(state.song.name) &&
           normalize(selected.artist) === normalize(state.song.artist);
  }

  function isCloseArtist(selected) {
    if (!state.song) return false;
    return normalize(selected.artist) === normalize(state.song.artist);
  }

  // ── Render ────────────────────────────────────────────────────────────────────
  function renderSlots() {
    slotsEl.innerHTML = '';
    for (var i = 0; i < MAX_GUESSES; i++) {
      var div = document.createElement('div');
      var g = state.guesses[i];
      if (g) {
        div.className = 'slot ' + g.status;
        div.textContent = g.text;
      } else {
        div.className = 'slot';
      }
      slotsEl.appendChild(div);
    }
  }

  function renderTimeline() {
    var total = CLIP_DURATIONS.reduce(function (a, b) { return a + b; }, 0);
    timelineEl.innerHTML = '';
    for (var i = 0; i < CLIP_DURATIONS.length; i++) {
      var seg = document.createElement('div');
      seg.className = 'timeline-seg' + (i < state.level ? ' unlocked' : '');
      seg.style.flexGrow = String(CLIP_DURATIONS[i]);
      timelineEl.appendChild(seg);
    }
    var played = 0;
    for (var j = 0; j < state.level; j++) played += CLIP_DURATIONS[j];
    var pct = (played / total) * 100;
    labelEl.style.left = pct + '%';
    var dur = CLIP_DURATIONS[Math.min(state.level, CLIP_DURATIONS.length - 1)];
    labelEl.textContent = dur + 's';
  }

  function renderTabs() {
    genreTabs.forEach(function (tab) {
      tab.classList.toggle('active', tab.dataset.genre === state.genre);
    });
  }

  function setStatus(msg, isError) {
    statusMsg.textContent = msg || '';
    statusMsg.className = 'status-msg' + (isError ? ' error' : '');
  }

  function setInputEnabled(enabled) {
    searchInput.disabled = !enabled;
    skipBtn.disabled     = !enabled;
    if (!enabled) hideDropdown();
  }

  function showResult(won, songName, songArtist) {
    resultBanner.hidden = false;
    resultTitle.textContent = won
      ? 'You got it in ' + state.guesses.length + (state.guesses.length === 1 ? ' guess!' : ' guesses!')
      : 'Better luck tomorrow!';
    resultSong.innerHTML = 'The song was <strong>' + escHtml(songArtist) + ' \u2013 ' + escHtml(songName) + '</strong>';
  }

  // ── Autocomplete ──────────────────────────────────────────────────────────────
  function getFilteredPool() {
    var q = searchInput.value.trim().toLowerCase();
    if (!q) return [];
    var pool = state.genre === 'all'
      ? state.songs
      : state.songs.filter(function (s) { return s.genre === state.genre; });
    return pool.filter(function (s) {
      return s.name.toLowerCase().includes(q) || s.artist.toLowerCase().includes(q);
    }).slice(0, 8);
  }

  function showDropdown(items) {
    dropdownEl.innerHTML = '';
    if (items.length === 0) { dropdownEl.hidden = true; return; }
    items.forEach(function (item) {
      var li = document.createElement('li');
      li.setAttribute('role', 'option');
      var nameEl = document.createElement('span');
      nameEl.className = 'song-name';
      nameEl.textContent = item.name;
      var artistEl = document.createElement('span');
      artistEl.className = 'song-artist';
      artistEl.textContent = item.artist;
      li.appendChild(nameEl);
      li.appendChild(artistEl);
      li.addEventListener('mousedown', function (e) {
        e.preventDefault();
        submitGuess(item);
      });
      dropdownEl.appendChild(li);
    });
    state.highlighted = -1;
    dropdownEl.hidden = false;
  }

  function hideDropdown() {
    dropdownEl.hidden = true;
    state.highlighted = -1;
  }

  function highlightItem(idx) {
    var items = dropdownEl.querySelectorAll('li');
    items.forEach(function (li, i) {
      li.classList.toggle('highlighted', i === idx);
    });
    if (idx >= 0 && items[idx]) items[idx].scrollIntoView({ block: 'nearest' });
  }

  searchInput.addEventListener('input', function () {
    showDropdown(getFilteredPool());
  });

  searchInput.addEventListener('keydown', function (e) {
    var items = dropdownEl.querySelectorAll('li');
    if (dropdownEl.hidden || items.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      state.highlighted = Math.min(state.highlighted + 1, items.length - 1);
      highlightItem(state.highlighted);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      state.highlighted = Math.max(state.highlighted - 1, -1);
      highlightItem(state.highlighted);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (state.highlighted >= 0) {
        var pool = getFilteredPool();
        if (pool[state.highlighted]) submitGuess(pool[state.highlighted]);
      }
    } else if (e.key === 'Escape') {
      hideDropdown();
    }
  });

  searchInput.addEventListener('blur', function () {
    setTimeout(hideDropdown, 150);
  });

  // ── Game Logic ────────────────────────────────────────────────────────────────
  function submitGuess(selected) {
    hideDropdown();
    searchInput.value = '';
    if (state.done) return;

    var status = isCorrect(selected) ? 'correct' : (isCloseArtist(selected) ? 'close' : 'wrong');
    var text = selected.artist + ' \u2013 ' + selected.name;
    state.guesses.push({ text: text, status: status });
    state.level = Math.min(state.level + 1, CLIP_DURATIONS.length - 1);

    // Invalidate cached audio so next play fetches the new duration
    if (state.audio) {
      state.audio.pause();
      state.audio = null;
    }
    setPlayIcon(false);

    renderSlots();
    renderTimeline();
    setStatus('');

    if (status === 'correct') {
      win();
    } else if (state.guesses.length >= MAX_GUESSES) {
      lose();
    } else {
      saveState();
    }
  }

  function skipGuess() {
    if (state.done) return;
    state.guesses.push({ text: 'Skipped', status: 'skipped' });
    state.level = Math.min(state.level + 1, CLIP_DURATIONS.length - 1);
    if (state.audio) { state.audio.pause(); state.audio = null; }
    setPlayIcon(false);
    renderSlots();
    renderTimeline();
    if (state.guesses.length >= MAX_GUESSES) {
      lose();
    } else {
      saveState();
    }
  }

  function win() {
    state.done = true; state.won = true;
    setInputEnabled(false);
    playBtn.disabled = false;
    saveState();
    showResult(true, state.song.name, state.song.artist);
  }

  function lose() {
    state.done = true; state.won = false;
    setInputEnabled(false);
    playBtn.disabled = false;
    saveState();
    showResult(false, state.song.name, state.song.artist);
  }

  // ── Audio ─────────────────────────────────────────────────────────────────────
  function getStreamUrl() {
    return API_BASE + '/api/songdle-stream'
      + '?date='  + encodeURIComponent(state.today)
      + '&genre=' + encodeURIComponent(state.genre);
  }

  function setPlayIcon(playing) {
    state.playing = playing;
    playBtn.innerHTML = playing
      ? '<svg viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>'
      : '<svg class="icon-play" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>';
  }

  function playClip() {
    if (!state.song) return;
    if (state.playing && state.audio) {
      state.audio.pause();
      setPlayIcon(false);
      return;
    }

    var url = getStreamUrl();
    var dur = state.done ? 30 : CLIP_DURATIONS[state.level];
    var stopTimer;

    if (!state.audio) {
      state.audio = new Audio(url);
    }
    state.audio.currentTime = 0;

    // Loading indicator
    playBtn.disabled = true;
    playBtn.innerHTML = '<svg viewBox="0 0 24 24" style="opacity:0.5"><path d="M8 5v14l11-7z"/></svg>';

    state.audio.play()
      .then(function () {
        playBtn.disabled = false;
        setPlayIcon(true);
        stopTimer = setTimeout(function () {
          if (state.audio) state.audio.pause();
          setPlayIcon(false);
        }, dur * 1000);
      })
      .catch(function () {
        playBtn.disabled = false;
        setPlayIcon(false);
        setStatus('Could not play audio. Try again.', true);
      });

    state.audio.onended = function () {
      clearTimeout(stopTimer);
      setPlayIcon(false);
    };
  }

  // ── Genre switching ───────────────────────────────────────────────────────────
  function switchGenre(genre) {
    if (genre === state.genre) return;
    saveState();
    if (state.audio) { state.audio.pause(); state.audio = null; }
    setPlayIcon(false);
    playBtn.disabled = true;
    setInputEnabled(false);
    resultBanner.hidden = true;
    state.genre = genre;
    renderTabs();

    var saved = loadSavedState(genre);
    state.level   = saved ? (saved.level   || 0) : 0;
    state.guesses = saved ? (saved.guesses || []) : [];
    state.done    = saved ? (saved.done    || false) : false;
    state.won     = saved ? (saved.won     || false) : false;
    state.song    = null;

    renderSlots();
    renderTimeline();
    setStatus('Loading...');
    fetchDailySong();
  }

  // ── Data fetching ─────────────────────────────────────────────────────────────
  function fetchSongs() {
    return fetch(API_BASE + '/api/songdle-songs')
      .then(function (r) { return r.json(); })
      .then(function (data) { state.songs = Array.isArray(data) ? data : []; })
      .catch(function () { state.songs = []; });
  }

  function fetchDailySong() {
    var url = API_BASE + '/api/soundcloud-daily'
      + '?date='  + encodeURIComponent(state.today)
      + '&genre=' + encodeURIComponent(state.genre);

    return fetch(url)
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(function (data) {
        if (!data || !data.song) throw new Error('No song data');
        state.song = data.song;
        playBtn.disabled = false;

        if (state.done) {
          showResult(state.won, state.song.name, state.song.artist);
          setInputEnabled(false);
        } else {
          setInputEnabled(true);
        }
        setStatus('');
      })
      .catch(function (err) {
        setStatus('Could not load today\'s song. ' + (err && err.message ? err.message : ''), true);
      });
  }

  // ── Event listeners ───────────────────────────────────────────────────────────
  playBtn.addEventListener('click', playClip);
  skipBtn.addEventListener('click', skipGuess);

  genreTabs.forEach(function (tab) {
    tab.addEventListener('click', function () { switchGenre(tab.dataset.genre); });
  });

  // ── Init ──────────────────────────────────────────────────────────────────────
  state.today = getToday();
  state.genre = 'all';

  var saved = loadSavedState('all');
  state.level   = saved ? (saved.level   || 0) : 0;
  state.guesses = saved ? (saved.guesses || []) : [];
  state.done    = saved ? (saved.done    || false) : false;
  state.won     = saved ? (saved.won     || false) : false;

  renderSlots();
  renderTimeline();
  renderTabs();
  setStatus('Loading...');

  fetchSongs().then(function () { return fetchDailySong(); });

})();
