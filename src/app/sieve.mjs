/*
 * The content of this file is licensed. You may obtain a copy of
 * the license at https://github.com/thsmi/sieve/ or request it via
 * email from the author.
 *
 * Do not remove or change this comment.
 *
 * The initial author of the code is:
 *   Thomas Schmid <schmid-thomas@gmx.net>
 */

 //{ app, Menu, BrowserWindow, ipcMain, dialog }
import path from 'path';
import url from 'url';

const DEFAULT_WINDOW_WIDTH = 1200;
const DEFAULT_WINDOW_HEIGHT = 600;

/**
 * Creates the main window
 */
function createWindow(electron) {

  const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

  let icon = undefined;
  if (process.platform === "linux")
    icon = path.join(__dirname, 'libs/icons/linux.png');

  // Create the browser window.
  let win = new electron.BrowserWindow({
    width: DEFAULT_WINDOW_WIDTH,
    height: DEFAULT_WINDOW_HEIGHT,
    icon: icon,
    webPreferences: {
      // nodeIntegrationInSubFrames: true,
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  // Hide the menu bar.
  win.removeMenu();

  // and load the index.html of the app.
  win.loadURL(url.format({
    pathname: path.join(__dirname, 'app.html'),
    protocol: 'file:',
    slashes: true
  }));

  // Open the DevTools.
  win.webContents.openDevTools();

  // Emitted when the window is closed.
  win.on('closed', () => {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    win = null;
  });

  // As suggested in https://github.com/electron/electron/issues/4068
  const inputMenu = electron.Menu.buildFromTemplate([
    { role: 'cut' },
    { role: 'copy' },
    { role: 'paste' }
  ]);

  win.webContents.on('context-menu', (e, props) => {
    const { isEditable } = props;
    if (isEditable) {
      inputMenu.popup(win);
    }
  });

  const handleRedirect = (e, uri) => {
    if (uri !== win.webContents.getURL()) {
      e.preventDefault();
      electron.shell.openExternal(uri);
    }
  };

  // win.webContents.on('will-navigate', handleRedirect);
  win.webContents.on('new-window', handleRedirect);
}

async function main(electron) {

  // Keep a global reference of the window object, if you don't, the window will
  // be closed automatically when the JavaScript object is garbage collected.
  let win;

  // ensure we are running as a singleton.
  const isLocked = electron.app.requestSingleInstanceLock();

  if (!isLocked) {
    console.log("Exiting app is locked");
    electron.app.quit();
    return;
  }

  electron.app.on('second-instance', () => {
    // Someone tried to run a second instance, we should focus our window.
    if (!win)
      return;

    if (win.isMinimized());
    win.restore();

    win.focus();
  });

  electron.ipcMain.handle("open-dialog", async(event, options) => {
    return await electron.dialog.showOpenDialog(options);
  });

  electron.ipcMain.handle("save-dialog", async(event, options) => {
    return await electron.dialog.showSaveDialog(options);
  });

  electron.ipcMain.handle("get-version", async() => {
    return await electron.app.getVersion();
  });

  electron.ipcMain.handle("open-developer-tools", () => {
    // Open the DevTools.
    win.webContents.openDevTools({
      "mode": "detach",
      "activate" : true
    });
  });

  electron.ipcMain.handle("reload-ui", () => {
    // Force reload...
    win.webContents.reloadIgnoringCache();
  });


  await electron.app.whenReady();

  createWindow(electron);

  // This method will be called when Electron has finished
  // initialization and is ready to create browser windows.
  // Some APIs can only be used after this event occurs.
  electron.app.on('ready', createWindow);

  // Quit when all windows are closed.
  electron.app.on('window-all-closed', () => {
    // On macOS it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
      electron.app.quit();
    }
  });

  electron.app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (win === null) {
      createWindow(electron);
    }
  });

  // In this file you can include the rest of your app's specific main process
  // code. You can also put them in separate files and require them here.

}

export {
  main
};
