import { BrowserWindow, screen } from 'electron';
import { join } from 'path';

declare const REMINDER_WINDOW_WEBPACK_ENTRY: string | undefined;
declare const REMINDER_WINDOW_PRELOAD_WEBPACK_ENTRY: string | undefined;

export class ReminderWindow {
  private windows: BrowserWindow[] = [];
  
  show(type: 'blink' | 'posture', message: string) {
    // Close existing windows
    this.windows.forEach(window => window.destroy());
    this.windows = [];
    
    // Get all displays
    const displays = screen.getAllDisplays();
    
    // Create a window for each display
    displays.forEach(display => {
      const { bounds } = display;
      
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
        window.loadURL(REMINDER_WINDOW_WEBPACK_ENTRY);
      } else {
        window.loadFile(join(__dirname, '../../public/reminder.html'));
      }
      
      window.setAlwaysOnTop(true, 'floating');
      window.setIgnoreMouseEvents(true);
      
      window.webContents.on('did-finish-load', () => {
        window.webContents.send('reminder-data', { type, message });
        // Show window after content loads to prevent glitchy animation
        setTimeout(() => {
          window.showInactive();
        }, 100);
      });
      
      window.on('closed', () => {
        const index = this.windows.indexOf(window);
        if (index > -1) {
          this.windows.splice(index, 1);
        }
      });
      
      this.windows.push(window);
    });
    
    // Auto close all windows after 6 seconds (5 seconds display + 1 second for animations)
    setTimeout(() => {
      this.windows.forEach(window => {
        if (!window.isDestroyed()) {
          window.close();
        }
      });
    }, 6000);
  }
}