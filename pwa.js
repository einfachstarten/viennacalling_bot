// PWA Installation and Management
class PWAManager {
  constructor() {
    this.deferredPrompt = null;
    this.isInstalled = false;
    this.isOnline = navigator.onLine;
    
    this.init();
  }

  init() {
    this.registerServiceWorker();
    this.setupInstallPrompt();
    this.setupOfflineDetection();
    this.handleQuickActions();
    this.setupIOSInstallPrompt();
  }

  // Register Service Worker
  async registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('PWA: Service Worker registered successfully:', registration);
        
        // Handle updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              this.showUpdateAvailable();
            }
          });
        });
        
      } catch (error) {
        console.error('PWA: Service Worker registration failed:', error);
      }
    }
  }

  // Setup install prompt
  setupInstallPrompt() {
    // Listen for install prompt
    window.addEventListener('beforeinstallprompt', (e) => {
      console.log('PWA: Install prompt triggered');
      e.preventDefault();
      this.deferredPrompt = e;
      this.showInstallBanner();
    });

    // Handle install button click
    document.getElementById('installBtn')?.addEventListener('click', () => {
      this.installApp();
    });

    // Handle dismiss button
    document.getElementById('dismissBtn')?.addEventListener('click', () => {
      this.hideInstallBanner();
      // Remember dismissal for 7 days
      localStorage.setItem('pwa-install-dismissed', Date.now());
    });

    // Check if already installed
    window.addEventListener('appinstalled', () => {
      console.log('PWA: App installed successfully');
      this.isInstalled = true;
      this.hideInstallBanner();
      this.showWelcomeMessage();
    });
  }

  // Show install banner
  showInstallBanner() {
    // Don't show if recently dismissed
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (dismissed && Date.now() - dismissed < 7 * 24 * 60 * 60 * 1000) {
      return;
    }

    // Don't show if already installed
    if (this.isInstalled || window.navigator.standalone) {
      return;
    }

    const banner = document.getElementById('installBanner');
    if (banner) {
      banner.style.display = 'block';
      banner.classList.add('show');
    }
  }

  // Hide install banner
  hideInstallBanner() {
    const banner = document.getElementById('installBanner');
    if (banner) {
      banner.classList.remove('show');
      setTimeout(() => {
        banner.style.display = 'none';
      }, 300);
    }
  }

  // Install app
  async installApp() {
    if (!this.deferredPrompt) return;

    try {
      await this.deferredPrompt.prompt();
      const choiceResult = await this.deferredPrompt.userChoice;

      // Analytics: Track installation
      if (typeof window.va === 'function') {
        window.va('track', 'pwa_install_prompt', {
          outcome: choiceResult.outcome,
          timestamp: new Date().toISOString()
        });
      }

      if (choiceResult.outcome === 'accepted') {
        console.log('PWA: User accepted install');
      } else {
        console.log('PWA: User dismissed install');
      }
      
      this.deferredPrompt = null;
      this.hideInstallBanner();
    } catch (error) {
      console.error('PWA: Install failed:', error);
    }
  }

  // Setup iOS install prompt
  setupIOSInstallPrompt() {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isStandalone = window.navigator.standalone;
    
    if (isIOS && !isStandalone) {
      // Show iOS specific install instructions
      setTimeout(() => {
        this.showIOSInstallPrompt();
      }, 3000);
    }
  }

  showIOSInstallPrompt() {
    // Don't show if recently dismissed
    const dismissed = localStorage.getItem('ios-install-dismissed');
    if (dismissed && Date.now() - dismissed < 7 * 24 * 60 * 60 * 1000) {
      return;
    }

    const message = `
      <div class="ios-install-prompt">
        <div class="ios-install-content">
          <h3>Franz als App installieren</h3>
          <p>Tippen Sie auf <strong>Teilen</strong> <span style="font-size: 1.2em;">⬆️</span> und dann auf <strong>"Zum Home-Bildschirm"</strong></p>
          <button onclick="this.parentElement.parentElement.remove(); localStorage.setItem('ios-install-dismissed', Date.now());">Verstanden</button>
        </div>
      </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', message);
  }

  // Setup offline detection
  setupOfflineDetection() {
    const updateOnlineStatus = () => {
      this.isOnline = navigator.onLine;

      // Analytics: Track connectivity
      if (typeof window.va === 'function') {
        window.va('track', 'connectivity_change', {
          online: this.isOnline,
          timestamp: new Date().toISOString()
        });
      }

      const indicator = document.getElementById('offlineIndicator');

      if (indicator) {
        if (this.isOnline) {
          indicator.style.display = 'none';
          indicator.textContent = '📡 Online';
        } else {
          indicator.style.display = 'block';
          indicator.textContent = '📡 Offline';
        }
      }

      // Show notification
      if (!this.isOnline) {
        this.showOfflineNotification();
      }
    };

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    updateOnlineStatus();
  }

  // Handle quick actions from shortcuts
  handleQuickActions() {
    const urlParams = new URLSearchParams(window.location.search);
    const quick = urlParams.get('quick');
    
    if (quick) {
      setTimeout(() => {
        const input = document.getElementById('userInput');
        if (input) {
          switch (quick) {
            case 'heute':
              input.value = 'Was ist heute geplant?';
              break;
            case 'termin':
              input.value = 'Wann ist der nächste Termin?';
              break;
          }
          // Auto-submit
          sendMessage();
        }
      }, 1000);
    }
  }

  // Show update available notification
  showUpdateAvailable() {
    if (window.addMessage) {
      addMessage('🔄 App-Update verfügbar! Laden Sie die Seite neu für die neueste Version.', true);
    }
  }

  // Show offline notification
  showOfflineNotification() {
    if (window.addMessage) {
      addMessage('📱 Sie sind offline. Franz funktioniert trotzdem, aber neue Nachrichten können nicht gesendet werden.', true);
    }
  }

  // Show welcome message for new installs
  showWelcomeMessage() {
    if (window.addMessage) {
      addMessage('🎉 Franz wurde erfolgreich installiert! Sie können die App jetzt jederzeit von Ihrem Homescreen aus starten.', true);
    }
  }
}

// Initialize PWA when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.pwaManager = new PWAManager();
});

// Export for global access
window.PWAManager = PWAManager;
