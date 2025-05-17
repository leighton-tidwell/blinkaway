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
  workingHoursEnabled: boolean;
  workingHoursStart: string; // Format: "HH:MM"
  workingHoursEnd: string; // Format: "HH:MM"
  manuallyResumedOutsideHours: boolean;
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
        workingHoursEnabled: false,
        workingHoursStart: "09:00",
        workingHoursEnd: "17:00",
        manuallyResumedOutsideHours: false,
      },
    });
    
    this.reminderWindow = new ReminderWindow();
    this.twentyTwentyWindow = new TwentyTwentyWindow();
    this.setupIPCHandlers();
    
    // Initialize times with proper offsets if they're in the past
    this.initializeTimersWithOffsets();
    
    // Start working hours checker
    this.startWorkingHoursChecker();
  }
  
  private initializeTimersWithOffsets() {
    const now = Date.now();
    const twentyTwentyInterval = this.store.get('twentyTwentyInterval') * 60 * 1000;
    const blinkInterval = this.store.get('blinkInterval') * 60 * 1000;
    const postureInterval = this.store.get('postureInterval') * 60 * 1000;
    
    // Calculate offsets to prevent overlaps
    // Blink timer gets a 1-minute offset
    const blinkOffset = 60 * 1000; // 1 minute
    // Posture timer gets a 2-minute offset
    const postureOffset = 2 * 60 * 1000; // 2 minutes
    
    // Initialize or reset timers if they're in the past
    if (this.store.get('nextTwentyTwenty') < now) {
      this.store.set('nextTwentyTwenty', now + twentyTwentyInterval);
    }
    
    if (this.store.get('nextBlink') < now) {
      // Add offset to blink timer to avoid overlap with 20-20-20
      this.store.set('nextBlink', now + blinkInterval + blinkOffset);
    }
    
    if (this.store.get('nextPosture') < now) {
      // Add offset to posture timer to avoid overlap with both other timers
      this.store.set('nextPosture', now + postureInterval + postureOffset);
    }
    
    // Check if any timers would overlap and adjust them
    this.preventTimerOverlaps();
  }
  
  private preventTimerOverlaps() {
    const nextTwentyTwenty = this.store.get('nextTwentyTwenty');
    const nextBlink = this.store.get('nextBlink');
    const nextPosture = this.store.get('nextPosture');
    const blinkInterval = this.store.get('blinkInterval') * 60 * 1000;
    const postureInterval = this.store.get('postureInterval') * 60 * 1000;
    
    // Define a buffer time (1 minute) to consider as overlap
    const bufferTime = 60 * 1000;
    
    // Check if blink timer is too close to 20-20-20 timer
    if (Math.abs(nextBlink - nextTwentyTwenty) < bufferTime) {
      // Move blink timer forward by 1 minute
      this.store.set('nextBlink', nextBlink + bufferTime);
    }
    
    // Check if posture timer is too close to either timer
    if (Math.abs(nextPosture - nextTwentyTwenty) < bufferTime || 
        Math.abs(nextPosture - nextBlink) < bufferTime) {
      // Move posture timer forward by 2 minutes
      this.store.set('nextPosture', nextPosture + 2 * bufferTime);
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
      // Check if we're outside working hours to show appropriate icon
      if (this.store.get('workingHoursEnabled') && !this.isWithinWorkingHours()) {
        this.tray.setTitle('🌙');
      } else {
        this.tray.setTitle('💤');
      }
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
      let newNextBlink = now + interval;
      
      // Check if new blink time would overlap with next 20-20-20
      const nextTwentyTime = this.store.get('nextTwentyTwenty');
      if (Math.abs(newNextBlink - nextTwentyTime) < 60 * 1000) {
        newNextBlink += 60 * 1000; // Add 1 minute offset
      }
      
      this.store.set('nextBlink', newNextBlink);
      this.reminderWindow.show('blink', '');
    }
    
    // Check if it's time for posture reminder
    if (now >= nextPosture) {
      const interval = this.store.get('postureInterval') * 60 * 1000;
      let newNextPosture = now + interval;
      
      // Check if new posture time would overlap with other timers
      const nextTwentyTime = this.store.get('nextTwentyTwenty');
      const nextBlinkTime = this.store.get('nextBlink');
      
      if (Math.abs(newNextPosture - nextTwentyTime) < 60 * 1000 || 
          Math.abs(newNextPosture - nextBlinkTime) < 60 * 1000) {
        newNextPosture += 2 * 60 * 1000; // Add 2 minute offset
      }
      
      this.store.set('nextPosture', newNextPosture);
      this.reminderWindow.show('posture', '');
    }
  }
  
  
  pause(minutes?: number) {
    this.store.set('isEnabled', false);
    this.stop();
    this.updateTrayTitle();
    
    // Reset manual resume flag when pausing
    this.store.set('manuallyResumedOutsideHours', false);
    
    // If minutes is provided, auto-resume after that time
    if (minutes) {
      setTimeout(() => {
        this.store.set('isEnabled', true);
        this.start();
      }, minutes * 60 * 1000);
    }
  }
  
  pauseUntilWorkStarts() {
    this.store.set('isEnabled', false);
    this.stop();
    this.updateTrayTitle();
    this.store.set('manuallyResumedOutsideHours', false);
    
    // Calculate time until work starts
    const now = new Date();
    const [startHour, startMinute] = this.store.get('workingHoursStart').split(':').map(Number);
    
    let startTime = new Date();
    startTime.setHours(startHour, startMinute, 0, 0);
    
    // If start time has already passed today, set it for tomorrow
    if (startTime <= now) {
      startTime.setDate(startTime.getDate() + 1);
    }
    
    const msUntilStart = startTime.getTime() - now.getTime();
    
    setTimeout(() => {
      this.store.set('isEnabled', true);
      this.start();
    }, msUntilStart);
  }
  
  resume() {
    this.store.set('isEnabled', true);
    
    // Check if resuming outside working hours
    if (this.store.get('workingHoursEnabled') && !this.isWithinWorkingHours()) {
      this.store.set('manuallyResumedOutsideHours', true);
    }
    
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
    
    let newNextBlink = Date.now() + interval;
    const nextTwentyTime = this.store.get('nextTwentyTwenty');
    
    // Check if new blink time would overlap with next 20-20-20
    if (Math.abs(newNextBlink - nextTwentyTime) < 60 * 1000) {
      newNextBlink += 60 * 1000; // Add 1 minute offset
    }
    
    this.store.set('nextBlink', newNextBlink);
  }
  
  triggerPosture() {
    const interval = this.store.get('postureInterval') * 60 * 1000;
    this.reminderWindow.show('posture', '');
    
    let newNextPosture = Date.now() + interval;
    const nextTwentyTime = this.store.get('nextTwentyTwenty');
    const nextBlinkTime = this.store.get('nextBlink');
    
    // Check if new posture time would overlap with other timers
    if (Math.abs(newNextPosture - nextTwentyTime) < 60 * 1000 || 
        Math.abs(newNextPosture - nextBlinkTime) < 60 * 1000) {
      newNextPosture += 2 * 60 * 1000; // Add 2 minute offset
    }
    
    this.store.set('nextPosture', newNextPosture);
  }
  
  skipToLastSeconds(seconds: number) {
    // Set the next twenty-twenty time to be 'seconds' seconds from now
    this.store.set('nextTwentyTwenty', Date.now() + (seconds * 1000));
    this.updateTrayTitle();
  }
  
  isPaused(): boolean {
    return !this.store.get('isEnabled');
  }
  
  hasWorkingHoursEnabled(): boolean {
    return this.store.get('workingHoursEnabled');
  }
  
  isCurrentlyWithinWorkingHours(): boolean {
    return this.isWithinWorkingHours();
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
      
      // If intervals have changed, reset timers with proper offsets
      if (settings.twentyTwentyInterval || settings.blinkInterval || settings.postureInterval) {
        const now = Date.now();
        
        if (settings.twentyTwentyInterval) {
          this.store.set('nextTwentyTwenty', now + settings.twentyTwentyInterval * 60 * 1000);
        }
        
        if (settings.blinkInterval) {
          // Add 1-minute offset to blink timer
          this.store.set('nextBlink', now + settings.blinkInterval * 60 * 1000 + 60 * 1000);
        }
        
        if (settings.postureInterval) {
          // Add 2-minute offset to posture timer
          this.store.set('nextPosture', now + settings.postureInterval * 60 * 1000 + 2 * 60 * 1000);
        }
        
        // Prevent any overlaps after updating
        this.preventTimerOverlaps();
      }
      
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
  
  private isWithinWorkingHours(): boolean {
    if (!this.store.get('workingHoursEnabled')) {
      return true; // If working hours are disabled, always consider it working time
    }
    
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTime = currentHour * 60 + currentMinute; // Convert to minutes since midnight
    
    const [startHour, startMinute] = this.store.get('workingHoursStart').split(':').map(Number);
    const [endHour, endMinute] = this.store.get('workingHoursEnd').split(':').map(Number);
    
    const startTime = startHour * 60 + startMinute;
    const endTime = endHour * 60 + endMinute;
    
    // Handle cases where end time is before start time (e.g., night shift)
    if (endTime < startTime) {
      return currentTime >= startTime || currentTime < endTime;
    }
    
    return currentTime >= startTime && currentTime < endTime;
  }
  
  private startWorkingHoursChecker() {
    // Check immediately on startup
    this.checkWorkingHours();
    
    // Then check every minute
    setInterval(() => {
      this.checkWorkingHours();
    }, 60 * 1000); // Check every minute
  }
  
  private checkWorkingHours() {
    const isEnabled = this.store.get('isEnabled');
    const isWithinHours = this.isWithinWorkingHours();
    
    if (this.store.get('workingHoursEnabled')) {
      if (isWithinHours && !isEnabled) {
        // Auto-resume at start of working hours
        this.store.set('isEnabled', true);
        this.start();
        this.updateTrayTitle();
        
        // Reset manual resume flag when entering working hours
        this.store.set('manuallyResumedOutsideHours', false);
      } else if (!isWithinHours && isEnabled) {
        // Only auto-pause if not manually resumed
        if (!this.store.get('manuallyResumedOutsideHours')) {
          this.store.set('isEnabled', false);
          this.stop();
          this.updateTrayTitle();
        }
      }
    }
  }
}