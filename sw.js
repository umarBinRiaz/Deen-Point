const CACHE_NAME = "deenpoint-v4";
const BASE = self.registration.scope.replace(/\/$/, "");
const ASSETS = [
  "",
  "/index.html",
  "/quran.html",
  "/hadith.html",
  "/dua.html",
  "/articles.html",
  "/salah.html",
  "/salah-reminder.html",
  "/download.html",
  "/css/style.css",
  "/css/salah.css",
  "/css/mobile-app.css",
  "/js/main.js",
  "/js/prayer.js",
  "/js/notifications.js",
  "/js/install.js",
  "/data/surahs.js",
  "/data/hadith.js",
  "/data/duas.js",
  "/data/articles.js",
  "/data/salah.js",
  "/manifest.json",
  "/offline.html",
  "/images/icon-192.png",
  "/images/icon-512.png"
].map(p => p ? BASE + p : BASE + "/");

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  if (e.request.url.includes("api.alquran.cloud") || e.request.url.includes("api.aladhan.com")) {
    e.respondWith(
      fetch(e.request).then((res) => {
        const clone = res.clone();
        caches.open(CACHE_NAME).then((c) => c.put(e.request, clone));
        return res;
      }).catch(() => caches.match(e.request))
    );
    return;
  }
  e.respondWith(
    caches.match(e.request).then((cached) => {
      if (cached) return cached;
      return fetch(e.request).catch(() => {
        if (e.request.mode === "navigate") {
          return caches.match(BASE + "/offline.html");
        }
        return new Response("", { status: 503, statusText: "Offline" });
      });
    })
  );
});

self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  e.waitUntil(
    clients.matchAll({ type: "window" }).then((list) => {
      for (const client of list) {
        if (client.url.includes("salah-reminder") && "focus" in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow(BASE + "/salah-reminder.html");
    })
  );
});

self.addEventListener("periodicsync", (e) => {
  if (e.tag === "prayer-check") {
    e.waitUntil(checkAndNotifyPrayer());
  }
});

async function checkAndNotifyPrayer() {
  try {
    const cache = await caches.open(CACHE_NAME);
    const res = await cache.match("https://api.aladhan.com/v1/timingsByCity?city=&country=&method=2");
    if (!res) return;
    const data = await res.json();
    const timings = data.data?.data?.timings;
    if (!timings) return;
    const now = new Date();
    const prayers = [
      { name: "Fajr", time: timings.Fajr },
      { name: "Sunrise", time: timings.Sunrise },
      { name: "Dhuhr", time: timings.Dhuhr },
      { name: "Asr", time: timings.Asr },
      { name: "Maghrib", time: timings.Maghrib },
      { name: "Isha", time: timings.Isha }
    ];
    for (const p of prayers) {
      if (!p.time || p.name === "Sunrise") continue;
      const [h, m] = p.time.split(":").map(Number);
      const prayerDate = new Date(now);
      prayerDate.setHours(h, m - 15, 0, 0);
      if (Math.abs(now - prayerDate) < 60000) {
        self.registration.showNotification("DeenPoint Salah Reminder", {
          body: `${p.name} ka waqt 15 minute mein hai. Tayyar ho jayen!`,
          icon: BASE + "/images/icon-192.png",
          badge: BASE + "/images/icon-192.png",
          tag: "salah-" + p.name,
          requireInteraction: true,
          vibrate: [200, 100, 200]
        });
      }
    }
  } catch (err) { /* silent */ }
}
