import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  onInitialState: (callback: (state: { countdown: number; message: string }) => void) => {
    ipcRenderer.on('initial-state', (_event, state) => callback(state));
  },
  
  onCountdownUpdate: (callback: (countdown: number) => void) => {
    ipcRenderer.on('update-countdown', (_event, countdown) => callback(countdown));
  },
  
  skip: () => {
    ipcRenderer.send('skip-twenty-twenty');
  },
});