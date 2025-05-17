import { BrowserWindow, screen } from 'electron';
import { join } from 'path';

declare const REMINDER_WINDOW_WEBPACK_ENTRY: string | undefined;
declare const REMINDER_WINDOW_PRELOAD_WEBPACK_ENTRY: string | undefined;

export class ReminderWindow {
  private window: BrowserWindow | null = null;
  
  show(type: 'blink' | 'posture', message: string) {
    if (this.window) {
      this.window.destroy();
    }
    
    const display = screen.getPrimaryDisplay();
    const { width, height } = display.bounds;
    
    this.window = new BrowserWindow({
      width,
      height,
      x: 0,
      y: 0,
      frame: false,
      transparent: true,
      alwaysOnTop: true,
      skipTaskbar: true,
      resizable: false,
      focusable: false,
      hasShadow: false,
      roundedCorners: false,
      webPreferences: {
        preload: REMINDER_WINDOW_PRELOAD_WEBPACK_ENTRY || undefined,
        contextIsolation: true,
        nodeIntegration: false,
      },
    });
    
    if (REMINDER_WINDOW_WEBPACK_ENTRY) {
      this.window.loadURL(REMINDER_WINDOW_WEBPACK_ENTRY);
    } else {
      this.window.loadFile(join(__dirname, '../../public/reminder.html'));
    }
    
    this.window.setAlwaysOnTop(true, 'floating');
    this.window.setIgnoreMouseEvents(true);
    
    this.window.webContents.on('did-finish-load', () => {
      this.window?.webContents.send('reminder-data', { type, message });
      // Show window after content loads to prevent glitchy animation
      setTimeout(() => {
        this.window?.showInactive();
      }, 100);
    });
    
    this.window.on('closed', () => {
      this.window = null;
    });
    
    // Auto close after 6 seconds (5 seconds display + 1 second for animations)
    setTimeout(() => {
      if (this.window) {
        this.window.close();
      }
    }, 6000);
  }
}