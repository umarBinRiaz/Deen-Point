/* =========================================
   DEEN POINT — SALAH TRACKER
========================================= */

const SALAH_NAMES = [
    "Fajr",
    "Dhuhr",
    "Asr",
    "Maghrib",
    "Isha"
];

const SALAH_STORAGE = "deenPointSalah";
const QAZA_STORAGE = "deenPointQaza";

const RING_RADIUS = 52;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;


/* =========================================
   HELPERS
========================================= */

function toKey(date) {
    return date.getFullYear() +
        "-" +
        String(date.getMonth() + 1).padStart(2, "0") +
        "-" +
        String(date.getDate()).padStart(2, "0");
}

function getTodayKey() {
    return toKey(new Date());
}

function notify(message) {
    if (typeof showToast === "function") {
        showToast(message);
    } else {
        alert(message);
    }
}

function readAllSalah() {
    return JSON.parse(localStorage.getItem(SALAH_STORAGE)) || {};
}

function isDayComplete(data) {
    return SALAH_NAMES.every(name => data && data[name] === true);
}


/* =========================================
   DATE
========================================= */

function showDate() {
    const date = new Date();
    const formatted = date.toLocaleDateString("en-US", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric"
    });
    const el = document.getElementById("todayDate");
    if (el) el.textContent = formatted;
}


/* =========================================
   GET / SAVE TODAY DATA
========================================= */

function getTodayData() {
    const saved = readAllSalah();
    const today = getTodayKey();

    if (!saved[today]) {
        saved[today] = {
            Fajr: false,
            Dhuhr: false,
            Asr: false,
            Maghrib: false,
            Isha: false
        };
        localStorage.setItem(SALAH_STORAGE, JSON.stringify(saved));
    }

    return saved[today];
}

function saveTodayData(data) {
    const saved = readAllSalah();
    saved[getTodayKey()] = data;
    localStorage.setItem(SALAH_STORAGE, JSON.stringify(saved));
}


/* =========================================
   TOGGLE SALAH
========================================= */

function toggleSalah(name) {
    const data = getTodayData();
    data[name] = !data[name];
    saveTodayData(data);
    updateSalahUI();
}


/* =========================================
   STREAK
========================================= */

function getStreak() {
    const saved = readAllSalah();
    let streak = 0;
    const today = new Date();

    if (!isDayComplete(saved[getTodayKey()])) {
        today.setDate(today.getDate() - 1);
    }

    while (isDayComplete(saved[toKey(today)])) {
        streak++;
        today.setDate(today.getDate() - 1);
    }

    return streak;
}


/* =========================================
   7-DAY HISTORY
========================================= */

function renderHistory() {
    const wrap = document.getElementById("historyList");
    if (!wrap) return;

    const saved = readAllSalah();
    const rows = [];

    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = toKey(d);
        const data = saved[key] || {};
        const done = SALAH_NAMES.filter(name => data[name] === true).length;
        const pct = Math.round((done / SALAH_NAMES.length) * 100);

        const label = d.toLocaleDateString("en-US", { weekday: "short" }) +
            " " + d.getDate();

        rows.push(`
            <div class="history-row">
                <span class="history-day">${label}</span>
                <div class="history-dots">
                    ${SALAH_NAMES.map(name =>
                        `<span class="history-dot ${data[name] === true ? "on" : ""}"></span>`
                    ).join("")}
                </div>
                <span class="history-pct">${pct}%</span>
            </div>
        `);
    }

    wrap.innerHTML = rows.join("");
}


/* =========================================
   UPDATE UI
========================================= */

function updateProgressRing(completed) {
    const ring = document.getElementById("ringFill");
    const label = document.getElementById("progressPercent");

    if (!ring || !label) return;

    const pct = Math.round((completed / SALAH_NAMES.length) * 100);
    const offset = RING_CIRCUMFERENCE * (1 - pct / 100);

    ring.style.strokeDashoffset = offset;
    label.textContent = pct + "%";
    label.classList.toggle("done", completed === SALAH_NAMES.length);
}

