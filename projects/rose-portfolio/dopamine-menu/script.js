(function () {
    'use strict';

    // ── State ──
    var state = {
        energy: null,    // low | medium | high
        setting: 'either',
        social: 'either',
        vibe: 'either',
        time: 'either',
        mood: 'neutral'
    };

    // ── DOM ──
    var steps = {
        energy: document.getElementById('step-energy'),
        preferences: document.getElementById('step-preferences'),
        mood: document.getElementById('step-mood'),
        menu: document.getElementById('step-menu')
    };
    var progressFill = document.getElementById('progress-fill');
    var menuSubtitle = document.getElementById('menu-subtitle');

    // ── Activity Database ──
    // Tags: setting(indoor/outdoor/either), social(solo/social/either), vibe(creative/relaxing/either), energy(low/medium/high/any)
    var activities = {
        snacks: [
            { text: "Step outside and take 10 deep breaths", setting: "outdoor", social: "solo", vibe: "relaxing", energy: "any" },
            { text: "Stretch for 5 minutes", setting: "indoor", social: "solo", vibe: "relaxing", energy: "any" },
            { text: "Listen to your favourite song with your eyes closed", setting: "either", social: "solo", vibe: "relaxing", energy: "any" },
            { text: "Write down 3 things you're grateful for", setting: "indoor", social: "solo", vibe: "either", energy: "any" },
            { text: "Drink a full glass of water mindfully", setting: "either", social: "solo", vibe: "relaxing", energy: "low" },
            { text: "Do a quick body scan from head to toe", setting: "either", social: "solo", vibe: "relaxing", energy: "any" },
            { text: "Doodle or sketch anything for 5 minutes", setting: "indoor", social: "solo", vibe: "creative", energy: "any" },
            { text: "Text a friend something kind or funny", setting: "either", social: "social", vibe: "either", energy: "low" },
            { text: "Tidy one small surface near you", setting: "indoor", social: "solo", vibe: "either", energy: "low" },
            { text: "Look at photos from a happy memory", setting: "either", social: "solo", vibe: "relaxing", energy: "low" },
            { text: "Write a short positive affirmation for yourself", setting: "indoor", social: "solo", vibe: "either", energy: "low" },
            { text: "Step onto grass or soil barefoot for a few minutes", setting: "outdoor", social: "solo", vibe: "relaxing", energy: "low" },
            { text: "Do 10 jumping jacks to reset your energy", setting: "either", social: "solo", vibe: "either", energy: "medium" },
            { text: "Watch a funny short video", setting: "indoor", social: "either", vibe: "relaxing", energy: "low" },
            { text: "Rearrange something small on your desk or shelf", setting: "indoor", social: "solo", vibe: "creative", energy: "low" },
            { text: "Name 5 things you can see and describe their colours", setting: "either", social: "solo", vibe: "relaxing", energy: "low" },
            { text: "Send a voice note to someone you miss", setting: "either", social: "social", vibe: "either", energy: "low" },
            { text: "Write a haiku about your current mood", setting: "indoor", social: "solo", vibe: "creative", energy: "any" },
            { text: "Water a plant or check on one nearby", setting: "either", social: "solo", vibe: "relaxing", energy: "low" },
            { text: "Play with a pet for a few minutes", setting: "either", social: "either", vibe: "relaxing", energy: "any" }
        ],
        appetizers: [
            { text: "Go for a 15-minute walk, no phone", setting: "outdoor", social: "solo", vibe: "relaxing", energy: "medium" },
            { text: "Journal about how your day is going so far", setting: "indoor", social: "solo", vibe: "either", energy: "any" },
            { text: "Do a 10-minute guided breathing exercise", setting: "either", social: "solo", vibe: "relaxing", energy: "low" },
            { text: "Call or voice-call a friend just to catch up", setting: "either", social: "social", vibe: "either", energy: "medium" },
            { text: "Make yourself a nice snack or drink from scratch", setting: "indoor", social: "solo", vibe: "creative", energy: "medium" },
            { text: "Write a letter to your future self", setting: "indoor", social: "solo", vibe: "creative", energy: "any" },
            { text: "Do a 15-minute yoga or stretching routine", setting: "indoor", social: "solo", vibe: "relaxing", energy: "medium" },
            { text: "Sit outside and people-watch or cloud-watch", setting: "outdoor", social: "solo", vibe: "relaxing", energy: "low" },
            { text: "Sketch, paint, or colour for 15 minutes", setting: "indoor", social: "solo", vibe: "creative", energy: "any" },
            { text: "Walk to a coffee shop and order your favourite drink", setting: "outdoor", social: "either", vibe: "relaxing", energy: "medium" },
            { text: "Read a chapter of a book you enjoy", setting: "either", social: "solo", vibe: "relaxing", energy: "low" },
            { text: "Do a brain dump: write everything on your mind on paper", setting: "indoor", social: "solo", vibe: "either", energy: "any" },
            { text: "Take a different route on your next walk", setting: "outdoor", social: "either", vibe: "either", energy: "medium" },
            { text: "Organize one drawer or small space", setting: "indoor", social: "solo", vibe: "either", energy: "medium" },
            { text: "Write a gratitude letter to someone (you don't have to send it)", setting: "indoor", social: "solo", vibe: "creative", energy: "any" },
            { text: "Listen to a short podcast episode about something new", setting: "either", social: "solo", vibe: "either", energy: "low" },
            { text: "Sit in a park and read or just be", setting: "outdoor", social: "solo", vibe: "relaxing", energy: "low" },
            { text: "Try a new breathing pattern (box breathing, 4-7-8, etc.)", setting: "either", social: "solo", vibe: "relaxing", energy: "low" },
            { text: "FaceTime a friend while making tea", setting: "indoor", social: "social", vibe: "relaxing", energy: "medium" },
            { text: "Write down your current worries, then physically set the paper aside", setting: "indoor", social: "solo", vibe: "either", energy: "any" }
        ],
        mains: [
            { text: "Cook a meal from scratch, something you enjoy making", setting: "indoor", social: "either", vibe: "creative", energy: "medium" },
            { text: "Go for a run, bike ride, or longer walk", setting: "outdoor", social: "either", vibe: "either", energy: "high" },
            { text: "Work on a creative project (art, music, writing, crafts)", setting: "indoor", social: "solo", vibe: "creative", energy: "medium" },
            { text: "Have a long phone call or video chat with someone close", setting: "either", social: "social", vibe: "either", energy: "medium" },
            { text: "Explore a new neighbourhood or trail", setting: "outdoor", social: "either", vibe: "either", energy: "high" },
            { text: "Try a full yoga or workout session", setting: "either", social: "either", vibe: "either", energy: "high" },
            { text: "Bake something from scratch", setting: "indoor", social: "either", vibe: "creative", energy: "medium" },
            { text: "Rearrange or redecorate a part of your room", setting: "indoor", social: "solo", vibe: "creative", energy: "high" },
            { text: "Go to a museum, gallery, or bookstore", setting: "outdoor", social: "either", vibe: "either", energy: "medium" },
            { text: "Have a picnic or eat lunch outside somewhere new", setting: "outdoor", social: "either", vibe: "relaxing", energy: "medium" },
            { text: "Write a short story, poem, or essay about anything", setting: "indoor", social: "solo", vibe: "creative", energy: "medium" },
            { text: "Deep clean one room and put on your favourite playlist", setting: "indoor", social: "solo", vibe: "either", energy: "high" },
            { text: "Volunteer somewhere local", setting: "outdoor", social: "social", vibe: "either", energy: "high" },
            { text: "Start learning something new (language, instrument, skill)", setting: "either", social: "solo", vibe: "creative", energy: "medium" },
            { text: "Garden, repot plants, or build a small planter", setting: "outdoor", social: "solo", vibe: "creative", energy: "medium" },
            { text: "Meet a friend for coffee or a walk", setting: "outdoor", social: "social", vibe: "either", energy: "medium" },
            { text: "Do a puzzle, build something with your hands", setting: "indoor", social: "either", vibe: "creative", energy: "medium" },
            { text: "Take a dance class or follow a dance video", setting: "either", social: "either", vibe: "creative", energy: "high" },
            { text: "Plan a day trip or outing for the weekend", setting: "indoor", social: "either", vibe: "either", energy: "medium" },
            { text: "Have a spa moment: face mask, bath, the whole thing", setting: "indoor", social: "solo", vibe: "relaxing", energy: "low" }
        ],
        sides: [
            { text: "Light a candle or use a diffuser", setting: "indoor", social: "either", vibe: "relaxing", energy: "any" },
            { text: "Put on a feel-good playlist in the background", setting: "either", social: "either", vibe: "either", energy: "any" },
            { text: "Make yourself tea or hot chocolate", setting: "indoor", social: "either", vibe: "relaxing", energy: "any" },
            { text: "Open a window and let fresh air in", setting: "indoor", social: "either", vibe: "relaxing", energy: "any" },
            { text: "Put on cozy clothes", setting: "indoor", social: "solo", vibe: "relaxing", energy: "low" },
            { text: "Use a hand cream or body lotion you love", setting: "either", social: "solo", vibe: "relaxing", energy: "any" },
            { text: "Turn off notifications for the next hour", setting: "either", social: "solo", vibe: "relaxing", energy: "any" },
            { text: "Put on a nature sounds track (rain, waves, birds)", setting: "either", social: "either", vibe: "relaxing", energy: "any" },
            { text: "Chew gum or eat a piece of chocolate mindfully", setting: "either", social: "either", vibe: "relaxing", energy: "any" },
            { text: "Spray your favourite scent or cologne", setting: "either", social: "solo", vibe: "relaxing", energy: "any" },
            { text: "Switch to warmer/softer lighting", setting: "indoor", social: "either", vibe: "relaxing", energy: "any" },
            { text: "Have a cold glass of water with lemon", setting: "indoor", social: "either", vibe: "relaxing", energy: "any" }
        ],
        desserts: [
            { text: "Watch an episode of your comfort show", setting: "indoor", social: "either", vibe: "relaxing", energy: "low" },
            { text: "Play a video game you enjoy", setting: "indoor", social: "either", vibe: "either", energy: "low" },
            { text: "Online window-shop for something fun", setting: "indoor", social: "solo", vibe: "either", energy: "low" },
            { text: "Scroll through your favourite meme page", setting: "either", social: "solo", vibe: "relaxing", energy: "low" },
            { text: "Order your favourite takeout", setting: "indoor", social: "either", vibe: "relaxing", energy: "low" },
            { text: "Binge a few YouTube videos on a topic you love", setting: "indoor", social: "solo", vibe: "either", energy: "low" },
            { text: "Watch a movie you've been meaning to see", setting: "indoor", social: "either", vibe: "relaxing", energy: "low" },
            { text: "Treat yourself to something small (a snack, a coffee, a download)", setting: "either", social: "either", vibe: "either", energy: "low" },
            { text: "Have a guilt-free nap", setting: "indoor", social: "solo", vibe: "relaxing", energy: "low" },
            { text: "Go down a Wikipedia rabbit hole on something random", setting: "either", social: "solo", vibe: "either", energy: "low" }
        ]
    };

    // Mood-specific bonus items injected into relevant categories
    var moodExtras = {
        stressed: {
            snacks: ["Do 30 seconds of box breathing (in 4, hold 4, out 4, hold 4)", "Write down one thing you can control right now"],
            appetizers: ["Take a warm shower and focus on the sensation of the water", "Do a progressive muscle relaxation from toes to head"]
        },
        anxious: {
            snacks: ["Hold an ice cube and focus on the cold sensation", "Name 5 things you see, 4 you hear, 3 you touch, 2 you smell, 1 you taste"],
            appetizers: ["Write down your worry and rate it 1-10. Revisit it in an hour.", "Do a grounding walk: feel each footstep on the ground"]
        },
        sad: {
            snacks: ["Wrap yourself in a blanket and let yourself just be for a minute", "Look at a photo of someone who loves you"],
            appetizers: ["Write a few sentences about what you're feeling, no filter", "Watch something that's made you genuinely laugh before"]
        },
        restless: {
            snacks: ["Do 20 jumping jacks or run in place for 30 seconds", "Rearrange 3 things on your desk"],
            mains: ["Start a brand new project or hobby you've been thinking about", "Go somewhere you've never been, even a new street"]
        },
        lonely: {
            snacks: ["Send a 'thinking of you' text to someone", "Write down 3 people you feel connected to"],
            appetizers: ["Call someone, even if it's just for 5 minutes", "Go to a coffee shop or library just to be around people"]
        },
        unmotivated: {
            snacks: ["Do the tiniest version of one thing on your list", "Set a 5-minute timer and just start"],
            appetizers: ["Write down 3 things you've accomplished this week, however small", "Change your environment, move to a different room or go outside"]
        }
    };

    // ── Helpers ──
    function shuffle(arr) {
        var a = arr.slice();
        for (var i = a.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var t = a[i]; a[i] = a[j]; a[j] = t;
        }
        return a;
    }

    function matches(item) {
        if (state.setting !== 'either' && item.setting !== 'either' && item.setting !== state.setting) return false;
        if (state.social !== 'either' && item.social !== 'either' && item.social !== state.social) return false;
        if (state.vibe !== 'either' && item.vibe !== 'either' && item.vibe !== state.vibe) return false;
        if (item.energy !== 'any') {
            var levels = { low: 1, medium: 2, high: 3 };
            var userLevel = levels[state.energy] || 2;
            var itemLevel = levels[item.energy] || 2;
            if (itemLevel > userLevel + 1) return false;
        }
        return true;
    }

    function filterAndPick(category, count) {
        var pool = activities[category].filter(matches);
        if (pool.length < count) pool = activities[category].slice(); // fallback
        var picked = shuffle(pool).slice(0, count);

        // Add mood-specific extras
        if (state.mood !== 'neutral' && moodExtras[state.mood] && moodExtras[state.mood][category]) {
            var extras = moodExtras[state.mood][category];
            var extra = extras[Math.floor(Math.random() * extras.length)];
            picked.push({ text: extra, mood: true });
        }

        return picked;
    }

    function showStep(name) {
        Object.keys(steps).forEach(function (k) {
            steps[k].classList.remove('active');
        });
        steps[name].classList.add('active');

        var progress = { energy: 33, preferences: 55, mood: 78, menu: 100 };
        progressFill.style.width = progress[name] + '%';
    }

    function renderMenu() {
        var sections = [
            { key: 'snacks', el: 'items-snacks', count: 4 },
            { key: 'appetizers', el: 'items-appetizers', count: 4 },
            { key: 'mains', el: 'items-mains', count: 3 },
            { key: 'sides', el: 'items-sides', count: 3 },
            { key: 'desserts', el: 'items-desserts', count: 2 }
        ];

        sections.forEach(function (sec) {
            var ul = document.getElementById(sec.el);
            ul.innerHTML = '';
            var items = filterAndPick(sec.key, sec.count);
            items.forEach(function (item) {
                var li = document.createElement('li');
                li.className = 'menu-item';
                var check = document.createElement('i');
                check.className = 'fas fa-circle item-check';
                li.appendChild(check);
                var span = document.createElement('span');
                span.textContent = item.text || item;
                if (item.mood) {
                    var tag = document.createElement('span');
                    tag.className = 'item-tag';
                    tag.textContent = 'for you';
                    span.appendChild(tag);
                }
                li.appendChild(span);
                ul.appendChild(li);
            });
        });

        var labels = [];
        if (state.energy) labels.push(state.energy + ' energy');
        if (state.setting !== 'either') labels.push(state.setting);
        if (state.social !== 'either') labels.push(state.social);
        if (state.vibe !== 'either') labels.push(state.vibe);
        if (state.mood !== 'neutral') labels.push('feeling ' + state.mood);
        menuSubtitle.textContent = labels.length ? 'Personalized for: ' + labels.join(' / ') : '';
    }

    // ── Events: Step 1 - Energy ──
    document.querySelectorAll('#step-energy .option-card').forEach(function (card) {
        card.addEventListener('click', function () {
            document.querySelectorAll('#step-energy .option-card').forEach(function (c) { c.classList.remove('selected'); });
            card.classList.add('selected');
            state.energy = card.dataset.value;
            setTimeout(function () { showStep('preferences'); }, 300);
        });
    });

    // ── Events: Step 2 - Preferences ──
    document.querySelectorAll('.pref-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
            var group = btn.dataset.pref;
            document.querySelectorAll('.pref-btn[data-pref="' + group + '"]').forEach(function (b) { b.classList.remove('active'); });
            btn.classList.add('active');
            state[group] = btn.dataset.value;
        });
    });

    document.getElementById('btn-generate').addEventListener('click', function () {
        showStep('mood');
    });

    // ── Events: Step 3 - Mood ──
    document.querySelectorAll('.mood-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
            state.mood = btn.dataset.mood;
            renderMenu();
            showStep('menu');
        });
    });

    // ── Events: Menu Actions ──
    document.getElementById('btn-shuffle').addEventListener('click', function () {
        renderMenu();
    });

    document.getElementById('btn-restart').addEventListener('click', function () {
        state = { energy: null, setting: 'either', social: 'either', vibe: 'either', time: 'either', mood: 'neutral' };
        document.querySelectorAll('.option-card').forEach(function (c) { c.classList.remove('selected'); });
        document.querySelectorAll('.pref-btn').forEach(function (b) {
            b.classList.remove('active');
            if (b.dataset.value === 'either') b.classList.add('active');
        });
        showStep('energy');
    });

    document.getElementById('btn-save').addEventListener('click', function () {
        var saved = JSON.parse(localStorage.getItem('rose-dopamine-menus') || '[]');
        var menuData = {};
        ['snacks', 'appetizers', 'mains', 'sides', 'desserts'].forEach(function (key) {
            var ul = document.getElementById('items-' + key);
            menuData[key] = Array.from(ul.querySelectorAll('.menu-item span')).map(function (s) { return s.textContent.replace('for you', '').trim(); });
        });
        saved.push({
            date: new Date().toISOString(),
            energy: state.energy,
            mood: state.mood,
            menu: menuData
        });
        localStorage.setItem('rose-dopamine-menus', JSON.stringify(saved));

        var btn = document.getElementById('btn-save');
        btn.innerHTML = '<i class="fas fa-check"></i> Saved!';
        setTimeout(function () { btn.innerHTML = '<i class="fas fa-bookmark"></i> Save Menu'; }, 2000);
    });

    // ── Saved Menus Modal ──
    var modal = document.getElementById('modal-saved');

    document.getElementById('btn-saved').addEventListener('click', function () {
        renderSavedList();
        modal.classList.add('active');
    });

    document.getElementById('btn-close-saved').addEventListener('click', function () {
        modal.classList.remove('active');
    });

    modal.addEventListener('click', function (e) {
        if (e.target === modal) modal.classList.remove('active');
    });

    function renderSavedList() {
        var saved = JSON.parse(localStorage.getItem('rose-dopamine-menus') || '[]');
        var list = document.getElementById('saved-list');
        list.innerHTML = '';

        if (!saved.length) {
            list.innerHTML = '<div class="empty-state">No saved menus yet. Build one and save it!</div>';
            return;
        }

        saved.slice().reverse().forEach(function (entry, i) {
            var idx = saved.length - 1 - i;
            var div = document.createElement('div');
            div.className = 'saved-entry';

            var date = new Date(entry.date);
            var dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

            var labels = [entry.energy + ' energy'];
            if (entry.mood && entry.mood !== 'neutral') labels.push(entry.mood);

            div.innerHTML = '<h4>' + dateStr + '</h4><p>' + labels.join(' / ') + '</p>' +
                '<div class="saved-actions">' +
                '<button class="saved-btn btn-view" data-idx="' + idx + '"><i class="fas fa-eye"></i> View</button>' +
                '<button class="saved-btn btn-delete" data-idx="' + idx + '"><i class="fas fa-trash"></i> Delete</button>' +
                '</div>';
            list.appendChild(div);
        });

        list.querySelectorAll('.btn-delete').forEach(function (btn) {
            btn.addEventListener('click', function (e) {
                e.stopPropagation();
                var idx = parseInt(btn.dataset.idx);
                saved.splice(idx, 1);
                localStorage.setItem('rose-dopamine-menus', JSON.stringify(saved));
                renderSavedList();
            });
        });

        list.querySelectorAll('.btn-view').forEach(function (btn) {
            btn.addEventListener('click', function (e) {
                e.stopPropagation();
                var idx = parseInt(btn.dataset.idx);
                var entry = saved[idx];
                modal.classList.remove('active');

                // Render the saved menu directly
                ['snacks', 'appetizers', 'mains', 'sides', 'desserts'].forEach(function (key) {
                    var ul = document.getElementById('items-' + key);
                    ul.innerHTML = '';
                    (entry.menu[key] || []).forEach(function (text) {
                        var li = document.createElement('li');
                        li.className = 'menu-item';
                        li.innerHTML = '<i class="fas fa-circle item-check"></i><span>' + text + '</span>';
                        ul.appendChild(li);
                    });
                });

                var labels = [entry.energy + ' energy'];
                if (entry.mood && entry.mood !== 'neutral') labels.push('feeling ' + entry.mood);
                menuSubtitle.textContent = 'Saved menu: ' + labels.join(' / ');

                showStep('menu');
            });
        });
    }
})();
