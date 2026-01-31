import { app, BrowserWindow, shell, Menu } from 'electron';
import { ELECTRON_CONSTANTS } from './electron.constants';
import path from 'node:path';

process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'true';

let mainWindow: BrowserWindow | null = null;
const isDev = !app.isPackaged;
const devUrl = process.env.VITE_DEV_SERVER_URL ?? ELECTRON_CONSTANTS.DEV_URL;

function getIconPath() {
  if (process.platform !== 'win32') return undefined;
  if (isDev) {
    return path.join(__dirname, ELECTRON_CONSTANTS.DEV_ICON_PATH)
  }
  return path.join(process.resourcesPath, 'build', 'icon.ico')
}

function createWindow() {
  const iconPath = getIconPath()
  mainWindow = new BrowserWindow({
    width: ELECTRON_CONSTANTS.WINDOW_WIDTH,
    height: ELECTRON_CONSTANTS.WINDOW_HEIGHT,
    minWidth: ELECTRON_CONSTANTS.MIN_WINDOW_WIDTH,
    minHeight: ELECTRON_CONSTANTS.MIN_WINDOW_HEIGHT,
    title: ELECTRON_CONSTANTS.APP_TITLE,
    webPreferences: {
      preload: path.join(__dirname, ELECTRON_CONSTANTS.PRELOAD_FILE),
      contextIsolation: ELECTRON_CONSTANTS.CONTEXT_ISOLATION,
      sandbox: ELECTRON_CONSTANTS.SANDBOX
    },
    icon: iconPath,
    //autoHideMenuBar: ELECTRON_CONSTANTS.AUTOHIDE_MENU_BAR,
  })

  if (isDev) {
    mainWindow.loadURL(devUrl)
    mainWindow.webContents.openDevTools({ mode: 'detach' })
  } else {
    const indexPath = path.resolve(__dirname, ELECTRON_CONSTANTS.BUILD_INDEX_PATH)
    mainWindow.loadFile(indexPath)
  }

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  mainWindow.on('closed', () => (mainWindow = null))
}

//app.whenReady().then(createWindow)
app.whenReady().then(() => {
  //Menu.setApplicationMenu(null)
  createWindow()
})
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit() })
app.on('activate', () => { if (!mainWindow) createWindow() })


