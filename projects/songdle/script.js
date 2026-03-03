(function () {
  'use strict';

  var REVEAL_DURATIONS = [0.1, 0.5, 2, 4, 8, 16, 30];
  var API_BASE = window.SONGDLE_API || (window.location.hostname === 'localhost' ? 'http://localhost:3000' : '');

  var playBtn = document.getElementById('playBtn');
  var guessInput = document.getElementById('guessInput');
  var submitBtn = document.getElementById('submitBtn');
  var feedbackEl = document.getElementById('feedback');
  var revealInfo = document.getElementById('revealInfo');

  var song = null;
  var revealLevel = 0;
  var audio = null;
  var today = '';

  function safeText(el, text) {
    try {
      if (el && 'textContent' in el) el.textContent = text;
    } catch (e) {}
  }

  function safeClass(el, className) {
    try {
      if (el && 'className' in el) el.className = className;
    } catch (e) {}
  }

  function safeDisabled(el, disabled) {
    try {
      if (el && 'disabled' in el) el.disabled = !!disabled;
    } catch (e) {}
  }

  function getToday() {
    return new Date().toISOString().slice(0, 10);
  }

  function loadState() {
    var key = 'songdle_' + today;
    var raw = localStorage.getItem(key);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  }

  function saveState(state) {
    var key = 'songdle_' + today;
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch (e) {}
  }

  function normalize(s) {
    return String(s).toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, ' ').trim();
  }

  function checkGuess(guess, track) {
    var g = normalize(guess);
    var artist = normalize(track.artist || '');
    var title = normalize(track.name || '');
    var full = normalize((track.artist || '') + ' - ' + (track.name || ''));
    var fullReverse = normalize((track.name || '') + ' - ' + (track.artist || ''));
    if (g === full || g === fullReverse) return true;
    if (g === title && artist.length > 0) return true;
    if (g.includes(artist) && g.includes(title)) return true;
    if (g.includes(title) && (g.includes(artist) || artist.split(',')[0].trim().toLowerCase().split(' ').some(function (w) { return g.includes(w); }))) return true;
    return false;
  }

  function fetchDailySong() {
    return fetch(API_BASE + '/api/soundcloud-daily')
      .then(function (res) {
        if (!res.ok) return res.json().catch(function () { return {}; }).then(function (err) { throw new Error(err.error || 'Failed to load today\'s song'); });
        return res.json();
      });
  }

  function updateUI() {
    var dur = REVEAL_DURATIONS[revealLevel] !== undefined ? REVEAL_DURATIONS[revealLevel] : 30;
    safeText(playBtn, '\u25B6 Play (' + dur + 's)');
    safeDisabled(playBtn, !song);
    safeText(revealInfo, 'Attempt ' + (revealLevel + 1) + ': ' + dur + ' second' + (dur === 1 ? '' : 's'));
  }

  function showFeedback(msg, correct) {
    safeText(feedbackEl, msg || '');
    safeClass(feedbackEl, 'feedback ' + (correct ? 'correct' : 'wrong'));
  }

  function playClip() {
    if (!song) return;
    var streamUrl = API_BASE ? (API_BASE + '/api/songdle-stream?date=' + encodeURIComponent(today)) : (song.preview_url || '');
    if (!streamUrl) {
      showFeedback('No preview available.', false);
      return;
    }
    var duration = REVEAL_DURATIONS[revealLevel] !== undefined ? REVEAL_DURATIONS[revealLevel] : 30;
    if (audio) {
      try { audio.pause(); audio.currentTime = 0; } catch (e) {}
    }
    safeDisabled(playBtn, true);
    safeText(playBtn, 'Loading…');
    audio = new Audio(streamUrl);
    audio.addEventListener('error', function onErr() {
      audio.removeEventListener('error', onErr);
      safeDisabled(playBtn, false);
      updateUI();
      showFeedback('Audio failed to load. SoundCloud may be restricted or slow.', false);
    }, { once: true });
    audio.play()
      .then(function () {
        safeDisabled(playBtn, false);
        updateUI();
        setTimeout(function () {
          try { if (audio) audio.pause(); } catch (e) {}
        }, duration * 1000);
      })
      .catch(function (e) {
        safeDisabled(playBtn, false);
        updateUI();
        showFeedback('Could not play audio. Try again.', false);
      });
    setTimeout(function () {
      if (playBtn && playBtn.textContent === 'Loading…') {
        safeDisabled(playBtn, false);
        updateUI();
        showFeedback('Playback didn\'t start. Check connection or try again.', false);
      }
    }, 10000);
  }

  function win() {
    safeDisabled(playBtn, true);
    safeText(playBtn, '\u2713 Solved');
    safeDisabled(guessInput, true);
    safeDisabled(submitBtn, true);
    showFeedback('Correct! It was ' + (song && song.artist) + ' – ' + (song && song.name), true);
    saveState({ revealLevel: revealLevel, won: true, song: { artist: song && song.artist, name: song && song.name } });
  }

  function handleGuess() {
    var guess = guessInput ? guessInput.value.trim() : '';
    if (!guess || !song) return;
    if (checkGuess(guess, song)) {
      win();
      return;
    }
    revealLevel = Math.min(revealLevel + 1, REVEAL_DURATIONS.length - 1);
    updateUI();
    showFeedback('Not quite – play again for a longer clip', false);
    saveState({ revealLevel: revealLevel, won: false });
  }

  if (playBtn) playBtn.addEventListener('click', playClip);
  if (submitBtn) submitBtn.addEventListener('click', handleGuess);
  if (guessInput) guessInput.addEventListener('keydown', function (e) { if (e.key === 'Enter') handleGuess(); });

  function init() {
    today = getToday();
    var state = loadState();
    if (state && state.won && state.song) {
      showFeedback('You already solved today\'s puzzle! It was ' + (state.song.artist || '') + ' – ' + (state.song.name || ''), true);
      return;
    }
    fetchDailySong()
      .then(function (data) {
        song = data && data.song;
        if (!song || !song.preview_url) {
          showFeedback('No preview available for today\'s song.', false);
          return;
        }
        if (state && !state.won && state.revealLevel != null) revealLevel = state.revealLevel;
        updateUI();
      })
      .catch(function (err) {
        showFeedback(err && err.message ? err.message : 'Could not load song.', false);
      });
  }

  init();
})();
