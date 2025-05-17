import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  onNotificationData: (callback: (data: any) => void) => {
    ipcRenderer.on('notification-data', (_event, data) => callback(data));
  },
});