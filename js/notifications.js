const NOTIF_KEY = "dpNotificationsEnabled";
const NOTIF_MINUTES_KEY = "dpNotifMinutes";
let notifTimers = [];

async function requestNotificationPermission() {
  if (!("Notification" in window)) {
    showToast("Aapka browser notifications support nahi karta.");
    return false;
  }
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") {
    showToast("Notifications blocked hain. Browser settings mein enable karein.");
    return false;
  }
  const perm = await Notification.requestPermission();
  return perm === "granted";
}

function isNotificationsEnabled() {
  try { return localStorage.getItem(NOTIF_KEY) === "1"; } catch { return false; }
}

function setNotificationsEnabled(val) {
  try { localStorage.setItem(NOTIF_KEY, val ? "1" : "0"); } catch { /* */ }
}

function getReminderMinutes() {
  try { return parseInt(localStorage.getItem(NOTIF_MINUTES_KEY)) || 15; } catch { return 15; }
}

function setReminderMinutes(min) {
  try { localStorage.setItem(NOTIF_MINUTES_KEY, String(min)); } catch { /* */ }
}

function clearAllSalahTimers() {
  notifTimers.forEach(clearTimeout);
  notifTimers = [];
}

function scheduleSalahNotifications(timings) {
  clearAllSalahTimers();
  if (!isNotificationsEnabled() || !timings) return;

  const now = Date.now();
  const minutes = getReminderMinutes();

  PRAYER_NAMES.forEach((name) => {
    if (!timings[name]) return;
    const prayerMs = getTimestampForPrayer(timings[name]);
    const triggerMs = prayerMs - minutes * 60 * 1000;
    const delay = triggerMs - now;

    if (delay > 0) {
      const timer = setTimeout(() => {
        sendPrayerNotification(name, timings[name]);
      }, delay);
      notifTimers.push(timer);
    }
  });
}

function sendPrayerNotification(prayerName, prayerTime) {
  if (Notification.permission !== "granted") return;

  const arabic = PRAYER_ARABIC[prayerName] || "";
  const time12 = formatTime12(prayerTime);
  const title = `${prayerName} ${arabic} Reminder`;

  try {
    if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.ready.then((reg) => {
        reg.showNotification(title, {
          body: `${prayerName} ka waqt ${time12} hai. Tayyar ho jayen!`,
          icon: "images/icon-192.png",
          badge: "images/icon-192.png",
          tag: "salah-" + prayerName,
          requireInteraction: true,
          vibrate: [200, 100, 200, 100, 200]
        });
      });
    } else {
      new Notification(title, {
        body: `${prayerName} ka waqt ${time12} hai. Tayyar ho jayen!`,
        icon: "images/icon-192.png",
        tag: "salah-" + prayerName
      });
    }
  } catch (err) {
    console.error("Notification error:", err);
  }
}

function sendImmediateTestNotification() {
  if (Notification.permission !== "granted") {
    showToast("Pehle notification permission dein.");
    return;
  }
  sendPrayerNotification("Fajr", "05:00");
  showToast("Test notification bhej diya!");
}
