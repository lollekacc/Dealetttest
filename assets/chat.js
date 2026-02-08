console.log("chat.js EXECUTED");
const toggle = document.getElementById("chat-toggle");
const panel = document.getElementById("chat-panel");
const close = document.getElementById("chat-close");
const form = document.getElementById("chat-form");
const input = document.getElementById("chat-input");
const messages = document.getElementById("chat-messages");
const CHAT_OPEN_KEY = "chat_open";
const CHAT_HISTORY_KEY = "chat_history";
const quizState = {
  persons: null,
  data: null
};
if (!localStorage.getItem("chat_sid")) {
  localStorage.setItem(
  "chat_sid",
  (window.crypto && crypto.randomUUID)
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2)
);

}
async function waitForPlans() {
  while (!window.__PLANS__ || !window.__PLANS__.length) {
    await new Promise(r => setTimeout(r, 50));
  }
}

function restoreMessages() {
  const savedMessages =
    JSON.parse(localStorage.getItem(CHAT_HISTORY_KEY) || "[]");

  messages.innerHTML = "";

  savedMessages.forEach(m => {
    const div = document.createElement("div");
    div.className = `chat-msg ${m.type}`;
    div.innerHTML = m.text;
    messages.appendChild(div);
  });

  messages.scrollTop = messages.scrollHeight;
}
const resetBtn = document.getElementById("chat-reset");
if (resetBtn) {
  resetBtn.onclick = () => {
  messages.innerHTML = "";
  localStorage.removeItem(CHAT_HISTORY_KEY);

  const sid = (window.crypto && crypto.randomUUID)
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);
  localStorage.setItem("chat_sid", sid);

  quizState.persons = null;
  quizState.data = null;

  addMessage("Hej! Vad kan jag hjälpa dig med?", "ai");
};

}

if (!toggle || !panel || !close || !form || !input || !messages) {
  console.error("Chat elements missing");
} else {

  panel.classList.remove("closed");
localStorage.setItem(CHAT_OPEN_KEY, "true");

toggle.onclick = () => {
  panel.classList.toggle("closed");
  localStorage.setItem(
    CHAT_OPEN_KEY,
    !panel.classList.contains("closed")
  );
};
let lastScrollY = window.scrollY;

window.addEventListener("scroll", () => {
  const currentScroll = window.scrollY;

  // If user scrolls down more than 150px → minimize
  if (currentScroll > 150) {
    panel.classList.add("closed");
    localStorage.setItem(CHAT_OPEN_KEY, "false");
  }

  // If user scrolls back to top → open again
  if (currentScroll < 80) {
    panel.classList.remove("closed");
    localStorage.setItem(CHAT_OPEN_KEY, "true");
  }

  lastScrollY = currentScroll;
});

close.onclick = () => {
  panel.classList.add("closed");
  localStorage.setItem(CHAT_OPEN_KEY, "false");
};
restoreMessages();


function addMessage(text, type) {
  const div = document.createElement("div");
  div.className = `chat-msg ${type}`;
  div.innerHTML = text;  
  messages.appendChild(div);
  messages.scrollTop = messages.scrollHeight;

  const history =
    JSON.parse(localStorage.getItem(CHAT_HISTORY_KEY) || "[]");

  history.push({ text, type });
  if (history.length > 100) history.shift();
  localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(history));
  
}
async function renderOfferInChat(payload) {
  await waitForPlans();

  const plan = window.__PLANS__?.find(p => p.id === payload.planId);

  if (!plan || !window.renderSingleOfferCard) {
    addMessage("Kunde inte visa erbjudandet som kort. Öppnar sidan istället.", "ai");
    addMessage(
      `<button class="chat-plan-btn" onclick="window.location.href='/abonnemang.html?op=${encodeURIComponent(payload.operator)}'">
        Visa erbjudanden
      </button>`,
      "ai"
    );
    return;
  }

  const wrapper = document.createElement("div");
  wrapper.className = "chat-msg ai";
  wrapper.style.maxWidth = "100%";
  wrapper.style.width = "100%";

  const card = window.renderSingleOfferCard(plan, payload);

  wrapper.appendChild(card);
  messages.appendChild(wrapper);
  messages.scrollTop = messages.scrollHeight;

  const history =
    JSON.parse(localStorage.getItem(CHAT_HISTORY_KEY) || "[]");
  history.push({ text: wrapper.innerHTML, type: "ai" });
  localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(history));
}

document.addEventListener("click", e => {
  const btn = e.target.closest(".chat-quiz-btn");
  if (!btn) return;

  if (btn.dataset.persons) {
    quizState.persons = btn.dataset.persons;
  }

  if (btn.dataset.data) {
    quizState.data = btn.dataset.data;
  }

  // visual feedback (optional but recommended)
  btn.classList.add("selected");

  // only send when BOTH answers exist
  if (quizState.persons && quizState.data) {
    const msg = `persons:${quizState.persons} data:${quizState.data}`;

    addMessage(
      `${quizState.persons} personer, ${quizState.data} surf`,
      "user"
    );

    const sid = localStorage.getItem("chat_sid");
const headers = { "Content-Type": "application/json" };
if (sid) headers["X-Chat-Session"] = sid;

fetch("https://dealett-backend.onrender.com/api/chat", {
  method: "POST",
  headers,
      body: JSON.stringify({ message: msg })
      
    })
      .then(res => res.json())
.then(data => {
  if (data.type === "offer") {
    renderOfferInChat(data.payload);
    return;
  }
  addMessage(data.reply, "ai");
});



    // reset state
    quizState.persons = null;
    quizState.data = null;
  }
});
form.onsubmit = async e => {
  e.preventDefault();

  const text = input.value.trim();
  if (!text) return;

  addMessage(text, "user");
  input.value = "";

  try {
    const sid = localStorage.getItem("chat_sid");
    const headers = { "Content-Type": "application/json" };
    if (sid) headers["X-Chat-Session"] = sid;

    const response = await fetch("https://dealett-backend.onrender.com/api/chat", {
      method: "POST",
      headers,
      body: JSON.stringify({ message: text })
    });

    if (!response.ok) {
      addMessage("Server error. Try again.", "ai");
      return;
    }

    const data = await response.json();

    if (data.type === "offer") {
      renderOfferInChat(data.payload);
      return;
    }

    if (typeof data.reply === "string") {
      addMessage(data.reply, "ai");
      return;
    }

    addMessage("No AI response.", "ai");

  } catch (err) {
    console.error("Chat fetch failed:", err);
    addMessage("Connection error.", "ai");
  }
};

window.addEventListener("beforeunload", () => {
  localStorage.setItem(
    CHAT_OPEN_KEY,
    !panel.classList.contains("closed")
  );
});


}







