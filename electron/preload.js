const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
    versions: process.versions,

    // Auto-update API
    checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
    installUpdate: () => ipcRenderer.invoke('install-update'),
    getAppVersion: () => ipcRenderer.invoke('get-app-version'),

    onUpdateStatus: (callback) => {
        const handler = (event, data) => callback(data);
        ipcRenderer.on('update-status', handler);
        // Return cleanup function
        return () => ipcRenderer.removeListener('update-status', handler);
    },

    // Music Player API
    getBundledMusic: () => ipcRenderer.invoke('get-bundled-music'),
});
