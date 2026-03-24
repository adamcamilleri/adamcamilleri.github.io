// ============================================================
// Study Smart — Retro OS Desktop Script
// ============================================================

// --- Music Genre Config ---
// Drop MP3 files into the audio/ folder matching these filenames
const GENRES = [
  { name: 'Lo-Fi', audioUrl: 'audio/lofi.mp3' },
  { name: 'Jazz', audioUrl: 'audio/jazz.mp3' },
  { name: 'Piano', audioUrl: 'audio/piano.mp3' },
  { name: 'Classical', audioUrl: 'audio/classical.mp3' },
  { name: 'Acoustic', audioUrl: 'audio/acoustic.mp3' },
  { name: 'Kalimba', audioUrl: 'audio/kalimba.mp3' },
  { name: 'K-Pop', audioUrl: 'audio/kpop.mp3' },
  { name: 'Cafe', audioUrl: 'audio/cafe.mp3' },
  { name: 'Library', audioUrl: 'audio/library.mp3' },
  { name: 'Nature', audioUrl: 'audio/nature.mp3' }
];

// --- Quote Config ---
const QUOTES = [
  { text: 'The secret of getting ahead is getting started.', author: 'Mark Twain' },
  { text: 'It always seems impossible until it is done.', author: 'Nelson Mandela' },
  { text: 'The only way to do great work is to love what you do.', author: 'Steve Jobs' },
  { text: 'Education is the most powerful weapon which you can use to change the world.', author: 'Nelson Mandela' },
  { text: 'In the middle of difficulty lies opportunity.', author: 'Albert Einstein' },
  { text: 'You are never too old to set another goal or to dream a new dream.', author: 'C.S. Lewis' },
  { text: 'Success is not final, failure is not fatal: it is the courage to continue that counts.', author: 'Winston Churchill' },
  { text: 'The beautiful thing about learning is that nobody can take it away from you.', author: 'B.B. King' },
  { text: 'Do what you can, with what you have, where you are.', author: 'Theodore Roosevelt' },
  { text: 'The mind is not a vessel to be filled, but a fire to be kindled.', author: 'Plutarch' },
  { text: 'Start where you are. Use what you have. Do what you can.', author: 'Arthur Ashe' },
  { text: 'We are what we repeatedly do. Excellence, then, is not an act, but a habit.', author: 'Aristotle' },
  { text: 'Creativity is intelligence having fun.', author: 'Albert Einstein' },
  { text: 'There is no substitute for hard work.', author: 'Thomas Edison' },
  { text: 'A person who never made a mistake never tried anything new.', author: 'Albert Einstein' },
  { text: 'Live as if you were to die tomorrow. Learn as if you were to live forever.', author: 'Mahatma Gandhi' },
  { text: 'Tell me and I forget. Teach me and I remember. Involve me and I learn.', author: 'Benjamin Franklin' },
  { text: 'The expert in anything was once a beginner.', author: 'Helen Hayes' }
];

// --- Timer Controls ---
const startBtn = document.getElementById('startBtn');
const resetBtn = document.getElementById('resetBtn');
const minutesDisplay = document.getElementById('minutes');
const secondsDisplay = document.getElementById('seconds');
const millisecondsDisplay = document.getElementById('milliseconds');
const sessionCountDisplay = document.getElementById('sessionCount');
const totalSessionsDisplay = document.getElementById('totalSessions');

const DURATIONS = {
  pomodoro: 25,
  shortBreak: 5,
  longBreak: 15
};

let timer = null;
let isRunning = false;
let timeLeft = DURATIONS.pomodoro * 60;
let milliseconds = 0;
let currentMode = 'pomodoro';
let sessionCount = 1;
let totalSessions = 4;
let lastTimestamp = 0;

function updateTimerDisplay() {
  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  minutesDisplay.textContent = mins.toString().padStart(2, '0');
  secondsDisplay.textContent = secs.toString().padStart(2, '0');
  if (millisecondsDisplay) {
    millisecondsDisplay.textContent = '.' + Math.floor(milliseconds).toString().padStart(3, '0');
  }

}

