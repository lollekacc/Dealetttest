// assets/chat.js

(function () {
  const CHAT_HISTORY_KEY = "chat_history";
  const CHAT_OPEN_KEY = "chat_open";
  const CHAT_SESSION_KEY = "chat_sid";
  const CHAT_CART_KEY = "dealettCart";
  const DEFAULT_GREETING = "Hej! Vad kan jag hj\u00e4lpa dig med?";

  const cachedCatalogs = {
    mobile: null,
    broadband: null
  };

  const CHAT_OPERATOR_LOGOS = {
    Tele2: "images/tele2.jpg",
    Telia: "images/telia.png",
    Telenor: "images/telenor.jpg",
    Tre: "images/tre.jpg",
    Halebop: "images/halebop.webp"
  };

  function readCartFallback() {
    try {
      const raw = localStorage.getItem(CHAT_CART_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  function addItemToCart(item) {
    if (window.cartAPI?.addToCart) {
      window.cartAPI.addToCart(item);
      return;
    }

    const cart = readCartFallback();
    cart.push(item);
    localStorage.setItem(CHAT_CART_KEY, JSON.stringify(cart));
    window.dispatchEvent(new Event("cartUpdated"));
  }

  function createChatUI() {
    if (document.querySelector('[data-chat-root]')) return;

    const chatHTML = `
<div id="dealett-chat" data-chat-root>
  <button
    id="chat-toggle"
    type="button"
    aria-controls="chat-panel"
    aria-expanded="false"
  >
    <span class="chat-toggle-dot" aria-hidden="true"></span>
    <span>Dealett-AI</span>
  </button>

  <div
    id="chat-panel"
    class="chat-panel closed"
    role="dialog"
    aria-label="Dealett chat"
  >
    <div class="chat-header">
      <div class="chat-header-left">
        <div class="chat-avatar" aria-hidden="true">D</div>
        <div>
          <strong>Dealett-AI</strong>
          <div class="chat-subtitle">
            Hj&auml;lper dig hitta r&auml;tt abonnemang eller 5G-bredband
          </div>
        </div>
      </div>

      <div class="chat-header-right">
        <button id="chat-reset" class="chat-reset-btn-header" type="button">
          Starta fr&auml;scht
        </button>
        <button id="chat-close" type="button" aria-label="St&auml;ng chatt">
          &times;
        </button>
      </div>
    </div>

    <div id="chat-messages" aria-live="polite" aria-atomic="false"></div>

    <div id="chat-suggestions" class="chat-suggestions">
      <button
        type="button"
        class="chat-suggestion-btn"
        data-suggest="Vilket mobilabonnemang passar mig?"
      >
        Vilket mobilabonnemang passar mig?
      </button>
      <button
        type="button"
        class="chat-suggestion-btn"
        data-suggest="Vilket 5G-bredband passar en familj?"
      >
        Vilket 5G-bredband passar en familj?
      </button>
      <button
        type="button"
        class="chat-suggestion-btn"
        data-suggest="Hur fungerar 5G-bredband hemma?"
      >
        Hur fungerar 5G-bredband hemma?
      </button>
    </div>

    <form id="chat-form">
      <input
        id="chat-input"
        type="text"
        placeholder="Fr&aring;ga om abonnemang eller 5G-bredband..."
        autocomplete="off"
      />
      <button type="submit">Skicka</button>
    </form>
  </div>
</div>
    `;

    document.body.insertAdjacentHTML('beforeend', chatHTML);

    const style = document.createElement('style');
    style.textContent = `
  #dealett-chat {
    position: fixed;
    right: 24px;
    bottom: 24px;
    z-index: 9999;
    font-family: "Segoe UI", system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
  }

  #chat-toggle {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    border: none;
    border-radius: 999px;
    background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
    color: #fff;
    padding: 14px 20px;
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    box-shadow:
      0 14px 36px rgba(15, 23, 42, 0.24),
      0 4px 12px rgba(15, 23, 42, 0.16);
    transition: transform 0.18s ease, box-shadow 0.18s ease;
  }

  #chat-toggle:hover {
    transform: translateY(-2px);
    box-shadow:
      0 18px 42px rgba(15, 23, 42, 0.28),
      0 6px 16px rgba(15, 23, 42, 0.18);
  }

  .chat-toggle-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: #22c55e;
    box-shadow: 0 0 0 6px rgba(34, 197, 94, 0.18);
  }

  .chat-panel {
    position: absolute;
    right: 0;
    bottom: 76px;
    width: min(390px, calc(100vw - 32px));
    height: min(640px, calc(100vh - 110px));
    display: flex;
    flex-direction: column;
    overflow: hidden;
    border-radius: 24px;
    background: #fff;
    border: 1px solid rgba(226, 232, 240, 0.9);
    box-shadow:
      0 30px 60px rgba(15, 23, 42, 0.18),
      0 8px 24px rgba(15, 23, 42, 0.08);
    transform-origin: bottom right;
    transition: opacity 0.2s ease, transform 0.2s ease;
  }

  .chat-panel.closed {
    opacity: 0;
    transform: translateY(12px) scale(0.97);
    pointer-events: none;
  }

  .chat-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding: 18px 20px;
    background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
    color: #fff;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  }

  .chat-header-left,
  .chat-header-right {
    display: flex;
    align-items: center;
  }

  .chat-header-left {
    gap: 12px;
  }

  .chat-header-right {
    gap: 8px;
  }

  .chat-avatar {
    width: 42px;
    height: 42px;
    border-radius: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255, 255, 255, 0.12);
    border: 1px solid rgba(255, 255, 255, 0.12);
    font-weight: 700;
  }

  .chat-header strong {
    display: block;
    font-size: 15px;
    letter-spacing: 0.01em;
  }

  .chat-subtitle {
    margin-top: 2px;
    font-size: 12px;
    color: rgba(255, 255, 255, 0.72);
  }

  .chat-reset-btn-header,
  #chat-close {
    border: none;
    cursor: pointer;
    transition: background 0.18s ease, color 0.18s ease;
  }

  .chat-reset-btn-header {
    padding: 9px 12px;
    border-radius: 10px;
    background: rgba(255, 255, 255, 0.1);
    color: rgba(255, 255, 255, 0.92);
    font-size: 12px;
    font-weight: 600;
  }

  .chat-reset-btn-header:hover,
  #chat-close:hover {
    background: rgba(255, 255, 255, 0.16);
  }

  #chat-close {
    width: 36px;
    height: 36px;
    border-radius: 10px;
    background: rgba(255, 255, 255, 0.08);
    color: #fff;
    font-size: 22px;
    line-height: 1;
  }

  #chat-messages {
    flex: 1;
    padding: 20px;
    background:
      radial-gradient(circle at top right, rgba(59, 130, 246, 0.05), transparent 30%),
      #f8fafc;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  #chat-messages::-webkit-scrollbar {
    width: 8px;
  }

  #chat-messages::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 999px;
  }

  .chat-msg {
    max-width: 100%;
    padding: 14px 16px;
    border-radius: 18px;
    line-height: 1.5;
    font-size: 14px;
    word-break: break-word;
  }

  .chat-msg.plain-text {
    white-space: pre-wrap;
  }

  .chat-msg.user {
    align-self: flex-end;
    max-width: 82%;
    background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
    color: #fff;
    border-bottom-right-radius: 6px;
    box-shadow: 0 10px 24px rgba(37, 99, 235, 0.22);
  }

  .chat-msg.ai {
    align-self: flex-start;
    background: #fff;
    color: #0f172a;
    border: 1px solid #e2e8f0;
    border-bottom-left-radius: 6px;
    box-shadow: 0 8px 22px rgba(15, 23, 42, 0.06);
  }

  .chat-msg.ai p,
  .chat-msg.ai strong,
  .chat-msg.ai b {
    margin: 0;
  }

  .chat-msg.ai .chat-quiz,
  .chat-msg.ai .chat-operator-plans,
  .chat-msg.ai .chat-offer-card {
    width: 100%;
  }

  .chat-msg.ai .chat-quiz {
    display: grid;
    gap: 12px;
  }

  .chat-msg.ai .quiz-card {
    padding: 12px;
    border-radius: 14px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
  }

  .chat-msg.ai .quiz-title {
    margin: 0 0 10px;
    font-weight: 700;
  }

  .chat-msg.ai .flex {
    display: flex;
  }

  .chat-msg.ai .flex-col {
    flex-direction: column;
  }

  .chat-msg.ai .gap-3 {
    gap: 12px;
  }

  .chat-msg.ai .chat-quiz-btn,
  .chat-msg.ai .chat-plan-btn,
  .chat-msg.ai .quiz-option,
  .chat-msg.ai .chat-answer-btn {
    width: 100%;
    border: 1px solid #cbd5e1;
    background: #fff;
    color: #0f172a;
    border-radius: 12px;
    padding: 10px 12px;
    font-size: 13px;
    text-align: left;
    cursor: pointer;
    transition: border-color 0.15s ease, background 0.15s ease, transform 0.15s ease;
  }

  .chat-msg.ai .chat-quiz-btn:hover,
  .chat-msg.ai .chat-plan-btn:hover,
  .chat-msg.ai .quiz-option:hover,
  .chat-msg.ai .chat-answer-btn:hover {
    border-color: #2563eb;
    background: #eff6ff;
    transform: translateY(-1px);
  }

  .chat-msg.ai .chat-answer-options {
    display: grid;
    gap: 8px;
    margin-top: 12px;
  }

  .chat-msg.ai .chat-operator {
    display: grid;
    gap: 12px;
  }

  .chat-msg.ai .chat-operator-logo {
    width: auto;
    max-width: 120px;
    max-height: 36px;
    object-fit: contain;
  }

  .chat-offer-card {
    display: grid;
    gap: 10px;
    padding: 14px;
    border-radius: 16px;
    background: linear-gradient(180deg, #f8fafc 0%, #fff 100%);
    border: 1px solid #dbe3ee;
  }

  .chat-offer-eyebrow {
    font-size: 12px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: #2563eb;
  }

  .chat-offer-title {
    font-size: 16px;
    font-weight: 700;
  }

  .chat-offer-meta {
    color: #334155;
    font-size: 13px;
  }

  .chat-offer-link {
    display: inline-flex;
    justify-content: center;
    align-items: center;
    min-height: 44px;
    padding: 0 14px;
    border: none;
    border-radius: 12px;
    background: #0f172a;
    color: #fff;
    font-size: 13px;
    font-weight: 600;
    font-family: inherit;
    text-decoration: none;
    cursor: pointer;
    transition: background 0.18s ease, transform 0.18s ease;
  }

  .chat-offer-link:hover {
    background: #1e293b;
    transform: translateY(-1px);
  }

  .chat-offer-link.is-added {
    background: #0f766e;
  }

  .chat-offer-link:disabled {
    cursor: default;
    opacity: 0.92;
  }

  .chat-recommendations {
    display: grid;
    gap: 12px;
    margin-top: 12px;
  }

  .chat-recommendation-card {
    display: grid;
    gap: 10px;
    padding: 14px;
    border-radius: 18px;
    background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
    border: 1px solid #dbe3ee;
  }

  .chat-recommendation-card--primary {
    border-color: #2563eb;
    box-shadow: 0 12px 28px rgba(37, 99, 235, 0.12);
  }

  .chat-recommendation-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  .chat-recommendation-label {
    display: inline-flex;
    align-items: center;
    padding: 5px 10px;
    border-radius: 999px;
    background: #eff6ff;
    color: #1d4ed8;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  .chat-recommendation-card--primary .chat-recommendation-label {
    background: #dbeafe;
  }

  .chat-recommendation-logo {
    width: auto;
    max-width: 92px;
    max-height: 28px;
    object-fit: contain;
  }

  .chat-recommendation-title {
    font-size: 16px;
    font-weight: 700;
  }

  .chat-recommendation-reason {
    color: #1e293b;
    font-size: 13px;
  }

  .chat-recommendation-meta {
    display: grid;
    gap: 6px;
    color: #334155;
    font-size: 13px;
  }

  .chat-recommendation-links {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }

  .chat-suggestions {
    padding: 12px;
    border-top: 1px solid rgba(226, 232, 240, 0.5);
    background: #f8fafc;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .chat-suggestion-btn {
    border: 1px solid rgba(148, 163, 184, 0.3);
    background: #fff;
    color: #334155;
    padding: 10px 12px;
    border-radius: 10px;
    font-size: 13px;
    cursor: pointer;
    text-align: left;
    transition: background 0.15s ease, border-color 0.15s ease;
  }

  .chat-suggestion-btn:hover {
    background: #f1f5f9;
    border-color: rgba(148, 163, 184, 0.5);
  }

  #chat-form {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 16px;
    background: #fff;
    border-top: 1px solid #e2e8f0;
  }

  #chat-input {
    flex: 1;
    height: 52px;
    border: 1px solid #dbe3ee;
    border-radius: 16px;
    padding: 0 16px;
    font-size: 14px;
    background: #f8fafc;
    color: #0f172a;
    transition: border-color 0.18s ease, box-shadow 0.18s ease, background 0.18s ease;
  }

  #chat-input:focus {
    outline: none;
    border-color: #2563eb;
    box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.12);
    background: #fff;
  }

  #chat-form button[type="submit"] {
    height: 52px;
    padding: 0 18px;
    border: none;
    border-radius: 16px;
    background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
    color: #fff;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    box-shadow: 0 10px 22px rgba(37, 99, 235, 0.22);
    transition: transform 0.18s ease, box-shadow 0.18s ease;
  }

  #chat-form button[type="submit"]:hover {
    transform: translateY(-1px);
    box-shadow: 0 14px 28px rgba(37, 99, 235, 0.28);
  }

  @media (max-width: 520px) {
    #dealett-chat {
      right: 0;
      bottom: 0;
      left: 0;
    }

    .chat-panel {
      width: 100vw;
      height: 100vh;
      right: 0;
      bottom: 0;
      border-radius: 0;
    }

    #chat-toggle {
      position: fixed;
      right: 16px;
      bottom: 16px;
    }
  }
    `;
    document.head.appendChild(style);
  }

  async function loadJsonArray(url) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      return Array.isArray(data) ? data : null;
    } catch {
      return null;
    }
  }

  function getCatalogCandidates(type) {
    const candidates = [];
    const explicitUrl =
      typeof window.APP?.catalogUrls?.[type] === "string"
        ? window.APP.catalogUrls[type].trim()
        : "";
    const staticUrl = type === "mobile" ? "./data/plans.json" : "./data/5Gbredband.json";
    const apiPath = type === "mobile" ? "/api/data/plans" : "/api/data/broadband";
    const allowProductionFallback = window.APP?.allowProductionFallback === true;
    const protocol = window.location.protocol;
    const host = window.location.hostname;
    const port = window.location.port;
    const origin = window.location.origin;
    const localApiUrl = `http://localhost:3000${apiPath}`;
    const productionApiUrl = `https://dealett-backend.onrender.com${apiPath}`;
    const sameOriginApiUrl =
      origin && origin !== "null" ? `${origin.replace(/\/$/, "")}${apiPath}` : "";

    function addCandidate(url) {
      if (!url || candidates.includes(url)) return;
      candidates.push(url);
    }

    addCandidate(explicitUrl);
    addCandidate(staticUrl);

    if (protocol === "file:") {
      addCandidate(localApiUrl);
      if (allowProductionFallback) {
        addCandidate(productionApiUrl);
      }
      return candidates;
    }

    if (host === "localhost" || host === "127.0.0.1") {
      if (port === "3000") {
        addCandidate(sameOriginApiUrl);
      }
      addCandidate(localApiUrl);
      if (allowProductionFallback) {
        addCandidate(productionApiUrl);
      }
      return candidates;
    }

    addCandidate(sameOriginApiUrl);
    if (allowProductionFallback) {
      addCandidate(productionApiUrl);
    }

    return candidates;
  }

  async function loadCatalog(type) {
    const candidates = getCatalogCandidates(type);

    for (const url of candidates) {
      const data = await loadJsonArray(url);
      if (Array.isArray(data)) {
        return data;
      }
    }

    return [];
  }

  async function loadCatalogs(providedPlans) {
    if (Array.isArray(providedPlans) && providedPlans.length) {
      cachedCatalogs.mobile = providedPlans;
    } else if (!Array.isArray(cachedCatalogs.mobile)) {
      cachedCatalogs.mobile = await loadCatalog("mobile");
    }

    if (!Array.isArray(cachedCatalogs.broadband)) {
      cachedCatalogs.broadband = await loadCatalog("broadband");
    }

    return {
      mobile: cachedCatalogs.mobile,
      broadband: cachedCatalogs.broadband
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

    if (entry.kind === "selection" && entry.payload) {
      return entry;
    }

    if (entry.kind === "recommendations" && entry.payload) {
      return entry;
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
    if (type === "mobil") return "5G-bredband";
    if (type === "5g") return "5G-bredband";
    if (type === "any") return "5G-bredband";
    return type || "";
  }

  function formatMoney(value) {
    const amount = Number(value);
    if (!Number.isFinite(amount)) {
      return null;
    }

    return `${amount.toLocaleString("sv-SE")} kr/m\u00e5n`;
  }

  function formatSek(value) {
    const amount = Number(value);
    if (!Number.isFinite(amount)) {
      return null;
    }

    return `${Math.round(amount).toLocaleString("sv-SE")} kr`;
  }

  function formatPricePerPerson(value) {
    const amount = Number(value);
    if (!Number.isFinite(amount)) {
      return null;
    }

    return `${Math.round(amount).toLocaleString("sv-SE")} kr/person`;
  }

  function formatKrPerGb(value) {
    const amount = Number(value);
    if (!Number.isFinite(amount)) {
      return null;
    }

    return `${amount.toLocaleString("sv-SE", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 1
    })} kr/GB`;
  }

  function formatLikelyReward(offer = {}) {
    const reward = Number(offer.likelyReward);
    if (!Number.isFinite(reward) || reward <= 0) {
      return null;
    }

    const rewardType =
      offer.likelyRewardType === "renewal" ? "vid f\u00f6rl\u00e4ngning" : "som ny kund";
    return `Presentkort: ${formatSek(reward)} ${rewardType}`;
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
    const port = window.location.port;
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
      if (port === "3000") {
        addCandidate(sameOriginApi);
      }
      addCandidate(localApi);
      if (allowProductionFallback) {
        addCandidate(productionApi);
      }
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
    createChatUI();
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
        const answerButton = event.target.closest(".chat-answer-btn");
        if (answerButton && root.contains(answerButton)) {
          const text = answerButton.dataset.chatAnswer;
          if (text && form && input) {
            input.value = text;
            if (typeof form.requestSubmit === "function") {
              form.requestSubmit();
            } else {
              form.dispatchEvent(new Event("submit", { cancelable: true }));
            }
          }
          return;
        }

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
        if (message.kind === "selection") {
          await renderSelection(message.payload, { persist: false });
          continue;
        }

        if (message.kind === "recommendations") {
          await renderRecommendations(message.payload, { persist: false });
          continue;
        }

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
            "Local backend unavailable. Start the backend on http://localhost:3000 to use the latest 5G-bredband chat logic.",
          format: "text"
        };
      }

      return {
        reply: "Connection error. Backend could not be reached.",
        format: "text"
      };
    }

    async function handleResponse(data) {
      if (data?.type === "selection") {
        await renderSelection(data.payload);
        return;
      }

      if (data?.type === "recommendations") {
        await renderRecommendations(data.payload);
        return;
      }

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

    function calculateChatMobileReward(price, rewardType = "new") {
      const amount = Number(price);
      if (!Number.isFinite(amount) || amount <= 0) {
        return 0;
      }

      let reward = 0;

      if (amount < 299) reward = 2000;
      else if (amount < 399) reward = 3000;
      else if (amount < 499) reward = 4000;
      else if (amount < 699) reward = 5000;
      else reward = 1000;

      return rewardType === "renewal" ? Math.round(reward / 2) : reward;
    }

    function calculateChatBroadbandReward(price) {
      const amount = Number(price);
      if (!Number.isFinite(amount) || amount <= 0) {
        return 0;
      }

      if (amount < 299) return 1000;
      if (amount < 399) return 2000;
      if (amount < 499) return 3000;
      if (amount < 699) return 4000;
      return 5000;
    }

    function getChatOfferLogo(plan, payload = {}) {
      const operator = plan?.operator || payload?.operator || "";
      return plan?.logo || payload?.logo || CHAT_OPERATOR_LOGOS[operator] || "";
    }

    function getChatOfferMonthlyPrice(plan, payload = {}, broadband = false) {
      const familyTotal = Number(payload?.totalPrice);
      if (!broadband && Number(payload?.persons) > 1 && Number.isFinite(familyTotal) && familyTotal > 0) {
        return familyTotal;
      }

      const payloadPrice = Number(payload?.price);
      if (Number.isFinite(payloadPrice) && payloadPrice > 0) {
        return payloadPrice;
      }

      const planPrice = Number(plan?.price);
      return Number.isFinite(planPrice) && planPrice > 0 ? planPrice : 0;
    }

    function getChatOfferRewardTotal(plan, payload = {}, broadband = false) {
      const explicitReward = Number(payload?.likelyReward ?? payload?.rewardTotal ?? payload?.reward);
      if (Number.isFinite(explicitReward) && explicitReward > 0) {
        return Math.round(explicitReward);
      }

      const monthlyPrice = getChatOfferMonthlyPrice(plan, payload, broadband);
      if (!monthlyPrice) {
        return 0;
      }

      return broadband
        ? calculateChatBroadbandReward(monthlyPrice)
        : calculateChatMobileReward(monthlyPrice, payload?.likelyRewardType);
    }

    function buildChatCartItem(plan, payload = {}, broadband = false) {
      const operator = plan?.operator || payload?.operator || "Dealett";
      const offerId =
        plan?.id ||
        payload?.planId ||
        `${operator.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`;
      const price = getChatOfferMonthlyPrice(plan, payload, broadband);
      const rewardTotal = getChatOfferRewardTotal(plan, payload, broadband);
      const featureLabel = formatPlanFeature(plan, payload, broadband);
      const persons = Number(payload?.persons) || 1;
      const bindingMonths = Number(plan?.bindingMonths ?? payload?.bindingMonths);
      const bindingLabel = broadband
        ? Number.isFinite(bindingMonths) && bindingMonths > 0
          ? `${bindingMonths} mån bindningstid`
          : "Ingen bindningstid"
        : payload?.bindingLabel || payload?.binding || "Ej angivet";

      return {
        type: broadband ? "bredband" : "mobil",
        offerId,
        operator,
        title:
          plan?.title ||
          payload?.title ||
          (broadband ? payload?.speed || "Bredband" : payload?.data || "Mobilabonnemang"),
        logo: getChatOfferLogo(plan, payload),
        price,
        monthlyPrice: price,
        pricePerPerson:
          persons > 1 && Number.isFinite(Number(payload?.pricePerLine))
            ? Math.round(Number(payload.pricePerLine))
            : null,
        data: broadband ? null : payload?.data || plan?.data || featureLabel || null,
        dataLabel: broadband ? null : featureLabel || payload?.data || plan?.data || null,
        speed: broadband ? plan?.speed || payload?.speed || null : null,
        speedMbps: broadband
          ? Number(plan?.speedMbps ?? payload?.speedMbps) || null
          : null,
        binding: broadband
          ? Number.isFinite(bindingMonths) && bindingMonths > 0
            ? bindingMonths
            : 0
          : bindingLabel,
        bindingLabel,
        rewardTotal,
        rewardMixLabel:
          rewardTotal > 0
            ? payload?.likelyRewardType === "renewal"
              ? "Förlängning"
              : "Preliminärt presentkort"
            : "",
        rewards: rewardTotal > 0 ? { Presentkort: rewardTotal } : {}
      };
    }

    function persistChatCartSelection(item) {
      localStorage.removeItem("rewardChoice");
      localStorage.setItem("rewardDistribution", JSON.stringify(item.rewards || {}));
      localStorage.removeItem("collectedNumbers");
      localStorage.removeItem("startDateChoice");
      localStorage.removeItem("contactEmail");
      localStorage.removeItem("contactPhone");

      localStorage.setItem(
        "selectedOffer",
        JSON.stringify({
          id: item.offerId,
          operator: item.operator,
          title: item.title,
          logo: item.logo,
          finalPrice: item.price,
          pricePerPerson: item.pricePerPerson,
          rewardTotal: item.rewardTotal,
          rewardMixLabel: item.rewardMixLabel || ""
        })
      );
    }

    function openCartDestination() {
      if (typeof window.openCart === "function") {
        window.openCart();
        return;
      }

      window.location.href = "./varukorg.html";
    }

    function handleChatOfferChoice({ plan = null, payload = {}, broadband = false, trigger = null } = {}) {
      const item = buildChatCartItem(plan, payload, broadband);
      addItemToCart(item);
      persistChatCartSelection(item);

      if (trigger) {
        trigger.disabled = true;
        trigger.classList.add("is-added");
        trigger.textContent = "Tillagd i varukorgen";
      }

      openCartDestination();
    }

    function createChatOfferButton({ plan = null, payload = {}, broadband = false } = {}) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "chat-offer-link";
      button.textContent = "Lägg i varukorgen";
      button.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        handleChatOfferChoice({
          plan,
          payload,
          broadband,
          trigger: button
        });
      });
      return button;
    }

    function bindOfferCardDirectAdd(card, config = {}) {
      if (!card || card.dataset.chatCartBound === "true") {
        return;
      }

      card.dataset.chatCartBound = "true";
      card.addEventListener("click", (event) => {
        if (event.target.closest("a")) {
          return;
        }

        handleChatOfferChoice(config);
      });
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

      card.appendChild(
        createChatOfferButton({
          plan,
          payload,
          broadband
        })
      );

      return card;
    }

    function buildRecommendationCard(offer = {}) {
      const broadband = offer.category === "bredband" || Boolean(offer.speed);
      const card = document.createElement("article");
      card.className = "chat-recommendation-card";

      if (Number(offer.rank) === 1) {
        card.classList.add("chat-recommendation-card--primary");
      }

      const top = document.createElement("div");
      top.className = "chat-recommendation-top";

      const label = document.createElement("span");
      label.className = "chat-recommendation-label";
      label.textContent = offer.label || "Alternativ";
      top.appendChild(label);

      if (offer.logo) {
        const logo = document.createElement("img");
        logo.className = "chat-recommendation-logo";
        logo.src = offer.logo;
        logo.alt = offer.operator || "Operator";
        top.appendChild(logo);
      }

      card.appendChild(top);

      const title = document.createElement("strong");
      title.className = "chat-recommendation-title";
      title.textContent = [offer.operator, offer.title].filter(Boolean).join(" ").trim();
      card.appendChild(title);

      if (offer.reason) {
        const reason = document.createElement("p");
        reason.className = "chat-recommendation-reason";
        reason.textContent = offer.reason;
        card.appendChild(reason);
      }

      const meta = document.createElement("div");
      meta.className = "chat-recommendation-meta";

      if (!broadband) {
        if (offer.persons && Number(offer.persons) > 1 && offer.totalPrice) {
          const total = document.createElement("div");
          total.textContent = `Ca ${formatMoney(offer.totalPrice)} totalt for ${offer.persons} personer`;
          meta.appendChild(total);

          if (offer.pricePerLine) {
            const perLine = document.createElement("div");
            perLine.textContent = `Ca ${formatPricePerPerson(offer.pricePerLine)}`;
            meta.appendChild(perLine);
          }
        } else if (offer.price) {
          const price = document.createElement("div");
          price.textContent = formatMoney(offer.price);
          meta.appendChild(price);
        }

        const dataLabel = formatPlanFeature(
          {
            dataAmount: offer.dataAmount,
            data: offer.data
          },
          offer,
          false
        );
        if (dataLabel) {
          const data = document.createElement("div");
          data.textContent = dataLabel;
          meta.appendChild(data);
        }

        if (offer.familyAddonPrice && offer.persons && Number(offer.persons) > 1) {
          const family = document.createElement("div");
          family.textContent = `Extra familjelinje ${formatMoney(offer.familyAddonPrice)}`;
          meta.appendChild(family);
        }

        const valuePerGb = formatKrPerGb(offer.valuePerGb);
        if (valuePerGb) {
          const value = document.createElement("div");
          value.textContent = `V\u00e4rde: ${valuePerGb}`;
          meta.appendChild(value);
        }

        const comparisonSummary = offer.currentPlanComparisonSummary;
        if (comparisonSummary) {
          const comparison = document.createElement("div");
          comparison.textContent = `J\u00e4mf\u00f6rt med idag: ${comparisonSummary}`;
          meta.appendChild(comparison);
        }

        const rewardSummary = formatLikelyReward(offer);
        if (rewardSummary) {
          const reward = document.createElement("div");
          reward.textContent = rewardSummary;
          meta.appendChild(reward);
        }
      } else {
        if (offer.price) {
          const price = document.createElement("div");
          price.textContent = formatMoney(offer.price);
          meta.appendChild(price);
        }

        if (offer.speed) {
          const speed = document.createElement("div");
          speed.textContent = `${offer.speed} Mbit/s`;
          meta.appendChild(speed);
        }

        const rewardSummary = formatLikelyReward(offer);
        if (rewardSummary) {
          const reward = document.createElement("div");
          reward.textContent = rewardSummary;
          meta.appendChild(reward);
        }
      }

      if (offer.description) {
        const description = document.createElement("div");
        description.textContent = offer.description;
        meta.appendChild(description);
      }

      card.appendChild(meta);

      const links = document.createElement("div");
      links.className = "chat-recommendation-links";

      links.appendChild(
        createChatOfferButton({
          plan: {
            id: offer.planId,
            operator: offer.operator,
            logo: offer.logo,
            title: offer.title,
            price: offer.price,
            data: offer.data,
            dataAmount: offer.dataAmount,
            speed: offer.speed,
            speedMbps: offer.speedMbps
          },
          payload: offer,
          broadband
        })
      );

      card.appendChild(links);
      return card;
    }

    async function renderSelection(payload, options = {}) {
      const { persist = true } = options;

      if (!payload || !payload.offer || !messages) {
        addMessage("Kunde inte visa ditt val.", "ai");
        return;
      }

      const wrapper = document.createElement("div");
      wrapper.className = "chat-msg ai";

      if (payload.intro) {
        const intro = document.createElement("p");
        intro.textContent = payload.intro;
        wrapper.appendChild(intro);
      }

      const selectionCard = buildRecommendationCard({
        ...payload.offer,
        label: payload.offer.label || "Valt"
      });
      selectionCard.classList.add("chat-recommendation-card--primary");
      wrapper.appendChild(selectionCard);

      if (payload.summary) {
        const summary = document.createElement("div");
        summary.className = "chat-recommendation-meta";

        if (payload.summary.provider) {
          const provider = document.createElement("div");
          provider.textContent = `Vald operator: ${payload.summary.provider}`;
          summary.appendChild(provider);
        }

        if (payload.summary.totalPrice) {
          const totalPrice = document.createElement("div");
          totalPrice.textContent = `Totalt: ${formatMoney(payload.summary.totalPrice)}`;
          summary.appendChild(totalPrice);
        }

        if (payload.summary.pricePerPerson) {
          const pricePerPerson = document.createElement("div");
          pricePerPerson.textContent = formatPricePerPerson(payload.summary.pricePerPerson);
          summary.appendChild(pricePerPerson);
        }

        if (payload.summary.includedData) {
          const data = document.createElement("div");
          data.textContent = `Surf: ${payload.summary.includedData}`;
          summary.appendChild(data);
        }

        if (payload.summary.currentPlanComparisonSummary) {
          const comparison = document.createElement("div");
          comparison.textContent = `J\u00e4mf\u00f6rt med idag: ${payload.summary.currentPlanComparisonSummary}`;
          summary.appendChild(comparison);
        }

        if (payload.summary.likelyReward) {
          const reward = document.createElement("div");
          reward.textContent = formatLikelyReward({
            likelyReward: payload.summary.likelyReward,
            likelyRewardType: payload.summary.likelyRewardType
          });
          summary.appendChild(reward);
        }

        if (payload.summary.reason) {
          const reason = document.createElement("div");
          reason.textContent = `Varfor det passar: ${payload.summary.reason}`;
          summary.appendChild(reason);
        }

        wrapper.appendChild(summary);
      }

      messages.appendChild(wrapper);
      messages.scrollTop = messages.scrollHeight;
      syncSuggestions(readHistory());

      if (persist) {
        saveHistory({
          kind: "selection",
          type: "ai",
          payload
        });
      }
    }

    async function renderRecommendations(payload, options = {}) {
      const { persist = true } = options;

      if (!payload || !messages || !Array.isArray(payload.offers) || !payload.offers.length) {
        addMessage("Kunde inte visa rekommendationerna.", "ai");
        return;
      }

      const wrapper = document.createElement("div");
      wrapper.className = "chat-msg ai";

      if (payload.intro) {
        const intro = document.createElement("p");
        intro.textContent = payload.intro;
        wrapper.appendChild(intro);
      }

      const list = document.createElement("div");
      list.className = "chat-recommendations";

      payload.offers.forEach((offer) => {
        list.appendChild(buildRecommendationCard(offer));
      });

      wrapper.appendChild(list);
      messages.appendChild(wrapper);
      messages.scrollTop = messages.scrollHeight;
      syncSuggestions(readHistory());

      if (persist) {
        saveHistory({
          kind: "recommendations",
          type: "ai",
          payload
        });
      }
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

      if (card.classList?.contains("offer-choice")) {
        bindOfferCardDirectAdd(card, {
          plan,
          payload,
          broadband
        });
      }

      const wrapper = document.createElement("div");
      wrapper.className = "chat-msg ai";
      wrapper.appendChild(card);

      if (card.classList?.contains("offer-choice")) {
        const actions = document.createElement("div");
        actions.className = "chat-recommendation-links";
        actions.appendChild(
          createChatOfferButton({
            plan,
            payload,
            broadband
          })
        );
        wrapper.appendChild(actions);
      }

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
