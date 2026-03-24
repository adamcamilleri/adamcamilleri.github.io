(function () {
    'use strict';

    var chatMessages = document.getElementById('chat-messages');
    var chatInput = document.getElementById('chat-input');
    var btnSend = document.getElementById('btn-send');
    var quickButtons = document.getElementById('quick-buttons');
    var conversationCount = 0;

    // ── Self-care idea banks ──
    var ideas = {
        stressed: [
            "Step away from whatever you're doing for 5 minutes. Just 5. Go stand outside or look out a window.",
            "Try a brain dump: grab a piece of paper and write down everything that's on your mind. Don't organize it, just get it out.",
            "Make yourself a warm drink. Hold it with both hands. Breathe.",
            "Put on a song you love and do absolutely nothing else but listen to it.",
            "Pick one thing on your plate and move it to tomorrow. Give yourself permission.",
            "Stretch for 2 minutes. Roll your shoulders, stretch your neck, shake out your hands.",
            "Try box breathing: in for 4, hold for 4, out for 4, hold for 4. Repeat a few times.",
            "Text a friend something random and funny. Getting out of your own head helps.",
            "Tidy one small thing near you. Just one. A little order can shift your headspace.",
            "Remind yourself: you don't have to solve everything today."
        ],
        anxious: [
            "Name 5 things you can see right now. Then 4 you can touch. 3 you can hear. 2 you can smell. 1 you can taste.",
            "Put your hand on your chest. Feel your heartbeat. You're here, you're okay.",
            "Write down the thing you're worried about. Then ask: what's the most likely outcome? Not the worst, the most likely.",
            "Go splash cold water on your face. It sounds weird but it actually calms your nervous system down.",
            "Move your body for even 5 minutes. Walk, stretch, dance in your room. Anxiety lives in stillness.",
            "Call or text someone you feel safe with. You don't even have to talk about what's bothering you.",
            "Chew gum or eat something crunchy. It signals to your brain that you're safe (you wouldn't be eating if you were in danger).",
            "Unclench your jaw. Drop your shoulders. Unfurrow your brow. You were probably tensing without realizing.",
            "Write down 3 things that are certain and stable in your life right now. Anchor yourself in what's real.",
            "Set a timer for 10 minutes and let yourself worry. When it goes off, move on to something else."
        ],
        sad: [
            "Let yourself feel it. You don't have to be okay right now. Sadness isn't a problem to fix, it's something to move through.",
            "Reach out to one person. Even just to say 'hey, I'm having a rough day.' You'd be surprised how much that helps.",
            "Watch something that's made you laugh before. A show, a video, a meme page. Let yourself be distracted for a bit.",
            "Take a shower or wash your face. Small acts of taking care of yourself matter when everything feels heavy.",
            "Write a few sentences about what you're feeling. You don't have to show anyone. Just get it on paper.",
            "Look through old photos from a time you felt happy. Remind yourself that good days exist and will come again.",
            "Get outside, even if it's just to your front step. Sunlight and fresh air do more than you'd think.",
            "Do one kind thing for yourself that you'd do for a friend having a bad day.",
            "Wrap yourself in a blanket and put on something comforting. Comfort isn't lazy, it's healing.",
            "Cry if you need to. It's literally your body's way of releasing stress hormones."
        ],
        tired: [
            "Drink a full glass of water right now. Dehydration makes exhaustion so much worse.",
            "If you can nap, nap. 20 minutes. Set an alarm. Don't feel guilty about it.",
            "Step into natural light for a few minutes. It resets your internal clock and gives you a little energy boost.",
            "Eat something with protein. Your body might just be running on empty.",
            "Lower your expectations for today. A half-effort day is still a day. You showed up.",
            "Do some gentle stretching. Sometimes tiredness is your body being stiff, not just sleepy.",
            "Say no to one thing today. Protect your energy like it matters, because it does.",
            "Put your phone on do not disturb for 30 minutes. The notifications will survive without you.",
            "Move to a different spot. Change of scenery can trick your brain into feeling a little more awake.",
            "Ask yourself: am I tired, or am I burnt out? Those need different things."
        ],
        lonely: [
            "Text someone you haven't talked to in a while. Something simple like 'been thinking about you' goes a long way.",
            "Go somewhere public, even if you don't talk to anyone. A coffee shop, a library, a park. Being around people helps.",
            "Write about what kind of connection you're craving. Sometimes naming it makes it easier to seek out.",
            "Call someone instead of texting. Hearing a voice makes a bigger difference than you'd expect.",
            "Do something creative. Draw, write, cook, build something. Creating fills a similar space as connecting.",
            "Join an online community for something you're into. Reddit, Discord, whatever. Low-pressure socializing counts.",
            "Volunteer for something. Helping others is one of the fastest ways to feel less alone.",
            "Plan something with someone, even if it's small. Having something on the calendar to look forward to helps.",
            "Remember: being alone and being lonely are different things. You can be alone and still take good care of yourself.",
            "Pet an animal if you can. If you can't, watch animal videos. Not even kidding, it helps."
        ],
        unmotivated: [
            "Start with the smallest possible version of what you need to do. Like, absurdly small. Open the document. Put on your shoes. That's it.",
            "Change your environment. Move to a different room, go to a cafe, sit outside. New space, new energy.",
            "Set a 10-minute timer and work on one thing. Just 10 minutes. You can stop after. But you probably won't.",
            "Ask yourself: what would make today feel like a win? Pick one thing.",
            "Put on music that makes you feel something. Sometimes motivation needs a soundtrack.",
            "Take a walk first. Movement creates energy, not the other way around.",
            "Write down 3 things you've already accomplished this week. You're doing more than you think.",
            "Stop waiting to feel motivated. Motivation comes after you start, not before.",
            "Break whatever you're avoiding into tiny steps. You're not overwhelmed by the task, you're overwhelmed by the whole picture.",
            "Give yourself something to look forward to after. Finish this, then treat yourself."
        ],
        good: [
            "That's awesome! Ride that wave. Do something you enjoy while you're in this headspace.",
            "Write down what's contributing to this good feeling. Next time you're struggling, you'll have a reminder of what helps.",
            "Use this energy to do something kind for someone else. It'll make the good feeling last longer.",
            "Try something new today. You're more open to it when you're feeling good.",
            "Reach out to someone you care about. Good moods are contagious.",
            "Take a second to appreciate where you are. You worked to get here, even if it doesn't feel that way.",
            "Do that one thing you've been putting off. You've got the energy for it right now.",
            "Go outside and soak it in. Good days deserve to be noticed.",
            "Start a self-care list for future you: things that make you feel this way.",
            "Just enjoy it. You don't have to be productive with good moods. Sometimes they're just for living."
        ],
        angry: [
            "Let yourself feel it. Anger isn't bad, it's information. Something crossed a line for you and that matters.",
            "Write down exactly what's making you angry. Be as specific and uncensored as you want. No one has to see it.",
            "Go for a walk or do something physical. Anger is energy and it needs somewhere to go.",
            "Squeeze an ice cube, rip up paper, punch a pillow. Give the feeling a physical outlet.",
            "Before you respond to anyone, pause. You can always reply later. You can't unsend.",
            "Ask yourself: am I angry, or am I hurt? Sometimes anger is just the louder version of pain.",
            "Vent to someone you trust. Say 'I just need to rant, I don't need advice.' Sometimes that's all it takes.",
            "Splash cold water on your face or take a cold shower. It interrupts the anger loop.",
            "Channel it into something productive. Clean aggressively, reorganize, go hard at the gym.",
            "Write a letter to whoever you're angry at. Say everything. Then don't send it."
        ],
        overwhelmed: [
            "Stop. Breathe. You don't need to figure it all out right now.",
            "Write down everything you're carrying. Then circle just the ONE thing that matters most today.",
            "Lower the bar for today. What's the bare minimum that would count as okay? Do that.",
            "Tell someone how you're feeling. 'I'm overwhelmed' is a complete sentence.",
            "Cancel or postpone one thing. The world will not end, I promise.",
            "Break whatever feels huge into the tiniest first step. Like, embarrassingly tiny.",
            "Go outside for 5 minutes. Fresh air won't fix it but it'll create a tiny bit of space.",
            "Stop multitasking. Pick one thing. Just one. Everything else can wait.",
            "Drink some water, eat something, sit down. Your body needs basics before your brain can cope.",
            "Remind yourself: feeling overwhelmed doesn't mean you're failing. It means you're carrying a lot."
        ],
        insecure: [
            "What you're feeling is normal. Everyone feels this way sometimes, even the people who seem like they have it all together.",
            "Write down 3 things you've done that you're proud of. They don't have to be big.",
            "Stop comparing your behind-the-scenes to everyone else's highlight reel.",
            "Ask yourself: would I say this to a friend? If not, why are you saying it to yourself?",
            "Unfollow or mute accounts that make you feel worse about yourself. Curate your feed.",
            "Wear something that makes you feel good. Small external shifts can change your internal state.",
            "Remember a time someone genuinely complimented you. Hold onto that. They meant it.",
            "You don't have to earn your worth. You have it already.",
            "Try a skill you're good at. Remind your brain that you're capable.",
            "Write yourself a note from your future self who's already past this moment."
        ],
        guilty: [
            "Ask yourself: did I actually do something wrong, or am I just taking on responsibility that isn't mine?",
            "If you did mess up, that's okay. Everyone does. What matters is what you do next.",
            "Write down what's making you feel guilty. Then ask: is this proportional? Am I being fair to myself?",
            "If you owe someone an apology, give it. A genuine 'I'm sorry' can free both of you.",
            "Stop replaying it. You can't change what happened, but you can decide what happens next.",
            "Talk to someone about it. Guilt gets heavier the longer you carry it alone.",
            "Forgive yourself the way you'd forgive a friend. You deserve the same compassion you give others.",
            "Do something kind today. Not to make up for anything, just to remind yourself you're a good person.",
            "Remember: feeling guilty doesn't make you guilty. Sometimes it just means you care a lot.",
            "Set it down for now. You can come back to it tomorrow with a clearer head."
        ],
        restless: [
            "Your body is trying to tell you something. What do you think it needs right now?",
            "Go move. Walk, run, stretch, dance. Restless energy needs to be spent, not suppressed.",
            "Try something new. Even something small like a new podcast, recipe, or route to walk.",
            "Rearrange something in your space. Moving furniture or reorganizing scratches the restless itch.",
            "Write down everything you want to do, try, or change. Get it out of your head and onto paper.",
            "Call someone spontaneously. Sometimes restlessness is just craving connection.",
            "Learn something random. Watch a documentary, read an article, fall down a Wikipedia hole.",
            "Start a project you've been thinking about. Even if it's messy and imperfect, just begin.",
            "Go somewhere you've never been. A new cafe, a different park, an unfamiliar street.",
            "Ask yourself: am I restless because I'm avoiding something? Sometimes the answer is yes."
        ],
        jealous: [
            "Jealousy is just unmet desire wearing a mask. What is it that you actually want?",
            "Unfollow or mute whatever's triggering it. You don't owe anyone your attention.",
            "Write down what you're jealous of. Then ask: is this something I can work toward? If yes, start planning.",
            "Remember that someone else's success doesn't take away from yours. There's room for everyone.",
            "Think about what you have that you'd never want to lose. Gratitude is jealousy's antidote.",
            "Talk to the person you're jealous of if you can. You'll probably find out their life isn't as perfect as it looks.",
            "Channel it. Let jealousy be fuel, not poison. Use it to clarify what you actually want.",
            "Be honest with yourself about the feeling. Pretending you're not jealous just makes it louder.",
            "Focus on your own timeline. You're not behind. You're on your own path.",
            "Do something that makes YOU feel accomplished today. Shift the spotlight back to your own life."
        ],
        frustrated: [
            "Step away from whatever's frustrating you. Seriously, walk away for 10 minutes.",
            "Say out loud what's frustrating you. Hearing it can sometimes make it feel smaller.",
            "Ask yourself: is this something I can control? If yes, what's one action I can take? If no, what can I let go of?",
            "Lower your expectations for a minute. Not forever, just for right now. Good enough is okay.",
            "Do something you're good at. Frustration often comes from feeling stuck, so remind yourself you're capable.",
            "Vent it out. Write it, say it, record a voice note. Just get it out of your system.",
            "Break the problem into smaller pieces. You're probably frustrated because you're looking at the whole thing at once.",
            "Take a shower. Water is weirdly good at resetting your mood.",
            "Remember a time you were frustrated about something that eventually worked out. This might be one of those times.",
            "Accept that some things just take longer than they should. It's annoying but it's not a reflection of you."
        ]
    };

    var followUps = {
        stressed: [
            "What's taking up the most space in your head right now?",
            "Is there one thing you could take off your plate today?",
            "When was the last time you took a real break?"
        ],
        anxious: [
            "What's the thing you keep coming back to?",
            "Is there something specific triggering this, or is it more of a general feeling?",
            "What usually helps when you feel like this?"
        ],
        sad: [
            "Do you know what brought this on, or did it just kind of settle in?",
            "What's one thing that usually comforts you?",
            "Is there someone you'd feel safe talking to about this?"
        ],
        tired: [
            "Is it more physical tiredness or mental exhaustion?",
            "Have you been sleeping okay lately?",
            "What's been draining you the most?"
        ],
        lonely: [
            "Is it that you want to be around people, or that you want to feel understood?",
            "Who's someone you feel comfortable reaching out to?",
            "What does connection look like for you when it's good?"
        ],
        unmotivated: [
            "Is there something specific you're avoiding, or is it everything?",
            "What's one thing that used to excite you?",
            "What would make today feel like it wasn't wasted?"
        ],
        good: [
            "What do you think is making today a good one?",
            "Is there anything you'd want to carry forward from today?",
            "Want some ideas to make the most of this energy?"
        ],
        angry: [
            "What set this off?",
            "Is this about one thing or has it been building up?",
            "What would help you feel heard right now?"
        ],
        overwhelmed: [
            "What's the biggest thing on your plate right now?",
            "Is there anything you can delegate or drop?",
            "When did it start feeling like too much?"
        ],
        insecure: [
            "What triggered this feeling?",
            "Is there something specific you're comparing yourself to?",
            "What's something you know you're good at?"
        ],
        guilty: [
            "What's weighing on you?",
            "Do you think you're being fair to yourself about this?",
            "Is there something you could do to make it right?"
        ],
        restless: [
            "What do you think is driving that feeling?",
            "Is there something you've been wanting to do but haven't?",
            "Do you think you need a change of scenery or a change of pace?"
        ],
        jealous: [
            "What specifically is triggering it?",
            "Is this about something you want for yourself?",
            "How are you feeling underneath the jealousy?"
        ],
        frustrated: [
            "What's the thing that's not working?",
            "Have you tried stepping away from it?",
            "Is this frustration new or has it been building?"
        ]
    };

    function detectMood(text) {
        var lower = text.toLowerCase();
        if (/angry|mad|furious|rage|pissed|livid|seething|fuming/.test(lower)) return 'angry';
        if (/frustr|annoyed|irritat|agitated|fed up|sick of/.test(lower)) return 'frustrated';
        if (/overwhelm|too much|swamped|drowning|can't keep up|falling behind/.test(lower)) return 'overwhelmed';
        if (/stress|burned out|burnout|pressure|overload|hectic|tense/.test(lower)) return 'stressed';
        if (/anxious|anxiety|worried|nervous|panic|racing|scared|fear|on edge|uneasy/.test(lower)) return 'anxious';
        if (/sad|depressed|down|hopeless|empty|numb|crying|grief|loss|unhappy|miserable|heartbr/.test(lower)) return 'sad';
        if (/tired|exhausted|drained|fatigue|sleepy|no energy|wiped|burnt out|worn out/.test(lower)) return 'tired';
        if (/lonely|alone|isolated|disconnected|no one|nobody|left out|invisible/.test(lower)) return 'lonely';
        if (/insecure|not good enough|self-conscious|doubt myself|imposter|comparing|inadequa/.test(lower)) return 'insecure';
        if (/guilty|guilt|ashamed|shame|regret|shouldn't have|my fault/.test(lower)) return 'guilty';
        if (/restless|antsy|can't sit still|need a change|itching|unsettled|stir crazy/.test(lower)) return 'restless';
        if (/jealous|envious|envy|why not me|everyone else|comparing/.test(lower)) return 'jealous';
        if (/unmotivated|lazy|can't be bothered|no motivation|procrastinat|stuck|blah|meh|bored/.test(lower)) return 'unmotivated';
        if (/good|great|happy|fine|okay|amazing|wonderful|fantastic|chill|relaxed|peaceful|grateful/.test(lower)) return 'good';
        return null;
    }

    function pick(arr) {
        return arr[Math.floor(Math.random() * arr.length)];
    }

    function pickMultiple(arr, n) {
        var shuffled = arr.slice().sort(function () { return 0.5 - Math.random(); });
        return shuffled.slice(0, n);
    }

    // ── Chat helpers ──
    function addMessage(text, type, options) {
        var div = document.createElement('div');
        div.className = 'message ' + type;

        var content = document.createElement('span');
        content.textContent = text;
        div.appendChild(content);

        if (options && options.listItems) {
            var list = document.createElement('ul');
            options.listItems.forEach(function (item) {
                var li = document.createElement('li');
                li.textContent = item;
                list.appendChild(li);
            });
            div.appendChild(list);
        }

        if (options && options.prompts) {
            var promptList = document.createElement('div');
            promptList.className = 'prompt-list';
            options.prompts.forEach(function (p) {
                var btn = document.createElement('button');
                btn.className = 'prompt-btn';
                btn.textContent = p.label;
                btn.addEventListener('click', function () {
                    promptList.querySelectorAll('.prompt-btn').forEach(function (b) {
                        b.disabled = true;
                        b.style.opacity = '0.4';
                        b.style.cursor = 'default';
                    });
                    p.action();
                });
                promptList.appendChild(btn);
            });
            div.appendChild(promptList);
        }

        chatMessages.appendChild(div);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function showTyping() {
        var div = document.createElement('div');
        div.className = 'typing-indicator';
        div.id = 'typing';
        div.innerHTML = '<span></span><span></span><span></span>';
        chatMessages.appendChild(div);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function hideTyping() {
        var el = document.getElementById('typing');
        if (el) el.remove();
    }

    function botSay(text, options) {
        showTyping();
        var delay = Math.min(text.length * 10, 1200);
        setTimeout(function () {
            hideTyping();
            addMessage(text, 'bot', options);
        }, delay);
        return delay;
    }

    function giveIdeas(mood) {
        var selected = pickMultiple(ideas[mood], 3);
        var d1 = botSay("Here are some things that might help right now:", { listItems: selected });

        setTimeout(function () {
            botSay(pick(followUps[mood]), {
                prompts: [
                    {
                        label: "More ideas please",
                        action: function () {
                            var more = pickMultiple(ideas[mood], 3);
                            botSay("A few more for you:", { listItems: more });
                            setTimeout(function () {
                                botSay("Want to keep going or try a different vibe?", {
                                    prompts: buildMoodButtons()
                                });
                            }, 1500);
                        }
                    },
                    {
                        label: "Something different",
                        action: function () {
                            botSay("No problem! How else are you feeling? Or pick one:", {
                                prompts: buildMoodButtons()
                            });
                        }
                    }
                ]
            });
        }, d1 + 500);
    }

    function buildMoodButtons() {
        var moods = ['Stressed', 'Anxious', 'Sad', 'Angry', 'Frustrated', 'Overwhelmed', 'Tired', 'Lonely', 'Insecure', 'Guilty', 'Restless', 'Jealous', 'Unmotivated', 'Feeling good'];
        return moods.map(function (m) {
            return {
                label: m,
                action: function () {
                    var key = m.toLowerCase().replace('feeling ', '');
                    addMessage(m, 'user');
                    conversationCount++;
                    giveIdeas(key);
                }
            };
        });
    }

    function handleInput(text) {
        if (!text.trim()) return;

        addMessage(text, 'user');
        chatInput.value = '';
        chatInput.style.height = 'auto';
        conversationCount++;

        // Hide quick buttons after first message
        quickButtons.style.display = 'none';

        var mood = detectMood(text);

        if (!mood) {
            // Can't detect mood, ask gently
            botSay("I hear you. Can you tell me a bit more about how you're feeling? Or pick one of these:", {
                prompts: buildMoodButtons()
            });
            return;
        }

        if (conversationCount === 1) {
            // First message - acknowledge and give ideas
            var acks = {
                stressed: "That sounds like a lot. Let's take a breath together for a sec.",
                anxious: "Anxiety is tough. I'm glad you're here though.",
                sad: "I'm sorry you're going through that. It's okay to not be okay.",
                tired: "Exhaustion is real. Let's keep this low-effort for you.",
                lonely: "Loneliness can be really heavy. You're not as alone as it feels right now.",
                unmotivated: "We've all been there. No judgment here.",
                good: "Love that for you!",
                angry: "That's valid. Anger means something crossed a line for you.",
                frustrated: "Ugh, that's the worst. Let's see what might help.",
                overwhelmed: "Hey, take a second. You don't have to figure it all out right now.",
                insecure: "That's a hard feeling to sit with. But you're more capable than you think.",
                guilty: "Guilt is heavy. Let's be gentle with yourself for a minute.",
                restless: "Sounds like you need to shake things up a bit.",
                jealous: "That's honest of you to name. Let's work with it."
            };
            var d1 = botSay(acks[mood]);
            setTimeout(function () {
                giveIdeas(mood);
            }, d1 + 400);
        } else {
            // Continuing conversation
            giveIdeas(mood);
        }
    }

    // ── Init ──
    botSay("Hey! I'm your self-care companion. How are you feeling right now? You can type or pick one below.");

    // Quick mood buttons
    document.querySelectorAll('.quick-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
            handleInput(btn.dataset.mood);
        });
    });

    btnSend.addEventListener('click', function () {
        handleInput(chatInput.value);
    });

    chatInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleInput(chatInput.value);
        }
    });

    chatInput.addEventListener('input', function () {
        this.style.height = 'auto';
        this.style.height = Math.min(this.scrollHeight, 120) + 'px';
    });
})();
