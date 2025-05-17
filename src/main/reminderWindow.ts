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
    const { width, height } = display.workAreaSize;
    
    // Center the window - make it larger
    const windowWidth = 500;
    const windowHeight = 180;
    const x = Math.round((width - windowWidth) / 2);
    const y = Math.round((height - windowHeight) / 2);
    
    this.window = new BrowserWindow({
      width: windowWidth,
      height: windowHeight,
      x,
      y,
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
    });
    
    this.window.on('closed', () => {
      this.window = null;
    });
    
    this.window.showInactive();
    
    // Auto close after 3.5 seconds (to match the animation timing)
    setTimeout(() => {
      if (this.window) {
        this.window.close();
      }
    }, 3500);
  }
}