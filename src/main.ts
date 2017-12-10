import { app, BrowserWindow, ipcMain} from "electron";
import * as path from "path";
import * as url from "url";
import  Logger from "./logger";

const log = new Logger();

let mainWindow: Electron.BrowserWindow;
let pickerDialog: Electron.BrowserWindow;

function createWindow() {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    height: 200,
    width: 320,
  });

  pickerDialog = new BrowserWindow({
      parent: mainWindow,
      skipTaskbar: true,
      modal: true,
      show: false,
      height: 487,
      width : 600,
  });

  // and load the index.html of the app.
  mainWindow.loadURL(url.format({
      pathname: path.join(__dirname, "../index.html"),
      protocol: "file:",
      slashes: true,
  }));

  pickerDialog.loadURL(url.format({
      pathname: path.join(__dirname, "../picker.html"),
      protocol: "file:",
      slashes: true,
  }));

  // Open the DevTools.
  // mainWindow.webContents.openDevTools();

  // pickerDialog.webContents.openDevTools();

  // Emitted when the window is closed.
  mainWindow.on("closed", () => {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null;
    pickerDialog = null;
  });
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", createWindow);

// Quit when all windows are closed.
app.on("window-all-closed", () => {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  // On OS X it"s common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow();
  }
});

ipcMain.on("show-picker", (event, sources) => {
    pickerDialog.show();
    pickerDialog.webContents.send("get-sources", sources);
});

ipcMain.on("source-id-selected", (event, souceId) => {
    log.debug("souce-id-selected", souceId);
    pickerDialog.hide();
    mainWindow.webContents.send("source-id-selected", souceId);

});

ipcMain.on("source-selected-esc", (event, options) => {
    pickerDialog.hide();
});