function updateSessionDisplay() {
  sessionCountDisplay.textContent = sessionCount;
  totalSessionsDisplay.textContent = totalSessions;

  const sessionCounter = document.querySelector('.session-count');
  if (sessionCounter) {
    const nextBreakText = sessionCount === totalSessions
      ? '(Long Break Next)'
      : '(Short Break Next)';
    // Use DOM APIs instead of innerHTML
    sessionCounter.textContent = '';
    const parts = [
      'Study Session ', String(sessionCount), ' of ', String(totalSessions), ' ' + nextBreakText
    ];
    parts.forEach(function(text) {
      const span = document.createElement('span');
      span.textContent = text;
      sessionCounter.appendChild(span);
    });
    // Re-assign IDs for any code that queries them
    const spans = sessionCounter.querySelectorAll('span');
    if (spans[1]) spans[1].id = 'sessionCount';
    if (spans[3]) spans[3].id = 'totalSessions';
  }
}

function toggleTimer() {
  if (isRunning) {
    cancelAnimationFrame(timer);
    isRunning = false;
    startBtn.textContent = 'START';
    startBtn.classList.remove('active');
  } else {
    isRunning = true;
    startBtn.textContent = 'PAUSE';
    startBtn.classList.add('active');
    lastTimestamp = performance.now();
    timer = requestAnimationFrame(updateTimer);
  }
}

function updateTimer(timestamp) {
  if (!isRunning) return;

  const elapsed = timestamp - lastTimestamp;
  lastTimestamp = timestamp;

  milliseconds -= elapsed;
  if (milliseconds <= 0) {
    milliseconds += 1000;
    timeLeft--;
  }

  updateTimerDisplay();

  if (timeLeft <= 0 && milliseconds <= 0) {
    cancelAnimationFrame(timer);
    playAlarm();

    if (currentMode === 'pomodoro') {
      sessionCount++;
      if (sessionCount > totalSessions) {
        sessionCount = 1;
        currentMode = 'longBreak';
        timeLeft = DURATIONS.longBreak * 60;
      } else {
        currentMode = 'shortBreak';
        timeLeft = DURATIONS.shortBreak * 60;
      }
      updateStats('pomodoro');
    } else {
      currentMode = 'pomodoro';
      timeLeft = DURATIONS.pomodoro * 60;
    }

    milliseconds = 0;
    updateTimerDisplay();
    updateSessionDisplay();
    updateModeButtons();
    isRunning = false;
    startBtn.textContent = 'START';
    startBtn.classList.remove('active');
    return;
  }

  timer = requestAnimationFrame(updateTimer);
}

function resetTimer() {
  cancelAnimationFrame(timer);
  timeLeft = DURATIONS[currentMode] * 60;
  milliseconds = 0;
  isRunning = false;
  startBtn.textContent = 'START';
  startBtn.classList.remove('active');
  updateTimerDisplay();
  updateSessionDisplay();
  updateModeButtons();
}

function updateModeButtons() {
  document.querySelectorAll('.mode-btn').forEach(function(btn) {
    btn.classList.remove('active');
    if (btn.dataset.mode === currentMode) {
      btn.classList.add('active');
    }
  });
}

function switchMode(mode) {
  if (isRunning) {
    cancelAnimationFrame(timer);
    isRunning = false;
    startBtn.textContent = 'START';
  }
  currentMode = mode;
  timeLeft = DURATIONS[mode] * 60;
  milliseconds = 0;
  updateTimerDisplay();
  updateModeButtons();
}

// Timer event listeners
startBtn.addEventListener('click', toggleTimer);
resetBtn.addEventListener('click', resetTimer);

document.querySelectorAll('.mode-btn').forEach(function(btn) {
  btn.addEventListener('click', function() {
    switchMode(btn.dataset.mode);
  });
});

