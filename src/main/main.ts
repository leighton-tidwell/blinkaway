import { app, BrowserWindow, Tray, Menu, nativeImage, Notification } from 'electron';
import { join } from 'path';
import { format } from 'url';
import { TimerManager } from './timerManager';

declare const MAIN_WINDOW_WEBPACK_ENTRY: string;
declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string;

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let trayIcon: Electron.NativeImage;
let timerManager: TimerManager;

const createWindow = (): void => {
  console.log('Creating window...');
  mainWindow = new BrowserWindow({
    width: 450,
    height: 800,
    show: false,
    frame: true,
    resizable: false,
    webPreferences: {
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
      contextIsolation: true,
      nodeIntegration: false,
    },
    titleBarStyle: 'hiddenInset',
    vibrancy: 'popover',
    visualEffectState: 'active',
  });

  mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  mainWindow.on('blur', () => {
    if (mainWindow && !mainWindow.webContents.isDevToolsOpened()) {
      mainWindow.hide();
    }
  });
};

const updateTrayMenu = (): void => {
  if (!tray) return;
  
  const isPaused = timerManager?.isPaused() || false;
  
  const menuItems = [
    {
      label: 'Settings',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
        }
      },
    },
    {
      type: 'separator',
    },
  ];
  
  if (!isPaused) {
    // Get actual working hours status - default to false for both
    const isWorkingHoursEnabled = timerManager ? timerManager.hasWorkingHoursEnabled() : false;
    const isWithinWorkingHours = timerManager ? timerManager.isCurrentlyWithinWorkingHours() : false;
    
    menuItems.push(
      {
        label: 'Pause for 5 minutes',
        click: () => {
          if (timerManager) {
            timerManager.pause(5);
            updateTrayMenu();
          }
        },
      },
      {
        label: 'Pause for 15 minutes',
        click: () => {
          if (timerManager) {
            timerManager.pause(15);
            updateTrayMenu();
          }
        },
      },
      {
        label: 'Pause for 1 hour',
        click: () => {
          if (timerManager) {
            timerManager.pause(60);
            updateTrayMenu();
          }
        },
      },
      {
        label: 'Pause indefinitely',
        click: () => {
          if (timerManager) {
            timerManager.pause();
            updateTrayMenu();
          }
        },
      }
    );
    
    // Add "Pause until work starts" option if working hours are enabled and we're outside working hours
    console.log('Menu debug - Working hours enabled:', isWorkingHoursEnabled, 'Within hours:', isWithinWorkingHours);
    if (isWorkingHoursEnabled && !isWithinWorkingHours) {
      menuItems.push({
        label: 'Pause until work starts',
        click: () => {
          if (timerManager) {
            timerManager.pauseUntilWorkStarts();
            updateTrayMenu();
          }
        },
      });
    }
  } else {
    menuItems.push({
      label: 'Resume',
      click: () => {
        if (timerManager) {
          timerManager.resume();
          updateTrayMenu();
        }
      },
    });
  }
  
  menuItems.push(
    {
      type: 'separator',
    },
    {
      label: 'Debug: Trigger 20-20-20',
      click: () => {
        if (timerManager) {
          timerManager.triggerTwentyTwenty();
        }
      },
    },
    {
      label: 'Debug: Trigger Blink',
      click: () => {
        if (timerManager) {
          timerManager.triggerBlink();
        }
      },
    },
    {
      label: 'Debug: Trigger Posture',
      click: () => {
        if (timerManager) {
          timerManager.triggerPosture();
        }
      },
    },
    {
      label: 'Debug: Skip to 5 seconds',
      click: () => {
        if (timerManager) {
          timerManager.skipToLastSeconds(5);
        }
      },
    },
    {
      type: 'separator',
    },
    {
      label: 'Quit',
      click: () => {
        app.quit();
      },
    }
  );
  
  const contextMenu = Menu.buildFromTemplate(menuItems);
  tray.setContextMenu(contextMenu);
};

const createTray = (): void => {
  console.log('Creating tray...');
  
  // Create a default icon using dataURL if file doesn't exist
  const defaultIcon = nativeImage.createFromDataURL('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==');
  
  const iconPath = join(__dirname, '../../assets/menubar-icon.png');
  console.log('Looking for icon at:', iconPath);
  
  trayIcon = nativeImage.createFromPath(iconPath);
  
  // Use default icon if the file icon is empty
  if (trayIcon.isEmpty()) {
    console.log('Icon not found, using default');
    trayIcon = defaultIcon;
  }
  
  trayIcon = trayIcon.resize({ width: 16, height: 16 });
  
  try {
    tray = new Tray(trayIcon);
    console.log('Tray created successfully');
    tray.setToolTip('BlinkAway');
    console.log('Tray tooltip set');
  } catch (error) {
    console.error('Error creating tray:', error);
  }
  
  updateTrayMenu();
  
  tray.on('click', () => {
    // Do nothing on click - only show menu
    tray.popUpContextMenu();
  });
};

app.whenReady().then(() => {
  console.log('App is ready');
  createWindow();
  console.log('Window created');
  createTray();
  console.log('Tray created');
  
  try {
    timerManager = new TimerManager();
    console.log('Timer manager created');
    timerManager.setTray(tray!);
    console.log('Timer manager tray set');
    timerManager.start();
    console.log('Timer manager started');
    updateTrayMenu(); // Update menu after timerManager is created
  } catch (error) {
    console.error('Error with timer manager:', error);
  }
  
  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });
  
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('before-quit', () => {
  if (tray) {
    tray.destroy();
  }
});