import { ipcMain, Notification, Tray } from 'electron';
import Store from 'electron-store';
import { ReminderWindow } from './reminderWindow';
import { TwentyTwentyWindow } from './twentyTwentyWindow';

interface TimerState {
  twentyTwentyInterval: number;
  blinkInterval: number;
  postureInterval: number;
  isEnabled: boolean;
  nextTwentyTwenty: number;
  nextBlink: number;
  nextPosture: number;
}

export class TimerManager {
  private store: Store<TimerState>;
  private timers: Map<string, NodeJS.Timeout> = new Map();
  private tray: Tray | null = null;
  private countdownInterval: NodeJS.Timeout | null = null;
  private reminderWindow: ReminderWindow;
  private twentyTwentyWindow: TwentyTwentyWindow;
  private isTwentyTwentyActive: boolean = false;
  
  constructor() {
    this.store = new Store<TimerState>({
      defaults: {
        twentyTwentyInterval: 20,
        blinkInterval: 5,
        postureInterval: 30,
        isEnabled: true,
        nextTwentyTwenty: Date.now() + 20 * 60 * 1000,
        nextBlink: Date.now() + 5 * 60 * 1000,
        nextPosture: Date.now() + 30 * 60 * 1000,
      },
    });
    
    this.reminderWindow = new ReminderWindow();
    this.twentyTwentyWindow = new TwentyTwentyWindow();
    this.setupIPCHandlers();
    
    // Initialize times if they're in the past
    const now = Date.now();
    if (this.store.get('nextTwentyTwenty') < now) {
      this.store.set('nextTwentyTwenty', now + this.store.get('twentyTwentyInterval') * 60 * 1000);
    }
    if (this.store.get('nextBlink') < now) {
      this.store.set('nextBlink', now + this.store.get('blinkInterval') * 60 * 1000);
    }
    if (this.store.get('nextPosture') < now) {
      this.store.set('nextPosture', now + this.store.get('postureInterval') * 60 * 1000);
    }
  }
  
  setTray(tray: Tray) {
    this.tray = tray;
    this.updateTrayTitle();
  }
  
  start() {
    const state = this.store.store;
    if (!state.isEnabled) return;
    
    this.startTwentyTwentyTimer();
    this.startBlinkTimer();
    this.startPostureTimer();
    this.startCountdownUpdater();
  }
  
  stop() {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
      this.countdownInterval = null;
    }
    