// Initialize timer
updateTimerDisplay();
updateSessionDisplay();
updateModeButtons();

// --- Task Management ---
const taskInput = document.getElementById('taskInput');
const taskDueDate = document.getElementById('taskDueDate');
const taskPriority = document.getElementById('taskPriority');
const addTaskBtn = document.getElementById('addTaskBtn');
const taskList = document.getElementById('taskList');
const taskSearch = document.getElementById('taskSearch');
const filterButtons = document.querySelectorAll('.filter-btn');

let tasks = JSON.parse(localStorage.getItem('tasks')) || [];

function saveTasks() {
  localStorage.setItem('tasks', JSON.stringify(tasks));
}

function renderTasks(filter) {
  if (filter === undefined) filter = 'all';
  // Clear list using DOM API
  while (taskList.firstChild) {
    taskList.removeChild(taskList.firstChild);
  }

  var filteredTasks = tasks.filter(function(task) {
    if (filter === 'active') return !task.completed;
    if (filter === 'completed') return task.completed;
    return true;
  });

  filteredTasks.forEach(function(task) {
    var li = document.createElement('li');
    li.className = 'task-item' + (task.completed ? ' completed' : '');

    var checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'task-checkbox';
    checkbox.checked = task.completed;

    var textSpan = document.createElement('span');
    textSpan.className = 'task-text';
    textSpan.textContent = task.text;

    var dateSpan = document.createElement('span');
    dateSpan.className = 'task-due-date';
    dateSpan.textContent = task.dueDate || '';

    var prioritySpan = document.createElement('span');
    prioritySpan.className = 'task-priority ' + task.priority;
    prioritySpan.textContent = task.priority;

    var actionsDiv = document.createElement('div');
    actionsDiv.className = 'task-actions';
    var deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-task';
    deleteBtn.setAttribute('aria-label', 'Delete task');
    var trashIcon = document.createElement('i');
    trashIcon.className = 'fas fa-trash';
    deleteBtn.appendChild(trashIcon);
    actionsDiv.appendChild(deleteBtn);

    li.appendChild(checkbox);
    li.appendChild(textSpan);
    li.appendChild(dateSpan);
    li.appendChild(prioritySpan);
    li.appendChild(actionsDiv);

    checkbox.addEventListener('change', function() {
      var wasCompleted = task.completed;
      task.completed = checkbox.checked;
      li.classList.toggle('completed', task.completed);
      saveTasks();
      updateStats('task', wasCompleted, task.completed);
    });

    deleteBtn.addEventListener('click', function() {
      var wasCompleted = task.completed;
      tasks = tasks.filter(function(t) { return t !== task; });
      saveTasks();
      renderTasks();
      if (wasCompleted) {
        updateStats('task', true, false);
      }
    });

    taskList.appendChild(li);
  });
}

function addTask() {
  var text = taskInput.value.trim();
  var dueDate = taskDueDate.value;
  var priority = taskPriority.value;

  if (text) {
    tasks.push({ text: text, dueDate: dueDate, priority: priority, completed: false });
    saveTasks();
    renderTasks();
    taskInput.value = '';
    taskDueDate.value = '';
    taskPriority.value = 'low';
  }
}

addTaskBtn.addEventListener('click', addTask);
taskInput.addEventListener('keypress', function(e) {
  if (e.key === 'Enter') addTask();
});

filterButtons.forEach(function(btn) {
  btn.addEventListener('click', function() {
    filterButtons.forEach(function(b) { b.classList.remove('active'); });
    btn.classList.add('active');
    renderTasks(btn.dataset.filter);
  });
});

taskSearch.addEventListener('input', function(e) {
  var searchTerm = e.target.value.toLowerCase();
  var items = taskList.querySelectorAll('.task-item');
  items.forEach(function(item) {
    var text = item.querySelector('.task-text').textContent.toLowerCase();
    item.style.display = text.includes(searchTerm) ? '' : 'none';
  });
});

