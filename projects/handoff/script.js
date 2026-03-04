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
  var chatFooter      = document.getElementById('chatFooter');
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
  var imageStrip          = document.getElementById('imageStrip');
  var imageInput          = document.getElementById('imageInput');

  // ── State ─────────────────────────────────────────────────────────────────────
  var state = {
    previewHtml:   null,
    history:       [],   // [{role, content}] conversation history
    editModeOn:    false,
    selectedHtml:  null,
    generating:    false,
    images:        {},   // { 'img_1': 'data:...' } all uploaded images
    imageCount:    0,
    pendingImages: [],   // [{ id, dataUrl, name }] attached to next outgoing message
  };

  // ── Onboarding data ────────────────────────────────────────────────────────────
  var REVENUE_OPTIONS = [
    'Just starting out',
    '$1 to $1,000',
    '$1,001 to $5,000',
    '$5,001 to $15,000',
    '$15,000+',
    'Prefer not to say',
  ];

  var onboarding = { businessDesc: null, revenue: null, location: null, name: null };

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
    return true; // limit disabled until app is ready
  }

  function renderUsageUI() {
    // usage counter hidden until limit is re-enabled
  }

  // ── Preview ───────────────────────────────────────────────────────────────────
  // Edit-mode script injected into preview iframes
  var EDIT_MODE_SCRIPT = '(function(){var on=false;function clear(){document.querySelectorAll("[data-hsel]").forEach(function(el){el.style.outline="";el.removeAttribute("data-hsel");});}window.addEventListener("message",function(e){if(e.data&&e.data.type==="handoff-edit"){on=e.data.enabled;clear();}});document.addEventListener("click",function(e){if(!on)return;e.preventDefault();e.stopPropagation();var el=e.target;while(el&&["BODY","HTML"].indexOf(el.tagName)===-1){var r=el.getBoundingClientRect();if(r.width>20&&r.height>20)break;el=el.parentElement;}if(!el||el.tagName==="HTML")return;clear();el.style.outline="2px solid #6366f1";el.setAttribute("data-hsel","1");window.parent.postMessage({type:"handoff-selected",html:el.outerHTML},"*");},true);})();';

  function prepareCurrentHtml(html) {
    if (!html) return '';
    // Strip base64 image data before sending to API to keep payload small
    return html.replace(/src="data:[^"]{50,}"/g, 'src="[embedded-image]"');
  }

  function setPreview(html) {
    if (!html) return;
    // Replace image placeholder tokens with actual base64 data URLs
    Object.keys(state.images).forEach(function (id) {
      html = html.split('{{' + id + '}}').join(state.images[id]);
    });
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

    var isFirstBuild = state.history.length === 0;

    // Build full message content — append image instructions if images are attached
    var fullText = text;
    if (state.pendingImages.length > 0) {
      fullText += '\n\n[Attached images:';
      state.pendingImages.forEach(function (img, i) {
        fullText += ' Image ' + (i + 1) + ' token={{' + img.id + '}}.';
      });
      fullText += ' For each image use <img src="{{token}}" class="w-full h-full object-cover" alt="..."> with the exact token string as the src. Place them where the user described above.]';
      state.pendingImages = [];
      renderPendingImages();
    }

    appendMessage('user', text);
    chatInput.value = '';
    chatInput.style.height = 'auto';
    state.generating = true;
    sendBtn.disabled = true;
    appendTyping();
    showBuildingState();

    var payload = {
      messages: state.history.concat([{ role: 'user', content: fullText }]),
      currentHtml: prepareCurrentHtml(state.previewHtml || ''),
    };

    fetch(API_BASE + '/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
      .then(function (r) {
        return r.json().then(function (data) {
          if (!r.ok) throw new Error(data.error || ('Server error ' + r.status));
          return data;
        });
      })
      .then(function (data) {
        removeTyping();
        var html = data.html || null;
        var reply = data.reply || '';
        var summary = data.summary || null;
        var followup = data.followup || null;

        if (html) {
          setPreview(html);
          state.history.push({ role: 'user', content: fullText });
          state.history.push({ role: 'assistant', content: summary || reply || 'Site updated.' });
          appendMessage('assistant', summary || defaultReply(text));
          if (isFirstBuild) {
            appendMessage('assistant', followup || buildFollowupQuestion(text));
          }
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
        var msg = (err && err.message && err.message.length < 200) ? err.message : 'Connection error — check your internet and try again.';
        appendMessage('assistant', msg);
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

  function buildFollowupQuestion(userText) {
    var t = (userText || '').toLowerCase();
    if (/restaurant|cafe|caf[eé]|pizza|food|diner|bistro|eatery|menu/.test(t))
      return 'What\'s the restaurant\'s name, address, and phone number? What are your opening hours, and do you have any signature dishes with prices to add?';
    if (/barbershop|barber|salon|haircut|grooming|spa/.test(t))
      return 'What\'s the shop\'s name and address? What are your hours and the prices for your main services?';
    if (/gym|fitness|yoga|pilates|crossfit|training|workout/.test(t))
      return 'What\'s the gym\'s name and location? What classes do you offer, and what are your membership prices?';
    if (/photographer|photography|wedding photo|portrait/.test(t))
      return 'What\'s your name and the areas you serve? What packages do you offer and at what prices?';
    if (/portfolio|designer|developer|freelancer|ux|ui/.test(t))
      return 'What\'s your name and job title? What are your top 3–4 skills or specialties you\'d like to highlight?';
    if (/startup|saas|app|software|product|tech|platform/.test(t))
      return 'What\'s the product called and what problem does it solve? What are your pricing tiers called and how much do they cost?';
    if (/boutique|shop|store|clothing|retail|fashion/.test(t))
      return 'What\'s the store\'s name and location? What kinds of products do you carry?';
    if (/law|lawyer|attorney|legal/.test(t))
      return 'What\'s the firm\'s name and location? What areas of law do you specialise in, and what\'s the best way for clients to contact you?';
    if (/clinic|dentist|doctor|medical|health|therapy/.test(t))
      return 'What\'s the practice\'s name and address? What services do you offer, and what are your hours?';
    return 'To make this feel real — what\'s the business name, address, phone number, and opening hours?';
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

  // ── Onboarding ────────────────────────────────────────────────────────────────
  function showObStep(n) {
    [1, 2, 3, 4, 5].forEach(function (i) {
      document.getElementById('obStep' + i).classList.toggle('hidden', i !== n);
    });
  }

  function initOnboarding() {
    // Step 1 — business description textarea
    var bizInput = document.getElementById('bizDescInput');
    var step1Btn = document.getElementById('step1Next');
    bizInput.addEventListener('input', function () {
      step1Btn.disabled = !this.value.trim();
    });
    step1Btn.addEventListener('click', function () {
      var val = bizInput.value.trim();
      if (!val) return;
      onboarding.businessDesc = val;
      showObStep(2);
    });
    bizInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.shiftKey && !step1Btn.disabled) {
        e.preventDefault();
        step1Btn.click();
      }
    });

    // Step 2 — revenue pills
    var revenueGrid = document.getElementById('revenueGrid');
    var step2Btn = document.getElementById('step2Next');
    REVENUE_OPTIONS.forEach(function (opt) {
      var pill = document.createElement('button');
      pill.className = 'ob-revenue-pill';
      pill.textContent = opt;
      pill.addEventListener('click', function () {
        revenueGrid.querySelectorAll('.ob-revenue-pill').forEach(function (p) {
          p.classList.remove('selected');
        });
        pill.classList.add('selected');
        onboarding.revenue = opt;
        step2Btn.disabled = false;
      });
      revenueGrid.appendChild(pill);
    });
    step2Btn.addEventListener('click', function () {
      if (!onboarding.revenue) return;
      showObStep(3);
      document.getElementById('locationInput').focus();
    });

    // Step 3 — location
    var locationInput = document.getElementById('locationInput');
    var step3Btn = document.getElementById('step3Next');
    locationInput.addEventListener('input', function () {
      step3Btn.disabled = !this.value.trim();
    });
    locationInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !step3Btn.disabled) step3Btn.click();
    });
    step3Btn.addEventListener('click', function () {
      var val = locationInput.value.trim();
      if (!val) return;
      onboarding.location = val;
      showObStep(4);
      document.getElementById('nameInput').focus();
    });

    // Step 4 — business name
    var nameInput = document.getElementById('nameInput');
    var step4Btn = document.getElementById('step4Next');
    nameInput.addEventListener('input', function () {
      step4Btn.disabled = !this.value.trim();
    });
    nameInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !step4Btn.disabled) step4Btn.click();
    });
    step4Btn.addEventListener('click', function () {
      var val = nameInput.value.trim();
      if (!val) return;
      onboarding.name = val;
      var revenuePhrase = revenueToPhrase(onboarding.revenue);
      document.getElementById('summaryText').innerHTML =
        'You\'re building <strong>' + onboarding.name + '</strong>, a <strong>' + onboarding.businessDesc + '</strong> in <strong>' + onboarding.location + '</strong>' +
        (revenuePhrase ? ', and ' + revenuePhrase : '') + '.';
      showObStep(5);
    });

    // Step 5 — extras + progress bar
    var extrasInput = document.getElementById('extrasInput');
    var progressBar = document.getElementById('progressBar');
    extrasInput.addEventListener('input', function () {
      var pct = 15 + Math.min(85, (this.value.length / 150) * 85);
      progressBar.style.width = pct + '%';
    });
    document.getElementById('buildBtn').addEventListener('click', triggerGenerate);

    // Back buttons
    document.getElementById('back2').addEventListener('click', function () { showObStep(1); });
    document.getElementById('back3').addEventListener('click', function () { showObStep(2); });
    document.getElementById('back4').addEventListener('click', function () { showObStep(3); });
    document.getElementById('back5').addEventListener('click', function () { showObStep(4); });
  }

  function revenueToPhrase(revenue) {
    if (!revenue || revenue === 'Prefer not to say') return '';
    if (revenue === 'Just starting out') return 'you\'re just getting started';
    return 'you\'re making ' + revenue + '/mo';
  }

  function generateFromOnboarding(prompt) {
    if (state.generating) return;
    state.generating = true;
    sendBtn.disabled = true;
    appendTyping();
    showBuildingState();

    fetch(API_BASE + '/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: prompt }],
        currentHtml: '',
      }),
    })
      .then(function (r) {
        return r.json().then(function (data) {
          if (!r.ok) throw new Error(data.error || ('Server error ' + r.status));
          return data;
        });
      })
      .then(function (data) {
        removeTyping();
        if (data.html) {
          setPreview(data.html);
          state.history.push({ role: 'user', content: prompt });
          state.history.push({ role: 'assistant', content: data.summary || 'Site built.' });
          appendMessage('assistant', 'Your site has been built based on the data provided. If you would like to add more details please describe them below. If you would like to add images, please upload them and describe where you would like them placed.');
          incrementUsage();
        } else {
          appendMessage('assistant', data.reply || 'Something went wrong — please try again.');
          showEmptyState();
        }
      })
      .catch(function (err) {
        removeTyping();
        var msg = (err && err.message && err.message.length < 200) ? err.message : 'Connection error — check your internet and try again.';
        appendMessage('assistant', msg);
        showEmptyState();
      })
      .finally(function () {
        state.generating = false;
        sendBtn.disabled = false;
      });
  }

  function triggerGenerate() {
    var extras = document.getElementById('extrasInput').value.trim();
    var prompt = 'Build a professional website for a ' + onboarding.businessDesc +
      ' called "' + onboarding.name + '", based in ' + onboarding.location + '.';
    if (onboarding.revenue && onboarding.revenue !== 'Prefer not to say') {
      prompt += ' Revenue: ' + onboarding.revenue + '/mo.';
    }
    if (extras) prompt += ' Additional details: ' + extras;
    prompt += ' Do not ask for any more information — build the full site now using the details provided.';

    document.getElementById('onboardingOverlay').classList.add('hidden');
    document.querySelector('.workspace').classList.remove('hidden');
    chatFooter.classList.remove('hidden');
    generateFromOnboarding(prompt);
  }

  function renderPendingImages() {
    if (!imageStrip) return;
    imageStrip.innerHTML = '';
    imageStrip.classList.toggle('hidden', state.pendingImages.length === 0);
    state.pendingImages.forEach(function (img) {
      var thumb = document.createElement('div');
      thumb.className = 'image-thumb';
      var imgEl = document.createElement('img');
      imgEl.src = img.dataUrl;
      imgEl.alt = img.name;
      var removeBtn = document.createElement('button');
      removeBtn.className = 'remove-thumb';
      removeBtn.innerHTML = '&#215;';
      removeBtn.setAttribute('data-id', img.id);
      removeBtn.addEventListener('click', function () {
        state.pendingImages = state.pendingImages.filter(function (i) { return i.id !== img.id; });
        renderPendingImages();
      });
      thumb.appendChild(imgEl);
      thumb.appendChild(removeBtn);
      imageStrip.appendChild(thumb);
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

  // ── Image Upload ──────────────────────────────────────────────────────────────
  if (imageInput) {
    imageInput.addEventListener('change', function (e) {
      Array.from(e.target.files).forEach(function (file) {
        var reader = new FileReader();
        reader.onload = function (ev) {
          var id = 'img_' + (++state.imageCount);
          state.images[id] = ev.target.result;
          state.pendingImages.push({ id: id, dataUrl: ev.target.result, name: file.name });
          renderPendingImages();
        };
        reader.readAsDataURL(file);
      });
      imageInput.value = '';
    });
  }

  // ── Init ──────────────────────────────────────────────────────────────────────
  initOnboarding();
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
