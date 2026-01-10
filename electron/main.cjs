const { app, BrowserWindow, ipcMain, dialog, protocol, net } = require('electron');
const path = require('path');
const fs = require('fs');
const { autoUpdater } = require('electron-updater');

// Register Custom Protocol for safe local file streaming
protocol.registerSchemesAsPrivileged([
    { scheme: 'music', privileges: { bypassCSP: true, stream: true, supportFetchAPI: true } }
]);

// isDev is defined at the top
const isDev = !app.isPackaged;

// Music Player IPC
ipcMain.handle('get-bundled-music', async () => {
    try {
        const MUSIC_PATH = isDev
            ? path.join(__dirname, '../public/music')
            : path.join(process.resourcesPath, 'music');

        // Ensure directory exists
        if (!fs.existsSync(MUSIC_PATH)) {
            console.log("Music path not found:", MUSIC_PATH);
            return [];
        }

        const files = await fs.promises.readdir(MUSIC_PATH);
        const audioFiles = files.filter(file => {
            const ext = path.extname(file).toLowerCase();
            return ['.mp3', '.wav', '.ogg', '.m4a'].includes(ext);
        });
        console.log("Found music files:", audioFiles);
        return audioFiles;
    } catch (error) {
        console.error("Error reading music folder:", error);
        return [];
    }
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
            preload: path.join(__dirname, 'preload.js'),
            webSecurity: true // Keep security enabled!
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
    // Handle music:// protocol
    protocol.handle('music', (request) => {
        const url = request.url.replace('music://', '');
        const filename = decodeURIComponent(url);

        const MUSIC_PATH = isDev
            ? path.join(__dirname, '../public/music')
            : path.join(process.resourcesPath, 'music');

        // Construct full path safely
        const fullPath = path.join(MUSIC_PATH, filename);

        // Basic security check to prevent directory traversal
        if (!fullPath.startsWith(MUSIC_PATH)) {
            return new Response('Forbidden', { status: 403 });
        }

        return net.fetch('file://' + fullPath);
    });

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
