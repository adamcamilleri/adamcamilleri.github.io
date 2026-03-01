(function () {
    'use strict';

    const API_BASE = (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'))
        ? '/api'
        : 'https://adamcamilleri-github-io.vercel.app/api';

    const chatMessages = document.getElementById('chatMessages');
    const chatInput = document.getElementById('chatInput');
    const sendBtn = document.getElementById('sendBtn');
    const previewFrame = document.getElementById('previewFrame');
    const deployBtn = document.getElementById('deployBtn');
    const saveBtn = document.getElementById('saveBtn');
    const editModeBtn = document.getElementById('editModeBtn');
    const editSelectionBar = document.getElementById('editSelectionBar');
    const editSelectionInput = document.getElementById('editSelectionInput');
    const editApplyBtn = document.getElementById('editApplyBtn');
    const deployResult = document.getElementById('deployResult');
    const deployUrlEl = document.getElementById('deployUrl');
    const copyUrlBtn = document.getElementById('copyUrlBtn');
    const connectVercelBtn = document.getElementById('connectVercelBtn');
    const connectVercelLabel = document.getElementById('connectVercelLabel');

    const DEFAULT_PREVIEW_HTML = `
<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Preview</title></head>
<body style="margin:0;font-family:system-ui;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#0f0f14;color:#71717a;">
  <p>Your site preview will appear here as you chat.</p>
</body></html>
    `.trim();

    var EDIT_MODE_SCRIPT = '(function(){var enabled=false;function clear(){document.querySelectorAll("[data-handoff-sel]").forEach(function(x){x.style.outline="";x.removeAttribute("data-handoff-sel");});}window.addEventListener("message",function(e){if(e.data&&e.data.type==="handoff-edit-mode"){enabled=e.data.enabled;clear();}});document.addEventListener("click",function(e){if(!enabled)return;e.preventDefault();e.stopPropagation();var el=e.target;while(el&&el.tagName&&["BODY","HTML"].indexOf(el.tagName)===-1){var r=el.getBoundingClientRect();if(r.width>20&&r.height>20)break;el=el.parentElement;}if(!el||el.tagName==="HTML")return;clear();el.style.outline="2px solid #6366f1";el.setAttribute("data-handoff-sel","1");window.parent.postMessage({type:"handoff-select",outerHTML:el.outerHTML},"*");},true);})();';

    // Set initial iframe content
    previewFrame.srcdoc = DEFAULT_PREVIEW_HTML;

    // OAuth: handle return from Vercel callback and check status on load
    (function checkOAuthParams() {
        const params = new URLSearchParams(window.location.search);
        const connected = params.get('vercel_connected');
        const error = params.get('error');
        if (connected === '1') {
            appendMessage('assistant', 'Vercel connected. Deploys will go to your account.');
            if (connectVercelLabel) connectVercelLabel.textContent = 'Vercel connected';
            if (connectVercelBtn) connectVercelBtn.classList.add('connected');
            window.history.replaceState({}, '', window.location.pathname);
        } else if (error) {
            var msg = 'Could not connect Vercel. ';
            if (error === 'oauth_denied') msg += 'Authorization was cancelled.';
            else if (error === 'oauth_token_failed') msg += 'Token exchange failed. Try again.';
            else msg += 'Error: ' + error;
            appendMessage('assistant', msg);
            window.history.replaceState({}, '', window.location.pathname);
        }
    })();

    function updateConnectVercelUI(connected) {
        if (!connectVercelLabel || !connectVercelBtn) return;
        if (connected) {
            connectVercelLabel.textContent = 'Vercel connected';
            connectVercelBtn.classList.add('connected');
        } else {
            connectVercelLabel.textContent = 'Connect Vercel';
            connectVercelBtn.classList.remove('connected');
        }
    }

    if (connectVercelBtn) {
        connectVercelBtn.href = API_BASE + '/auth/authorize';
        fetch(API_BASE + '/auth/status', { credentials: 'include' })
            .then(function (r) { return r.json(); })
            .then(function (data) { updateConnectVercelUI(data.connected); })
            .catch(function () {});
    }

    var lastPreviewHtml = '';

    const conversationHistory = [];

    function getCurrentHtml() {
        if (lastPreviewHtml) return lastPreviewHtml;
        var html = previewFrame.srcdoc || '';
        return (html && html !== DEFAULT_PREVIEW_HTML) ? html : '';
    }

    function looksLikeEmail(s) {
        return typeof s === 'string' && s.indexOf('@') > 0 && s.indexOf('.') > 0;
    }

    /**
     * Map raw user input to chat API payload.
     */
    function toChatPayload(userText, context) {
        const t = userText.trim().toLowerCase();
        const isDesignRequest =
            /\b(header|footer|hero|section|color|font|layout|button|form|nav|menu|blue|red|dark|light)\b/.test(t) ||
            /\b(make|change|add|update|design|style)\b/.test(t);

        if (isDesignRequest) {
            var userContent = 'Design request: ' + userText.trim();
            var p = {
                system: 'You are a web design assistant. Use Tailwind CSS. Include <script src="https://cdn.tailwindcss.com"></script> in the head. Respond with a single HTML document that implements the design request. Output only the HTML, no markdown code fences or explanation.',
                messages: conversationHistory.concat([{ role: 'user', content: userContent }]),
                user: userContent,
                currentHtml: getCurrentHtml(),
                formEmail: context && context.formEmail
            };
            if (looksLikeEmail(userText.trim())) p.formEmail = userText.trim();
            return p;
        }
        var payload = {
            system: 'You are a helpful web design assistant. If the user describes a website they want, respond with a complete single-page HTML document (using Tailwind CSS) that matches their description. Output only the HTML, no markdown or extra text.',
            messages: conversationHistory.concat([{ role: 'user', content: userText.trim() }]),
            user: userText.trim(),
            currentHtml: getCurrentHtml(),
            formEmail: context && context.formEmail
        };
        if (looksLikeEmail(userText.trim())) payload.formEmail = userText.trim();
        return payload;
    }

    function appendMessage(role, text) {
        const div = document.createElement('div');
        div.className = 'message ' + role;
        const p = document.createElement('p');
        p.textContent = text;
        div.appendChild(p);
        chatMessages.appendChild(div);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function appendTypingIndicator() {
        const div = document.createElement('div');
        div.className = 'message assistant typing-indicator';
        div.innerHTML = '<p><span class="dot"></span><span class="dot"></span><span class="dot"></span></p>';
        chatMessages.appendChild(div);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        return div;
    }

    function extractHtmlFromResponse(text) {
        if (!text || typeof text !== 'string') return null;
        const trimmed = text.trim();
        const open = trimmed.indexOf('<');
        const close = trimmed.lastIndexOf('>');
        if (open !== -1 && close > open) {
            return fixImagePlaceholders(trimmed.slice(open, close + 1));
        }
        return null;
    }

    function fixImagePlaceholders(html) {
        if (!html || typeof html !== 'string') return html;
        html = html.replace(/<img([^>]*?)src=["']([^"']*)["']([^>]*?)>/gi, function (m, before, src, after) {
            var altMatch = m.match(/alt=["']([^"']*)["']/i);
            var alt = (altMatch && altMatch[1]) ? altMatch[1].trim() : 'image';
            return '<div class="flex items-center justify-center bg-slate-200 text-slate-500 rounded-lg min-h-[120px] text-sm" style="aspect-ratio:16/9">Add image: ' + alt + '</div>';
        });
        return html;
    }

    function injectTailwind(html) {
        if (!html || typeof html !== 'string') return html;
        if (html.indexOf('tailwindcss') !== -1) return html;
        var tailwind = '<script src="https://cdn.tailwindcss.com"><\/script>';
        var headEnd = html.indexOf('</head>');
        if (headEnd !== -1) return html.slice(0, headEnd) + tailwind + html.slice(headEnd);
        return tailwind + html;
    }

    function injectEditScript(html) {
        if (!html || typeof html !== 'string') return html;
        var script = '<script>' + EDIT_MODE_SCRIPT + '<\/script>';
        var idx = html.lastIndexOf('</body>');
        if (idx !== -1) return html.slice(0, idx) + script + html.slice(idx);
        return html + script;
    }

    function setPreview(html) {
        if (!html) return;
        lastPreviewHtml = html;
        var toLoad = injectEditScript(injectTailwind(html));
        var blob = new Blob([toLoad], { type: 'text/html' });
        var url = URL.createObjectURL(blob);
        previewFrame.removeAttribute('srcdoc');
        previewFrame.onload = function () {
            URL.revokeObjectURL(url);
            if (editModeOn) tellIframeEditMode(true);
        };
        previewFrame.src = url;
    }

    var editModeOn = false;
    var lastSelectedHtml = null;

    function tellIframeEditMode(on) {
        try {
            if (previewFrame.contentWindow) previewFrame.contentWindow.postMessage({ type: 'handoff-edit-mode', enabled: on }, '*');
        } catch (e) {}
    }

    function handleEditModeToggle() {
        editModeOn = !editModeOn;
        editModeBtn.classList.toggle('active', editModeOn);
        if (!editModeOn) {
            editSelectionBar.classList.add('hidden');
            lastSelectedHtml = null;
        }
        tellIframeEditMode(editModeOn);
    }

    window.addEventListener('message', function (e) {
        if (!e.data || e.data.type !== 'handoff-select') return;
        if (!lastPreviewHtml || lastPreviewHtml === DEFAULT_PREVIEW_HTML) return;
        lastSelectedHtml = e.data.outerHTML || null;
        editSelectionBar.classList.remove('hidden');
        editSelectionInput.value = '';
        editSelectionInput.focus();
    });

    async function sendElementEdit(instruction) {
        if (!lastPreviewHtml || !lastSelectedHtml || !instruction) return Promise.reject(new Error('Nothing selected or no instruction'));
        var payload = {
            elementEdit: true,
            currentHtml: lastPreviewHtml,
            selectedElementHtml: lastSelectedHtml,
            instruction: instruction.trim()
        };
        var res = await fetch(API_BASE + '/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        var data = await res.json().catch(function () { return {}; });
        if (!res.ok) throw new Error(data.error || 'Request failed');
        return data;
    }

    async function sendToApi(userPrompt, context) {
        const payload = toChatPayload(userPrompt, context);
        const res = await fetch(API_BASE + '/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json().catch(function () { return {}; });
        if (!res.ok) {
            let msg = data.error || 'API request failed';
            if (data.details) msg += ': ' + (typeof data.details === 'string' ? data.details.slice(0, 200) : JSON.stringify(data.details).slice(0, 200));
            throw new Error(msg);
        }
        return data;
    }

    function handleSend(context) {
        const text = chatInput.value.trim();
        if (!text) return;

        appendMessage('user', text);
        chatInput.value = '';

        if (!API_BASE) {
            appendMessage('assistant', 'Demo mode: no API configured. Set API_BASE in script.js.');
            return;
        }

        sendBtn.disabled = true;
        appendTypingIndicator();

        sendToApi(text, context)
            .then(function (data) {
                const last = chatMessages.querySelector('.typing-indicator');
                if (last) chatMessages.removeChild(last);
                const reply = data.reply || data.text || data.message || '';
                const html = data.html || extractHtmlFromResponse(reply);
                if (html) {
                    setPreview(html);
                    appendMessage('assistant', 'Preview updated.');
                    conversationHistory.push({ role: 'user', content: text });
                    conversationHistory.push({ role: 'assistant', content: 'Preview updated.' });
                } else {
                    const msg = (reply || 'No response.').toString();
                    appendMessage('assistant', msg);
                    conversationHistory.push({ role: 'user', content: text });
                    conversationHistory.push({ role: 'assistant', content: msg });
                }
            })
            .catch(function (err) {
                const last = chatMessages.querySelector('.typing-indicator');
                if (last) chatMessages.removeChild(last);
                appendMessage('assistant', 'Error: ' + (err.message || 'Could not reach API.'));
            })
            .finally(function () {
                sendBtn.disabled = false;
            });
    }

    function getPreviewHtml() {
        return lastPreviewHtml || previewFrame.srcdoc || '';
    }

    function handleDeploy() {
        const html = getPreviewHtml();
        if (!html || html === DEFAULT_PREVIEW_HTML) {
            appendMessage('assistant', 'Design something first, then I can deploy it.');
            return;
        }

        deployBtn.disabled = true;
        deployBtn.textContent = '… Deploying';

        fetch(API_BASE + '/deploy', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ html })
        })
            .then(function (r) { return r.json(); })
            .then(function (data) {
                deployBtn.disabled = false;
                deployBtn.innerHTML = '<i class="fas fa-rocket"></i> Deploy';
                if (data.url) {
                    deployUrlEl.href = data.url;
                    deployUrlEl.textContent = data.url;
                    deployResult.classList.remove('hidden');
                } else {
                    appendMessage('assistant', 'Deploy failed: ' + (data.error || 'Unknown error'));
                }
            })
            .catch(function (err) {
                deployBtn.disabled = false;
                deployBtn.innerHTML = '<i class="fas fa-rocket"></i> Deploy';
                appendMessage('assistant', 'Deploy error: ' + (err.message || 'Could not reach API'));
            });
    }

    function handleSave() {
        var html = getPreviewHtml();
        if (!html || html === DEFAULT_PREVIEW_HTML) {
            appendMessage('assistant', 'Design something first, then I can save it.');
            return;
        }
        if (!saveBtn) return;
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving';
        fetch(API_BASE + '/save-design', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ html: html, name: 'Handoff design' })
        })
            .then(function (r) { return r.json(); })
            .then(function (data) {
                saveBtn.disabled = false;
                saveBtn.innerHTML = '<i class="fas fa-save"></i> Save';
                if (data.id) appendMessage('assistant', 'Design saved.');
                else appendMessage('assistant', 'Save failed: ' + (data.error || 'Unknown error'));
            })
            .catch(function (err) {
                saveBtn.disabled = false;
                saveBtn.innerHTML = '<i class="fas fa-save"></i> Save';
                appendMessage('assistant', 'Save error: ' + (err.message || 'Could not reach API'));
            });
    }

    function copyDeployUrl() {
        const url = deployUrlEl.href;
        if (url && navigator.clipboard) {
            navigator.clipboard.writeText(url).then(function () {
                const orig = copyUrlBtn.innerHTML;
                copyUrlBtn.innerHTML = '<i class="fas fa-check"></i> Copied';
                setTimeout(function () { copyUrlBtn.innerHTML = orig; }, 1500);
            });
        }
    }

    sendBtn.addEventListener('click', function () { handleSend(); });
    chatInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    });
    function handleEditApply() {
        var text = editSelectionInput && editSelectionInput.value ? editSelectionInput.value.trim() : '';
        if (!text || !lastSelectedHtml || !lastPreviewHtml) return;
        editApplyBtn.disabled = true;
        appendTypingIndicator();
        sendElementEdit(text)
            .then(function (data) {
                var last = chatMessages.querySelector('.typing-indicator');
                if (last) chatMessages.removeChild(last);
                var reply = data.reply || data.text || data.message || '';
                var html = data.html || extractHtmlFromResponse(reply);
                if (html) {
                    setPreview(html);
                    appendMessage('assistant', 'Updated.');
                    editSelectionBar.classList.add('hidden');
                    lastSelectedHtml = null;
                } else appendMessage('assistant', reply || 'No changes.');
            })
            .catch(function (err) {
                var last = chatMessages.querySelector('.typing-indicator');
                if (last) chatMessages.removeChild(last);
                appendMessage('assistant', 'Error: ' + (err.message || 'Could not apply.'));
            })
            .finally(function () { editApplyBtn.disabled = false; });
    }

    if (deployBtn) deployBtn.addEventListener('click', handleDeploy);
    if (saveBtn) saveBtn.addEventListener('click', handleSave);
    if (copyUrlBtn) copyUrlBtn.addEventListener('click', copyDeployUrl);
    if (editModeBtn) editModeBtn.addEventListener('click', handleEditModeToggle);
    if (editApplyBtn) editApplyBtn.addEventListener('click', handleEditApply);
    if (editSelectionInput) editSelectionInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') { e.preventDefault(); handleEditApply(); }
    });
})();
