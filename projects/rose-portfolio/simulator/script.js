/* ==========================================================================
   Self-Regulation Intervention Simulator
   Rose Amir Pour Portfolio
   ========================================================================== */

(function () {
    'use strict';

    // ── State ──────────────────────────────────────────────────────────
    var STORAGE_KEY = 'rose-simulator-results';
    var ALL_TYPES = ['breathing', 'mindfulness', 'writing', 'gratitude', 'nature', 'pmr', 'compassion', 'grounding'];
    var DIMENSIONS = ['mood', 'energy', 'stress', 'satisfaction'];
    var currentIntervention = null;
    var preRatings = { mood: 5, energy: 5, stress: 5, satisfaction: 5 };
    var postRatings = { mood: 5, energy: 5, stress: 5, satisfaction: 5 };
    var exerciseTimer = null;
    var exerciseInterval = null;
    var exerciseTimer2 = null;

    // ── DOM refs ───────────────────────────────────────────────────────
    var screens = {
        welcome:  document.getElementById('screen-welcome'),
        preMood:  document.getElementById('screen-pre-mood'),
        select:   document.getElementById('screen-select'),
        exercise: document.getElementById('screen-exercise'),
        postMood: document.getElementById('screen-post-mood'),
        results:  document.getElementById('screen-results'),
    };

    // ── Emoji maps ─────────────────────────────────────────────────────
    var MOOD_EMOJIS = {
        1: '\u{1F622}', 2: '\u{1F614}', 3: '\u{1F61F}', 4: '\u{1F641}', 5: '\u{1F610}',
        6: '\u{1F642}', 7: '\u{1F60A}', 8: '\u{1F604}', 9: '\u{1F601}', 10: '\u{1F929}',
    };
    var ENERGY_EMOJIS = {
        1: '\u{1F634}', 2: '\u{1F62A}', 3: '\u{1F971}', 4: '\u{1F4A4}', 5: '\u{1F6B6}',
        6: '\u{2615}', 7: '\u{1F3C3}', 8: '\u{1F4AA}', 9: '\u{26A1}', 10: '\u{1F525}',
    };
    var STRESS_EMOJIS = {
        1: '\u{1F4A5}', 2: '\u{1F630}', 3: '\u{1F628}', 4: '\u{1F616}', 5: '\u{1F610}',
        6: '\u{1F32C}', 7: '\u{1F343}', 8: '\u{1F54A}', 9: '\u{1F9D8}', 10: '\u{2728}',
    };
    var SATISFACTION_EMOJIS = {
        1: '\u{1F5D1}', 2: '\u{1F327}', 3: '\u{1F326}', 4: '\u{2601}', 5: '\u{26C5}',
        6: '\u{1F324}', 7: '\u{2600}', 8: '\u{1F308}', 9: '\u{1F31F}', 10: '\u{1F3C6}',
    };

    var EMOJI_MAPS = {
        mood: MOOD_EMOJIS,
        energy: ENERGY_EMOJIS,
        stress: STRESS_EMOJIS,
        satisfaction: SATISFACTION_EMOJIS,
    };

    // ── Prompt sets ──────────────────────────────────────────────────
    var MINDFULNESS_PROMPTS = [
        'Close your eyes gently. Take a deep breath in... and out.',
        'Focus on your feet. Notice any sensations - warmth, tingling, pressure against the ground.',
        'Move your attention to your legs. Notice how they feel - the weight, any tension or comfort.',
        'Feel your stomach rise and fall with each breath. Let your breathing be natural.',
        'Relax your shoulders. Let them drop away from your ears. Release any tightness.',
        'Notice any tension in your face - your jaw, forehead, around your eyes. Soften those areas.',
        'Now take in your whole body at once. Feel the gentle rhythm of your breath flowing through you.',
    ];

    var NATURE_SCENES = [
        { visual: '\u{1F333}\u{1F332}\u{2600}\u{FE0F}\u{1F332}\u{1F333}', prompt: 'Imagine yourself standing at the edge of a quiet forest. The air is fresh and cool. Sunlight filters through the leaves above.' },
        { visual: '\u{1F343}\u{1F33F}\u{1F343}', prompt: 'A gentle breeze moves through the trees, carrying the scent of pine and earth. Leaves rustle softly around you.' },
        { visual: '\u{1F4A7}\u{1F30A}\u{1F4A7}', prompt: 'In the distance, you hear the sound of a stream. The water flows over smooth stones, steady and calming.' },
        { visual: '\u{1F426}\u{1F3B6}\u{1F426}', prompt: 'Birds sing in the canopy overhead. Their melody blends with the water and wind, creating a natural symphony.' },
        { visual: '\u{2600}\u{FE0F}\u{1F33B}\u{2600}\u{FE0F}', prompt: 'You step into a warm, sunlit clearing. Wildflowers sway gently. Feel the warmth on your skin.' },
        { visual: '\u{1F30C}\u{2728}\u{1F30C}', prompt: 'Take one last deep breath. Carry this sense of peace with you as you return to the present moment.' },
    ];

    var PMR_STEPS = [
        { group: 'HANDS', prompt: 'Make tight fists with both hands. Squeeze as hard as you can... Hold it... Now release. Feel the tension dissolve.' },
        { group: 'ARMS', prompt: 'Bend your arms and flex your biceps tightly. Hold the tension... Now let your arms drop and go completely limp.' },
        { group: 'SHOULDERS', prompt: 'Shrug your shoulders up toward your ears. Hold them high and tight... Now let them drop all at once. Feel the relief.' },
        { group: 'FACE', prompt: 'Scrunch up your entire face - eyes, nose, mouth. Squeeze tightly... Now release. Let your face become smooth and relaxed.' },
        { group: 'CHEST', prompt: 'Take a deep breath and hold it. Feel your chest expand... Now exhale slowly and let all the tension go.' },
        { group: 'STOMACH', prompt: 'Tighten your stomach muscles as if bracing for impact. Hold firm... Now release and let your belly soften completely.' },
        { group: 'LEGS', prompt: 'Press your legs together and tighten your thighs. Hold the squeeze... Now release and feel heaviness settling in.' },
        { group: 'FEET', prompt: 'Curl your toes tightly and press the balls of your feet down. Hold it... Now let go. Feel warmth spreading through your feet.' },
    ];

    var COMPASSION_PROMPTS = [
        'Place your hand over your heart. Feel its gentle rhythm. You are here, and that is enough.',
        'Repeat silently: "This is a moment of difficulty. Suffering is a part of being human."',
        'Now say to yourself: "May I be kind to myself in this moment. May I give myself the compassion I need."',
        'Think of someone who loves you unconditionally. Imagine them speaking gently to you: "You are doing your best, and that is enough."',
        'Repeat: "May I be safe. May I be healthy. May I live with ease. May I be happy."',
        'Now extend this compassion outward. "May all beings feel safe. May all beings feel loved."',
        'Take a deep breath. You are worthy of the same kindness you give to others. Carry this warmth with you.',
    ];

    var GROUNDING_STEPS = [
        { count: 5, sense: 'SEE', prompt: 'Look around you. Name 5 things you can see right now. Notice their colors, shapes, and textures.' },
        { count: 4, sense: 'TOUCH', prompt: 'Notice 4 things you can physically feel. The chair beneath you, fabric on your skin, the temperature of the air.' },
        { count: 3, sense: 'HEAR', prompt: 'Listen carefully. Identify 3 sounds you can hear. Maybe distant traffic, your breathing, a fan humming.' },
        { count: 2, sense: 'SMELL', prompt: 'Notice 2 things you can smell. If nothing is obvious, bring something close - your sleeve, a nearby object.' },
        { count: 1, sense: 'TASTE', prompt: 'Focus on 1 thing you can taste. The inside of your mouth, a recent drink, the freshness of your breath.' },
    ];

    // ── Screen transitions ─────────────────────────────────────────────
    function showScreen(name) {
        Object.values(screens).forEach(function (s) {
            s.classList.remove('active', 'visible');
        });
        var target = screens[name];
        target.classList.add('active');
        void target.offsetWidth;
        requestAnimationFrame(function () {
            target.classList.add('visible');
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    requestAnimationFrame(function () {
        screens.welcome.classList.add('visible');
    });

    // ── Mood slider helpers ────────────────────────────────────────────
    function setupSlider(sliderId, valueId, emojiId, emojiMap) {
        var slider = document.getElementById(sliderId);
        var valueEl = document.getElementById(valueId);
        var emojiEl = document.getElementById(emojiId);
        var map = emojiMap || MOOD_EMOJIS;

        function update() {
            var val = parseInt(slider.value, 10);
            valueEl.textContent = val;
            emojiEl.textContent = map[val] || '\u{1F610}';
            emojiEl.style.transform = 'scale(1.1)';
            setTimeout(function () { emojiEl.style.transform = 'scale(1)'; }, 150);
            return val;
        }

        slider.addEventListener('input', update);
        update();
        return { slider: slider, getValue: function () { return parseInt(slider.value, 10); } };
    }

    // Set up all sliders
    var sliders = {
        pre: {
            mood: setupSlider('pre-mood-slider', 'pre-mood-value', 'pre-mood-emoji', MOOD_EMOJIS),
            energy: setupSlider('pre-energy-slider', 'pre-energy-value', 'pre-energy-emoji', ENERGY_EMOJIS),
            stress: setupSlider('pre-stress-slider', 'pre-stress-value', 'pre-stress-emoji', STRESS_EMOJIS),
            satisfaction: setupSlider('pre-satisfaction-slider', 'pre-satisfaction-value', 'pre-satisfaction-emoji', SATISFACTION_EMOJIS),
        },
        post: {
            mood: setupSlider('post-mood-slider', 'post-mood-value', 'post-mood-emoji', MOOD_EMOJIS),
            energy: setupSlider('post-energy-slider', 'post-energy-value', 'post-energy-emoji', ENERGY_EMOJIS),
            stress: setupSlider('post-stress-slider', 'post-stress-value', 'post-stress-emoji', STRESS_EMOJIS),
            satisfaction: setupSlider('post-satisfaction-slider', 'post-satisfaction-value', 'post-satisfaction-emoji', SATISFACTION_EMOJIS),
        },
    };

    // ── Navigation handlers ────────────────────────────────────────────
    document.getElementById('btn-begin').addEventListener('click', function () {
        showScreen('preMood');
    });

    document.getElementById('btn-pre-next').addEventListener('click', function () {
        DIMENSIONS.forEach(function (d) {
            preRatings[d] = sliders.pre[d].getValue();
        });
        showScreen('select');
    });

    document.querySelectorAll('.intervention-card').forEach(function (card) {
        card.addEventListener('click', function () {
            currentIntervention = this.getAttribute('data-intervention');
            showScreen('exercise');
            startExercise(currentIntervention);
        });
    });

    document.getElementById('btn-finish-early').addEventListener('click', function () {
        stopExercise();
        showScreen('postMood');
    });

    document.getElementById('btn-post-next').addEventListener('click', function () {
        DIMENSIONS.forEach(function (d) {
            postRatings[d] = sliders.post[d].getValue();
        });
        saveResult();
        showResults();
        showScreen('results');
    });

    document.getElementById('btn-try-another').addEventListener('click', function () {
        // Reset post sliders only (pre-ratings carry over as new baseline)
        DIMENSIONS.forEach(function (d) {
            document.getElementById('pre-' + d + '-slider').value = 5;
            document.getElementById('post-' + d + '-slider').value = 5;
        });
        sliders.pre = {
            mood: setupSlider('pre-mood-slider', 'pre-mood-value', 'pre-mood-emoji', MOOD_EMOJIS),
            energy: setupSlider('pre-energy-slider', 'pre-energy-value', 'pre-energy-emoji', ENERGY_EMOJIS),
            stress: setupSlider('pre-stress-slider', 'pre-stress-value', 'pre-stress-emoji', STRESS_EMOJIS),
            satisfaction: setupSlider('pre-satisfaction-slider', 'pre-satisfaction-value', 'pre-satisfaction-emoji', SATISFACTION_EMOJIS),
        };
        sliders.post = {
            mood: setupSlider('post-mood-slider', 'post-mood-value', 'post-mood-emoji', MOOD_EMOJIS),
            energy: setupSlider('post-energy-slider', 'post-energy-value', 'post-energy-emoji', ENERGY_EMOJIS),
            stress: setupSlider('post-stress-slider', 'post-stress-value', 'post-stress-emoji', STRESS_EMOJIS),
            satisfaction: setupSlider('post-satisfaction-slider', 'post-satisfaction-value', 'post-satisfaction-emoji', SATISFACTION_EMOJIS),
        };
        currentIntervention = null;
        showScreen('preMood');
    });

    // ── Exercise logic ─────────────────────────────────────────────────
    function startExercise(type) {
        document.querySelectorAll('.exercise-panel').forEach(function (p) {
            p.hidden = true;
        });
        var panel = document.getElementById('exercise-' + type);
        panel.hidden = false;

        if (type === 'breathing') startBreathing();
        else if (type === 'mindfulness') startMindfulness();
        else if (type === 'writing') startWriting();
        else if (type === 'gratitude') startGratitude();
        else if (type === 'nature') startNature();
        else if (type === 'pmr') startPMR();
        else if (type === 'compassion') startCompassion();
        else if (type === 'grounding') startGrounding();
    }

    function stopExercise() {
        if (exerciseTimer) { clearTimeout(exerciseTimer); exerciseTimer = null; }
        if (exerciseTimer2) { clearTimeout(exerciseTimer2); exerciseTimer2 = null; }
        if (exerciseInterval) { clearInterval(exerciseInterval); exerciseInterval = null; }
        var circle = document.getElementById('breathing-circle');
        if (circle) {
            circle.classList.remove('inhale', 'exhale');
            document.getElementById('breathing-text').textContent = 'Get Ready';
        }
    }

    // ── Paced Breathing ────────────────────────────────────────────────
    function startBreathing() {
        var totalSeconds = 120;
        var timerEl = document.getElementById('breathing-timer');
        var circle = document.getElementById('breathing-circle');
        var textEl = document.getElementById('breathing-text');
        var remaining = totalSeconds;

        updateTimerDisplay(timerEl, remaining);

        setTimeout(function () {
            breathCycle();
            exerciseInterval = setInterval(function () {
                remaining--;
                updateTimerDisplay(timerEl, remaining);
                if (remaining <= 0) {
                    stopExercise();
                    showScreen('postMood');
                }
            }, 1000);
        }, 500);

        function breathCycle() {
            if (remaining <= 0) return;
            circle.classList.remove('exhale');
            circle.classList.add('inhale');
            textEl.textContent = 'Breathe In...';

            exerciseTimer = setTimeout(function () {
                if (remaining <= 0) return;
                circle.classList.remove('inhale');
                circle.classList.add('exhale');
                textEl.textContent = 'Breathe Out...';
                exerciseTimer = setTimeout(function () { breathCycle(); }, 4000);
            }, 4000);
        }
    }

    // ── Mindfulness Body Scan ──────────────────────────────────────────
    function startMindfulness() {
        runPromptExercise(120, 'mindfulness-timer', 'mindfulness-prompt', 'mindfulness-progress-bar', MINDFULNESS_PROMPTS);
    }

    // ── Expressive Writing ─────────────────────────────────────────────
    function startWriting() {
        runWritingExercise(180, 'writing-timer', 'writing-textarea');
    }

    // ── Gratitude Journaling ───────────────────────────────────────────
    function startGratitude() {
        runWritingExercise(180, 'gratitude-timer', 'gratitude-textarea');
    }

    // ── Nature Visualization ───────────────────────────────────────────
    function startNature() {
        var totalSeconds = 120;
        var timerEl = document.getElementById('nature-timer');
        var promptEl = document.getElementById('nature-prompt');
        var visualEl = document.getElementById('nature-visual');
        var progressBar = document.getElementById('nature-progress-bar');
        var remaining = totalSeconds;
        var promptIndex = 0;
        var promptDuration = Math.floor(totalSeconds / NATURE_SCENES.length);

        updateTimerDisplay(timerEl, remaining);
        progressBar.style.width = '0%';

        setTimeout(function () {
            showNaturePrompt(0);
            exerciseInterval = setInterval(function () {
                remaining--;
                updateTimerDisplay(timerEl, remaining);
                progressBar.style.width = (((totalSeconds - remaining) / totalSeconds) * 100) + '%';

                if (remaining <= 0) {
                    stopExercise();
                    showScreen('postMood');
                    return;
                }

                var elapsed = totalSeconds - remaining;
                var newIndex = Math.min(Math.floor(elapsed / promptDuration), NATURE_SCENES.length - 1);
                if (newIndex !== promptIndex) {
                    promptIndex = newIndex;
                    promptEl.classList.add('fading');
                    visualEl.classList.add('fading');
                    exerciseTimer2 = setTimeout(function () {
                        showNaturePrompt(promptIndex);
                        promptEl.classList.remove('fading');
                        visualEl.classList.remove('fading');
                    }, 500);
                }
            }, 1000);
        }, 500);

        function showNaturePrompt(idx) {
            var scene = NATURE_SCENES[idx] || NATURE_SCENES[NATURE_SCENES.length - 1];
            visualEl.textContent = scene.visual;
            promptEl.textContent = scene.prompt;
        }
    }

    // ── Progressive Muscle Relaxation ──────────────────────────────────
    function startPMR() {
        var totalSeconds = 120;
        var timerEl = document.getElementById('pmr-timer');
        var promptEl = document.getElementById('pmr-prompt');
        var statusEl = document.getElementById('pmr-status');
        var progressBar = document.getElementById('pmr-progress-bar');
        var remaining = totalSeconds;
        var stepIndex = 0;
        var stepDuration = Math.floor(totalSeconds / PMR_STEPS.length);

        updateTimerDisplay(timerEl, remaining);
        progressBar.style.width = '0%';

        setTimeout(function () {
            showPMRStep(0);
            exerciseInterval = setInterval(function () {
                remaining--;
                updateTimerDisplay(timerEl, remaining);
                progressBar.style.width = (((totalSeconds - remaining) / totalSeconds) * 100) + '%';

                if (remaining <= 0) {
                    stopExercise();
                    showScreen('postMood');
                    return;
                }

                var elapsed = totalSeconds - remaining;
                var newIndex = Math.min(Math.floor(elapsed / stepDuration), PMR_STEPS.length - 1);
                if (newIndex !== stepIndex) {
                    stepIndex = newIndex;
                    promptEl.classList.add('fading');
                    exerciseTimer2 = setTimeout(function () {
                        showPMRStep(stepIndex);
                        promptEl.classList.remove('fading');
                    }, 500);
                }
            }, 1000);
        }, 500);

        function showPMRStep(idx) {
            var step = PMR_STEPS[idx] || PMR_STEPS[PMR_STEPS.length - 1];
            statusEl.textContent = step.group;
            promptEl.textContent = step.prompt;
        }
    }

    // ── Self-Compassion ────────────────────────────────────────────────
    function startCompassion() {
        runPromptExercise(120, 'compassion-timer', 'compassion-prompt', 'compassion-progress-bar', COMPASSION_PROMPTS);
    }

    // ── 5-4-3-2-1 Grounding ───────────────────────────────────────────
    var groundingStepIndex = 0;
    var groundingNextBtn = document.getElementById('btn-grounding-next');

    function startGrounding() {
        groundingStepIndex = 0;
        showGroundingStep(0);

        // Update step info
        var infoEl = document.getElementById('grounding-step-info');
        infoEl.textContent = 'Step 1 of ' + GROUNDING_STEPS.length;
    }

    if (groundingNextBtn) {
        groundingNextBtn.addEventListener('click', function () {
            groundingStepIndex++;
            if (groundingStepIndex >= GROUNDING_STEPS.length) {
                stopExercise();
                showScreen('postMood');
            } else {
                var promptEl = document.getElementById('grounding-prompt');
                promptEl.classList.add('fading');
                setTimeout(function () {
                    showGroundingStep(groundingStepIndex);
                    promptEl.classList.remove('fading');
                }, 300);
            }
        });
    }

    function showGroundingStep(idx) {
        var SENSE_ICONS = { SEE: '\u{1F441}', TOUCH: '\u{270B}', HEAR: '\u{1F442}', SMELL: '\u{1F443}', TASTE: '\u{1F445}' };
        var step = GROUNDING_STEPS[idx] || GROUNDING_STEPS[GROUNDING_STEPS.length - 1];
        var countEl = document.getElementById('grounding-count');
        var senseEl = document.getElementById('grounding-sense');
        var promptEl = document.getElementById('grounding-prompt');
        var inputsEl = document.getElementById('grounding-inputs');
        var infoEl = document.getElementById('grounding-step-info');

        countEl.textContent = step.count;
        senseEl.textContent = (SENSE_ICONS[step.sense] || '') + ' ' + step.sense;
        promptEl.textContent = step.prompt;
        infoEl.textContent = 'Step ' + (idx + 1) + ' of ' + GROUNDING_STEPS.length;

        // Update button text on last step
        if (groundingNextBtn) {
            if (idx === GROUNDING_STEPS.length - 1) {
                groundingNextBtn.innerHTML = 'Finish <i class="fas fa-check"></i>';
            } else {
                groundingNextBtn.innerHTML = 'Next <i class="fas fa-arrow-right"></i>';
            }
        }

        // Build input fields
        inputsEl.innerHTML = '';
        for (var i = 1; i <= step.count; i++) {
            var input = document.createElement('input');
            input.type = 'text';
            input.className = 'grounding-input';
            input.placeholder = i + '. I ' + step.sense.toLowerCase() + '...';
            inputsEl.appendChild(input);
        }
        var firstInput = inputsEl.querySelector('input');
        if (firstInput) firstInput.focus();
    }

    // ── Shared helpers ─────────────────────────────────────────────────
    function runPromptExercise(totalSeconds, timerId, promptId, progressBarId, prompts) {
        var timerEl = document.getElementById(timerId);
        var promptEl = document.getElementById(promptId);
        var progressBar = document.getElementById(progressBarId);
        var remaining = totalSeconds;
        var promptIndex = 0;
        var promptDuration = Math.floor(totalSeconds / prompts.length);

        updateTimerDisplay(timerEl, remaining);
        progressBar.style.width = '0%';

        setTimeout(function () {
            promptEl.textContent = prompts[0];
            exerciseInterval = setInterval(function () {
                remaining--;
                updateTimerDisplay(timerEl, remaining);
                progressBar.style.width = (((totalSeconds - remaining) / totalSeconds) * 100) + '%';

                if (remaining <= 0) {
                    stopExercise();
                    showScreen('postMood');
                    return;
                }

                var elapsed = totalSeconds - remaining;
                var newIndex = Math.min(Math.floor(elapsed / promptDuration), prompts.length - 1);
                if (newIndex !== promptIndex) {
                    promptIndex = newIndex;
                    promptEl.classList.add('fading');
                    exerciseTimer2 = setTimeout(function () {
                        promptEl.textContent = prompts[promptIndex] || prompts[prompts.length - 1];
                        promptEl.classList.remove('fading');
                    }, 500);
                }
            }, 1000);
        }, 500);
    }

    function runWritingExercise(totalSeconds, timerId, textareaId) {
        var timerEl = document.getElementById(timerId);
        var textarea = document.getElementById(textareaId);
        var remaining = totalSeconds;

        textarea.value = '';
        textarea.focus();
        updateTimerDisplay(timerEl, remaining);

        exerciseInterval = setInterval(function () {
            remaining--;
            updateTimerDisplay(timerEl, remaining);
            if (remaining <= 0) {
                stopExercise();
                showScreen('postMood');
            }
        }, 1000);
    }

    // ── Timer display ──────────────────────────────────────────────────
    function updateTimerDisplay(el, seconds) {
        var m = Math.floor(seconds / 60);
        var s = seconds % 60;
        el.textContent = m + ':' + (s < 10 ? '0' : '') + s;
    }

    // ── Data persistence ───────────────────────────────────────────────
    function getResults() {
        try {
            var data = JSON.parse(localStorage.getItem(STORAGE_KEY));
            return Array.isArray(data) ? data : [];
        } catch (e) {
            return [];
        }
    }

    function saveResult() {
        var results = getResults();
        var entry = {
            intervention: currentIntervention,
            timestamp: new Date().toISOString(),
        };
        DIMENSIONS.forEach(function (d) {
            entry['pre_' + d] = preRatings[d];
            entry['post_' + d] = postRatings[d];
            entry['change_' + d] = postRatings[d] - preRatings[d];
        });
        // Backward compat
        entry.preMood = preRatings.mood;
        entry.postMood = postRatings.mood;
        entry.change = postRatings.mood - preRatings.mood;
        results.push(entry);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(results));
    }

    // ── Intervention display names ─────────────────────────────────────
    var INTERVENTION_NAMES = {
        breathing: 'Paced Breathing',
        mindfulness: 'Mindfulness Body Scan',
        writing: 'Expressive Writing',
        gratitude: 'Gratitude Journaling',
        nature: 'Nature Visualization',
        pmr: 'Progressive Muscle Relaxation',
        compassion: 'Self-Compassion',
        grounding: '5-4-3-2-1 Grounding',
    };

    // ── Results display ────────────────────────────────────────────────
    function showResults() {
        document.getElementById('result-intervention').textContent = INTERVENTION_NAMES[currentIntervention] || currentIntervention;

        // Show each dimension's before/after
        DIMENSIONS.forEach(function (d) {
            var pre = preRatings[d];
            var post = postRatings[d];
            var change = post - pre;

            document.getElementById('result-pre-' + d).textContent = pre;
            document.getElementById('result-post-' + d).textContent = post;

            var arrowEl = document.getElementById('result-arrow-' + d);
            var changeEl = document.getElementById('result-change-' + d);

            arrowEl.className = 'result-arrow';
            changeEl.className = 'result-change';

            if (change > 0) {
                arrowEl.innerHTML = '<i class="fas fa-arrow-up"></i>';
                arrowEl.classList.add('improved');
                changeEl.classList.add('improved');
                changeEl.textContent = '+' + change;
            } else if (change < 0) {
                arrowEl.innerHTML = '<i class="fas fa-arrow-down"></i>';
                arrowEl.classList.add('declined');
                changeEl.classList.add('declined');
                changeEl.textContent = change;
            } else {
                arrowEl.innerHTML = '<i class="fas fa-equals"></i>';
                changeEl.classList.add('neutral');
                changeEl.textContent = 'No change';
            }
        });

        // Aggregated stats (mood-based for the chart)
        var results = getResults();
        var totals = {};
        ALL_TYPES.forEach(function (t) { totals[t] = []; });

        results.forEach(function (r) {
            if (totals[r.intervention]) {
                // Use mood change or fall back to generic change
                var ch = r.change_mood !== undefined ? r.change_mood : r.change;
                if (ch !== undefined) totals[r.intervention].push(ch);
            }
        });

        var averages = {};
        var maxAbsAvg = 0;
        ALL_TYPES.forEach(function (key) {
            var arr = totals[key];
            if (arr.length === 0) {
                averages[key] = null;
            } else {
                var sum = arr.reduce(function (a, b) { return a + b; }, 0);
                averages[key] = sum / arr.length;
                var abs = Math.abs(averages[key]);
                if (abs > maxAbsAvg) maxAbsAvg = abs;
            }
        });

        if (maxAbsAvg === 0) maxAbsAvg = 1;

        ALL_TYPES.forEach(function (key) {
            var bar = document.getElementById('bar-' + key);
            var val = document.getElementById('val-' + key);
            if (!bar || !val) return;

            if (averages[key] === null) {
                bar.style.width = '0%';
                bar.className = 'chart-bar';
                val.textContent = '--';
            } else {
                var avg = averages[key];
                var pct = Math.min((Math.abs(avg) / maxAbsAvg) * 80, 80) + 5;
                bar.className = 'chart-bar';

                setTimeout(function () {
                    bar.style.width = pct + '%';
                    if (avg > 0) bar.classList.add('positive');
                    else if (avg < 0) bar.classList.add('negative');
                    else bar.classList.add('zero');
                }, 300);

                val.textContent = (avg >= 0 ? '+' : '') + avg.toFixed(1);
            }
        });

        document.getElementById('session-count').textContent =
            'Based on ' + results.length + ' session' + (results.length !== 1 ? 's' : '') + ' recorded';
    }

})();
