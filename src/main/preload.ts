import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  notifyUser: (title: string, body: string) => {
    ipcRenderer.send('notify-user', { title, body });
  },
  
  getReminderSettings: () => {
    return ipcRenderer.invoke('get-reminder-settings');
  },
  
  updateReminderSettings: (settings: any) => {
    ipcRenderer.send('update-reminder-settings', settings);
  },
  
  pauseReminders: (duration: number) => {
    ipcRenderer.send('pause-reminders', duration);
  },
  
  resumeReminders: () => {
    ipcRenderer.send('resume-reminders');
  },
});