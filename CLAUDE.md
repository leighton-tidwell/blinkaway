# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Essential Commands

- `npm run lint`: Run ESLint to check code style
- `npm run typecheck`: Run TypeScript type checking
- `npm run dev`: Start development server with debugging enabled
- `npm start`: Start the application (production mode)
- `npm run build`: Build the production app
- `npm run package`: Create packaged app
- `npm run make`: Create distributable files (DMG for macOS)

## Architecture Overview

BlinkAway is an Electron app with separate main and renderer processes:

**Main Process Architecture:**
- `src/main/main.ts`: Entry point, manages Tray, Menu, and window lifecycle
- `src/main/timerManager.ts`: Core timer logic, manages all reminder intervals and state persistence using electron-store
- `src/main/notificationWindow.ts`: Creates floating notification windows
- `src/main/reminderWindow.ts`: Handles blink and posture reminder windows
- `src/main/twentyTwentyWindow.ts`: Manages fullscreen 20-20-20 break windows

**Renderer Process Architecture:**
- Multi-window setup with Webpack entry points for each window type
- React components render in separate windows: main settings, notifications, reminders, and 20-20-20
- IPC communication between main and renderer processes for state management

**Build Configuration:**
- Uses Electron Forge with Webpack plugin
- Multiple renderer entry points defined in `forge.config.js`
- TypeScript for both main and renderer processes

## Key Architectural Patterns

1. **State Management**: Uses electron-store for persistent settings and timer states
2. **Window Management**: Each notification type has its own BrowserWindow class
3. **IPC Communication**: Main process handles all timer logic, renderers only display UI
4. **Menu Bar Integration**: Tray icon shows countdown to next break