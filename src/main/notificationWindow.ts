import { BrowserWindow, screen } from 'electron';
import { join } from 'path';

// These will be defined by webpack plugin
declare const NOTIFICATION_WINDOW_WEBPACK_ENTRY: string | undefined;
declare const NOTIFICATION_WINDOW_PRELOAD_WEBPACK_ENTRY: string | undefined;

export class NotificationWindow {
  private window: BrowserWindow | null = null;
  private hideTimeout: NodeJS.Timeout | null = null;
  
  show(title: string, body: string, type: 'twentytwenty' | 'blink' | 'posture') {
    if (this.window) {
      this.window.destroy();
    }
    
    const display = screen.getPrimaryDisplay();
    const { width } = display.workAreaSize;
    const { x: screenX, y: screenY } = display.bounds;
    
    this.window = new BrowserWindow({
      width: 350,
      height: 150,
      x: screenX + width - 370,
      y: screenY + 20,
      frame: false,
      transparent: true,
      alwaysOnTop: true,
      skipTaskbar: true,
      resizable: false,
      webPreferences: {
        preload: NOTIFICATION_WINDOW_PRELOAD_WEBPACK_ENTRY || join(__dirname, 'notificationPreload.js'),
        contextIsolation: true,
        nodeIntegration: false,
      },
    });
    
    if (NOTIFICATION_WINDOW_WEBPACK_ENTRY) {
      this.window.loadURL(NOTIFICATION_WINDOW_WEBPACK_ENTRY);
    } else {
      // Fallback for development
      this.window.loadFile(join(__dirname, '../../public/notification.html'));
    }
    
    this.window.webContents.on('did-finish-load', () => {
      this.window?.webContents.send('notification-data', { title, body, type });
    });
    
    this.window.on('closed', () => {
      this.window = null;
      if (this.hideTimeout) {
        clearTimeout(this.hideTimeout);
        this.hideTimeout = null;
      }
    });
    
    this.window.showInactive();
    
    this.hideTimeout = setTimeout(() => {
      this.hide();
    }, 8000);
  }
  
  hide() {
    if (this.window) {
      this.window.close();
    }
  }
}