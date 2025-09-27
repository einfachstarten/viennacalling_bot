const messagesEl = document.getElementById('messages');
const inputEl = document.getElementById('userInput');

// Workshop Password Management - FRONTEND ONLY
let requiredPassword = 'frieder2025'; // Fallback, can be overridden by API
let isAuthenticated = localStorage.getItem('workshop_authenticated') === 'true';

// Load password from API (optional backend support)
fetch('/api/config')
  .then(response => response.json())
  .then(data => {
    if (data && typeof data.workshopPassword === 'string') {
      requiredPassword = data.workshopPassword;
    }
  })
  .catch(() => {
    console.log('Using fallback password');
  });

// Check authentication on page load
document.addEventListener('DOMContentLoaded', () => {
  if (!isAuthenticated) {
    showPasswordPrompt();
  }

  trackEvent('page_loaded', {
    user_agent: navigator.userAgent,
    is_mobile: /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
    authenticated: isAuthenticated,
    timestamp: new Date().toISOString()
  });
});

function showPasswordPrompt() {
  // Disable chat interface
  const userInput = document.getElementById('userInput');
  const chatButton = document.querySelector('.chat-input button');
  if (userInput) userInput.disabled = true;
  if (chatButton) chatButton.disabled = true;

  const overlay = document.createElement('div');
  overlay.id = 'passwordOverlay';
  overlay.innerHTML = `
    <div style="
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.9);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
    ">
      <div style="
        background: white;
        padding: 30px;
        border-radius: 16px;
        box-shadow: 0 8px 30px rgba(0,0,0,0.3);
        max-width: 400px;
        width: 90%;
        text-align: center;
      ">
        <h2 style="margin: 0 0 10px 0; color: #000;">🏛️ Wien Workshop</h2>
        <p style="margin: 0 0 20px 0; color: #666; font-size: 14px;">
          Kaiser Franz steht nur Workshop-Teilnehmern zur Verfügung
        </p>
        
        <div style="margin-bottom: 20px;">
          <input 
            type="password" 
            id="workshopPasswordInput" 
            placeholder="Workshop-Passwort eingeben"
            style="
              width: 100%;
              padding: 12px;
              border: 2px solid #e1e5e9;
              border-radius: 8px;
              font-size: 16px;
              box-sizing: border-box;
              margin-bottom: 12px;
            "
            onkeypress="if(event.key==='Enter') validatePassword()"
          >
          
          <label style="display: flex; align-items: center; gap: 8px; font-size: 14px; color: #666;">
            <input type="checkbox" id="rememberPassword" checked>
            Passwort speichern (nur auf diesem Gerät)
          </label>
        </div>
        
        <button 
          onclick="validatePassword()"
          style="
            background: #FF1493;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            width: 100%;
          "
        >
          Workshop betreten
        </button>
        
        <div id="passwordError" style="
          margin-top: 12px;
          color: #dc3545;
          font-size: 14px;
          display: none;
        "></div>
      </div>
    </div>
  `;
  
  document.body.appendChild(overlay);
  
  // Focus password input
  setTimeout(() => {
    const passwordInput = document.getElementById('workshopPasswordInput');
    if (passwordInput) {
      passwordInput.focus();
    }
  }, 100);
}

function validatePassword() {
  const input = document.getElementById('workshopPasswordInput');
  const remember = document.getElementById('rememberPassword');
  const enteredPassword = input ? input.value.trim() : '';
  const rememberChecked = remember ? remember.checked : false;
  
  if (!enteredPassword) {
    showPasswordError('Bitte Passwort eingeben');
    return;
  }
  
  if (enteredPassword !== requiredPassword) {
    showPasswordError('Falsches Passwort. Nur für Workshop-Teilnehmer!');
    if (input) {
      input.value = '';
      input.focus();
    }
    
    // Analytics: Track failed login
    trackEvent('password_failed', {
      timestamp: new Date().toISOString()
    });
    return;
  }
  
  // Success!
  isAuthenticated = true;
  
  if (rememberChecked) {
    localStorage.setItem('workshop_authenticated', 'true');
  }
  
  // Remove overlay
  const overlay = document.getElementById('passwordOverlay');
  if (overlay) {
    overlay.remove();
  }
  
  // Enable chat interface
  const userInput = document.getElementById('userInput');
  const chatButton = document.querySelector('.chat-input button');
  if (userInput) {
    userInput.disabled = false;
    userInput.focus();
  }
  if (chatButton) {
    chatButton.disabled = false;
  }
  
  // Analytics: Track successful login
  trackEvent('password_success', {
    remembered: rememberChecked,
    timestamp: new Date().toISOString()
  });
  
  // Show welcome message
  addMessage('Willkommen beim Workshop! 👑', true);
}

function showPasswordError(message) {
  const errorDiv = document.getElementById('passwordError');
  if (errorDiv) {
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
  }
  
  // Hide after 3 seconds
  setTimeout(() => {
    const error = document.getElementById('passwordError');
    if (error) {
      error.style.display = 'none';
    }
  }, 3000);
}

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

    // Analytics: Track unknown question detection
    const unknownIndicators = [
      'weiß ich nicht', 'kann ich nicht', 'des kenn ich nicht',
      'hab keine ahnung', 'tut mir leid', 'sorry', 'leider'
    ];

    const isUnknownResponse = unknownIndicators.some(indicator =>
      response.toLowerCase().includes(indicator.toLowerCase())
    );

    if (isUnknownResponse) {
      trackEvent('unknown_question_detected', {
        user_message: message,
        bot_response_length: response.length,
        timestamp: new Date().toISOString()
      });
    }
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
  // Check authentication before sending
  if (!isAuthenticated) {
    showPasswordPrompt();
    return;
  }

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


