(function () {
    'use strict';

    // Set to your Vercel deployment URL + /api (find it in Vercel → your project → Domains or deployment URL)
    const API_BASE = 'https://adamcamilleri-github-io.vercel.app/api';

    const chatMessages = document.getElementById('chatMessages');
    const chatInput = document.getElementById('chatInput');
    const sendBtn = document.getElementById('sendBtn');
    const previewFrame = document.getElementById('previewFrame');
    const apiHint = document.getElementById('apiHint');

    const DEFAULT_PREVIEW_HTML = `
<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Preview</title></head>
<body style="margin:0;font-family:system-ui;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#f4f4f5;color:#71717a;">
  <p>Your site preview will appear here as you chat.</p>
</body></html>
    `.trim();

    // Set initial iframe content
    previewFrame.srcdoc = DEFAULT_PREVIEW_HTML;

    /**
     * Map raw user input to an Anthropic-friendly prompt.
     * Keeps intent clear and asks the model to return HTML/CSS when appropriate.
     */
    function toAnthropicPrompt(userText) {
        const t = userText.trim().toLowerCase();
        const isDesignRequest =
            /\b(header|footer|hero|section|color|font|layout|button|form|nav|menu|blue|red|dark|light)\b/.test(t) ||
            /\b(make|change|add|update|design|style)\b/.test(t);

        if (isDesignRequest) {
            return {
                system: 'You are a web design assistant. When the user asks for design changes, respond with a single HTML document (with inline CSS) that implements their request. Output only the HTML, no markdown code fences or explanation before/after.',
                user: 'Design request: ' + userText.trim()
            };
        }
        return {
            system: 'You are a helpful web design assistant. If the user describes a website they want, respond with a complete single-page HTML document (with inline CSS) that matches their description. Output only the HTML, no markdown or extra text.',
            user: userText.trim()
        };
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

    function extractHtmlFromResponse(text) {
        if (!text || typeof text !== 'string') return null;
        const trimmed = text.trim();
        const open = trimmed.indexOf('<');
        const close = trimmed.lastIndexOf('>');
        if (open !== -1 && close > open) {
            return trimmed.slice(open, close + 1);
        }
        return null;
    }

    function setPreview(html) {
        if (html) previewFrame.srcdoc = html;
    }

    async function sendToApi(userPrompt) {
        const { system, user } = toAnthropicPrompt(userPrompt);
        const res = await fetch(API_BASE + '/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ system, user })
        });
        const data = await res.json().catch(function () { return {}; });
        if (!res.ok) {
            const msg = data.error || data.details || 'API request failed';
            throw new Error(typeof msg === 'string' ? msg : JSON.stringify(msg));
        }
        return data.reply || data.text || data.message || '';
    }

    function handleSend() {
        const text = chatInput.value.trim();
        if (!text) return;

        appendMessage('user', text);
        chatInput.value = '';

        if (!API_BASE) {
            appendMessage('assistant', 'Demo mode: no API configured. Set API_BASE in script.js to your backend that calls Anthropic. I would map your message to an Anthropic-friendly prompt and show the generated HTML here.');
            return;
        }

        sendBtn.disabled = true;
        appendMessage('assistant', '…');

        sendToApi(text)
            .then(function (reply) {
                chatMessages.removeChild(chatMessages.lastElementChild);
                const html = extractHtmlFromResponse(reply);
                if (html) {
                    setPreview(html);
                    appendMessage('assistant', 'Preview updated.');
                } else {
                    appendMessage('assistant', reply || 'No response.');
                }
            })
            .catch(function (err) {
                chatMessages.removeChild(chatMessages.lastElementChild);
                appendMessage('assistant', 'Error: ' + (err.message || 'Could not reach API.'));
            })
            .finally(function () {
                sendBtn.disabled = false;
            });
    }

    sendBtn.addEventListener('click', handleSend);
    chatInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    });
})();
