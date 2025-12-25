import { app, BrowserWindow, shell, Menu } from 'electron'
import path from 'node:path'

process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'true'

let mainWindow: BrowserWindow | null = null
const isDev = !!process.env.VITE_DEV_SERVER_URL
const isDev2 = !app.isPackaged

function getIconPath() {
  if (process.platform !== 'win32') return undefined
  if (isDev2) {
    return path.join(__dirname, '../build/icon.ico')
  }
  return path.join(process.resourcesPath, 'build', 'icon.ico')
}

function createWindow() {
  const iconPath = getIconPath()
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 800,
    minWidth: 1400,
    minHeight: 800,
    title: 'Fobos',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      sandbox: true
    },
    icon: iconPath,
    //autoHideMenuBar: true,
  })

  const isDev = !app.isPackaged
  const devUrl = process.env.VITE_DEV_SERVER_URL ?? 'http://localhost:5173'

  if (isDev) {
    mainWindow.loadURL(devUrl)
    mainWindow.webContents.openDevTools({ mode: 'detach' })
  } else {
    const indexPath = path.resolve(__dirname, '../dist/index.html')
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


