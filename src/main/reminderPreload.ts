import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  onReminderData: (callback: (data: any) => void) => {
    ipcRenderer.on('reminder-data', (_event, data) => callback(data));
  },
});