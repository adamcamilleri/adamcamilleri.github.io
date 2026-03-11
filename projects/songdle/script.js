(function () {
  'use strict';

  var CLIP_DURATIONS = [0.1, 0.5, 2, 4, 8, 16]; // seconds per level
  var MAX_GUESSES = 6;
  var API_BASE = window.SONGDLE_API || (location.hostname === 'localhost' ? 'http://localhost:3000' : '');

  // ── DOM refs ─────────────────────────────────────────────────────────────────
  var slotsEl       = document.getElementById('guessSlots');
  var timelineEl    = document.getElementById('timeline');
  var labelEl       = document.getElementById('timelineLabel');
  var playBtn       = document.getElementById('playBtn');
  var volumeSlider  = document.getElementById('volumeSlider');
  var searchInput   = document.getElementById('searchInput');
  var dropdownEl    = document.getElementById('autocompleteList');
  var skipBtn       = document.getElementById('skipBtn');
  var statusMsg     = document.getElementById('statusMsg');
  var resultBanner  = document.getElementById('resultBanner');
  var resultTitle   = document.getElementById('resultTitle');
  var resultSong    = document.getElementById('resultSong');
  var spotifyEmbedEl = document.getElementById('spotifyEmbed');
  var nextSongBtn   = document.getElementById('nextSongBtn');
  var genreTabs     = document.querySelectorAll('.tab');
  var statsBtn      = document.getElementById('statsBtn');
  var statsModal    = document.getElementById('statsModal');
  var statsCloseBtn = document.getElementById('statsClose');
  var statsNumbers  = document.getElementById('statsNumbers');
  var statsDistEl      = document.getElementById('statsDistribution');
  var artistFilterBar  = document.getElementById('artistFilterBar');
  var artistFilterBtn  = document.getElementById('artistFilterBtn');
  var hintBtn          = document.getElementById('hintBtn');
  var hintDisplay      = document.getElementById('hintDisplay');
  var shareBtn         = document.getElementById('shareBtn');
  var modeSubtitle     = document.getElementById('modeSubtitle');
  var artistPickerModal = document.getElementById('artistPickerModal');
  var artistPickerClose = document.getElementById('artistPickerClose');
  var artistSearchInput = document.getElementById('artistSearchInput');
  var artistPickerList  = document.getElementById('artistPickerList');

  // ── State ─────────────────────────────────────────────────────────────────────
  var state = {
    genre:           'all',
    song:            null,   // { id, name, artist, spotifyId, youtubeId, startOffset }
    songs:           [],     // [{id, name, artist, genre, spotifyId, youtubeId, startOffset}]
    level:           0,      // 0–5
    guesses:         [],     // [{text, status}]
    done:            false,
    won:             false,
    today:           '',
    audio:           null,   // fallback HTMLAudioElement (songs without youtubeId)
    playing:         false,
    highlighted:     -1,
    // Unlimited mode
    sessionPlayed:   [],     // ids played this session (to avoid repeats)
    // Artist filter & hint
    artistFilter:    null,   // null = all artists, string = filter to one artist
    hintUsed:        false,
  };

  // ── YouTube IFrame player ─────────────────────────────────────────────────────
  var ytPlayer       = null;
  var ytReady        = false;
  var ytCurrentSongId = null;  // song.id currently loaded in the player
  var ytClipTimer    = null;
  var ytIntentPlay   = false;  // true = we initiated playback, suppress accidental autoplay

  window.onYouTubeIframeAPIReady = function () {
    ytPlayer = new YT.Player('ytPlayer', {
      height: '1', width: '1', videoId: '',
      playerVars: { autoplay: 0, controls: 0, disablekb: 1, fs: 0, iv_load_policy: 3, rel: 0 },
      events: {
        onReady: function () {
          ytReady = true;
          ytPlayer.setVolume(getVolume() * 100);
        },
        onStateChange: function (e) {
          if (e.data === YT.PlayerState.PLAYING) {
            if (!ytIntentPlay) { ytPlayer.pauseVideo(); return; }
            playBtn.disabled = false;
            setPlayIcon(true);
            // Start the clip timer from when audio actually begins
            clearTimeout(ytClipTimer);
            var dur = state.done ? 30 : CLIP_DURATIONS[state.level];
            var guardId = state.song ? state.song.id : null;
            ytClipTimer = setTimeout(function () {
              if (state.song && state.song.id === guardId) stopCurrentClip();
            }, dur * 1000);
          }
          if (e.data === YT.PlayerState.ENDED) {
            clearTimeout(ytClipTimer);
            setPlayIcon(false);
            ytIntentPlay = false;
          }
        },
        onError: function () {
          // YouTube can't play this video (embedding blocked, region restriction, etc.)
          // Fall back to the iTunes preview stream if available
          ytIntentPlay = false;
          playBtn.disabled = false;
          if (state.song && state.song.preview_url) {
            playFallback();
          } else {
            setStatus('Could not play audio. Try again.', true);
            setPlayIcon(false);
          }
        }
      }
    });
  };

  function isUnlimited() { return state.genre === 'unlimited'; }

  // ── Helpers ───────────────────────────────────────────────────────────────────
  function getToday() {
    return new Date().toISOString().slice(0, 10);
  }

  function storageKey(genre) {
    return 'songdle_' + genre + '_' + state.today;
  }

  function saveState() {
    if (isUnlimited()) return; // unlimited mode is session-only, not persisted
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
    if (genre === 'unlimited') return null;
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

  // ── Stats ─────────────────────────────────────────────────────────────────────
  function defaultStats() {
    return { played: 0, wins: 0, streak: 0, maxStreak: 0, lastDate: '', distribution: {'1':0,'2':0,'3':0,'4':0,'5':0,'6':0} };
  }

  function loadStats(genre) {
    try {
      var raw = localStorage.getItem('songdle_stats_' + genre);
      var s = raw ? JSON.parse(raw) : {};
      var d = defaultStats();
      return {
        played:       s.played    || 0,
        wins:         s.wins      || 0,
        streak:       s.streak    || 0,
        maxStreak:    s.maxStreak || 0,
        lastDate:     s.lastDate  || '',
        distribution: Object.assign({}, d.distribution, s.distribution || {}),
      };
    } catch (e) { return defaultStats(); }
  }

  function saveStats(genre, stats) {
    try {
      localStorage.setItem('songdle_stats_' + genre, JSON.stringify(stats));
    } catch (e) {}
  }

  function updateStats(genre, won, numGuesses) {
    var stats = loadStats(genre);
    if (stats.lastDate === state.today) return;
    stats.played += 1;
    var prev = new Date();
    prev.setDate(prev.getDate() - 1);
    var yesterday = prev.toISOString().slice(0, 10);
    if (won) {
      stats.wins += 1;
      var key = String(numGuesses);
      stats.distribution[key] = (stats.distribution[key] || 0) + 1;
      stats.streak = (stats.lastDate === yesterday) ? stats.streak + 1 : 1;
      stats.maxStreak = Math.max(stats.maxStreak, stats.streak);
    } else {
      stats.streak = 0;
    }
    stats.lastDate = state.today;
    saveStats(genre, stats);
  }

  function renderStats() {
    var genre = isUnlimited() ? 'all' : state.genre;
    var stats = loadStats(genre);
    var winPct = stats.played > 0 ? Math.round((stats.wins / stats.played) * 100) : 0;

    statsNumbers.innerHTML = [
      ['Played', stats.played],
      ['Win %', winPct],
      ['Streak', stats.streak],
      ['Max', stats.maxStreak],
    ].map(function (item) {
      return '<div class="stat-item">'
        + '<div class="stat-value">' + item[1] + '</div>'
        + '<div class="stat-label">' + item[0] + '</div>'
        + '</div>';
    }).join('');

    var distVals = [1, 2, 3, 4, 5, 6].map(function (i) { return stats.distribution[String(i)] || 0; });
    var max = Math.max.apply(null, [1].concat(distVals));
    var currentGuesses = (state.done && state.won) ? state.guesses.length : -1;

    statsDistEl.innerHTML = '';
    for (var i = 1; i <= 6; i++) {
      var count = stats.distribution[String(i)] || 0;
      var pct = Math.max(Math.round((count / max) * 100), 6);
      var row = document.createElement('div');
      row.className = 'dist-row';
      row.innerHTML = '<span class="dist-num">' + i + '</span>'
        + '<div class="dist-bar-wrap">'
        + '<div class="dist-bar' + (i === currentGuesses ? ' highlight' : '') + '" style="width:' + pct + '%">' + count + '</div>'
        + '</div>';
      statsDistEl.appendChild(row);
    }
  }

  function showStats() {
    renderStats();
    statsModal.hidden = false;
  }

  function hideStats() {
    statsModal.hidden = true;
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
    hintBtn.disabled     = !enabled || state.hintUsed;
    if (!enabled) hideDropdown();
  }

  function resetHint() {
    state.hintUsed = false;
    hintDisplay.hidden = true;
    hintDisplay.textContent = '';
    hintBtn.disabled = false;
  }

  function revealHint() {
    if (state.hintUsed || state.done || !state.song) return;
    state.hintUsed = true;
    hintBtn.disabled = true;
    hintDisplay.textContent = 'Artist: ' + state.song.artist;
    hintDisplay.hidden = false;
  }

  function shareResult() {
    var emojiMap = { correct: '\uD83D\uDFE9', close: '\uD83D\uDFE8', wrong: '\uD83D\uDFE5', skipped: '\u2B1B' };
    var grid = state.guesses.map(function (g) { return emojiMap[g.status] || '\u2B1B'; }).join('');
    var context;
    if (isUnlimited()) {
      context = state.artistFilter ? ('Unlimited \u00B7 ' + state.artistFilter) : 'Unlimited';
    } else {
      var label = state.genre === 'all' ? 'All' : (state.genre.charAt(0).toUpperCase() + state.genre.slice(1));
      context = label + ' \u00B7 ' + state.today;
    }
    var result = state.won ? (state.guesses.length + '/6') : 'X/6';
    var text = 'Songdle \uD83C\uDFB5 ' + context + '\n' + grid + ' ' + result + '\nadamcamilleri.com/songdle';
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () {
        var orig = shareBtn.textContent;
        shareBtn.textContent = 'Copied!';
        setTimeout(function () { shareBtn.textContent = orig; }, 2000);
      }).catch(function () { setStatus('Could not copy to clipboard', true); });
    } else {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.style.cssText = 'position:fixed;opacity:0';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); } catch (e) {}
      document.body.removeChild(ta);
      shareBtn.textContent = 'Copied!';
      setTimeout(function () { shareBtn.textContent = 'Share Result'; }, 2000);
    }
  }

  function updateArtistFilterBtn() {
    if (state.artistFilter) {
      artistFilterBtn.textContent = state.artistFilter + ' \u00D7';
      artistFilterBtn.classList.add('active');
      modeSubtitle.textContent = state.artistFilter;
      modeSubtitle.hidden = false;
      document.title = state.artistFilter + ' \u2013 Songdle';
    } else {
      artistFilterBtn.textContent = 'All Artists \u25BE';
      artistFilterBtn.classList.remove('active');
      modeSubtitle.hidden = true;
      document.title = 'Songdle \u2013 Guess the Song';
    }
  }

  function buildArtistList(filter) {
    var artistCounts = {};
    state.songs.forEach(function (s) {
      artistCounts[s.artist] = (artistCounts[s.artist] || 0) + 1;
    });
    var artists = Object.keys(artistCounts).sort();
    var q = filter ? filter.toLowerCase() : '';
    var filtered = q ? artists.filter(function (a) { return a.toLowerCase().indexOf(q) !== -1; }) : artists;

    artistPickerList.innerHTML = '';

    var allLi = document.createElement('li');
    allLi.className = 'all-artists-item' + (!state.artistFilter ? ' selected' : '');
    var allSpan = document.createElement('span');
    allSpan.textContent = 'All Artists';
    var allCount = document.createElement('span');
    allCount.className = 'artist-count';
    allCount.textContent = state.songs.length + ' songs';
    allLi.appendChild(allSpan);
    allLi.appendChild(allCount);
    allLi.addEventListener('click', function () { selectArtist(null); });
    artistPickerList.appendChild(allLi);

    filtered.forEach(function (artist) {
      var li = document.createElement('li');
      if (state.artistFilter === artist) li.classList.add('selected');
      var nameSpan = document.createElement('span');
      nameSpan.textContent = artist;
      var countSpan = document.createElement('span');
      countSpan.className = 'artist-count';
      countSpan.textContent = artistCounts[artist] + (artistCounts[artist] === 1 ? ' song' : ' songs');
      li.appendChild(nameSpan);
      li.appendChild(countSpan);
      li.addEventListener('click', (function (a) { return function () { selectArtist(a); }; })(artist));
      artistPickerList.appendChild(li);
    });
  }

  function openArtistPicker() {
    artistSearchInput.value = '';
    buildArtistList('');
    artistPickerModal.hidden = false;
    setTimeout(function () { artistSearchInput.focus(); }, 50);
  }

  function closeArtistPicker() {
    artistPickerModal.hidden = true;
  }

  function selectArtist(artist) {
    state.artistFilter = artist;
    state.sessionPlayed = [];
    closeArtistPicker();
    updateArtistFilterBtn();
    startUnlimitedSong();
  }

  function showResult(won, songName, songArtist) {
    resultBanner.hidden = false;
    resultTitle.textContent = won
      ? 'You got it in ' + state.guesses.length + (state.guesses.length === 1 ? ' guess!' : ' guesses!')
      : 'Better luck tomorrow!';
    resultSong.innerHTML = 'The song was <strong>' + escHtml(songArtist) + ' \u2013 ' + escHtml(songName) + '</strong>';
    nextSongBtn.hidden = !isUnlimited();

    // Show Spotify embed if song has a spotifyId
    if (state.song && state.song.spotifyId) {
      spotifyEmbedEl.innerHTML = '<iframe'
        + ' src="https://open.spotify.com/embed/track/' + encodeURIComponent(state.song.spotifyId) + '?utm_source=generator"'
        + ' width="100%" height="152" frameborder="0"'
        + ' allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"'
        + ' loading="lazy"></iframe>';
      spotifyEmbedEl.hidden = false;
    } else {
      spotifyEmbedEl.innerHTML = '';
      spotifyEmbedEl.hidden = true;
    }
  }

  // ── Autocomplete ──────────────────────────────────────────────────────────────
  function getFilteredPool() {
    var q = searchInput.value.trim().toLowerCase();
    if (!q) return [];
    var pool = (state.genre === 'all' || isUnlimited())
      ? state.songs
      : state.songs.filter(function (s) { return s.genre === state.genre; });
    if (isUnlimited() && state.artistFilter) {
      pool = pool.filter(function (s) { return s.artist === state.artistFilter; });
    }
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

    stopCurrentClip();

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
    stopCurrentClip();
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
    if (!isUnlimited()) updateStats(state.genre, true, state.guesses.length);
    saveState();
    showResult(true, state.song.name, state.song.artist);
    if (!isUnlimited()) setTimeout(showStats, 1800);
  }

  function lose() {
    state.done = true; state.won = false;
    setInputEnabled(false);
    playBtn.disabled = false;
    if (!isUnlimited()) updateStats(state.genre, false, state.guesses.length);
    saveState();
    showResult(false, state.song.name, state.song.artist);
    if (!isUnlimited()) setTimeout(showStats, 1800);
  }

  // ── Unlimited mode ────────────────────────────────────────────────────────────
  function pickUnlimitedSong() {
    var allInPool = state.artistFilter
      ? state.songs.filter(function (s) { return s.artist === state.artistFilter; })
      : state.songs;
    var pool = allInPool.filter(function (s) { return state.sessionPlayed.indexOf(s.id) === -1; });
    if (pool.length === 0) {
      state.sessionPlayed = [];
      pool = allInPool.slice();
    }
    var idx = Math.floor(Math.random() * pool.length);
    return pool[idx];
  }

  function startUnlimitedSong() {
    stopCurrentClip();

    state.level   = 0;
    state.guesses = [];
    state.done    = false;
    state.won     = false;
    resetHint();

    var song = pickUnlimitedSong();
    if (!song) {
      setStatus('No songs available.', true);
      return;
    }
    state.song = song;
    state.sessionPlayed.push(song.id);

    artistFilterBar.hidden = false;
    resultBanner.hidden = true;
    nextSongBtn.hidden = true;
    playBtn.disabled = false;
    setInputEnabled(true);
    setStatus('');
    renderSlots();
    renderTimeline();
    initAudioForSong(state.song);
  }

  // ── Audio helpers ─────────────────────────────────────────────────────────────

  function getStreamUrl() {
    if (isUnlimited() && state.song && state.song.id) {
      return API_BASE + '/api/songdle-stream?id=' + encodeURIComponent(state.song.id);
    }
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

  function getVolume() {
    return volumeSlider ? parseFloat(volumeSlider.value) : 1;
  }

  /** Stop whatever is currently playing (YouTube or fallback audio). */
  function stopCurrentClip() {
    clearTimeout(ytClipTimer);
    ytIntentPlay = false;
    if (ytPlayer && ytReady) ytPlayer.pauseVideo();
    if (state.audio) { state.audio.pause(); state.audio = null; }
    setPlayIcon(false);
  }

  /** Called when a new song is loaded — cue it in the YouTube player without playing. */
  function initAudioForSong(song) {
    if (!song) return;
    stopCurrentClip();
    if (song.youtubeId && ytPlayer && ytReady) {
      ytCurrentSongId = song.id;
      ytPlayer.cueVideoById({ videoId: song.youtubeId, startSeconds: song.startOffset || 0 });
    }
  }

  function playClip() {
    if (!state.song) return;

    // Toggle off if already playing
    if (state.playing) { stopCurrentClip(); return; }

    var song = state.song;

    // ── YouTube path ──────────────────────────────────────────────────────────
    if (song.youtubeId && ytPlayer && ytReady) {
      playBtn.disabled = true;
      playBtn.innerHTML = '<svg viewBox="0 0 24 24" style="opacity:0.5"><path d="M8 5v14l11-7z"/></svg>';
      ytIntentPlay = true;

      if (ytCurrentSongId !== song.id) {
        // New video — loadVideoById triggers autoplay which onStateChange handles
        ytCurrentSongId = song.id;
        ytPlayer.loadVideoById({ videoId: song.youtubeId, startSeconds: song.startOffset || 0 });
      } else {
        // Same video — seek and play; onStateChange(PLAYING) starts the clip timer
        ytPlayer.seekTo(song.startOffset || 0, true);
        ytPlayer.setVolume(getVolume() * 100);
        ytPlayer.playVideo();
      }
      return;
    }

    // ── Fallback: stream proxy (songs without youtubeId, or YouTube failed) ──────
    playFallback();
  }

  function playFallback() {
    var song = state.song;
    if (!song) return;

    playBtn.disabled = true;
    playBtn.innerHTML = '<svg viewBox="0 0 24 24" style="opacity:0.5"><path d="M8 5v14l11-7z"/></svg>';

    var audioUrl = getStreamUrl();
    var dur = state.done ? 30 : CLIP_DURATIONS[state.level];
    var guardId = song.id;

    if (state.audio) { state.audio.pause(); state.audio = null; }
    state.audio = new Audio(audioUrl);
    state.audio.volume = getVolume();
    state.audio.currentTime = 0;

    state.audio.play()
      .then(function () {
        if (!state.song || state.song.id !== guardId) return;
        playBtn.disabled = false;
        setPlayIcon(true);
        ytClipTimer = setTimeout(function () {
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
      clearTimeout(ytClipTimer);
      setPlayIcon(false);
    };
  }

  // ── Genre switching ───────────────────────────────────────────────────────────
  function switchGenre(genre) {
    if (genre === state.genre) return;
    saveState();
    stopCurrentClip();
    playBtn.disabled = true;
    setInputEnabled(false);
    resultBanner.hidden = true;
    nextSongBtn.hidden = true;
    state.genre = genre;
    if (genre !== 'unlimited') {
      state.artistFilter = null;
      artistFilterBar.hidden = true;
      modeSubtitle.hidden = true;
      document.title = 'Songdle \u2013 Guess the Song';
    }
    resetHint();
    renderTabs();

    if (genre === 'unlimited') {
      updateArtistFilterBtn();
      if (state.songs.length === 0) {
        setStatus('Loading...');
        fetchSongs().then(function () { startUnlimitedSong(); });
      } else {
        startUnlimitedSong();
      }
      return;
    }

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
        initAudioForSong(state.song);
      })
      .catch(function (err) {
        setStatus('Could not load today\'s song. ' + (err && err.message ? err.message : ''), true);
      });
  }

  // ── Event listeners ───────────────────────────────────────────────────────────
  playBtn.addEventListener('click', playClip);
  skipBtn.addEventListener('click', skipGuess);

  volumeSlider.addEventListener('input', function () {
    var v = getVolume();
    if (ytPlayer && ytReady) ytPlayer.setVolume(v * 100);
    if (state.audio) state.audio.volume = v;
  });

  genreTabs.forEach(function (tab) {
    tab.addEventListener('click', function () { switchGenre(tab.dataset.genre); });
  });

  statsBtn.addEventListener('click', showStats);
  statsCloseBtn.addEventListener('click', hideStats);
  statsModal.addEventListener('click', function (e) {
    if (e.target === statsModal) hideStats();
  });

  nextSongBtn.addEventListener('click', function () {
    startUnlimitedSong();
  });

  hintBtn.addEventListener('click', revealHint);
  shareBtn.addEventListener('click', shareResult);

  artistFilterBtn.addEventListener('click', openArtistPicker);
  artistPickerClose.addEventListener('click', closeArtistPicker);
  artistPickerModal.addEventListener('click', function (e) {
    if (e.target === artistPickerModal) closeArtistPicker();
  });
  artistSearchInput.addEventListener('input', function () {
    buildArtistList(artistSearchInput.value);
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
