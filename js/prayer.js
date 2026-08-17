const PRAYER_API = "https://api.aladhan.com/v1";
const PRAYER_CACHE_KEY = "dpPrayerData";
const PRAYER_CACHE_DURATION = 6 * 60 * 60 * 1000;

const PRAYER_NAMES = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];
const PRAYER_ARABIC = { Fajr: "فجر", Dhuhr: "ظہر", Asr: "عصر", Maghrib: "مغرب", Isha: "عشاء" };
const PRAYER_ICONS = {
  Fajr: "fa-solid fa-star-and-crescent",
  Dhuhr: "fa-solid fa-sun",
  Asr: "fa-solid fa-cloud-sun",
  Maghrib: "fa-solid fa-mountain-sun",
  Isha: "fa-solid fa-moon"
};
const PRAYER_RAKAAT = { Fajr: "2 Rak'ah", Dhuhr: "4 Rak'ah", Asr: "4 Rak'ah", Maghrib: "3 Rak'ah", Isha: "4 Rak'ah" };

let prayerData = null;
let userLat = null;
let userLng = null;
let userCity = "";

async function fetchPrayerTimes(lat, lng) {
  const cache = getPrayerCache();
  if (cache && cache.lat === lat && cache.lng === lng && Date.now() - cache.timestamp < PRAYER_CACHE_DURATION) {
    prayerData = cache.data;
    return cache.data;
  }

  try {
    const res = await fetch(
      `${PRAYER_API}/timings/${Math.floor(Date.now() / 1000)}?latitude=${lat}&longitude=${lng}&method=2`
    );
    if (!res.ok) throw new Error("API error");
    const json = await res.json();
    if (json.code !== 200) throw new Error("Bad response");
    prayerData = json.data;
    savePrayerCache(lat, lng, prayerData);
    return prayerData;
  } catch (err) {
    console.error("Prayer API error:", err);
    return null;
  }
}

async function fetchPrayerTimesByCity(city, country) {
  try {
    const res = await fetch(
      `${PRAYER_API}/timingsByCity?city=${encodeURIComponent(city)}&country=${encodeURIComponent(country)}&method=2`
    );
    if (!res.ok) throw new Error("API error");
    const json = await res.json();
    if (json.code !== 200) throw new Error("Bad response");
    prayerData = json.data;
    return prayerData;
  } catch (err) {
    console.error("Prayer API error:", err);
    return null;
  }
}

function getPrayerCache() {
  try {
    const c = localStorage.getItem(PRAYER_CACHE_KEY);
    return c ? JSON.parse(c) : null;
  } catch { return null; }
}

function savePrayerCache(lat, lng, data) {
  try {
    localStorage.setItem(PRAYER_CACHE_KEY, JSON.stringify({ lat, lng, data, city: userCity, timestamp: Date.now() }));
  } catch { /* storage unavailable */ }
}

function parseTime(timeStr) {
  const [h, m] = timeStr.split(":").map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d;
}

function getNextPrayer(timings) {
  const now = new Date();
  for (const name of PRAYER_NAMES) {
    if (!timings[name]) continue;
    const prayerTime = parseTime(timings[name]);
    if (prayerTime > now) {
      return { name, time: timings[name], date: prayerTime };
    }
  }
  if (timings.Fajr) {
    const fajrTomorrow = parseTime(timings.Fajr);
    fajrTomorrow.setDate(fajrTomorrow.getDate() + 1);
    return { name: "Fajr", time: timings.Fajr, date: fajrTomorrow };
  }
  return null;
}

function formatCountdown(ms) {
  if (ms <= 0) return "00:00:00";
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function formatTime12(timeStr) {
  const [h, m] = timeStr.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
}

function getTimestampForPrayer(timeStr) {
  const d = new Date();
  const [h, m] = timeStr.split(":").map(Number);
  d.setHours(h, m, 0, 0);
  return d.getTime();
}

function detectLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation not supported"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        userLat = pos.coords.latitude;
        userLng = pos.coords.longitude;
        try {
          const res = await fetch(
            `https://api.aladhan.com/v1/${Math.floor(Date.now() / 1000)}?latitude=${userLat}&longitude=${userLng}`
          );
          if (res.ok) {
            const json = await res.json();
            userCity = json.data?.meta?.timezone?.split("/").pop()?.replace(/_/g, " ") || "";
          }
        } catch { /* silent */ }
        if (!userCity) {
          try {
            const geoRes = await fetch(
              `https://nominatim.openstreetmap.org/reverse?lat=${userLat}&lon=${userLng}&format=json`
            );
            if (geoRes.ok) {
              const geoJson = await geoRes.json();
              userCity = geoJson.address?.city || geoJson.address?.town || geoJson.address?.village || geoJson.address?.state || "Your Location";
            }
          } catch { userCity = "Your Location"; }
        }
        resolve({ lat: userLat, lng: userLng, city: userCity });
      },
      (err) => reject(err),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
    );
  });
}
