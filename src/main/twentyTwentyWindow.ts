import { BrowserWindow, screen, globalShortcut } from 'electron';
import { join } from 'path';

declare const TWENTY_TWENTY_WINDOW_WEBPACK_ENTRY: string | undefined;
declare const TWENTY_TWENTY_WINDOW_PRELOAD_WEBPACK_ENTRY: string | undefined;

export class TwentyTwentyWindow {
  private window: BrowserWindow | null = null;
  private onComplete: (() => void) | null = null;
  private onCountdownUpdate: ((seconds: number) => void) | null = null;
  private countdownInterval: NodeJS.Timeout | null = null;
  
  show(onComplete: () => void, onCountdownUpdate?: (seconds: number) => void) {
    if (this.window) {
      this.window.destroy();
    }
    
    this.onComplete = onComplete;
    this.onCountdownUpdate = onCountdownUpdate || null;
    
    const display = screen.getPrimaryDisplay();
    const { width, height } = display.bounds;
    const { x: screenX, y: screenY } = display.bounds;
    
    this.window = new BrowserWindow({
      width,
      height,
      x: screenX,
      y: screenY,
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
      focusable: true,
      webPreferences: {
        preload: TWENTY_TWENTY_WINDOW_PRELOAD_WEBPACK_ENTRY || undefined,
        contextIsolation: true,
        nodeIntegration: false,
      },
    });
    
    if (TWENTY_TWENTY_WINDOW_WEBPACK_ENTRY) {
      this.window.loadURL(TWENTY_TWENTY_WINDOW_WEBPACK_ENTRY);
    } else {
      this.window.loadFile(join(__dirname, '../../public/twenty-twenty.html'));
    }
    
    this.window.setAlwaysOnTop(true, 'screen-saver');
    this.window.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
    
    this.window.on('closed', () => {
      this.cleanup();
    });
    
    globalShortcut.register('Escape', () => {
      this.skip();
    });
    
    // Send initial countdown
    this.window.webContents.on('did-finish-load', () => {
      if (this.window) {
        this.window.webContents.send('update-countdown', 20);
      }
    });
    
    let countdown = 20;
    this.countdownInterval = setInterval(() => {
      countdown--;
      if (this.window && !this.window.isDestroyed()) {
        this.window.webContents.send('update-countdown', countdown);
      }
      if (this.onCountdownUpdate) {
        this.onCountdownUpdate(countdown);
      }
      if (countdown <= 0) {
        this.complete();
      }
    }, 1000);
    
    this.window.show();
  }
  
  skip() {
    this.cleanup();
  }
  
  complete() {
    this.cleanup();
  }
  
  private cleanup() {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
      this.countdownInterval = null;
    }
    
    globalShortcut.unregister('Escape');
    
    if (this.window) {
      this.window.destroy();
      this.window = null;
    }
    
    if (this.onComplete) {
      this.onComplete();
      this.onComplete = null;
    }
    
    this.onCountdownUpdate = null;
  }
}