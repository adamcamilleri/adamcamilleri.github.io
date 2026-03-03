(function () {
  'use strict';

  var API_BASE = window.HANDOFF_API || (
    location.hostname === 'localhost' || location.hostname === '127.0.0.1'
      ? 'http://localhost:3000'
      : ''
  );

  var FREE_LIMIT = 3;

  // ── DOM Refs ──────────────────────────────────────────────────────────────────
  var messagesEl      = document.getElementById('messages');
  var welcomeState    = document.getElementById('welcomeState');
  var startersEl      = document.getElementById('starters');
  var chatInput       = document.getElementById('chatInput');
  var sendBtn         = document.getElementById('sendBtn');
  var previewFrame    = document.getElementById('previewFrame');
  var previewLabel    = document.getElementById('previewLabel');
  var downloadBtn     = document.getElementById('downloadBtn');
  var deployBtn       = document.getElementById('deployBtn');
  var editModeBtn     = document.getElementById('editModeBtn');
  var editBar         = document.getElementById('editBar');
  var editInput       = document.getElementById('editInput');
  var editApplyBtn    = document.getElementById('editApplyBtn');
  var editCancelBtn   = document.getElementById('editCancelBtn');
  var usageCounter    = document.getElementById('usageCounter');
  var upgradeModal    = document.getElementById('upgradeModal');
  var upgradeBtn      = document.getElementById('upgradeBtn');
  var upgradeClose    = document.getElementById('upgradeClose');
  var upgradeCta      = document.getElementById('upgradeCta');
  var deployModal     = document.getElementById('deployModal');
  var deployModalClose    = document.getElementById('deployModalClose');
  var deployInstantBtn    = document.getElementById('deployInstantBtn');
  var deployOwnVercelBtn  = document.getElementById('deployOwnVercelBtn');
  var deployStatus        = document.getElementById('deployStatus');
  var deployStatusText    = document.getElementById('deployStatusText');
  var deployResult        = document.getElementById('deployResult');
  var deployResultUrl     = document.getElementById('deployResultUrl');
  var deployResultCopy    = document.getElementById('deployResultCopy');

  // ── State ─────────────────────────────────────────────────────────────────────
  var state = {
    previewHtml:  null,
    history:      [],   // [{role, content}] conversation history
    editModeOn:   false,
    selectedHtml: null,
    generating:   false,
  };

  // ── Starter prompts ────────────────────────────────────────────────────────────
  var STARTERS = [
    {
      icon: '🍕', label: 'Restaurant',
      prompt: 'Build a website for my Italian restaurant. Include a stunning hero section, a menu highlights section with 6 dishes, an about us story, and contact details with a reservation form at the bottom.'
    },
    {
      icon: '✂️', label: 'Barbershop',
      prompt: 'Build a barbershop website with a dark masculine design. Include a bold hero, services and pricing, a team section with 3 barbers, a photo gallery, and a booking CTA.'
    },
    {
      icon: '🎨', label: 'Portfolio',
      prompt: 'Build a personal portfolio site for a UI/UX designer. Clean minimal design with a hero showing name and title, a featured projects grid (6 projects), a skills section, and a contact form.'
    },
    {
      icon: '🚀', label: 'Startup',
      prompt: 'Build a SaaS landing page for a productivity app. Include a hero with a bold headline and app mockup placeholder, 3 key features, how it works (3 steps), pricing with 3 tiers, and a footer.'
    },
    {
      icon: '📸', label: 'Photographer',
      prompt: 'Build an elegant portfolio website for a wedding photographer. Full-width hero, photo gallery in a grid layout, testimonials from 3 clients, photography packages, and a contact form.'
    },
    {
      icon: '🏋️', label: 'Gym',
      prompt: 'Build a gym website with a bold, energetic design. Include a strong hero, class schedule, personal trainers (3), membership pricing with 3 tiers, and a sign-up form.'
    },
    {
      icon: '🛍️', label: 'Boutique',
      prompt: 'Build a website for a small boutique clothing store. Warm minimal aesthetic. Include featured products (6 items with placeholder images), an about the brand section, and contact/location.'
    },
    {
      icon: '🏠', label: 'Real Estate',
      prompt: 'Build a professional real estate agent website. Include a hero, featured property listings (4 properties), about the agent, services offered, client testimonials, and a contact form.'
    },
  ];

  // ── Usage Tracking ─────────────────────────────────────────────────────────────
  function getUsage() {
    var today = new Date().toISOString().slice(0, 10);
    try {
      var stored = JSON.parse(localStorage.getItem('handoff_usage') || '{}');
      return stored.date === today ? stored : { date: today, count: 0 };
    } catch (e) {
      return { date: today, count: 0 };
    }
  }

  function incrementUsage() {
    var usage = getUsage();
    usage.count = (usage.count || 0) + 1;
    try { localStorage.setItem('handoff_usage', JSON.stringify(usage)); } catch (e) {}
    renderUsageUI();
  }

  function canGenerate() {
    return getUsage().count < FREE_LIMIT;
  }

  function renderUsageUI() {
    if (!usageCounter) return;
    var remaining = Math.max(0, FREE_LIMIT - getUsage().count);
    if (remaining === 0) {
      usageCounter.textContent = 'Free limit reached';
      usageCounter.className = 'usage-counter exhausted';
    } else {
      usageCounter.textContent = remaining + ' free ' + (remaining === 1 ? 'design' : 'designs') + ' left today';
      usageCounter.className = 'usage-counter';
    }
  }

  // ── Preview ───────────────────────────────────────────────────────────────────
  // Edit-mode script injected into preview iframes
  var EDIT_MODE_SCRIPT = '(function(){var on=false;function clear(){document.querySelectorAll("[data-hsel]").forEach(function(el){el.style.outline="";el.removeAttribute("data-hsel");});}window.addEventListener("message",function(e){if(e.data&&e.data.type==="handoff-edit"){on=e.data.enabled;clear();}});document.addEventListener("click",function(e){if(!on)return;e.preventDefault();e.stopPropagation();var el=e.target;while(el&&["BODY","HTML"].indexOf(el.tagName)===-1){var r=el.getBoundingClientRect();if(r.width>20&&r.height>20)break;el=el.parentElement;}if(!el||el.tagName==="HTML")return;clear();el.style.outline="2px solid #6366f1";el.setAttribute("data-hsel","1");window.parent.postMessage({type:"handoff-selected",html:el.outerHTML},"*");},true);})();';

  function setPreview(html) {
    if (!html) return;
    state.previewHtml = html;

    // Inject Tailwind if not already present
    var augmented = html;
    if (augmented.indexOf('tailwindcss') === -1) {
      var tw = '<script src="https://cdn.tailwindcss.com"><\/script>';
      var headEnd = augmented.indexOf('</head>');
      augmented = headEnd !== -1
        ? augmented.slice(0, headEnd) + tw + augmented.slice(headEnd)
        : tw + augmented;
    }
    // Inject edit mode script
    var editScript = '<script>' + EDIT_MODE_SCRIPT + '<\/script>';
    var bodyEnd = augmented.lastIndexOf('</body>');
    augmented = bodyEnd !== -1
      ? augmented.slice(0, bodyEnd) + editScript + augmented.slice(bodyEnd)
      : augmented + editScript;

    var blob = new Blob([augmented], { type: 'text/html' });
    var url = URL.createObjectURL(blob);
    previewFrame.removeAttribute('srcdoc');
    previewFrame.onload = function () {
      URL.revokeObjectURL(url);
      if (state.editModeOn) tellEditMode(true);
    };
    previewFrame.src = url;

    downloadBtn.disabled = false;
    deployBtn.disabled = false;
    previewLabel.textContent = 'Live Preview';
  }

  function showBuildingState() {
    var html = '<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:14px;background:#0f0f18;font-family:system-ui;color:#60607a;font-size:13px}@keyframes spin{to{transform:rotate(360deg)}}.s{width:28px;height:28px;border:2px solid #1e1e30;border-top-color:#6366f1;border-radius:50%;animation:spin 0.8s linear infinite}</style></head><body><div class="s"></div><span>Building your site&hellip;</span></body></html>';
    previewFrame.srcdoc = html;
  }

  function showEmptyState() {
    var html = '<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#0f0f18;font-family:system-ui;text-align:center;padding:32px}p{color:#60607a;font-size:13px;max-width:200px;line-height:1.6}</style></head><body><p>Your site will appear here &rarr;<br>Start chatting to build it.</p></body></html>';
    previewFrame.srcdoc = html;
  }

  // ── Edit Mode ─────────────────────────────────────────────────────────────────
  function tellEditMode(on) {
    try {
      if (previewFrame.contentWindow) {
        previewFrame.contentWindow.postMessage({ type: 'handoff-edit', enabled: on }, '*');
      }
    } catch (e) {}
  }

  window.addEventListener('message', function (e) {
    if (!e.data || e.data.type !== 'handoff-selected') return;
    state.selectedHtml = e.data.html || null;
    editBar.classList.remove('hidden');
    editInput.value = '';
    editInput.focus();
  });

  editModeBtn.addEventListener('click', function () {
    state.editModeOn = !state.editModeOn;
    editModeBtn.classList.toggle('active', state.editModeOn);
    if (!state.editModeOn) {
      editBar.classList.add('hidden');
      state.selectedHtml = null;
    }
    tellEditMode(state.editModeOn);
  });

  editCancelBtn.addEventListener('click', function () {
    editBar.classList.add('hidden');
    state.selectedHtml = null;
  });

  function applyEdit() {
    var instruction = editInput.value.trim();
    if (!instruction || !state.selectedHtml || !state.previewHtml) return;

    editApplyBtn.disabled = true;
    appendTyping();
    showBuildingState();

    fetch(API_BASE + '/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        elementEdit: true,
        currentHtml: state.previewHtml,
        selectedElementHtml: state.selectedHtml,
        instruction: instruction,
      }),
    })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        removeTyping();
        if (data.html) {
          setPreview(data.html);
          editBar.classList.add('hidden');
          state.selectedHtml = null;
          appendMessage('assistant', 'Done! ' + (data.summary || 'Updated that section.'));
        } else {
          setPreview(state.previewHtml); // restore
          appendMessage('assistant', 'Couldn\'t apply that change — try rephrasing it.');
        }
      })
      .catch(function (err) {
        removeTyping();
        setPreview(state.previewHtml);
        appendMessage('assistant', 'Error: ' + (err.message || 'Could not reach server.'));
      })
      .finally(function () {
        editApplyBtn.disabled = false;
      });
  }

  editApplyBtn.addEventListener('click', applyEdit);
  editInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') { e.preventDefault(); applyEdit(); }
  });

  // ── Chat ──────────────────────────────────────────────────────────────────────
  function hideWelcome() {
    if (welcomeState && !welcomeState.classList.contains('hidden')) {
      welcomeState.classList.add('hidden');
    }
  }

  function appendMessage(role, text) {
    hideWelcome();
    var div = document.createElement('div');
    div.className = 'message ' + role;
    text.split('\n\n').forEach(function (part) {
      if (!part.trim()) return;
      var p = document.createElement('p');
      p.textContent = part.trim();
      div.appendChild(p);
    });
    messagesEl.appendChild(div);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    return div;
  }

  var _typingEl = null;

  function appendTyping() {
    hideWelcome();
    if (_typingEl) return;
    _typingEl = document.createElement('div');
    _typingEl.className = 'message assistant typing';
    _typingEl.innerHTML = '<div class="typing-dots"><span></span><span></span><span></span></div>';
    messagesEl.appendChild(_typingEl);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function removeTyping() {
    if (_typingEl && _typingEl.parentNode) {
      messagesEl.removeChild(_typingEl);
    }
    _typingEl = null;
  }

  function sendMessage() {
    var text = chatInput.value.trim();
    if (!text || state.generating) return;

    if (!canGenerate()) {
      upgradeModal.classList.remove('hidden');
      return;
    }

    appendMessage('user', text);
    chatInput.value = '';
    chatInput.style.height = 'auto';
    state.generating = true;
    sendBtn.disabled = true;
    appendTyping();
    showBuildingState();

    var payload = {
      user: text,
      messages: state.history.slice(),
      currentHtml: state.previewHtml || '',
    };

    fetch(API_BASE + '/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
      .then(function (r) {
        if (!r.ok) throw new Error('Server error ' + r.status);
        return r.json();
      })
      .then(function (data) {
        removeTyping();
        var html = data.html || null;
        var reply = data.reply || '';
        var summary = data.summary || null;
        var followup = data.followup || null;

        if (html) {
          setPreview(html);
          state.history.push({ role: 'user', content: text });
          state.history.push({ role: 'assistant', content: summary || reply || 'Site updated.' });
          var botReply = summary || defaultReply(text);
          if (followup) botReply += '\n\n' + followup;
          appendMessage('assistant', botReply);
          incrementUsage();
        } else if (reply) {
          // Non-HTML response (e.g. feature not supported message)
          appendMessage('assistant', reply.slice(0, 400));
          showEmptyState();
        } else {
          appendMessage('assistant', 'Something went wrong. Try rephrasing your request.');
          showEmptyState();
        }
      })
      .catch(function (err) {
        removeTyping();
        appendMessage('assistant', 'Connection error — check your internet and try again.');
        showEmptyState();
        console.error('Handoff API error:', err);
      })
      .finally(function () {
        state.generating = false;
        sendBtn.disabled = false;
      });
  }

  function defaultReply(userText) {
    var t = userText.toLowerCase();
    if (t.indexOf('change') !== -1 || t.indexOf('update') !== -1 || t.indexOf('make') !== -1) {
      return 'Done! I\'ve applied your changes. What else would you like to adjust?';
    }
    return 'Here\'s your site! Take a look at the preview. What would you like to change?';
  }

  sendBtn.addEventListener('click', sendMessage);
  chatInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  // Auto-resize textarea
  chatInput.addEventListener('input', function () {
    this.style.height = 'auto';
    this.style.height = Math.min(this.scrollHeight, 120) + 'px';
  });

  // ── Starters ──────────────────────────────────────────────────────────────────
  function renderStarters() {
    startersEl.innerHTML = '';
    STARTERS.forEach(function (s) {
      var btn = document.createElement('button');
      btn.className = 'starter-chip';
      btn.innerHTML = '<span class="starter-icon">' + s.icon + '</span>'
        + '<span class="starter-label">' + s.label + '</span>';
      btn.addEventListener('click', function () {
        chatInput.value = s.prompt;
        chatInput.style.height = 'auto';
        sendMessage();
      });
      startersEl.appendChild(btn);
    });
  }

  // ── Download ──────────────────────────────────────────────────────────────────
  downloadBtn.addEventListener('click', function () {
    if (!state.previewHtml) return;
    var blob = new Blob([state.previewHtml], { type: 'text/html' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'my-website.html';
    document.body.appendChild(a);
    a.click();
    setTimeout(function () {
      document.body.removeChild(a);
      URL.revokeObjectURL(a.href);
    }, 100);
  });

  // ── Deploy ────────────────────────────────────────────────────────────────────
  deployBtn.addEventListener('click', function () {
    if (!state.previewHtml) return;
    // Reset modal state
    deployStatus.classList.add('hidden');
    deployResult.classList.add('hidden');
    deployInstantBtn.disabled = false;
    deployOwnVercelBtn.disabled = false;
    deployModal.classList.remove('hidden');
  });

  deployModalClose.addEventListener('click', function () {
    deployModal.classList.add('hidden');
  });

  deployModal.addEventListener('click', function (e) {
    if (e.target === deployModal) deployModal.classList.add('hidden');
  });

  deployInstantBtn.addEventListener('click', function () {
    if (!state.previewHtml) return;
    deployInstantBtn.disabled = true;
    deployOwnVercelBtn.disabled = true;
    deployStatus.classList.remove('hidden');
    deployStatusText.textContent = 'Deploying your site\u2026';

    fetch(API_BASE + '/api/deploy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ html: state.previewHtml }),
    })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        deployStatus.classList.add('hidden');
        if (data.url) {
          deployResultUrl.href = data.url;
          deployResultUrl.textContent = data.url;
          deployResult.classList.remove('hidden');
          appendMessage('assistant', 'Your site is live! \u2192 ' + data.url);
        } else {
          deployStatus.classList.remove('hidden');
          deployStatusText.textContent = 'Deploy failed: ' + (data.error || 'Unknown error');
          deployInstantBtn.disabled = false;
          deployOwnVercelBtn.disabled = false;
        }
      })
      .catch(function (err) {
        deployStatus.classList.remove('hidden');
        deployStatusText.textContent = 'Error: ' + (err.message || 'Could not reach server');
        deployInstantBtn.disabled = false;
        deployOwnVercelBtn.disabled = false;
      });
  });

  deployResultCopy.addEventListener('click', function () {
    var url = deployResultUrl.href;
    if (!url) return;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(function () {
        var orig = deployResultCopy.textContent;
        deployResultCopy.textContent = 'Copied!';
        setTimeout(function () { deployResultCopy.textContent = orig; }, 1500);
      });
    }
  });

  deployOwnVercelBtn.addEventListener('click', function () {
    window.location.href = API_BASE + '/api/auth/authorize';
  });

  // ── Upgrade Modal ─────────────────────────────────────────────────────────────
  upgradeBtn.addEventListener('click', function () {
    upgradeModal.classList.remove('hidden');
  });

  upgradeClose.addEventListener('click', function () {
    upgradeModal.classList.add('hidden');
  });

  upgradeModal.addEventListener('click', function (e) {
    if (e.target === upgradeModal) upgradeModal.classList.add('hidden');
  });

  upgradeCta.addEventListener('click', function () {
    upgradeModal.classList.add('hidden');
    appendMessage('assistant', 'Pro plan is on the way! You\'ll be the first to know when it launches.');
  });

  // ── Init ──────────────────────────────────────────────────────────────────────
  renderStarters();
  renderUsageUI();
  showEmptyState();

  // Handle Vercel OAuth return
  (function handleOAuthReturn() {
    var params = new URLSearchParams(window.location.search);
    var connected = params.get('vercel_connected');
    var error = params.get('error');
    if (connected === '1') {
      appendMessage('assistant', 'Vercel connected! Your next deploy will go to your own account. Hit Deploy when you\'re ready.');
      window.history.replaceState({}, '', window.location.pathname);
    } else if (error) {
      var msg = 'Could not connect Vercel. ';
      if (error === 'oauth_denied') msg += 'You cancelled the authorization.';
      else if (error === 'oauth_token_failed') msg += 'Token exchange failed — try again.';
      else msg += '(Error: ' + error + ')';
      appendMessage('assistant', msg);
      window.history.replaceState({}, '', window.location.pathname);
    }
  })();

})();
