// assets/chat.js

export function initChat({ plans }) {
  console.log("Chat initialized");

  const root = document.querySelector("[data-chat-root]");
  if (!root) return;

  const toggle = root.querySelector("#chat-toggle");
  const panel = root.querySelector("#chat-panel");
  const close = root.querySelector("#chat-close");
  const form = root.querySelector("#chat-form");
  const input = root.querySelector("#chat-input");
  const messages = root.querySelector("#chat-messages");
  const resetBtn = root.querySelector("#chat-reset");

  const CHAT_HISTORY_KEY = "chat_history";
  const CHAT_OPEN_KEY = "chat_open";

  const state = {
    quiz: { persons: null, data: null }
  };

  ensureSession();

  restoreMessages();

  bindUI();
  bindForm();
  bindQuizButtons();

  // ---------------------

  function ensureSession() {
    if (!localStorage.getItem("chat_sid")) {
      localStorage.setItem(
        "chat_sid",
        crypto.randomUUID?.() || Math.random().toString(36).slice(2)
      );
    }
  }

  function bindUI() {
    toggle?.addEventListener("click", () => {
      panel.classList.toggle("closed");
      localStorage.setItem(
        CHAT_OPEN_KEY,
        !panel.classList.contains("closed")
      );
    });

    close?.addEventListener("click", () => {
      panel.classList.add("closed");
      localStorage.setItem(CHAT_OPEN_KEY, "false");
    });

    resetBtn?.addEventListener("click", resetChat);
  }

  function resetChat() {
    messages.innerHTML = "";
    localStorage.removeItem(CHAT_HISTORY_KEY);
    ensureSession();
    addMessage("Hej! Vad kan jag hjälpa dig med?", "ai");
  }

  function bindForm() {
    form?.addEventListener("submit", async e => {
      e.preventDefault();

      const text = input.value.trim();
      if (!text) return;

      addMessage(text, "user");
      input.value = "";

      const data = await sendMessage(text);

      handleResponse(data);
    });
  }

  function bindQuizButtons() {
    document.addEventListener("click", async e => {
      const btn = e.target.closest(".chat-quiz-btn");
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
        handleResponse(data);

        state.quiz = { persons: null, data: null };
      }
    });
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

    } catch (err) {
      console.error(err);
      return { reply: "Connection error." };
    }
  }

  function handleResponse(data) {
    if (data.type === "offer") {
      renderOffer(data.payload);
      return;
    }

    addMessage(data.reply || "No response", "ai");
  }

  function renderOffer(payload) {
    const plan = plans.find(p => p.id === payload.planId);

    if (!plan || !window.renderSingleOfferCard) {
      addMessage("Kunde inte visa erbjudandet.", "ai");
      return;
    }

    const wrapper = document.createElement("div");
    wrapper.className = "chat-msg ai";

    const card = window.renderSingleOfferCard(plan, payload);
    wrapper.appendChild(card);

    messages.appendChild(wrapper);
    messages.scrollTop = messages.scrollHeight;
  }

  function addMessage(text, type) {
    const div = document.createElement("div");
    div.className = `chat-msg ${type}`;
    div.textContent = text; // 🔐 SAFE
    messages.appendChild(div);

    messages.scrollTop = messages.scrollHeight;

    saveHistory({ text, type });
  }

  function saveHistory(msg) {
    const history = JSON.parse(localStorage.getItem(CHAT_HISTORY_KEY) || "[]");

    history.push(msg);
    if (history.length > 100) history.shift();

    localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(history));
  }

  function restoreMessages() {
    const history = JSON.parse(localStorage.getItem(CHAT_HISTORY_KEY) || "[]");

    history.forEach(m => addMessage(m.text, m.type));
  }
}