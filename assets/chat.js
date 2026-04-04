// assets/chat.js

(function () {
  const CHAT_HISTORY_KEY = "chat_history";
  const CHAT_OPEN_KEY = "chat_open";
  const CHAT_SESSION_KEY = "chat_sid";
  const DEFAULT_GREETING = "Hej! Vad kan jag hj\u00e4lpa dig med?";

  const cachedCatalogs = {
    mobile: null,
    broadband: null
  };

  async function loadJsonArray(url) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to load ${url}: ${response.status}`);
      }

      const data = await response.json();
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error(`Could not load ${url}:`, error);
      return [];
    }
  }

  async function loadCatalogs(providedPlans) {
    if (Array.isArray(providedPlans) && providedPlans.length) {
      cachedCatalogs.mobile = providedPlans;
    } else if (Array.isArray(window.APP?.plans) && window.APP.plans.length) {
      cachedCatalogs.mobile = window.APP.plans;
    } else if (!Array.isArray(cachedCatalogs.mobile)) {
      cachedCatalogs.mobile = await loadJsonArray("./data/plans.json");
    }

    if (!Array.isArray(cachedCatalogs.broadband)) {
      cachedCatalogs.broadband = await loadJsonArray("./data/5Gbredband.json");
    }

    return {
      mobile: Array.isArray(cachedCatalogs.mobile) ? cachedCatalogs.mobile : [],
      broadband: Array.isArray(cachedCatalogs.broadband) ? cachedCatalogs.broadband : []
    };
  }

  function createSessionId() {
    return crypto.randomUUID?.() || Math.random().toString(36).slice(2);
  }

  function createEmptyQuizState() {
    return {
      persons: null,
      data: null,
      speed: null,
      bredbandtype: null
    };
  }

  function readHistory() {
    try {
      const raw = localStorage.getItem(CHAT_HISTORY_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.warn("Could not restore chat history:", error);
      return [];
    }
  }

  function detectReplyFormat(reply) {
    if (typeof reply !== "string") {
      return "text";
    }

    return /<\/?[a-z][\s\S]*>/i.test(reply) ? "html" : "text";
  }

  function normalizeHistoryMessage(entry) {
    if (!entry || typeof entry !== "object") {
      return null;
    }

    if (entry.kind === "offer" && entry.payload) {
      return entry;
    }

    if (typeof entry.text !== "string" || !entry.type) {
      return null;
    }

    return {
      kind: "message",
      text: entry.text,
      type: entry.type === "user" ? "user" : "ai",
      format: entry.format || detectReplyFormat(entry.text)
    };
  }

  function formatDataLabel(level) {
    if (level === "low") return "Lite surf";
    if (level === "medium") return "Lagom surf";
    if (level === "high") return "Obegr\u00e4nsad surf";
    return level || "";
  }

  function formatSpeedLabel(level) {
    if (level === "low") return "Lagom hastighet";
    if (level === "medium") return "Snabb hastighet";
    if (level === "high") return "Mycket snabb hastighet";
    return level || "";
  }

  function formatBroadbandTypeLabel(type) {
    if (type === "fiber") return "Fiber";
    if (type === "mobil") return "Mobilt bredband";
    if (type === "any") return "B\u00e5da fungerar";
    return type || "";
  }

  function formatMoney(value) {
    const amount = Number(value);
    if (!Number.isFinite(amount)) {
      return null;
    }

    return `${amount.toLocaleString("sv-SE")} kr/m\u00e5n`;
  }

  function formatPlanFeature(plan, payload, isBroadband) {
    if (isBroadband) {
      const speed = plan?.speed || payload?.speed || plan?.speedMbps;
      return speed ? `${speed} Mbit/s` : null;
    }

    const dataAmount = plan?.dataAmount ?? plan?.data;
    if (dataAmount === undefined || dataAmount === null || dataAmount === "") {
      return null;
    }

    const numericDataAmount = Number(dataAmount);
    if (Number.isFinite(numericDataAmount)) {
      return numericDataAmount >= 999
        ? "Obegr\u00e4nsad surf"
        : `${numericDataAmount} GB surf`;
    }

    return String(dataAmount);
  }

  function getChatApiCandidates() {
    const candidates = [];
    const explicitApi =
      typeof window.APP?.chatApi === "string" ? window.APP.chatApi.trim() : "";
    const allowProductionFallback = window.APP?.allowProductionFallback === true;
    const protocol = window.location.protocol;
    const host = window.location.hostname;
    const origin = window.location.origin;
    const localApi = "http://localhost:3000/api/chat";
    const productionApi = "https://dealett-backend.onrender.com/api/chat";
    const sameOriginApi =
      origin && origin !== "null" ? `${origin.replace(/\/$/, "")}/api/chat` : "";

    function addCandidate(url) {
      if (!url || candidates.includes(url)) return;
      candidates.push(url);
    }

    addCandidate(explicitApi);

    if (protocol === "file:") {
      addCandidate(localApi);
      addCandidate(productionApi);
      return candidates;
    }

    if (host === "localhost" || host === "127.0.0.1") {
      addCandidate(sameOriginApi);
      addCandidate(localApi);
      addCandidate(productionApi);
      return candidates;
    }

    addCandidate(sameOriginApi);
    if (allowProductionFallback) {
      addCandidate(productionApi);
    }

    return candidates;
  }

  function isLocalDevContext() {
    const protocol = window.location.protocol;
    const host = window.location.hostname;

    return (
      protocol === "file:" ||
      host === "localhost" ||
      host === "127.0.0.1"
    );
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
    const suggestions = root.querySelector("#chat-suggestions");
    const catalogs = await loadCatalogs(plans);

    const state = {
      catalogs,
      quiz: createEmptyQuizState()
    };

    ensureSession();
    const restoredHistory = await restoreMessages();
    restoreOpenState();
    syncSuggestions(restoredHistory);
    bindUI();
    bindForm();
    bindQuizButtons();

    if (!messages.children.length) {
      addMessage(DEFAULT_GREETING, "ai");
      syncSuggestions([]);
    }

    syncPanelAccessibility();
    return true;

    function ensureSession(options = {}) {
      if (options.forceNew) {
        localStorage.setItem(CHAT_SESSION_KEY, createSessionId());
        return localStorage.getItem(CHAT_SESSION_KEY);
      }

      if (!localStorage.getItem(CHAT_SESSION_KEY)) {
        localStorage.setItem(CHAT_SESSION_KEY, createSessionId());
      }

      return localStorage.getItem(CHAT_SESSION_KEY);
    }

    function syncPanelAccessibility() {
      const isOpen = !panel?.classList.contains("closed");
      toggle?.setAttribute("aria-expanded", String(Boolean(isOpen)));
    }

    function hasMeaningfulHistory(history) {
      return history.some((entry) => {
        if (entry?.kind === "offer") return true;
        if (entry?.type === "user") return true;
        return entry?.text && entry.text !== DEFAULT_GREETING;
      });
    }

    function syncSuggestions(history = readHistory()) {
      if (!suggestions) return;
      suggestions.style.display = hasMeaningfulHistory(history) ? "none" : "";
    }

    function bindUI() {
      toggle?.addEventListener("click", openOrTogglePanel);
      close?.addEventListener("click", closePanel);
      resetBtn?.addEventListener("click", resetChat);

      document.querySelectorAll("#open-chat").forEach((button) => {
        button.addEventListener("click", openPanel);
      });

      document.addEventListener("click", (event) => {
        const suggestionButton = event.target.closest(".chat-suggestion-btn");
        if (!suggestionButton || !root.contains(suggestionButton)) return;

        const text = suggestionButton.dataset.suggest;
        if (!text || !form || !input) return;

        input.value = text;
        if (typeof form.requestSubmit === "function") {
          form.requestSubmit();
        } else {
          form.dispatchEvent(new Event("submit", { cancelable: true }));
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
        syncSuggestions(readHistory());

        const data = await sendMessage(text);
        await handleResponse(data);
      });
    }

    function bindQuizButtons() {
      document.addEventListener("click", async (event) => {
        const button = event.target.closest(".chat-quiz-btn");
        if (!button || !root.contains(button)) return;

        if (button.dataset.persons) state.quiz.persons = button.dataset.persons;
        if (button.dataset.data) state.quiz.data = button.dataset.data;

        if (state.quiz.persons && state.quiz.data) {
          const message = `persons:${state.quiz.persons} data:${state.quiz.data}`;
          addMessage(
            `${state.quiz.persons} personer, ${formatDataLabel(state.quiz.data)}`,
            "user"
          );

          state.quiz = createEmptyQuizState();
          syncSuggestions(readHistory());

          const data = await sendMessage(message);
          await handleResponse(data);
          return;
        }

        if (button.dataset.speed) state.quiz.speed = button.dataset.speed;
        if (button.dataset.bredbandtype) {
          state.quiz.bredbandtype = button.dataset.bredbandtype;
        }

        if (state.quiz.speed && state.quiz.bredbandtype) {
          const message =
            `speed:${state.quiz.speed} ` +
            `bredbandtype:${state.quiz.bredbandtype}`;

          addMessage(
            `${formatSpeedLabel(state.quiz.speed)}, ` +
              `${formatBroadbandTypeLabel(state.quiz.bredbandtype)}`,
            "user"
          );

          state.quiz = createEmptyQuizState();
          syncSuggestions(readHistory());

          const data = await sendMessage(message);
          await handleResponse(data);
        }
      });
    }

    async function restoreMessages() {
      const history = readHistory().map(normalizeHistoryMessage).filter(Boolean);

      for (const message of history) {
        if (message.kind === "offer") {
          await renderOffer(message.payload, { persist: false });
          continue;
        }

        appendMessage(message.text, message.type, {
          format: message.format || "text"
        });
      }

      return history;
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
      syncPanelAccessibility();
    }

    function openPanel() {
      if (!panel) return;

      panel.classList.remove("closed");
      localStorage.setItem(CHAT_OPEN_KEY, "true");
      syncPanelAccessibility();
    }

    function closePanel() {
      if (!panel) return;

      panel.classList.add("closed");
      localStorage.setItem(CHAT_OPEN_KEY, "false");
      syncPanelAccessibility();
    }

    function resetChat() {
      if (!messages) return;

      messages.innerHTML = "";
      localStorage.removeItem(CHAT_HISTORY_KEY);
      ensureSession({ forceNew: true });
      state.quiz = createEmptyQuizState();

      addMessage(DEFAULT_GREETING, "ai");
      syncSuggestions([]);
    }

    async function sendMessage(message) {
      const sid = ensureSession();
      const headers = { "Content-Type": "application/json" };

      if (sid) {
        headers["X-Chat-Session"] = sid;
      }

      const apiCandidates = getChatApiCandidates();
      let lastError = null;

      try {
        for (const apiUrl of apiCandidates) {
          try {
            const response = await fetch(apiUrl, {
              method: "POST",
              headers,
              body: JSON.stringify({ message })
            });

            if (!response.ok) {
              if (response.status === 503) {
                try {
                  const payload = await response.json();
                  if (payload?.code === "AI_UNAVAILABLE") {
                    console.warn("Chat endpoint is reachable but AI is unavailable:", apiUrl);
                    continue;
                  }
                } catch (error) {
                  console.warn("Could not parse unavailable-AI response:", error);
                }
              }

              lastError = new Error(`Server error ${response.status} from ${apiUrl}`);
              console.warn("Chat endpoint returned an error:", apiUrl, response.status);
              continue;
            }

            const data = await response.json();
            if (data?.sessionId) {
              localStorage.setItem(CHAT_SESSION_KEY, data.sessionId);
            }

            return data;
          } catch (error) {
            lastError = error;
            console.warn("Chat request failed for endpoint:", apiUrl, error);
          }
        }
      } catch (error) {
        lastError = error;
      }

      console.error("All chat endpoints failed:", lastError);
      if (isLocalDevContext()) {
        return {
          reply:
            "Local backend unavailable. Start the backend on http://localhost:3000 to use the latest bredband chat logic.",
          format: "text"
        };
      }

      return {
        reply: "Connection error. Backend could not be reached.",
        format: "text"
      };
    }

    async function handleResponse(data) {
      if (data?.type === "offer") {
        await renderOffer(data.payload);
        return;
      }

      const reply = typeof data?.reply === "string" ? data.reply : "No response";
      addMessage(reply, "ai", {
        format: data?.format || detectReplyFormat(reply)
      });
    }

    async function findPlan(planId) {
      if (!planId) return null;

      const mobilePlans = state.catalogs.mobile || [];
      const broadbandPlans = state.catalogs.broadband || [];

      return (
        mobilePlans.find((item) => item.id === planId) ||
        broadbandPlans.find((item) => item.id === planId) ||
        null
      );
    }

    function isBroadbandPlan(plan, payload) {
      return Boolean(
        plan?.speed ||
          plan?.speedMbps ||
          payload?.speed ||
          payload?.category === "bredband"
      );
    }

    function buildOfferHref(plan, payload, broadband) {
      const operator = plan?.operator || payload?.operator || "";
      const planId = plan?.id || payload?.planId || "";
      const page = broadband ? "bredband.html" : "abonnemang.html";
      const params = new URLSearchParams();

      if (operator) params.set("op", operator);
      if (planId) params.set("plan", planId);

      const query = params.toString();
      return query ? `./${page}?${query}` : `./${page}`;
    }

    function buildFallbackOfferCard(plan, payload = {}) {
      const broadband = isBroadbandPlan(plan, payload);
      const operator = plan?.operator || payload.operator || "Dealett";
      const title =
        plan?.title ||
        (broadband ? "Rekommenderat bredband" : "Rekommenderat abonnemang");
      const price = formatMoney(plan?.price ?? payload.price);
      const feature = formatPlanFeature(plan, payload, broadband);
      const people =
        payload.persons && Number(payload.persons) > 1
          ? `${payload.persons} personer`
          : null;

      const card = document.createElement("div");
      card.className = "chat-offer-card";

      const eyebrow = document.createElement("p");
      eyebrow.className = "chat-offer-eyebrow";
      eyebrow.textContent = broadband
        ? "Rekommenderat bredband"
        : "Rekommenderat abonnemang";

      const titleEl = document.createElement("strong");
      titleEl.className = "chat-offer-title";
      titleEl.textContent = `${operator} ${title}`.trim();

      card.append(eyebrow, titleEl);

      [price, feature, people].filter(Boolean).forEach((value) => {
        const meta = document.createElement("p");
        meta.className = "chat-offer-meta";
        meta.textContent = value;
        card.appendChild(meta);
      });

      const link = document.createElement("a");
      link.className = "chat-offer-link";
      link.href = buildOfferHref(plan, payload, broadband);
      link.textContent = "\u00d6ppna erbjudandet";
      card.appendChild(link);

      return card;
    }

    async function renderOffer(payload, options = {}) {
      const { persist = true } = options;

      if (!payload || !messages) {
        addMessage("Kunde inte visa erbjudandet.", "ai");
        return;
      }

      const plan = await findPlan(payload.planId);
      const broadband = isBroadbandPlan(plan, payload);
      let card = null;

      if (!broadband && plan && typeof window.renderSingleOfferCard === "function") {
        try {
          card = window.renderSingleOfferCard(plan, payload);
        } catch (error) {
          console.warn("Could not render site offer card, using chat fallback:", error);
        }
      }

      if (!card) {
        card = buildFallbackOfferCard(plan, payload);
      }

      const wrapper = document.createElement("div");
      wrapper.className = "chat-msg ai";
      wrapper.appendChild(card);

      messages.appendChild(wrapper);
      messages.scrollTop = messages.scrollHeight;
      syncSuggestions(readHistory());

      if (persist) {
        saveHistory({
          kind: "offer",
          type: "ai",
          payload
        });
      }
    }

    function addMessage(text, type, options = {}) {
      const format = options.format || "text";

      appendMessage(text, type, { format });
      saveHistory({
        kind: "message",
        text,
        type,
        format
      });
    }

    function appendMessage(text, type, options = {}) {
      if (!messages) return;

      const div = document.createElement("div");
      div.className = `chat-msg ${type}`;

      if (type === "ai" && options.format === "html") {
        div.classList.add("rich-text");
        div.innerHTML = text;
      } else {
        div.classList.add("plain-text");
        div.textContent = text;
      }

      messages.appendChild(div);
      messages.scrollTop = messages.scrollHeight;
    }

    function saveHistory(entry) {
      const history = readHistory();
      history.push(entry);

      if (history.length > 100) {
        history.splice(0, history.length - 100);
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
