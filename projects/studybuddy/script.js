// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Active navigation link highlighting
const sections = document.querySelectorAll('section');
const navLinks = document.querySelectorAll('.nav-links a');

window.addEventListener('scroll', () => {
    let current = '';
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;
        if (window.pageYOffset >= sectionTop - 200) {
            current = section.getAttribute('id');
        }
    });

    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href').slice(1) === current) {
            link.classList.add('active');
        }
    });
});

// Timer Controls
const startBtn = document.getElementById('startBtn');
const resetBtn = document.getElementById('resetBtn');
const minutesDisplay = document.getElementById('minutes');
const secondsDisplay = document.getElementById('seconds');
const millisecondsDisplay = document.getElementById('milliseconds');
const progressRing = document.querySelector('.progress-ring-circle');
const sessionCountDisplay = document.getElementById('sessionCount');
const totalSessionsDisplay = document.getElementById('totalSessions');

// Timer durations in minutes
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
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    minutesDisplay.textContent = minutes.toString().padStart(2, '0');
    secondsDisplay.textContent = seconds.toString().padStart(2, '0');
    millisecondsDisplay.textContent = `.${Math.floor(milliseconds).toString().padStart(3, '0')}`;
    
    const circumference = 2 * Math.PI * 115;
    const progress = 1 - (timeLeft / (DURATIONS[currentMode] * 60));
    progressRing.style.strokeDasharray = `${circumference} ${circumference}`;
    progressRing.style.strokeDashoffset = circumference * progress;
}

function updateSessionDisplay() {
    sessionCountDisplay.textContent = sessionCount;
    totalSessionsDisplay.textContent = totalSessions;
    
    const sessionCounter = document.querySelector('.session-count');
    const nextBreakText = sessionCount === totalSessions ? 
        '(Long Break Next)' : 
        '(Short Break Next)';
    
    sessionCounter.innerHTML = `
        <span>Study Session </span>
        <span id="sessionCount">${sessionCount}</span>
        <span> of </span>
        <span id="totalSessions">${totalSessions}</span>
        <span> ${nextBreakText}</span>
    `;
}

function toggleTimer() {
    if (isRunning) {
        cancelAnimationFrame(timer);
        isRunning = false;
        startBtn.innerHTML = '<i class="fas fa-play"></i>';
    } else {
        isRunning = true;
        startBtn.innerHTML = '<i class="fas fa-pause"></i>';
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
        startBtn.innerHTML = '<i class="fas fa-play"></i>';
        return;
    }

    timer = requestAnimationFrame(updateTimer);
}

function resetTimer() {
    cancelAnimationFrame(timer);
    timeLeft = DURATIONS[currentMode] * 60;
    milliseconds = 0;
    isRunning = false;
    startBtn.innerHTML = '<i class="fas fa-play"></i>';
    updateTimerDisplay();
    updateSessionDisplay();
    updateModeButtons();
}

function updateModeButtons() {
    document.querySelectorAll('.mode-btn').forEach(btn => {
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
        startBtn.innerHTML = '<i class="fas fa-play"></i>';
    }
    currentMode = mode;
    timeLeft = DURATIONS[mode] * 60;
    milliseconds = 0;
    updateTimerDisplay();
    updateModeButtons();
}

// Event Listeners
startBtn.addEventListener('click', toggleTimer);
resetBtn.addEventListener('click', resetTimer);

// Mode buttons
document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        switchMode(btn.dataset.mode);
    });
});

// Initialize timer display
updateTimerDisplay();
updateSessionDisplay();
updateModeButtons();

// Task Management
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

