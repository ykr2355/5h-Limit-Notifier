@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo 5h Limit Notifier のサーバーを起動しています...
echo アプリが自動的に開くまで数秒お待ちください。

:: サーバー起動待ちのため、別プロセスで2秒待機したあとにChromeアプリを起動します
start "" cmd /c "timeout /t 2 /nobreak >nul && start chrome.exe --app-id=idemibpphagihbobmgmaojhjfidlfpdl"

:: Viteサーバーを起動（コンソールはこのままサーバー実行状態になります）
npm run dev
