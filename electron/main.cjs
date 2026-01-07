const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { autoUpdater } = require('electron-updater');

const isDev = !app.isPackaged;

// Configure auto-updater
autoUpdater.autoDownload = true;
autoUpdater.autoInstallOnAppQuit = true;

let mainWindow = null;

function sendUpdateStatus(status, data = {}) {
    if (mainWindow && mainWindow.webContents) {
        mainWindow.webContents.send('update-status', { status, ...data });
    }
}

function setupAutoUpdater() {
    if (isDev) {
        console.log('Auto-updater disabled in development mode');
        return;
    }

    autoUpdater.on('checking-for-update', () => {
        console.log('Checking for updates...');
        sendUpdateStatus('checking');
    });

    autoUpdater.on('update-available', (info) => {
        console.log('Update available:', info.version);
        sendUpdateStatus('available', { version: info.version });
    });

    autoUpdater.on('update-not-available', (info) => {
        console.log('No update available');
        sendUpdateStatus('not-available', { version: info.version });
    });

    autoUpdater.on('download-progress', (progress) => {
        console.log(`Download progress: ${Math.round(progress.percent)}%`);
        sendUpdateStatus('downloading', {
            percent: Math.round(progress.percent),
            transferred: progress.transferred,
            total: progress.total
        });
    });

    autoUpdater.on('update-downloaded', (info) => {
        console.log('Update downloaded:', info.version);
        sendUpdateStatus('ready', { version: info.version });
    });

    autoUpdater.on('error', (error) => {
        console.error('Auto-updater error:', error.message);
        sendUpdateStatus('error', { message: error.message });
    });

    // Check for updates after a short delay
    setTimeout(() => {
        autoUpdater.checkForUpdates().catch(err => {
            console.log('Update check failed:', err.message);
        });
    }, 3000);
}

// IPC handlers for manual update control
ipcMain.handle('check-for-updates', async () => {
    if (isDev) {
        return { status: 'dev-mode' };
    }
    try {
        const result = await autoUpdater.checkForUpdates();
        return { status: 'checking', version: result?.updateInfo?.version };
    } catch (error) {
        return { status: 'error', message: error.message };
    }
});

ipcMain.handle('install-update', () => {
    autoUpdater.quitAndInstall(false, true);
});

ipcMain.handle('get-app-version', () => {
    return app.getVersion();
});

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1280,
        height: 800,
        minWidth: 900,
        minHeight: 600,
        title: 'Eunoia.so',
        icon: path.join(__dirname, 'icon.ico'),
        backgroundColor: '#1c1917',
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        },
        titleBarStyle: 'hidden',
        titleBarOverlay: {
            color: '#1c1917',
            symbolColor: '#e7e5e4',
            height: 32
        }
    });

    mainWindow.setMenuBarVisibility(false);

    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        if (url.startsWith('https:') || url.startsWith('http:')) {
            require('electron').shell.openExternal(url);
            return { action: 'deny' };
        }
        return { action: 'allow' };
    });

    if (isDev) {
        mainWindow.loadURL('http://localhost:5173');
        mainWindow.webContents.openDevTools({ mode: 'detach' });
    } else {
        mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
    }

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

app.whenReady().then(() => {
    createWindow();
    setupAutoUpdater();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
