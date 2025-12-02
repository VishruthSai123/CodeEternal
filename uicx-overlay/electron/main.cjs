const { app, BrowserWindow, globalShortcut, ipcMain, screen, clipboard, Tray, Menu, nativeImage, session, shell } = require('electron');
const path = require('path');

let mainWindow = null;
let tray = null;
let isVisible = true;

// Determine if we're in development mode
const isDev = !app.isPackaged;

// Production URL - the deployed Vercel app
const PRODUCTION_URL = 'https://codeeternal.vercel.app';

function createWindow() {
  const { width: screenWidth, height: screenHeight } = screen.getPrimaryDisplay().workAreaSize;

  // Load app icon
  const appIcon = nativeImage.createFromPath(path.join(__dirname, '../assets/icon-rounded.png'));

  // Create the overlay window
  mainWindow = new BrowserWindow({
    width: 420,
    height: 700,
    x: screenWidth - 440,
    y: 100,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: true,
    skipTaskbar: false,
    hasShadow: true,
    icon: appIcon,
    vibrancy: 'ultra-dark',
    visualEffectState: 'active',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.cjs'),
      webSecurity: false, // Allow loading from Vercel with preload
    },
  });

  // Disable CORS for API requests (Gemini and Supabase)
  session.defaultSession.webRequest.onBeforeSendHeaders(
    { urls: ['https://generativelanguage.googleapis.com/*', 'https://*.supabase.co/*'] },
    (details, callback) => {
      callback({ requestHeaders: { ...details.requestHeaders } });
    }
  );

  session.defaultSession.webRequest.onHeadersReceived(
    { urls: ['https://generativelanguage.googleapis.com/*', 'https://*.supabase.co/*'] },
    (details, callback) => {
      callback({
        responseHeaders: {
          ...details.responseHeaders,
          'Access-Control-Allow-Origin': ['*'],
        },
      });
    }
  );

  // Load the app
  if (isDev) {
    // Development: use localhost for hot reload
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    // Production: load from Vercel for automatic updates
    // Users always get the latest version without reinstalling
    mainWindow.loadURL(PRODUCTION_URL);
    
    // Fallback to local files if offline
    mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
      console.log('Failed to load from web, falling back to local files:', errorDescription);
      mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
    });
  }

  // Set icon explicitly for Windows
  if (process.platform === 'win32') {
    mainWindow.setIcon(appIcon);
  }

  // Handle window close
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Prevent window from being closed, just hide it
  mainWindow.on('close', (event) => {
    if (!app.isQuitting) {
      event.preventDefault();
      mainWindow.hide();
      isVisible = false;
    }
  });
}

function createTray() {
  // Create tray icon
  const iconPath = path.join(__dirname, '../assets/icon-rounded.png');
  
  try {
    const icon = nativeImage.createFromPath(iconPath);
    tray = new Tray(icon.isEmpty() ? nativeImage.createEmpty() : icon);
  } catch {
    tray = new Tray(nativeImage.createEmpty());
  }

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show/Hide Code Eternal',
      click: () => toggleWindow(),
    },
    {
      label: 'Toggle Always on Top',
      click: () => {
        const current = mainWindow.isAlwaysOnTop();
        mainWindow.setAlwaysOnTop(!current);
      },
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        app.isQuitting = true;
        app.quit();
      },
    },
  ]);

  tray.setToolTip('Code Eternal');
  tray.setContextMenu(contextMenu);

  tray.on('click', () => toggleWindow());
}

function toggleWindow() {
  if (mainWindow) {
    if (isVisible) {
      mainWindow.hide();
      isVisible = false;
    } else {
      mainWindow.show();
      mainWindow.focus();
      isVisible = true;
    }
  }
}

function registerGlobalShortcuts() {
  // Toggle overlay visibility
  globalShortcut.register('CommandOrControl+Shift+U', () => {
    toggleWindow();
  });

  // Quick copy prompt
  globalShortcut.register('CommandOrControl+Shift+C', () => {
    if (mainWindow) {
      mainWindow.webContents.send('quick-copy-prompt');
    }
  });

  // Quick paste to editor
  globalShortcut.register('CommandOrControl+Shift+V', () => {
    if (mainWindow) {
      mainWindow.webContents.send('quick-paste-prompt');
    }
  });
}

// IPC Handlers
function setupIpcHandlers() {
  // Window controls
  ipcMain.on('window-minimize', () => {
    mainWindow?.minimize();
  });

  ipcMain.on('window-close', () => {
    mainWindow?.hide();
    isVisible = false;
  });

  ipcMain.on('window-toggle-pin', () => {
    if (mainWindow) {
      const isPinned = mainWindow.isAlwaysOnTop();
      mainWindow.setAlwaysOnTop(!isPinned);
      mainWindow.webContents.send('pin-state-changed', !isPinned);
    }
  });

  // Get current pin state
  ipcMain.handle('get-pin-state', () => {
    return mainWindow?.isAlwaysOnTop() ?? true;
  });

  // Refresh the page
  ipcMain.on('window-refresh', () => {
    if (mainWindow) {
      mainWindow.webContents.reload();
    }
  });

  // Clipboard operations
  ipcMain.handle('clipboard-write', (_, text) => {
    clipboard.writeText(text);
    return true;
  });

  ipcMain.handle('clipboard-read', () => {
    return clipboard.readText();
  });

  // Gemini API call handler - runs in main process to avoid CORS
  ipcMain.handle('gemini-generate', async (_, { apiKey, model, prompt }) => {
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || `API error: ${response.status}`);
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      return { success: true, text };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // Window positioning
  ipcMain.on('dock-left', () => {
    if (mainWindow) {
      const { height: screenHeight } = screen.getPrimaryDisplay().workAreaSize;
      mainWindow.setBounds({ x: 20, y: 100, width: 420, height: screenHeight - 200 });
    }
  });

  ipcMain.on('dock-right', () => {
    if (mainWindow) {
      const { width: screenWidth, height: screenHeight } = screen.getPrimaryDisplay().workAreaSize;
      mainWindow.setBounds({ x: screenWidth - 440, y: 100, width: 420, height: screenHeight - 200 });
    }
  });

  ipcMain.on('dock-float', () => {
    if (mainWindow) {
      const { width: screenWidth } = screen.getPrimaryDisplay().workAreaSize;
      mainWindow.setBounds({ x: screenWidth - 440, y: 100, width: 420, height: 700 });
    }
  });

  // Open external URLs (for OAuth)
  ipcMain.handle('open-external', async (_, url) => {
    try {
      await shell.openExternal(url);
      return { success: true };
    } catch (error) {
      console.error('Failed to open external URL:', error);
      return { success: false, error: error.message };
    }
  });
}

// App lifecycle
app.whenReady().then(() => {
  createWindow();
  createTray();
  registerGlobalShortcuts();
  setupIpcHandlers();

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

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

app.on('before-quit', () => {
  app.isQuitting = true;
});
