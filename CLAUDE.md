# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Essential Commands

Development:
- `npm install`: Install all dependencies
- `npm run dev`: Start development server with debugging enabled (includes stack dumping and logging)
- `npm start`: Start the application in production mode

Code Quality:
- `npm run lint`: Run ESLint to check code style (uses TypeScript ESLint)
- `npm run typecheck`: Run TypeScript type checking with no emit

Build & Distribution:
- `npm run build`: Build the production app and create DMG
- `npm run package`: Create packaged app without distributables
- `npm run make`: Create distributable files for all platforms (DMG, Squirrel, DEB, RPM)

## Architecture Overview

BlinkAway is an Electron application that helps users maintain healthy screen habits through reminders for blinking, posture, and the 20-20-20 rule.

**Core Architecture Components:**

1. **Multi-Process Design**:
   - Main process handles all business logic, timer management, and window lifecycle
   - Renderer processes only handle UI rendering and user interactions
   - Communication via Electron IPC with typed channels

2. **Window System**:
   - Main window: Settings and controls interface
   - Notification window: Floating translucent popups for quick reminders
   - Reminder window: Modal dialogs for blink and posture checks
   - Twenty-twenty window: Fullscreen overlay for 20-20-20 rule breaks

3. **Timer Management**:
   - `timerManager.ts` centralizes all timer logic with configurable intervals
   - Uses electron-store for persistence across app restarts
   - Updates menu bar tray icon with real-time countdown

**Webpack Configuration:**
- Multiple entry points defined in `forge.config.js` for each window type
- Separate preload scripts for each window to maintain security isolation
- TypeScript loader for both main and renderer processes

## Key Technical Patterns

1. **State Persistence**: All settings and timer states persisted via electron-store
2. **Preload Scripts**: Each window type has dedicated preload script for secure IPC
3. **Menu Bar App**: Lives primarily in macOS menu bar with tray icon
4. **Window Positioning**: Notification windows positioned strategically on screen
5. **React Components**: Renderer UI built with React functional components