function renderTasks(filter = 'all') {
    taskList.innerHTML = '';
    const filteredTasks = tasks.filter(task => {
        if (filter === 'active') return !task.completed;
        if (filter === 'completed') return task.completed;
        return true;
    });

    filteredTasks.forEach(task => {
        const taskItem = document.createElement('li');
        taskItem.className = `task-item ${task.completed ? 'completed' : ''}`;
        taskItem.innerHTML = `
            <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
            <span class="task-text">${task.text}</span>
            <span class="task-due-date">${task.dueDate || ''}</span>
            <span class="task-priority ${task.priority}">${task.priority}</span>
            <div class="task-actions">
                <button class="delete-task" aria-label="Delete task">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;

        const checkbox = taskItem.querySelector('.task-checkbox');
        checkbox.addEventListener('change', () => {
            const wasCompleted = task.completed;
            task.completed = checkbox.checked;
            taskItem.classList.toggle('completed', task.completed);
            saveTasks();
            updateStats('task', wasCompleted, task.completed);
        });

        const deleteBtn = taskItem.querySelector('.delete-task');
        deleteBtn.addEventListener('click', () => {
            const wasCompleted = task.completed;
            tasks = tasks.filter(t => t !== task);
            saveTasks();
            renderTasks();
            if (wasCompleted) {
                updateStats('task', true, false);
            }
        });

        taskList.appendChild(taskItem);
    });
}

function addTask() {
    const text = taskInput.value.trim();
    const dueDate = taskDueDate.value;
    const priority = taskPriority.value;

    if (text) {
        tasks.push({
            text,
            dueDate,
            priority,
            completed: false
        });
        saveTasks();
        renderTasks();
        taskInput.value = '';
        taskDueDate.value = '';
        taskPriority.value = 'low';
    }
}

addTaskBtn.addEventListener('click', addTask);
taskInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        addTask();
    }
});

filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        filterButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        renderTasks(btn.dataset.filter);
    });
});

taskSearch.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    const taskItems = taskList.querySelectorAll('.task-item');
    
    taskItems.forEach(item => {
        const text = item.querySelector('.task-text').textContent.toLowerCase();
        item.style.display = text.includes(searchTerm) ? '' : 'none';
    });
});

// Stats Management
const completedPomodoros = document.getElementById('completedPomodoros');
const focusTime = document.getElementById('focusTime');
const tasksCompleted = document.getElementById('tasksCompleted');

let stats = JSON.parse(localStorage.getItem('studybuddyStats')) || {
    pomodoros: 0,
    focusMinutes: 0,
    tasks: 0
};

function updateStats(type, wasCompleted = false, isCompleted = false) {
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
    
    completedPomodoros.textContent = stats.pomodoros;
    focusTime.textContent = `${Math.floor(stats.focusMinutes / 60)}h ${stats.focusMinutes % 60}m`;
    tasksCompleted.textContent = stats.tasks;
    
    localStorage.setItem('studybuddyStats', JSON.stringify(stats));
}

// Initialize
renderTasks();
updateStats();

// Sound Management
const soundToggleBtn = document.querySelector('.sound-toggle-btn');
const soundOptions = document.querySelector('.sound-options');
const soundOptionsButtons = document.querySelectorAll('.sound-option');
let currentSound = null;
let audioContext = null;

// Initialize Web Audio API
function initAudio() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
}

// Play ambient sound
function playAmbientSound(sound) {
    if (currentSound) {
        currentSound.stop();
    }
    
    initAudio();
    
    const soundUrls = {
        rain: 'https://assets.mixkit.co/sfx/preview/mixkit-rain-and-thunder-storm-2393.mp3',
        cafe: 'https://assets.mixkit.co/sfx/preview/mixkit-cafe-ambience-172.mp3',
        nature: 'https://assets.mixkit.co/sfx/preview/mixkit-forest-birds-ambience-1210.mp3',
        'white-noise': 'https://assets.mixkit.co/sfx/preview/mixkit-white-noise-ambience-loop-1313.mp3'
    };
    
    fetch(soundUrls[sound])
        .then(response => response.arrayBuffer())
        .then(arrayBuffer => audioContext.decodeAudioData(arrayBuffer))
        .then(audioBuffer => {
            const source = audioContext.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(audioContext.destination);
            source.loop = true;
            source.start();
            currentSound = source;
        });
}

// Toggle sound options
soundToggleBtn.addEventListener('click', () => {
    soundOptions.classList.toggle('show');
});

// Sound option buttons
soundOptionsButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        const sound = btn.dataset.sound;
        playAmbientSound(sound);
        soundOptionsButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
    });
});

// Play alarm sound
function playAlarm() {
    if (document.getElementById('enableSound').checked) {
        const audio = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-alarm-digital-clock-beep-989.mp3');
        audio.volume = document.getElementById('soundVolume').value / 100;
        audio.play();
    }
    
    if (document.getElementById('enableNotifications').checked) {
        if (Notification.permission === 'granted') {
            new Notification('StudyBuddy Timer', {
                body: 'Time is up! Take a break.',
                icon: 'https://example.com/icon.png'
            });
        } else if (Notification.permission !== 'denied') {
            Notification.requestPermission();
        }
    }
}

// Settings Management
const settingsInputs = document.querySelectorAll('.settings-container input');
settingsInputs.forEach(input => {
    input.addEventListener('change', () => {
        const setting = input.id;
        const value = input.type === 'checkbox' ? input.checked : input.value;
        localStorage.setItem(setting, value);
    });
});

// Load saved settings
settingsInputs.forEach(input => {
    const savedValue = localStorage.getItem(input.id);
    if (savedValue !== null) {
        if (input.type === 'checkbox') {
            input.checked = savedValue === 'true';
        } else {
            input.value = savedValue;
        }
    }
});

// Initialize timer
function initializeTimer() {
    timeLeft = DURATIONS[currentMode] * 60;
    updateDisplay();
}

// Update display
function updateDisplay() {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    minutesDisplay.textContent = minutes.toString().padStart(2, '0');
    secondsDisplay.textContent = seconds.toString().padStart(2, '0');
}

// Start timer
function startTimer() {
    if (!isRunning) {
        isRunning = true;
        startBtn.disabled = true;
        pauseBtn.disabled = false;
        
        timer = setInterval(() => {
            timeLeft--;
            updateDisplay();
            
            if (timeLeft === 0) {
                clearInterval(timer);
                isRunning = false;
                startBtn.disabled = false;
                pauseBtn.disabled = true;
                playAlarm();
                updateStats();
            }
        }, 1000);
    }
}

// Pause timer
function pauseTimer() {
    if (isRunning) {
        clearInterval(timer);
        isRunning = false;
        startBtn.disabled = false;
        pauseBtn.disabled = true;
    }
}

// Change timer mode
function changeMode(mode) {
    currentMode = mode;
    modeButtons.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.mode === mode);
    });
    resetTimer();
}

// Event Listeners
startBtn.addEventListener('click', startTimer);
pauseBtn.addEventListener('click', pauseTimer);

modeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        changeMode(btn.dataset.mode);
    });
});

// Initialize timer
initializeTimer(); 