/* DeenPoint — shared interactions */
const NAV_LANG_KEY = "dpNavLang";

function applyNavLang(lang) {
    const nav = document.querySelector(".dp-navbar");
    const toggle = document.getElementById("langToggle");
    if (!nav) return;
    const isAr = lang === "ar";
    nav.setAttribute("dir", isAr ? "rtl" : "ltr");
    nav.classList.toggle("nav-ar", isAr);
    document.querySelectorAll("#navbarNav .nav-link").forEach(a => {
        if (isAr && a.dataset.ar) a.textContent = a.dataset.ar;
        else if (!isAr && a.dataset.en) a.textContent = a.dataset.en;
    });
    const cta = document.querySelector("#navbarNav .btn-dp");
    if (cta) {
        cta.innerHTML = isAr
            ? '<i class="fa-solid fa-headphones"></i> استمع إلى القرآن'
            : '<i class="fa-solid fa-headphones"></i> Listen Quran';
    }
    if (toggle) {
        toggle.textContent = isAr ? "EN" : "عربي";
        toggle.setAttribute("aria-label", isAr ? "Switch to English" : "التبديل إلى العربية");
    }
    try {
        localStorage.setItem(NAV_LANG_KEY, isAr ? "ar" : "en");
    } catch (e) { /* storage unavailable */ }
}

document.addEventListener("DOMContentLoaded", () => {
    const navbar = document.querySelector(".dp-navbar");
    const onScroll = () => {
        if (!navbar) return;
        navbar.classList.toggle("scrolled", window.scrollY > 10);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    const langToggle = document.getElementById("langToggle");
    if (langToggle) {
        let saved = "en";
        try {
            saved = localStorage.getItem(NAV_LANG_KEY) === "ar" ? "ar" : "en";
        } catch (e) { /* storage unavailable */ }
        applyNavLang(saved);
        langToggle.addEventListener("click", () => {
            const isAr = navbar && navbar.getAttribute("dir") === "rtl";
            applyNavLang(isAr ? "en" : "ar");
        });
    }

    document.querySelectorAll("#year").forEach(el => {
        el.textContent = new Date().getFullYear();
    });

    const io = new IntersectionObserver((entries) => {
        entries.forEach((entry, i) => {
            if (entry.isIntersecting) {
                entry.target.style.transitionDelay = (Math.min(i, 6) * 70) + "ms";
                entry.target.classList.add("visible");
                io.unobserve(entry.target);
            }
        });
    }, { threshold: 0.12 });
    document.querySelectorAll(".reveal").forEach(el => io.observe(el));

});

function showToast(message) {
    let toast = document.getElementById("appToast");
    if (!toast) {
        toast = document.createElement("div");
        toast.id = "appToast";
        toast.className = "toast-dp";
        document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(toast._t);
    toast._t = setTimeout(() => toast.classList.remove("show"), 2600);
}
