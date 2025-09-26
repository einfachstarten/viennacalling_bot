const messagesEl = document.getElementById('messages');
const inputEl = document.getElementById('userInput');

// NEUE CHAT HISTORY
let conversationHistory = [];

let lastRequestTime = 0;
const REQUEST_COOLDOWN = 2000;

function addMessage(text, isBot = false, options = {}) {
  const { loading = false, allowHTML = false } = options;
  const bubble = document.createElement('div');
  bubble.classList.add('message', isBot ? 'bot-message' : 'user-message');

  if (loading) {
    const span = document.createElement('span');
    span.classList.add('loading-dots');
    bubble.appendChild(span);
  } else if (allowHTML) {
    bubble.innerHTML = text;
  } else {
    bubble.textContent = text;
  }

  messagesEl.appendChild(bubble);
  messagesEl.scrollTop = messagesEl.scrollHeight;
  return bubble;
}

function formatBotMessage(message) {
  const safeMessage = typeof message === 'string' ? message : String(message ?? '');
  const temp = document.createElement('div');
  temp.textContent = safeMessage;
  let html = temp.innerHTML.replace(/\n/g, '<br>');

  // URLs zu klickbaren Links machen
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  html = html.replace(urlRegex, '<a href="$1" target="_blank" rel="noopener">$1</a>');

  return html;
}

async function getOpenAIResponse(userMessage) {
  try {
    console.log('Sending conversation history:', conversationHistory);

    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: conversationHistory
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Server error');
    }

    return data.message;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

async function processUserMessage(message) {
  const now = Date.now();
  if (now - lastRequestTime < REQUEST_COOLDOWN) {
    addMessage('Bitte warte kurz zwischen den Fragen 😊', true);
    return;
  }
  lastRequestTime = now;

  // User Message zur History hinzufügen
  conversationHistory.push({ role: 'user', content: message });

  if (conversationHistory.length > 20) {
    // Behalte nur letzten 20 Messages (10 Paare)
    conversationHistory = conversationHistory.slice(-20);
  }

  const loadingBubble = addMessage('', true, { loading: true });

  try {
    const response = await getOpenAIResponse(message);
    if (loadingBubble.parentNode === messagesEl) {
      messagesEl.removeChild(loadingBubble);
    }

    // Bot Response zur History hinzufügen
    conversationHistory.push({ role: 'assistant', content: response });

    addMessage(formatBotMessage(response), true, { allowHTML: true });

    // Analytics: Track successful response
    trackEvent('bot_response_success', {
      response_length: response.length,
      conversation_length: conversationHistory.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    if (loadingBubble.parentNode === messagesEl) {
      messagesEl.removeChild(loadingBubble);
    }
    addMessage('Sorry, da ist was schiefgelaufen. Versuch es nochmal! 🔄', true);

    // Analytics: Track error
    trackEvent('bot_response_error', {
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

// Analytics Event Tracking
function trackEvent(eventName, properties = {}) {
  if (typeof window.va === 'function') {
    window.va('track', eventName, properties);
  }
}

async function sendMessage() {
  const message = inputEl.value.trim();
  if (message === '') return;

  addMessage(message, false);

  // Analytics: Track user message
  trackEvent('message_sent', {
    message_length: message.length,
    has_question_mark: message.includes('?'),
    timestamp: new Date().toISOString()
  });

  inputEl.value = '';
  inputEl.focus();

  await processUserMessage(message);
}

async function askQuick(question) {
  inputEl.value = question;
  await sendMessage();
}

document.addEventListener('DOMContentLoaded', () => {
  trackEvent('page_loaded', {
    user_agent: navigator.userAgent,
    is_mobile: /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
    timestamp: new Date().toISOString()
  });
});