// --- Stats Management ---
var completedPomodoros = document.getElementById('completedPomodoros');
var focusTime = document.getElementById('focusTime');
var tasksCompleted = document.getElementById('tasksCompleted');

var stats = JSON.parse(localStorage.getItem('studybuddyStats')) || {
  pomodoros: 0,
  focusMinutes: 0,
  tasks: 0
};

function updateStats(type, wasCompleted, isCompleted) {
  if (type === 'pomodoro') {
    stats.pomodoros++;
    stats.focusMinutes += DURATIONS.pomodoro;
  } else if (type === 'task') {
    if (wasCompleted && !isCompleted) {
      stats.tasks--;
    } else if (!wasCompleted && isCompleted) {
      stats.tasks++;
    }
  }

  if (completedPomodoros) completedPomodoros.textContent = stats.pomodoros;
  if (focusTime) focusTime.textContent = Math.floor(stats.focusMinutes / 60) + 'h ' + (stats.focusMinutes % 60) + 'm';
  if (tasksCompleted) tasksCompleted.textContent = stats.tasks;

  localStorage.setItem('studybuddyStats', JSON.stringify(stats));
}

// Initialize tasks and stats
renderTasks();
updateStats();

// --- Play Alarm ---
function playAlarm() {
  var enableSound = document.getElementById('enableSound');
  if (enableSound && enableSound.checked) {
    var audio = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-alarm-digital-clock-beep-989.mp3');
    var soundVolume = document.getElementById('soundVolume');
    audio.volume = soundVolume ? soundVolume.value / 100 : 0.5;
    audio.play().catch(function(err) {
      console.error('Error playing alarm:', err);
    });
  }

  var enableNotifications = document.getElementById('enableNotifications');
  if (enableNotifications && enableNotifications.checked) {
    if (Notification.permission === 'granted') {
      new Notification('Study Smart', { body: 'Time is up! Take a break.' });
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission();
    }
  }
}

// --- Settings Management ---
var settingsInputs = document.querySelectorAll('#settingsPanel input, #settingsPanel select');
settingsInputs.forEach(function(input) {
  input.addEventListener('change', function() {
    var value = input.type === 'checkbox' ? input.checked : input.value;
    localStorage.setItem(input.id, value);

    // Apply duration settings immediately
    if (input.id === 'pomodoroDuration') {
      DURATIONS.pomodoro = parseInt(input.value) || 25;
      if (currentMode === 'pomodoro' && !isRunning) {
        timeLeft = DURATIONS.pomodoro * 60;
        updateTimerDisplay();
      }
    } else if (input.id === 'shortBreakDuration') {
      DURATIONS.shortBreak = parseInt(input.value) || 5;
    } else if (input.id === 'longBreakDuration') {
      DURATIONS.longBreak = parseInt(input.value) || 15;
    } else if (input.id === 'sessionsUntilLongBreak') {
      totalSessions = parseInt(input.value) || 4;
      updateSessionDisplay();
    }
  });
});

// Load saved settings
settingsInputs.forEach(function(input) {
  var savedValue = localStorage.getItem(input.id);
  if (savedValue !== null) {
    if (input.type === 'checkbox') {
      input.checked = savedValue === 'true';
    } else {
      input.value = savedValue;
    }
    // Apply loaded duration settings
    if (input.id === 'pomodoroDuration') DURATIONS.pomodoro = parseInt(input.value) || 25;
    if (input.id === 'shortBreakDuration') DURATIONS.shortBreak = parseInt(input.value) || 5;
    if (input.id === 'longBreakDuration') DURATIONS.longBreak = parseInt(input.value) || 15;
    if (input.id === 'sessionsUntilLongBreak') {
      totalSessions = parseInt(input.value) || 4;
      updateSessionDisplay();
    }
  }
});

// Re-init timer with loaded durations
timeLeft = DURATIONS[currentMode] * 60;
updateTimerDisplay();

