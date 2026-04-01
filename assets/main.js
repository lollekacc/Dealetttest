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
