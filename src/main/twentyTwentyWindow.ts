import { BrowserWindow, screen, globalShortcut } from 'electron';
import { join } from 'path';

declare const TWENTY_TWENTY_WINDOW_WEBPACK_ENTRY: string | undefined;
declare const TWENTY_TWENTY_WINDOW_PRELOAD_WEBPACK_ENTRY: string | undefined;

export class TwentyTwentyWindow {
  private windows: BrowserWindow[] = [];
  private onComplete: (() => void) | null = null;
  private onCountdownUpdate: ((seconds: number) => void) | null = null;
  private countdownInterval: NodeJS.Timeout | null = null;
  private isClosing: boolean = false;
  
  private messages = [
    "Give them eyes a rest, champ 👀",
    "Time to gaze into the distance 🌅",
    "Look far, see far 🔭",
    "Your eyes will thank you ✨",
    "Take a visual vacation 🏖️",
    "Time for some eye yoga 🧘",
    "Let those peepers breathe 💨",
    "Focus on the horizon 🌄",
  ];
  
  private getRandomMessage(): string {
    return this.messages[Math.floor(Math.random() * this.messages.length)];
  }
  
  show(onComplete: () => void, onCountdownUpdate?: (seconds: number) => void) {
    // Close existing windows
    this.windows.forEach(window => window.destroy());
    this.windows = [];
    this.isClosing = false;
    
    this.onComplete = onComplete;
    this.onCountdownUpdate = onCountdownUpdate || null;
    
    // Unregister any existing shortcuts first
    globalShortcut.unregister('Escape');
    
    // Register global shortcut
    globalShortcut.register('Escape', () => {
      console.log('Escape pressed, closing all windows');
      this.skip();
    });
    
    // Get all displays
    const displays = screen.getAllDisplays();
    
    // Pre-determine the initial state to send to all windows
    const initialState = {
      countdown: 20,
      message: this.getRandomMessage()
    };
    
    // Create a window for each display
    displays.forEach((display, index) => {
      const { bounds } = display;
      const isPrimary = display.primary;
      
      const window = new BrowserWindow({
        width: bounds.width,
        height: bounds.height,
        x: bounds.x,
        y: bounds.y,
        frame: false,
        transparent: true,
        alwaysOnTop: true,
        skipTaskbar: true,
        resizable: false,
        movable: false,
        minimizable: false,
        maximizable: false,
        closable: true,
        hasShadow: false,
        roundedCorners: false,
        focusable: true, // All windows can be focused
        webPreferences: {
          preload: TWENTY_TWENTY_WINDOW_PRELOAD_WEBPACK_ENTRY || undefined,
          contextIsolation: true,
          nodeIntegration: false,
          backgroundThrottling: false,
        },
      });
      
      if (TWENTY_TWENTY_WINDOW_WEBPACK_ENTRY) {
        window.loadURL(TWENTY_TWENTY_WINDOW_WEBPACK_ENTRY);
      } else {
        window.loadFile(join(__dirname, '../../public/twenty-twenty.html'));
      }
      
      window.setAlwaysOnTop(true, 'screen-saver');
      window.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
      
      window.on('closed', () => {
        // Don't remove from array here, let cleanup handle it
      });
      
      // Send initial state for each window
      window.webContents.on('did-finish-load', () => {
        if (!window.isDestroyed()) {
          window.webContents.send('initial-state', initialState);
        }
      });
      
      window.show();
      this.windows.push(window);
      
      // Focus one window to ensure keyboard shortcuts work
      if (index === 0) {
        window.focus();
      }
    });
    
    let countdown = 20;
    this.countdownInterval = setInterval(() => {
      countdown--;
      this.windows.forEach(window => {
        if (!window.isDestroyed()) {
          window.webContents.send('update-countdown', countdown);
        }
      });
      if (this.onCountdownUpdate) {
        this.onCountdownUpdate(countdown);
      }
      if (countdown <= 0) {
        this.complete();
      }
    }, 1000);
  }
  
  skip() {
    if (this.isClosing) {
      console.log('Skip already in progress, ignoring');
      return;
    }
    
    this.isClosing = true;
    console.log('Skip called, force closing all windows');
    
    // First try to close all windows immediately
    this.windows.forEach((window, index) => {
      if (!window.isDestroyed()) {
        console.log(`Force closing window ${index}`);
        window.destroy();
      }
    });
    
    // Then do regular cleanup
    this.cleanup();
  }
  
  complete() {
    this.cleanup();
  }
  
  private cleanup() {
    console.log('Cleanup called, closing', this.windows.length, 'windows');
    
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
      this.countdownInterval = null;
    }
    
    globalShortcut.unregister('Escape');
    
    // Force close all windows
    const windowsToClose = [...this.windows];
    this.windows = [];
    
    windowsToClose.forEach((window, index) => {
      console.log('Closing window', index, 'destroyed:', window.isDestroyed());
      if (!window.isDestroyed()) {
        window.destroy();
      }
    });
    
    if (this.onComplete) {
      this.onComplete();
      this.onComplete = null;
    }
    
    this.onCountdownUpdate = null;
  }
}