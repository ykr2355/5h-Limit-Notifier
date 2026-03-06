// 通知設定
const NOTIFY_TITLE = 'リミットが更新されました';
const NOTIFY_INTERVAL_HOURS = 5;
const NOTIFY_INTERVAL_MS = NOTIFY_INTERVAL_HOURS * 60 * 60 * 1000;

function getSavedBaseTime() {
    const saved = localStorage.getItem('5h_limit_base_time');
    if (saved) {
        return parseInt(saved, 10);
    }
    return new Date('2025-03-05T18:00:00+09:00').getTime();
}

let BASE_TIME = getSavedBaseTime();

function setBaseTime(newTime) {
    BASE_TIME = newTime;
    localStorage.setItem('5h_limit_base_time', BASE_TIME.toString());
    lastNotifiedCycle = -1; // リセット
    calculateTimer();
}

// DOM要素
const countdownEl = document.getElementById('countdown');
const progressBar = document.getElementById('progress-bar');
const prevTimeEl = document.getElementById('prev-time');
const nextTimeEl = document.getElementById('next-time');
const statusBadge = document.getElementById('notification-status');
const statusText = document.getElementById('status-text');
const editBaseTimeBtn = document.getElementById('edit-base-time-btn');
const baseTimeInput = document.getElementById('base-time-input');

let lastNotifiedCycle = -1;

function calculateTimer() {
    const now = Date.now();
    const elapsedSinceBase = now - BASE_TIME;

    // 現在が何番目のサイクルにいるか
    const currentCycle = Math.floor(elapsedSinceBase / NOTIFY_INTERVAL_MS);

    // 次回の更新時間
    const nextUpdateTime = BASE_TIME + (currentCycle + 1) * NOTIFY_INTERVAL_MS;
    const prevUpdateTime = BASE_TIME + currentCycle * NOTIFY_INTERVAL_MS;

    // 残り時間（ミリ秒）
    const remainingMs = nextUpdateTime - now;

    // UI更新: カウントダウン
    const hours = Math.floor(remainingMs / (1000 * 60 * 60));
    const minutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((remainingMs % (1000 * 60)) / 1000);

    countdownEl.textContent = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

    // UI更新: プログレスバー
    const progress = ((NOTIFY_INTERVAL_MS - remainingMs) / NOTIFY_INTERVAL_MS) * 100;
    progressBar.style.width = `${progress}%`;

    // UI更新: 日時表示
    prevTimeEl.textContent = formatTime(new Date(prevUpdateTime));
    nextTimeEl.textContent = formatTime(new Date(nextUpdateTime));

    // 通知チェック
    // サイクルが変わった瞬間に通知を送る
    if (lastNotifiedCycle !== -1 && lastNotifiedCycle < currentCycle) {
        sendNotification();
    }
    lastNotifiedCycle = currentCycle;
}

function formatTime(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const h = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    return `${y}/${m}/${d} ${h}:${min}`;
}

async function requestNotificationPermission() {
    if (!("Notification" in window)) {
        alert("このブラウザはデスクトップ通知をサポートしていません。");
        return;
    }

    if (Notification.permission === "granted") {
        updateStatusUI(true);
    } else if (Notification.permission !== "denied") {
        const permission = await Notification.requestPermission();
        updateStatusUI(permission === "granted");
    }
}

function updateStatusUI(granted) {
    if (granted) {
        statusBadge.classList.add('status-ready');
        statusText.textContent = '通知有効';
    } else {
        statusBadge.classList.remove('status-ready');
        statusText.textContent = '通知を有効にする';
    }
}

function sendNotification() {
    if (Notification.permission === "granted") {
        new Notification(NOTIFY_TITLE, {
            body: '次の5時間サイクルが開始されました。',
            icon: './icon.png' // フルパスではなく相対パスに変更
        });
    }
}

// ユーザーがバッジをクリックして権限をリクエストできるようにする
statusBadge.addEventListener('click', requestNotificationPermission);

// 次回更新時間の編集
editBaseTimeBtn.addEventListener('click', () => {
    const now = Date.now();
    const elapsedSinceBase = now - BASE_TIME;
    const currentCycle = Math.floor(elapsedSinceBase / NOTIFY_INTERVAL_MS);
    const nextUpdateTime = BASE_TIME + (currentCycle + 1) * NOTIFY_INTERVAL_MS;

    const date = new Date(nextUpdateTime);
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const h = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');

    baseTimeInput.value = `${y}-${m}-${d}T${h}:${min}`;

    if (baseTimeInput.classList.contains('hidden')) {
        baseTimeInput.classList.remove('hidden');
        nextTimeEl.classList.add('hidden');
    } else {
        baseTimeInput.classList.add('hidden');
        nextTimeEl.classList.remove('hidden');
    }
});

baseTimeInput.addEventListener('change', (e) => {
    if (e.target.value) {
        const newNextTime = new Date(e.target.value).getTime();
        // 入力された次回更新時間から5時間引いた時間を新たな基準時間に設定する
        const newBaseTime = newNextTime - NOTIFY_INTERVAL_MS;
        setBaseTime(newBaseTime);

        baseTimeInput.classList.add('hidden');
        nextTimeEl.classList.remove('hidden');
    }
});

// 初期化
requestNotificationPermission();
setInterval(calculateTimer, 1000);
calculateTimer();