    this.updateTrayTitle();
  }
  
  private startTwentyTwentyTimer() {
    // Timer logic is now handled by checkTimers() which runs every second
    // This method is kept for consistency with other timers
  }
  
  private startBlinkTimer() {
    // Timer logic is now handled by checkTimers() which runs every second
  }
  
  private startPostureTimer() {
    // Timer logic is now handled by checkTimers() which runs every second
  }
  
  private startCountdownUpdater() {
    this.countdownInterval = setInterval(() => {
      this.updateTrayTitle();
      this.checkTimers();
    }, 1000);
  }
  
  private updateTrayTitle(customTitle?: string) {
    if (!this.tray) return;
    
    if (customTitle) {
      this.tray.setTitle(customTitle);
      return;
    }
    
    if (!this.store.get('isEnabled')) {
      this.tray.setTitle('💤');
      return;
    }
    
    if (this.isTwentyTwentyActive) {
      // Don't update countdown while 20-20-20 is active
      return;
    }
    
    const now = Date.now();
    const nextTwentyTwenty = this.store.get('nextTwentyTwenty');
    const timeRemaining = Math.max(0, nextTwentyTwenty - now);
    
    const minutes = Math.floor(timeRemaining / 60000);
    const seconds = Math.floor((timeRemaining % 60000) / 1000);
    
    this.tray.setTitle(`👁️ ${minutes}:${seconds.toString().padStart(2, '0')}`);
  }
  
  private checkTimers() {
    if (!this.store.get('isEnabled')) return;
    
    // Skip all timer checks if 20-20-20 is active
    if (this.isTwentyTwentyActive) return;
    
    const now = Date.now();
    const nextTwentyTwenty = this.store.get('nextTwentyTwenty');
    const nextBlink = this.store.get('nextBlink');
    const nextPosture = this.store.get('nextPosture');
    
    // Check if it's time for 20-20-20
    if (now >= nextTwentyTwenty) {
      const interval = this.store.get('twentyTwentyInterval') * 60 * 1000;
      this.isTwentyTwentyActive = true;
      // Set the next time to be from when the overlay completes
      this.updateTrayTitle('🥰 0:20');
      this.twentyTwentyWindow.show(
        () => {
          // Set next time from NOW when overlay completes
          this.store.set('nextTwentyTwenty', Date.now() + interval);
          this.isTwentyTwentyActive = false;
          this.updateTrayTitle();
        },
        (seconds) => {
          this.updateTrayTitle(`🥰 0:${seconds.toString().padStart(2, '0')}`);
        }
      );
    }
    
    // Check if it's time for blink reminder
    if (now >= nextBlink) {
      const interval = this.store.get('blinkInterval') * 60 * 1000;
      this.store.set('nextBlink', now + interval);
      this.reminderWindow.show('blink', '');
    }
    
    // Check if it's time for posture reminder
    if (now >= nextPosture) {
      const interval = this.store.get('postureInterval') * 60 * 1000;
      this.store.set('nextPosture', now + interval);
      this.reminderWindow.show('posture', '');
    }
  }
  
  
  pause(minutes?: number) {
    this.store.set('isEnabled', false);
    this.stop();
    this.updateTrayTitle('💤');
    
    // If minutes is provided, auto-resume after that time
    if (minutes) {
      setTimeout(() => {
        this.store.set('isEnabled', true);
        this.start();
      }, minutes * 60 * 1000);
    }
  }
  
  resume() {
    this.store.set('isEnabled', true);
    this.start();
  }
  
  triggerTwentyTwenty() {
    const interval = this.store.get('twentyTwentyInterval') * 60 * 1000;
    this.isTwentyTwentyActive = true;
    this.updateTrayTitle('🥰 0:20');
    this.twentyTwentyWindow.show(
      () => {
        // Set next time from NOW when overlay completes
        this.store.set('nextTwentyTwenty', Date.now() + interval);
        this.isTwentyTwentyActive = false;
        this.updateTrayTitle();
      },
      (seconds) => {
        this.updateTrayTitle(`🥰 0:${seconds.toString().padStart(2, '0')}`);
      }
    );
  }
  
  triggerBlink() {
    const interval = this.store.get('blinkInterval') * 60 * 1000;
    this.reminderWindow.show('blink', '');
    this.store.set('nextBlink', Date.now() + interval);
  }
  
  triggerPosture() {
    const interval = this.store.get('postureInterval') * 60 * 1000;
    this.reminderWindow.show('posture', '');
    this.store.set('nextPosture', Date.now() + interval);
  }
  
  skipToLastSeconds(seconds: number) {
    // Set the next twenty-twenty time to be 'seconds' seconds from now
    this.store.set('nextTwentyTwenty', Date.now() + (seconds * 1000));
    this.updateTrayTitle();
  }
  
  isPaused(): boolean {
    return !this.store.get('isEnabled');
  }
  
  private setupIPCHandlers() {
    ipcMain.on('skip-twenty-twenty', () => {
      this.twentyTwentyWindow.skip();
    });
    
    ipcMain.on('pause-reminders', (_event, duration: number) => {
      this.stop();
      if (duration > 0) {
        setTimeout(() => {
          if (this.store.get('isEnabled')) {
            this.start();
          }
        }, duration * 60 * 1000);
      }
    });
    
    ipcMain.on('resume-reminders', () => {
      this.store.set('isEnabled', true);
      this.start();
    });
    
    ipcMain.on('update-reminder-settings', (_event, settings: Partial<TimerState>) => {
      Object.keys(settings).forEach(key => {
        this.store.set(key as keyof TimerState, settings[key as keyof TimerState]);
      });
      
      if (settings.hasOwnProperty('isEnabled')) {
        if (settings.isEnabled) {
          this.start();
        } else {
          this.stop();
        }
      } else {
        this.stop();
        this.start();
      }
    });
    
    ipcMain.handle('get-reminder-settings', () => {
      return this.store.store;
    });
  }
}