// --- Music Genre System (HTML5 Audio, works on file://) ---
var musicAudio = new Audio();
musicAudio.loop = true;
var currentGenre = localStorage.getItem('studySmartGenre') || null;
var isMusicPlaying = false;

// Restore last genre selection UI (don't autoplay)
if (currentGenre) {
  document.querySelectorAll('.genre-btn').forEach(function(btn) {
    btn.classList.toggle('active', btn.dataset.genre === currentGenre);
  });
  var nowPlaying = document.querySelector('.now-playing-info');
  if (nowPlaying) nowPlaying.textContent = currentGenre;
  // Pre-load the audio source
  var savedGenre = GENRES.find(function(g) { return g.name === currentGenre; });
  if (savedGenre) musicAudio.src = savedGenre.audioUrl;
}

// Genre button click handlers
document.querySelectorAll('.genre-btn').forEach(function(btn) {
  btn.addEventListener('click', function() {
    var genre = btn.dataset.genre;
    var genreObj = GENRES.find(function(g) { return g.name === genre; });
    if (!genreObj) return;

    // Update active state
    document.querySelectorAll('.genre-btn').forEach(function(b) { b.classList.remove('active'); });
    btn.classList.add('active');

    // Update now-playing
    var nowPlaying = document.querySelector('.now-playing-info');
    if (nowPlaying) nowPlaying.textContent = genre;

    // Load and play
    musicAudio.src = genreObj.audioUrl;
    musicAudio.volume = (document.getElementById('volumeSlider').value || 50) / 100;
    musicAudio.play();
    isMusicPlaying = true;
    currentGenre = genre;
    localStorage.setItem('studySmartGenre', genre);

    // Update play button icon
    var playBtn = document.getElementById('musicPlayBtn');
    if (playBtn) playBtn.querySelector('i').className = 'fas fa-pause';
  });
});

// Play/Pause button
var musicPlayBtn = document.getElementById('musicPlayBtn');
if (musicPlayBtn) {
  musicPlayBtn.addEventListener('click', function() {
    if (!musicAudio.src) return;
    if (isMusicPlaying) {
      musicAudio.pause();
      isMusicPlaying = false;
      musicPlayBtn.querySelector('i').className = 'fas fa-play';
    } else {
      musicAudio.play();
      isMusicPlaying = true;
      musicPlayBtn.querySelector('i').className = 'fas fa-pause';
    }
  });
}

// Volume slider
var volumeSlider = document.getElementById('volumeSlider');
if (volumeSlider) {
  volumeSlider.addEventListener('input', function() {
    musicAudio.volume = volumeSlider.value / 100;
  });
}


// --- Quote Widget ---
var currentQuoteIndex = -1;

function showRandomQuote() {
  var newIndex;
  do {
    newIndex = Math.floor(Math.random() * QUOTES.length);
  } while (newIndex === currentQuoteIndex && QUOTES.length > 1);
  currentQuoteIndex = newIndex;

  var quote = QUOTES[currentQuoteIndex];
  var quoteText = document.getElementById('quoteText');
  var quoteAuthor = document.getElementById('quoteAuthor');
  if (quoteText) quoteText.textContent = quote.text;
  if (quoteAuthor) quoteAuthor.textContent = '\u2014 ' + quote.author;
}

// Initialize quote
showRandomQuote();

// Refresh button with fade
var refreshQuote = document.getElementById('refreshQuote');
if (refreshQuote) {
  refreshQuote.addEventListener('click', function() {
    var content = document.querySelector('.quote-content');
    if (content) {
      content.style.opacity = '0';
      content.style.transition = 'opacity 0.3s';
      setTimeout(function() {
        showRandomQuote();
        content.style.opacity = '1';
      }, 300);
    } else {
      showRandomQuote();
    }
  });
}

// --- Draggable Panels ---
var zCounter = 10;
var DRAG_THRESHOLD = 5; // px of movement before it counts as a drag

