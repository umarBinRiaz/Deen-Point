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


/* =========================================
   DATE
========================================= */

function getTodayKey() {

    const date = new Date();

    return date.getFullYear() +
        "-" +
        String(date.getMonth() + 1).padStart(2, "0") +
        "-" +
        String(date.getDate()).padStart(2, "0");
}


function showDate() {

    const date = new Date();

    const formatted = date.toLocaleDateString("en-US", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric"
    });

    document.getElementById("todayDate").textContent = formatted;
}


/* =========================================
   GET TODAY DATA
========================================= */

function getTodayData() {

    const saved =
        JSON.parse(localStorage.getItem(SALAH_STORAGE)) || {};

    const today = getTodayKey();

    if (!saved[today]) {

        saved[today] = {
            Fajr: false,
            Dhuhr: false,
            Asr: false,
            Maghrib: false,
            Isha: false
        };

        localStorage.setItem(
            SALAH_STORAGE,
            JSON.stringify(saved)
        );
    }

    return saved[today];
}


/* =========================================
   SAVE TODAY
========================================= */

function saveTodayData(data) {

    const saved =
        JSON.parse(localStorage.getItem(SALAH_STORAGE)) || {};

    saved[getTodayKey()] = data;

    localStorage.setItem(
        SALAH_STORAGE,
        JSON.stringify(saved)
    );
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
   UPDATE UI
========================================= */

function updateSalahUI() {

    const data = getTodayData();

    let completed = 0;

    SALAH_NAMES.forEach(name => {

        const card =
            document.querySelector(
                `[data-salah="${name}"]`
            );

        const button =
            card.querySelector(".salah-check");

        const check =
            document.getElementById(
                `check-${name}`
            );

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


    const percentage =
        Math.round((completed / 5) * 100);


    document.getElementById(
        "progressPercent"
    ).textContent = percentage + "%";


    document.getElementById(
        "progressText"
    ).textContent = `${completed} / 5`;


    document.getElementById(
        "completedText"
    ).textContent = `${completed} Completed`;


    document.getElementById(
        "remainingText"
    ).textContent = `${5 - completed} Remaining`;


    document.getElementById(
        "progressFill"
    ).style.width = percentage + "%";
}


/* =========================================
   QAZA
========================================= */

function getQazaInputs() {

    return {
        Fajr: Number(
            document.getElementById("qazaFajr").value
        ) || 0,

        Dhuhr: Number(
            document.getElementById("qazaDhuhr").value
        ) || 0,

        Asr: Number(
            document.getElementById("qazaAsr").value
        ) || 0,

        Maghrib: Number(
            document.getElementById("qazaMaghrib").value
        ) || 0,

        Isha: Number(
            document.getElementById("qazaIsha").value
        ) || 0
    };
}


/* =========================================
   CALCULATE QAZA
========================================= */

function calculateQaza() {

    const qaza = getQazaInputs();

    const total =
        qaza.Fajr +
        qaza.Dhuhr +
        qaza.Asr +
        qaza.Maghrib +
        qaza.Isha;


    let dailyTarget =
        Number(
            document.getElementById("dailyTarget").value
        ) || 1;


    if (dailyTarget < 1) {
        dailyTarget = 1;
        document.getElementById(
            "dailyTarget"
        ).value = 1;
    }


    const days =
        total === 0
            ? 0
            : Math.ceil(total / dailyTarget);


    document.getElementById(
        "totalQaza"
    ).textContent = total;


    document.getElementById(
        "estimatedDays"
    ).textContent = days;
}


/* =========================================
   SAVE QAZA
========================================= */

function saveQaza() {

    const qaza = getQazaInputs();

    const dailyTarget =
        Number(
            document.getElementById("dailyTarget").value
        ) || 1;


    const data = {
        ...qaza,
        dailyTarget: dailyTarget
    };


    localStorage.setItem(
        QAZA_STORAGE,
        JSON.stringify(data)
    );


    alert("Qaza progress saved.");
}


/* =========================================
   LOAD QAZA
========================================= */

function loadQaza() {

    const saved =
        JSON.parse(
            localStorage.getItem(QAZA_STORAGE)
        );

    if (!saved) {
        calculateQaza();
        return;
    }


    document.getElementById(
        "qazaFajr"
    ).value = saved.Fajr || 0;


    document.getElementById(
        "qazaDhuhr"
    ).value = saved.Dhuhr || 0;


    document.getElementById(
        "qazaAsr"
    ).value = saved.Asr || 0;


    document.getElementById(
        "qazaMaghrib"
    ).value = saved.Maghrib || 0;


    document.getElementById(
        "qazaIsha"
    ).value = saved.Isha || 0;


    document.getElementById(
        "dailyTarget"
    ).value = saved.dailyTarget || 2;


    calculateQaza();
}


/* =========================================
   RESET TODAY
========================================= */

function resetSalah() {

    const confirmReset =
        confirm(
            "Reset today's Salah progress?"
        );

    if (!confirmReset) return;


    const saved =
        JSON.parse(
            localStorage.getItem(SALAH_STORAGE)
        ) || {};


    delete saved[getTodayKey()];


    localStorage.setItem(
        SALAH_STORAGE,
        JSON.stringify(saved)
    );


    updateSalahUI();
}


/* =========================================
   INITIALIZE
========================================= */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        showDate();

        updateSalahUI();

        loadQaza();

    }
);