import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  onCountdownUpdate: (callback: (countdown: number) => void) => {
    ipcRenderer.on('update-countdown', (_event, countdown) => callback(countdown));
  },
  
  skip: () => {
    ipcRenderer.send('skip-twenty-twenty');
  },
});