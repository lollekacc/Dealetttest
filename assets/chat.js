// assets/chat.js

(function () {
  let cachedPlans = null;

  async function loadPlans(providedPlans) {
    if (Array.isArray(providedPlans) && providedPlans.length) {
      return providedPlans;
    }

    if (Array.isArray(window.APP?.plans) && window.APP.plans.length) {
      return window.APP.plans;
    }

    if (Array.isArray(cachedPlans) && cachedPlans.length) {
      return cachedPlans;
    }

    try {
      const res = await fetch("./data/plans.json");
      if (!res.ok) {
        throw new Error(`Failed to load plans: ${res.status}`);
      }

      cachedPlans = await res.json();
      return Array.isArray(cachedPlans) ? cachedPlans : [];
    } catch (error) {
      console.error("Could not load chat plans:", error);
      return [];
    }
  }

  async function initChat({ plans } = {}) {
    const root = document.querySelector("[data-chat-root]");
    if (!root) return false;

    if (root.dataset.chatInitialized === "true") {
      return true;
    }

    root.dataset.chatInitialized = "true";

    const toggle = root.querySelector("#chat-toggle");
    const panel = root.querySelector("#chat-panel");
    const close = root.querySelector("#chat-close");
    const form = root.querySelector("#chat-form");
    const input = root.querySelector("#chat-input");
    const messages = root.querySelector("#chat-messages");
    const resetBtn = root.querySelector("#chat-reset");
    const availablePlans = await loadPlans(plans);

    const CHAT_HISTORY_KEY = "chat_history";
    const CHAT_OPEN_KEY = "chat_open";

    const state = {
      plans: availablePlans,
      quiz: { persons: null, data: null }
    };

    ensureSession();
    restoreMessages();
    restoreOpenState();
    bindUI();
    bindForm();
    bindQuizButtons();

    if (!messages.children.length) {
      addMessage("Hej! Vad kan jag hjalpa dig med?", "ai");
    }

    return true;

    function ensureSession() {
      if (!localStorage.getItem("chat_sid")) {
        localStorage.setItem(
          "chat_sid",
          crypto.randomUUID?.() || Math.random().toString(36).slice(2)
        );
      }
    }

    function bindUI() {
      toggle?.addEventListener("click", openOrTogglePanel);
      close?.addEventListener("click", closePanel);
      resetBtn?.addEventListener("click", resetChat);

      document.querySelectorAll("#open-chat").forEach((btn) => {
        btn.addEventListener("click", openPanel);
      });

      // Bind suggestion buttons
      document.addEventListener("click", (event) => {
        const btn = event.target.closest(".chat-suggestion-btn");
        if (!btn) return;

        const text = btn.dataset.suggest;
        if (text) {
          input.value = text;
          form.dispatchEvent(new Event('submit'));
        }
      });
    }

    function bindForm() {
      form?.addEventListener("submit", async (event) => {
        event.preventDefault();

        const text = input?.value.trim();
        if (!text) return;

        addMessage(text, "user");
        input.value = "";

        // Hide suggestions after first message
        const suggestions = document.getElementById("chat-suggestions");
        if (suggestions) suggestions.style.display = "none";

        const data = await sendMessage(text);
        await handleResponse(data);
      });
    }

    function bindQuizButtons() {
      document.addEventListener("click", async (event) => {
        const btn = event.target.closest(".chat-quiz-btn");
        if (!btn) return;

        if (btn.dataset.persons) state.quiz.persons = btn.dataset.persons;
        if (btn.dataset.data) state.quiz.data = btn.dataset.data;

        if (state.quiz.persons && state.quiz.data) {
          const msg = `persons:${state.quiz.persons} data:${state.quiz.data}`;

          addMessage(
            `${state.quiz.persons} personer, ${state.quiz.data} surf`,
            "user"
          );

          const data = await sendMessage(msg);
          await handleResponse(data);

          state.quiz = { persons: null, data: null };
        }
      });
    }

    function restoreMessages() {
      const history = JSON.parse(localStorage.getItem(CHAT_HISTORY_KEY) || "[]");
      history.forEach((message) => appendMessage(message.text, message.type));
    }

    function restoreOpenState() {
      const shouldBeOpen = localStorage.getItem(CHAT_OPEN_KEY) === "true";
      if (shouldBeOpen) {
        panel?.classList.remove("closed");
      }
    }

    function openOrTogglePanel() {
      if (!panel) return;

      panel.classList.toggle("closed");
      localStorage.setItem(
        CHAT_OPEN_KEY,
        String(!panel.classList.contains("closed"))
      );
    }

    function openPanel() {
      if (!panel) return;

      panel.classList.remove("closed");
      localStorage.setItem(CHAT_OPEN_KEY, "true");
    }

    function closePanel() {
      if (!panel) return;

      panel.classList.add("closed");
      localStorage.setItem(CHAT_OPEN_KEY, "false");
    }

    function resetChat() {
      if (!messages) return;

      messages.innerHTML = "";
      localStorage.removeItem(CHAT_HISTORY_KEY);
      ensureSession();
      addMessage("Hej! Vad kan jag hjalpa dig med?", "ai");
    }

    async function sendMessage(message) {
      const sid = localStorage.getItem("chat_sid");
      const headers = { "Content-Type": "application/json" };

      if (sid) headers["X-Chat-Session"] = sid;

      try {
        const res = await fetch("https://dealett-backend.onrender.com/api/chat", {
          method: "POST",
          headers,
          body: JSON.stringify({ message })
        });

        if (!res.ok) throw new Error("Server error");

        return await res.json();
      } catch (error) {
        console.error(error);
        return { reply: "Connection error." };
      }
    }

    async function handleResponse(data) {
      if (data?.type === "offer") {
        await renderOffer(data.payload);
        return;
      }

      addMessage(data?.reply || "No response", "ai");
    }

    async function renderOffer(payload) {
      if (!payload) {
        addMessage("Kunde inte visa erbjudandet.", "ai");
        return;
      }

      if (!state.plans.length) {
        state.plans = await loadPlans();
      }

      const plan = state.plans.find((item) => item.id === payload.planId);

      if (!plan || !window.renderSingleOfferCard) {
        addMessage("Kunde inte visa erbjudandet.", "ai");
        return;
      }

      const wrapper = document.createElement("div");
      wrapper.className = "chat-msg ai";

      const card = window.renderSingleOfferCard(plan, payload);
      wrapper.appendChild(card);

      messages?.appendChild(wrapper);
      if (messages) messages.scrollTop = messages.scrollHeight;
    }

    function addMessage(text, type) {
      appendMessage(text, type);
      saveHistory({ text, type });
    }

    function appendMessage(text, type) {
      if (!messages) return;

      const div = document.createElement("div");
      div.className = `chat-msg ${type}`;
      div.textContent = text;
      messages.appendChild(div);
      messages.scrollTop = messages.scrollHeight;
    }

    function saveHistory(msg) {
      const history = JSON.parse(localStorage.getItem(CHAT_HISTORY_KEY) || "[]");
      history.push(msg);

      if (history.length > 100) {
        history.shift();
      }

      localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(history));
    }
  }

  window.initChat = initChat;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      initChat().catch((error) => console.error("Chat init failed:", error));
    });
  } else {
    initChat().catch((error) => console.error("Chat init failed:", error));
  }
})();