function updateSalahUI() {
    const data = getTodayData();
    let completed = 0;

    SALAH_NAMES.forEach(name => {
        const card = document.querySelector(`[data-salah="${name}"]`);
        if (!card) return;

        const button = card.querySelector(".salah-check");
        const check = document.getElementById(`check-${name}`);

        if (data[name]) {
            completed++;
            card.classList.add("completed");
            button.classList.add("completed");
            check.textContent = "✓";
        } else {
            card.classList.remove("completed");
            button.classList.remove("completed");
            check.textContent = "○";
        }
    });

    const percentage = Math.round((completed / SALAH_NAMES.length) * 100);

    const progressText = document.getElementById("progressText");
    const completedText = document.getElementById("completedText");
    const remainingText = document.getElementById("remainingText");
    const progressFill = document.getElementById("progressFill");

    if (progressText) progressText.textContent = `${completed} / ${SALAH_NAMES.length}`;
    if (completedText) completedText.textContent = `${completed} Completed`;
    if (remainingText) remainingText.textContent = `${SALAH_NAMES.length - completed} Remaining`;
    if (progressFill) progressFill.style.width = percentage + "%";

    updateProgressRing(completed);

    const streakCount = document.getElementById("streakCount");
    const streakLabel = document.getElementById("streakLabel");
    const streak = getStreak();
    if (streakCount) streakCount.textContent = streak;
    if (streakLabel) streakLabel.textContent = streak === 1 ? "Day streak" : "Days streak";
    renderHistory();
}


/* =========================================
   QAZA
========================================= */

function getQazaInputs() {
    return {
        Fajr: Number(document.getElementById("qazaFajr").value) || 0,
        Dhuhr: Number(document.getElementById("qazaDhuhr").value) || 0,
        Asr: Number(document.getElementById("qazaAsr").value) || 0,
        Maghrib: Number(document.getElementById("qazaMaghrib").value) || 0,
        Isha: Number(document.getElementById("qazaIsha").value) || 0
    };
}

function calculateQaza() {
    const qaza = getQazaInputs();

    const total =
        qaza.Fajr +
        qaza.Dhuhr +
        qaza.Asr +
        qaza.Maghrib +
        qaza.Isha;

    let dailyTarget = Number(document.getElementById("dailyTarget").value) || 1;

    if (dailyTarget < 1) {
        dailyTarget = 1;
        document.getElementById("dailyTarget").value = 1;
    }

    const days = total === 0 ? 0 : Math.ceil(total / dailyTarget);

    document.getElementById("totalQaza").textContent = total;
    document.getElementById("estimatedDays").textContent = days;
}


/* =========================================
   SAVE / LOAD QAZA
========================================= */

function saveQaza() {
    const qaza = getQazaInputs();
    const dailyTarget = Number(document.getElementById("dailyTarget").value) || 1;

    const data = {
        ...qaza,
        dailyTarget: dailyTarget
    };

    localStorage.setItem(QAZA_STORAGE, JSON.stringify(data));
    notify("Qaza progress saved.");
}

function loadQaza() {
    const saved = JSON.parse(localStorage.getItem(QAZA_STORAGE));

    if (!saved) {
        calculateQaza();
        return;
    }

    document.getElementById("qazaFajr").value = saved.Fajr || 0;
    document.getElementById("qazaDhuhr").value = saved.Dhuhr || 0;
    document.getElementById("qazaAsr").value = saved.Asr || 0;
    document.getElementById("qazaMaghrib").value = saved.Maghrib || 0;
    document.getElementById("qazaIsha").value = saved.Isha || 0;
    document.getElementById("dailyTarget").value = saved.dailyTarget || 2;

    calculateQaza();
}


/* =========================================
   RESET TODAY
========================================= */

function resetSalah() {
    const confirmReset = confirm("Reset today's Salah progress?");

    if (!confirmReset) return;

    const saved = readAllSalah();
    delete saved[getTodayKey()];

    localStorage.setItem(SALAH_STORAGE, JSON.stringify(saved));
    updateSalahUI();
}


/* =========================================
   INITIALIZE
========================================= */

document.addEventListener("DOMContentLoaded", function () {
    showDate();
    updateSalahUI();
    loadQaza();
});