function makeDraggable(panel) {
  var titlebar = panel.querySelector('.window-titlebar');
  if (!titlebar) return;

  titlebar.style.cursor = 'grab';

  titlebar.addEventListener('pointerdown', function(e) {
    // Don't drag if clicking window buttons
    if (e.target.closest('.window-btn')) return;

    e.preventDefault();
    panel.style.zIndex = ++zCounter;

    var startX = e.clientX;
    var startY = e.clientY;
    var didDrag = false;
    var positioned = false;
    var origLeft, origTop;

    function onMove(ev) {
      var dx = ev.clientX - startX;
      var dy = ev.clientY - startY;

      // Only start dragging after passing the threshold
      if (!didDrag && Math.abs(dx) + Math.abs(dy) < DRAG_THRESHOLD) return;

      if (!didDrag) {
        didDrag = true;
        titlebar.style.cursor = 'grabbing';

        // Switch panel to absolute positioning on first drag
        if (getComputedStyle(panel).position !== 'absolute') {
          var rect = panel.getBoundingClientRect();
          var scrollX = window.scrollX || window.pageXOffset;
          var scrollY = window.scrollY || window.pageYOffset;
          panel.style.position = 'absolute';
          panel.style.left = (rect.left + scrollX) + 'px';
          panel.style.top = (rect.top + scrollY) + 'px';
          panel.style.width = rect.width + 'px';
        }
        origLeft = parseInt(panel.style.left) || 0;
        origTop = parseInt(panel.style.top) || 0;
        positioned = true;
      }

      if (positioned) {
        panel.style.left = (origLeft + dx) + 'px';
        panel.style.top = (origTop + dy) + 'px';
      }
    }

    function onUp() {
      titlebar.style.cursor = 'grab';
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerup', onUp);
    }

    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerup', onUp);
  });
}

// Initialize drag on desktop only
function initDrag() {
  if (window.innerWidth >= 768) {
    document.querySelectorAll('.desktop-panel:not(.overlay-panel)').forEach(makeDraggable);
  }
}

initDrag();

// --- Minimize Buttons ---
document.querySelectorAll('.window-btn.minimize').forEach(function(btn) {
  btn.addEventListener('click', function() {
    var panelId = btn.dataset.panel;
    if (panelId) {
      var panel = document.getElementById(panelId);
      if (panel) panel.classList.toggle('minimized');
    }
  });
});

// --- Overlay Panels (Stats & Settings) ---
var statsPanel = document.getElementById('statsPanel');
var settingsPanel = document.getElementById('settingsPanel');
var overlayBackdrop = document.getElementById('overlayBackdrop');

function showOverlay(panel) {
  if (panel) {
    panel.style.display = 'block';
    if (overlayBackdrop) overlayBackdrop.style.display = 'block';
  }
}

function hideOverlay(panel) {
  if (panel) {
    panel.style.display = 'none';
    if (overlayBackdrop) overlayBackdrop.style.display = 'none';
  }
}

function hideAllOverlays() {
  hideOverlay(statsPanel);
  hideOverlay(settingsPanel);
}

// Stats toggle button
var statsToggleBtn = document.querySelector('.stats-toggle-btn');
if (statsToggleBtn) {
  statsToggleBtn.addEventListener('click', function() {
    if (statsPanel && statsPanel.style.display === 'block') {
      hideOverlay(statsPanel);
    } else {
      hideAllOverlays();
      showOverlay(statsPanel);
      initCharts();
    }
  });
}

// Settings toggle button
var settingsToggleBtn = document.querySelector('.settings-toggle-btn');
if (settingsToggleBtn) {
  settingsToggleBtn.addEventListener('click', function() {
    if (settingsPanel && settingsPanel.style.display === 'block') {
      hideOverlay(settingsPanel);
    } else {
      hideAllOverlays();
      showOverlay(settingsPanel);
    }
  });
}

// Close buttons on overlay panels
document.querySelectorAll('.window-btn.close[data-close]').forEach(function(btn) {
  btn.addEventListener('click', function() {
    var panelId = btn.dataset.close;
    var panel = document.getElementById(panelId);
    hideOverlay(panel);
  });
});

