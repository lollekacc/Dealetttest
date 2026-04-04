async function initApp() {
  if (typeof window.initChat === "function") {
    await window.initChat();
    return;
  }

  const chatScript = document.querySelector('script[data-chat-script="true"]');
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
  const row = header.querySelector(".relative.w-full");

  if (window.scrollY > 20) {
    header.classList.add("shadow-md", "bg-white");
    header.classList.remove("bg-transparent");

    row.classList.remove("h-16");
    row.classList.add("h-14");
  } else {
    header.classList.remove("shadow-md", "bg-white");
    header.classList.add("bg-transparent");

    row.classList.remove("h-14");
    row.classList.add("h-16");
  }
});
