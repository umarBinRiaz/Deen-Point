let deferredPrompt = null;

// Detect iOS
function isIOS() {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) || 
           (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

// Detect if already installed (standalone mode)
function isStandalone() {
    return window.matchMedia("(display-mode: standalone)").matches ||
           window.navigator.standalone === true;
}

// Android / Chrome install prompt
window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e;
    showInstallBanner();
});

function showInstallBanner() {
    const banner = document.getElementById("installBanner");
    if (banner && !localStorage.getItem("dpInstallDismissed")) {
        banner.classList.add("show");
    }
}

// Show iOS install sheet
function showIOSInstall() {
    const sheet = document.getElementById("iosInstallSheet");
    if (sheet && !localStorage.getItem("dpInstallDismissed")) {
        sheet.classList.add("show");
    }
}

document.addEventListener("DOMContentLoaded", () => {
    // Dismiss banner
    const dismissBtn = document.getElementById("installDismiss");
    if (dismissBtn) {
        dismissBtn.addEventListener("click", () => {
            localStorage.setItem("dpInstallDismissed", "1");
            const banner = document.getElementById("installBanner");
            if (banner) banner.classList.remove("show");
        });
    }

    // Install button — Android/Chrome
    const installBtn = document.getElementById("installBtn");
    if (installBtn) {
        installBtn.addEventListener("click", async () => {
            // iOS: show manual instructions
            if (isIOS()) {
                showIOSInstall();
                return;
            }
            // Android: native prompt
            if (!deferredPrompt) {
                showToast("App apke browser mein already install hai ya browser support nahi karta.");
                return;
            }
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === "accepted") {
                showToast("DeenPoint install ho raha hai...");
            }
            deferredPrompt = null;
            const banner = document.getElementById("installBanner");
            if (banner) banner.classList.remove("show");
        });
    }

    // Auto-show install prompt on mobile
    if (!isStandalone() && !localStorage.getItem("dpInstallDismissed")) {
        // If already installed, don't show
        if (isStandalone()) return;

        // Show iOS instructions after 3 seconds if on iOS Safari
        if (isIOS() && !window.navigator.standalone) {
            setTimeout(() => {
                const banner = document.getElementById("installBanner");
                if (banner) banner.classList.add("show");
            }, 3000);
        }
    }

    // Close iOS sheet on overlay click
    const iosSheet = document.getElementById("iosInstallSheet");
    if (iosSheet) {
        iosSheet.addEventListener("click", (e) => {
            if (e.target === iosSheet) {
                iosSheet.classList.remove("show");
            }
        });
    }
});

// App installed callback
window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
    showToast("DeenPoint successfully install ho gaya!");
    const banner = document.getElementById("installBanner");
    if (banner) banner.classList.remove("show");
});

function getInstallStatus() {
    if (isStandalone()) return "installed";
    if (deferredPrompt) return "available";
    return "unavailable";
}
