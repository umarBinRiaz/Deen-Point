let deferredPrompt = null;

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

document.addEventListener("DOMContentLoaded", () => {
  const dismissBtn = document.getElementById("installDismiss");
  if (dismissBtn) {
    dismissBtn.addEventListener("click", () => {
      localStorage.setItem("dpInstallDismissed", "1");
      const banner = document.getElementById("installBanner");
      if (banner) banner.classList.remove("show");
    });
  }

  const installBtn = document.getElementById("installBtn");
  if (installBtn) {
    installBtn.addEventListener("click", async () => {
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
});

window.addEventListener("appinstalled", () => {
  deferredPrompt = null;
  showToast("DeenPoint successfully install ho gaya!");
  const banner = document.getElementById("installBanner");
  if (banner) banner.classList.remove("show");
});

function getInstallStatus() {
  if (window.matchMedia("(display-mode: standalone)").matches) return "installed";
  if (deferredPrompt) return "available";
  return "unavailable";
}
