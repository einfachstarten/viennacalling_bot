const messagesEl = document.getElementById('messages');
const inputEl = document.getElementById('userInput');

// NEUE CHAT HISTORY
let conversationHistory = [];

// Workshop Password Management
let workshopPassword = '';

try {
  workshopPassword = localStorage.getItem('workshop_password') || '';
} catch (storageError) {
  console.warn('LocalStorage unavailable for workshop password:', storageError);
}

// Check if password is needed on page load
document.addEventListener('DOMContentLoaded', () => {
  if (!workshopPassword) {
    showPasswordPrompt();
  }

  trackEvent('page_loaded', {
    user_agent: navigator.userAgent,
    is_mobile: /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
    has_saved_password: !!workshopPassword,
    timestamp: new Date().toISOString()
  });
});

function showPasswordPrompt() {
  if (document.getElementById('passwordOverlay')) {
    const existingInput = document.getElementById('workshopPasswordInput');
    if (existingInput) {
      existingInput.focus();
    }
    return;
  }

  const overlay = document.createElement('div');
  overlay.id = 'passwordOverlay';
  overlay.innerHTML = `
    <div style="
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.8);
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
            onkeypress="if(event.key==='Enter') validateWorkshopPassword()"
          >
          
          <label style="display: flex; align-items: center; gap: 8px; font-size: 14px; color: #666;">
            <input type="checkbox" id="rememberPassword" checked>
            Passwort speichern (nur auf diesem Gerät)
          </label>
        </div>
        
        <button 
          onclick="validateWorkshopPassword()"
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
    const input = document.getElementById('workshopPasswordInput');
    if (input) {
      input.focus();
    }
  }, 100);
}

async function validateWorkshopPassword() {
  const input = document.getElementById('workshopPasswordInput');
  const rememberCheckbox = document.getElementById('rememberPassword');
  const remember = rememberCheckbox ? rememberCheckbox.checked : false;
  const enteredPassword = input ? input.value.trim() : '';

  if (!enteredPassword) {
    showPasswordError('Bitte Passwort eingeben');
    return;
  }

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'test' }],
        workshopPassword: enteredPassword
      })
    });

    if (response.status === 401) {
      showPasswordError('Falsches Passwort. Nur für Workshop-Teilnehmer!');
      if (input) {
        input.value = '';
        input.focus();
      }

      trackEvent('password_failed', {
        timestamp: new Date().toISOString()
      });
      return;
    }

    if (!response.ok) {
      const data = await response.json().catch(() => ({ error: 'Server error' }));
      throw new Error(data.error || 'Server error');
    }

    workshopPassword = enteredPassword;

    try {
      if (remember) {
        localStorage.setItem('workshop_password', enteredPassword);
      } else {
        localStorage.removeItem('workshop_password');
      }
    } catch (storageError) {
      console.warn('Failed to persist workshop password:', storageError);
    }

    const overlay = document.getElementById('passwordOverlay');
    if (overlay) {
      overlay.remove();
    }

    trackEvent('password_success', {
      remembered: remember,
      timestamp: new Date().toISOString()
    });

    addMessage('Willkommen beim Workshop! 👑', true);
  } catch (error) {
    console.error('Workshop password validation failed:', error);
    showPasswordError('Verbindungsfehler. Bitte versuchen Sie es erneut.');
  }
}

function showPasswordError(message) {
  const errorDiv = document.getElementById('passwordError');
  if (!errorDiv) return;

  errorDiv.textContent = message;
  errorDiv.style.display = 'block';

  setTimeout(() => {
    errorDiv.style.display = 'none';
  }, 3000);
}

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
        messages: conversationHistory,
        workshopPassword
      })
    });

    const data = await response.json();

    if (response.status === 401 && data.needsPassword) {
      workshopPassword = '';
      try {
        localStorage.removeItem('workshop_password');
      } catch (storageError) {
        console.warn('Failed to remove stored workshop password:', storageError);
      }
      showPasswordPrompt();
      throw new Error('Authentication required');
    }

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

    if (error.message === 'Authentication required') {
      conversationHistory = conversationHistory.slice(0, -1);
      return;
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

  if (!workshopPassword) {
    showPasswordPrompt();
    return;
  }

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
