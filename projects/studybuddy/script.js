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

// Timer Management
let timer;
let timeLeft;
let isRunning = false;
let currentMode = 'pomodoro';

const minutesDisplay = document.getElementById('minutes');
const secondsDisplay = document.getElementById('seconds');
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const resetBtn = document.getElementById('resetBtn');
const modeButtons = document.querySelectorAll('.mode-btn');

// Timer durations (in minutes)
const durations = {
    pomodoro: 25,
    shortBreak: 5,
    longBreak: 15
};

// Initialize timer
function initializeTimer() {
    timeLeft = durations[currentMode] * 60;
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

// Reset timer
function resetTimer() {
    clearInterval(timer);
    isRunning = false;
    startBtn.disabled = false;
    pauseBtn.disabled = true;
    initializeTimer();
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
resetBtn.addEventListener('click', resetTimer);

modeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        changeMode(btn.dataset.mode);
    });
});

// Task Management
const taskInput = document.getElementById('taskInput');
const addTaskBtn = document.getElementById('addTaskBtn');
const taskList = document.getElementById('taskList');

function addTask() {
    const taskText = taskInput.value.trim();
    if (taskText) {
        const taskItem = document.createElement('li');
        taskItem.className = 'task-item';
        taskItem.innerHTML = `
            <span>${taskText}</span>
            <div class="task-actions">
                <button class="complete-task" aria-label="Complete task">
                    <i class="fas fa-check"></i>
                </button>
                <button class="delete-task" aria-label="Delete task">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        
        taskList.appendChild(taskItem);
        taskInput.value = '';
        
        // Add event listeners to new buttons
        taskItem.querySelector('.complete-task').addEventListener('click', () => {
            taskItem.classList.toggle('completed');
            updateStats();
        });
        
        taskItem.querySelector('.delete-task').addEventListener('click', () => {
            taskItem.remove();
        });
    }
}

addTaskBtn.addEventListener('click', addTask);
taskInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        addTask();
    }
});

// Stats Management
const completedPomodoros = document.getElementById('completedPomodoros');
const focusTime = document.getElementById('focusTime');
const tasksCompleted = document.getElementById('tasksCompleted');

let stats = {
    pomodoros: 0,
    focusMinutes: 0,
    tasks: 0
};

function updateStats() {
    if (currentMode === 'pomodoro') {
        stats.pomodoros++;
        stats.focusMinutes += durations.pomodoro;
    }
    
    stats.tasks = document.querySelectorAll('.task-item.completed').length;
    
    completedPomodoros.textContent = stats.pomodoros;
    focusTime.textContent = `${Math.floor(stats.focusMinutes / 60)}h ${stats.focusMinutes % 60}m`;
    tasksCompleted.textContent = stats.tasks;
    
    // Save stats to localStorage
    localStorage.setItem('studybuddyStats', JSON.stringify(stats));
}

// Load stats from localStorage
const savedStats = localStorage.getItem('studybuddyStats');
if (savedStats) {
    stats = JSON.parse(savedStats);
    updateStats();
}

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
initializeTimer(); 