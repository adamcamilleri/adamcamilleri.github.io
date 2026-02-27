(function () {
    'use strict';

    const API_BASE = 'https://adamcamilleri-github-io.vercel.app/api';

    const chatMessages = document.getElementById('chatMessages');
    const chatInput = document.getElementById('chatInput');
    const sendBtn = document.getElementById('sendBtn');
    const previewFrame = document.getElementById('previewFrame');
    const apiHint = document.getElementById('apiHint');
    const deployBtn = document.getElementById('deployBtn');
    const deployResult = document.getElementById('deployResult');
    const deployUrlEl = document.getElementById('deployUrl');
    const copyUrlBtn = document.getElementById('copyUrlBtn');

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
    function toAnthropicPrompt(userText, context) {
        const t = userText.trim().toLowerCase();
        const isDesignRequest =
            /\b(header|footer|hero|section|color|font|layout|button|form|nav|menu|blue|red|dark|light)\b/.test(t) ||
            /\b(make|change|add|update|design|style)\b/.test(t);

        if (isDesignRequest) {
            return {
                system: 'You are a web design assistant. When the user asks for design changes, respond with a single HTML document (with inline CSS) that implements their request. Output only the HTML, no markdown code fences or explanation before/after.',
                user: 'Design request: ' + userText.trim(),
                formEmail: context && context.formEmail,
                paymentLink: context && context.paymentLink
            };
        }
        return {
            system: 'You are a helpful web design assistant. If the user describes a website they want, respond with a complete single-page HTML document (with inline CSS) that matches their description. Output only the HTML, no markdown or extra text.',
            user: userText.trim(),
            formEmail: context && context.formEmail,
            paymentLink: context && context.paymentLink
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

    async function sendToApi(userPrompt, context) {
        const { system, user, formEmail, paymentLink } = toAnthropicPrompt(userPrompt, context);
        const res = await fetch(API_BASE + '/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ system, user, formEmail, paymentLink })
        });
        const data = await res.json().catch(function () { return {}; });
        if (!res.ok) {
            let msg = data.error || 'API request failed';
            if (data.details) msg += ': ' + (typeof data.details === 'string' ? data.details.slice(0, 200) : JSON.stringify(data.details).slice(0, 200));
            throw new Error(msg);
        }
        return data.reply || data.text || data.message || '';
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
        appendMessage('assistant', '…');

        sendToApi(text, context)
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

    function getPreviewHtml() {
        return previewFrame.srcdoc || '';
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

    function quickAddForm() {
        const email = prompt('What email should the contact form send submissions to?');
        if (!email || !email.trim()) return;
        const msg = 'Add a contact form to the page. Include name, email, and message fields.';
        chatInput.value = msg;
        handleSend({ formEmail: email.trim() });
    }

    function quickAddPayment() {
        const input = prompt('Payment amount? (e.g. 20 for $20, 5 for $5)');
        if (!input) return;
        const amt = parseFloat(String(input).replace(/[^0-9.]/g, ''));
        if (!amt || amt <= 0) {
            appendMessage('assistant', 'Please enter a valid amount (e.g. 20 for $20).');
            return;
        }
        const cents = Math.round(amt * 100);
        const label = prompt('Button label?', 'Buy now');

        fetch(API_BASE + '/create-payment-link', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount: cents, label: label || 'Payment' })
        })
            .then(function (r) { return r.json(); })
            .then(function (data) {
                if (data.paymentLink) {
                    const msg = 'Add a buy/donate button to the page. Make it prominent and clear.';
                    chatInput.value = msg;
                    handleSend({ paymentLink: data.paymentLink });
                } else {
                    appendMessage('assistant', 'Payment setup unavailable. ' + (data.error || 'Add STRIPE_SECRET_KEY for payment buttons.'));
                }
            })
            .catch(function (err) {
                appendMessage('assistant', 'Could not create payment link: ' + (err.message || 'Check backend.'));
            });
    }

    sendBtn.addEventListener('click', function () { handleSend(); });
    chatInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    });
    if (deployBtn) deployBtn.addEventListener('click', handleDeploy);
    if (copyUrlBtn) copyUrlBtn.addEventListener('click', copyDeployUrl);

    document.querySelectorAll('.quick-btn[data-type="form"]').forEach(function (btn) {
        btn.addEventListener('click', quickAddForm);
    });
    document.querySelectorAll('.quick-btn[data-type="payment"]').forEach(function (btn) {
        btn.addEventListener('click', quickAddPayment);
    });
})();
