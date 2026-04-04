async function initApp() {
  if (typeof window.initChat === "function") {
    await window.initChat();
    return;
  }

  const chatScript = document.querySelector(
    'script[data-chat-script="true"], script[src="./assets/chat.js"], script[src="assets/chat.js"], script[src$="/assets/chat.js"]'
  );
  if (!chatScript) return;

  chatScript.addEventListener(
    "load",
    () => {
      window.initChat?.();
    },
    { once: true }
  );
}

initApp().catch((error) => {
  console.error("Main app init failed:", error);
});

    window.addEventListener("scroll", () => {
      const header = document.getElementById("mainHeader");
      if (!header) return;

      const row = header.querySelector(".relative.w-full");

      if (window.scrollY > 20) {
        header.classList.remove("header-overlay");
        header.classList.add("header-solid");
        header.classList.add("shadow-md");

        if (row) {
          row.classList.remove("h-16");
          row.classList.add("h-14");
        }
      } else {
        header.classList.remove("header-solid");
        header.classList.add("header-overlay");
        header.classList.remove("shadow-md");

        if (row) {
          row.classList.remove("h-14");
          row.classList.add("h-16");
        }
      }
    });
