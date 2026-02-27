const { app, BrowserWindow, screen } = require('electron')
const path = require('path')

app.commandLine.appendSwitch('disable-gpu-shader-disk-cache')

app.whenReady().then(() => {
  const { width: sw, height: sh } = screen.getPrimaryDisplay().workAreaSize

  // 테스트 1: 불투명 윈도우
  const win = new BrowserWindow({
    width: 400,
    height: 300,
    x: sw - 420,
    y: sh - 320,
    frame: false,
    alwaysOnTop: true,
    skipTaskbar: false,  // 작업표시줄에 보이게
    webPreferences: { nodeIntegration: false, contextIsolation: true }
  })

  win.loadURL('data:text/html,' + encodeURIComponent(`
    <html>
    <body style="margin:0; background:#1a1a2e; color:white; font-family:Segoe UI;
                 display:flex; flex-direction:column; align-items:center; justify-content:center;
                 height:100vh; user-select:none;">
      <div style="font-size:48px; font-weight:bold;
                  background:linear-gradient(135deg,#7c3aed,#3b82f6);
                  -webkit-background-clip:text; -webkit-text-fill-color:transparent;">
        G
      </div>
      <div style="font-size:14px; margin-top:8px; color:rgba(255,255,255,0.7);">
        GameQA Hub - 테스트 윈도우
      </div>
      <button onclick="document.body.style.background='#7c3aed'"
              style="margin-top:20px; padding:10px 24px; border-radius:8px; border:none;
                     background:linear-gradient(135deg,#7c3aed,#3b82f6); color:white;
                     font-size:14px; cursor:pointer; font-weight:600;">
        클릭 테스트
      </button>
      <div style="margin-top:12px; font-size:11px; color:rgba(255,255,255,0.4);">
        이 창이 보이면 Electron은 정상 동작
      </div>
    </body>
    </html>
  `))

  win.webContents.openDevTools({ mode: 'detach' })
})

app.on('window-all-closed', () => app.quit())
