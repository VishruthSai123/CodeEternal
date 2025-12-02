const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods to the renderer process
contextBridge.exposeInMainWorld('electron', {
  // Window controls
  minimize: () => ipcRenderer.send('window-minimize'),
  close: () => ipcRenderer.send('window-close'),
  togglePin: () => ipcRenderer.send('window-toggle-pin'),
  refresh: () => ipcRenderer.send('window-refresh'),
  
  // Get pin state
  getPinState: () => ipcRenderer.invoke('get-pin-state'),

  // Clipboard
  copyToClipboard: (text) => ipcRenderer.invoke('clipboard-write', text),
  readFromClipboard: () => ipcRenderer.invoke('clipboard-read'),

  // Gemini API (runs in main process to avoid CORS)
  geminiGenerate: (apiKey, model, prompt) => 
    ipcRenderer.invoke('gemini-generate', { apiKey, model, prompt }),

  // Open external URL (for OAuth)
  openExternal: (url) => ipcRenderer.invoke('open-external', url),

  // Docking
  dockLeft: () => ipcRenderer.send('dock-left'),
  dockRight: () => ipcRenderer.send('dock-right'),
  dockFloat: () => ipcRenderer.send('dock-float'),

  // Event listeners
  onQuickCopyPrompt: (callback) => {
    ipcRenderer.on('quick-copy-prompt', callback);
    return () => ipcRenderer.removeListener('quick-copy-prompt', callback);
  },

  onQuickPastePrompt: (callback) => {
    ipcRenderer.on('quick-paste-prompt', callback);
    return () => ipcRenderer.removeListener('quick-paste-prompt', callback);
  },

  onPinStateChanged: (callback) => {
    const handler = (_, isPinned) => callback(isPinned);
    ipcRenderer.on('pin-state-changed', handler);
    return () => ipcRenderer.removeListener('pin-state-changed', handler);
  },
});

// Expose platform info
contextBridge.exposeInMainWorld('platform', {
  isWindows: process.platform === 'win32',
  isMac: process.platform === 'darwin',
  isLinux: process.platform === 'linux',
});
