const {app, BrowserWindow} = require('electron');
var fs = require('fs');
//var ipcMain = require('electron').ipcMain;
// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win
global.designSaved = {prop:true};
console.log('Running Electron Version: '+process.versions.electron);
function createWindow () {
  // Create the browser window.
 // win = new BrowserWindow({width: 800, height: 600})
win = new BrowserWindow()
win.maximize();

  // and load the index.html of the app.
  win.loadURL(`file://${__dirname}/index.html`)

  // Open the DevTools.
  win.webContents.openDevTools()

  // Emitted when the window is closed.
  win.on('closed', () => {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    win = null
  })
  win.on('close', function(e){
   /* var choice = require('electron').dialog.showMessageBox(this,
        {
          type: 'question',
          buttons: ['Yes', 'No'],
          title: 'Confirm',
          message: 'Are you sure you want to quit?'
       });
       if(choice == 1){
         e.preventDefault();
       }*/
  });
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (win === null) {
    createWindow()
  }
})

app.on('ready', function() {
    const {dialog} = require('electron');
    //console.log(dialog.showOpenDialog({properties: ["openFile"]}));
});
app.on('browser-window-created',function(e,window) {
      window.setMenu(null);
  });