// Backdrop click closes overlays
if (overlayBackdrop) {
  overlayBackdrop.addEventListener('click', hideAllOverlays);
}

// --- Chart.js Initialization ---
var chartsInitialized = false;

function initCharts() {
  if (chartsInitialized) return;
  chartsInitialized = true;

  var dailyCanvas = document.getElementById('dailyChart');
  var taskCanvas = document.getElementById('taskChart');

  if (dailyCanvas && typeof Chart !== 'undefined') {
    new Chart(dailyCanvas.getContext('2d'), {
      type: 'bar',
      data: {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [{
          label: 'Sessions',
          data: [0, 0, 0, 0, 0, 0, stats.pomodoros],
          backgroundColor: '#8D6E63'
        }]
      },
      options: {
        responsive: true,
        scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
      }
    });
  }

  if (taskCanvas && typeof Chart !== 'undefined') {
    var completedCount = tasks.filter(function(t) { return t.completed; }).length;
    var activeCount = tasks.length - completedCount;
    new Chart(taskCanvas.getContext('2d'), {
      type: 'doughnut',
      data: {
        labels: ['Completed', 'Active'],
        datasets: [{
          data: [completedCount, activeCount],
          backgroundColor: ['#8D6E63', '#D7CCC8']
        }]
      },
      options: { responsive: true }
    });
  }
}

// --- Keyboard Shortcuts ---
document.addEventListener('keydown', function(e) {
  // Don't trigger shortcuts when typing in inputs
  var tag = e.target.tagName.toLowerCase();
  if (tag === 'input' || tag === 'textarea' || tag === 'select') {
    if (e.key === 'Escape') {
      hideAllOverlays();
      e.target.blur();
    }
    return;
  }

  if (e.code === 'Space') {
    e.preventDefault();
    toggleTimer();
  } else if (e.key === 'r' || e.key === 'R') {
    resetTimer();
  } else if (e.key === 'Escape') {
    hideAllOverlays();
  }
});

// --- Keyboard Shortcuts Modal ---
var shortcutsBtn = document.querySelector('.shortcuts-btn');
var shortcutsModal = document.querySelector('.shortcuts-modal');
if (shortcutsBtn && shortcutsModal) {
  shortcutsBtn.addEventListener('click', function() {
    shortcutsModal.classList.toggle('visible');
  });
}

// --- Scene Background Switching ---
// Drop images into backgrounds/ folder matching these filenames
var SCENES = {
  default: null,
  nature: 'backgrounds/nature.jpg',
  rainy: 'backgrounds/rainy.jpg',
  modern: 'backgrounds/modern.jpg',
  cozy: 'backgrounds/cozy.jpg',
  space: 'backgrounds/space.jpg'
};

var currentScene = localStorage.getItem('studySmartScene') || 'default';

function applyScene(sceneName) {
  var body = document.body;

  if (sceneName === 'default' || !SCENES[sceneName]) {
    body.classList.remove('has-scene');
    body.style.removeProperty('--scene-bg');
    // Re-apply default background
    body.style.backgroundImage = '';
    body.style.backgroundColor = '';
  } else {
    body.classList.add('has-scene');
    body.style.setProperty('--scene-bg', 'url(' + SCENES[sceneName] + ')');
  }

  // Update active button
  document.querySelectorAll('.scene-btn').forEach(function(btn) {
    btn.classList.toggle('active', btn.dataset.scene === sceneName);
  });

  currentScene = sceneName;
  localStorage.setItem('studySmartScene', sceneName);
}

// Scene button click handlers
document.querySelectorAll('.scene-btn').forEach(function(btn) {
  btn.addEventListener('click', function() {
    applyScene(btn.dataset.scene);
  });
});

// Restore saved scene on load
if (currentScene !== 'default') {
  applyScene(currentScene);
}