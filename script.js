const messagesEl = document.getElementById('messages');
const inputEl = document.getElementById('userInput');

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
  return temp.innerHTML.replace(/\n/g, '<br>');
}

async function getOpenAIResponse(userMessage) {
  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: userMessage
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

  const loadingBubble = addMessage('', true, { loading: true });

  try {
    const response = await getOpenAIResponse(message);
    if (loadingBubble.parentNode === messagesEl) {
      messagesEl.removeChild(loadingBubble);
    }
    addMessage(formatBotMessage(response), true, { allowHTML: true });
  } catch (error) {
    if (loadingBubble.parentNode === messagesEl) {
      messagesEl.removeChild(loadingBubble);
    }
    addMessage('Sorry, da ist was schiefgelaufen. Versuch es nochmal! 🔄', true);
  }
}

async function sendMessage() {
  const message = inputEl.value.trim();
  if (message === '') return;

  addMessage(message, false);
  inputEl.value = '';
  inputEl.focus();

  await processUserMessage(message);
}

async function askQuick(question) {
  inputEl.value = question;
  await sendMessage();
}
