(function () {
  const REVEAL_DURATIONS = [0.1, 0.5, 2, 4, 8, 16, 30]; // seconds
  // Same-origin when on Vercel. For GitHub Pages, set window.SONGLESS_API before script loads, e.g. 'https://your-project.vercel.app'
  const API_BASE = window.SONGDLE_API || (window.location.hostname === 'localhost' ? 'http://localhost:3000' : '');

  const playBtn = document.getElementById('playBtn');
  const guessInput = document.getElementById('guessInput');
  const submitBtn = document.getElementById('submitBtn');
  const feedback = document.getElementById('feedback');
  const revealInfo = document.getElementById('revealInfo');

  let song = null;
  let revealLevel = 0;
  let audio = null;
  let today = '';

  function getToday() {
    return new Date().toISOString().slice(0, 10);
  }

  function loadState() {
    const key = 'songdle_' + today;
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  function saveState(state) {
    const key = 'songdle_' + today;
    localStorage.setItem(key, JSON.stringify(state));
  }

  function normalize(s) {
    return s.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, ' ').trim();
  }

  function checkGuess(guess, song) {
    const g = normalize(guess);
    const artist = normalize(song.artist);
    const title = normalize(song.name);
    const full = normalize(song.artist + ' - ' + song.name);
    const fullReverse = normalize(song.name + ' - ' + song.artist);

    if (g === full || g === fullReverse) return true;
    if (g === title && artist.length > 0) return true;
    if (g.includes(artist) && g.includes(title)) return true;
    if (g.includes(title) && (g.includes(artist) || artist.split(',')[0].trim().toLowerCase().split(' ').some(w => g.includes(w)))) return true;
    return false;
  }

  async function fetchDailySong() {
    const res = await fetch(API_BASE + '/api/soundcloud-daily');
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to load today\'s song');
    }
    return res.json();
  }

  function playClip() {
    if (!song || !song.preview_url) return;
    const duration = REVEAL_DURATIONS[revealLevel] ?? 30;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
    audio = new Audio(song.preview_url);
    audio.play();
    setTimeout(() => {
      if (audio) audio.pause();
    }, duration * 1000);
  }

  function updateUI() {
    const dur = REVEAL_DURATIONS[revealLevel] ?? 30;
    playBtn.querySelector('.play-icon').textContent = '▶';
    playBtn.textContent = ' Play (' + dur + 's)';
    playBtn.disabled = !song;
    revealInfo.textContent = `Attempt ${revealLevel + 1}: ${dur} second${dur === 1 ? '' : 's'}`;
  }

  function showFeedback(msg, correct) {
    feedback.textContent = msg;
    feedback.className = 'feedback ' + (correct ? 'correct' : 'wrong');
  }

  function win() {
    playBtn.disabled = true;
    playBtn.textContent = '✓ Solved';
    guessInput.disabled = true;
    submitBtn.disabled = true;
    showFeedback(`Correct! It was ${song.artist} – ${song.name}`, true);
    saveState({ revealLevel, won: true, song: { artist: song.artist, name: song.name } });
  }

  function handleGuess() {
    const guess = guessInput.value.trim();
    if (!guess || !song) return;

    if (checkGuess(guess, song)) {
      win();
      return;
    }

    revealLevel = Math.min(revealLevel + 1, REVEAL_DURATIONS.length - 1);
    updateUI();
    showFeedback('Not quite – play again for a longer clip', false);
    saveState({ revealLevel, won: false });
  }

  async function init() {
    today = getToday();
    const state = loadState();
    if (state && state.won && state.song) {
      feedback.textContent = `You already solved today's puzzle! It was ${state.song.artist} – ${state.song.name}`;
      feedback.className = 'feedback correct';
      return;
    }

    try {
      const data = await fetchDailySong();
      song = data.song;
      if (!song || !song.preview_url) {
        showFeedback('No preview available for today\'s song.', false);
        return;
      }

      if (state && !state.won) {
        revealLevel = state.revealLevel || 0;
      }

      updateUI();
      playBtn.addEventListener('click', playClip);
      submitBtn.addEventListener('click', handleGuess);
      guessInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') handleGuess();
      });
    } catch (err) {
      showFeedback(err.message || 'Could not load song.', false);
    }
  }

  init();
})();
