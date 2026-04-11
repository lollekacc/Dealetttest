const CART_KEY = "dealettCart";
const REWARD_OPTIONS = [
  { name: "ICA Maxi", logo: "https://detailproduktion.se/wp-content/uploads/2014/04/ica-maxi-stormarknad-logo.png" },
  { name: "Amazon", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/Amazon_logo.svg/2560px-Amazon_logo.svg.png" },
  { name: "MIO", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/MIO_Logo.svg/2560px-MIO_Logo.svg.png" },
  { name: "Coop", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/Coop_logo.svg/2560px-Coop_logo.svg.png" },
  { name: "H&M", logo: "https://upload.wikimedia.org/wikipedia/commons/5/53/H%26M-Logo.svg" },
  { name: "MQ", logo: "https://www.kungsmassan.se/Images/Butiker/MQMARQET_1080x1080.png" },
  { name: "Guldfynd", logo: "https://www.datocms-assets.com/138720/1732112442-guldfynd.png" },
  { name: "Hemtex", logo: "https://images.seeklogo.com/logo-png/32/1/hemtex-logo-png_seeklogo-329500.png" },
  { name: "Hemköp", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/ce/Hemkop_logo.svg/1280px-Hemkop_logo.svg.png" },
  { name: "Specsavers", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/78/Specsavers_logo.svg/1200px-Specsavers_logo.svg.png" },
  { name: "Synsam", logo: "https://kraftenifinspang.se/wp-content/uploads/2024/09/Loggor-centrumbutikerna_Synsam-1024x503.png" },
  { name: "SATS", logo: "https://cdn.sanity.io/images/xkmfhygb/production/7a8c8bd647ab4949343baef3fe30dc92281489e7-1920x1080.jpg" }
];

let revealObserver = null;

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function getCart() {
  return readJson(CART_KEY, []);
}

function getSavedState() {
  return readJson("dealettState", {});
}

function getSelectedOffer() {
  return readJson("selectedOffer", null);
}

function getRewardChoice() {
  return readJson("rewardChoice", null);
}

function getRewardDistribution() {
  return readJson("rewardDistribution", {});
}

function getCollectedNumbers() {
  return readJson("collectedNumbers", null);
}

function getLatestBindingEndDate(state = {}) {
  const dates = (state.bindingEndDatesByPerson || []).filter((date, index) => {
    return state.bindingsByPerson?.[index] === "yes" && Boolean(date);
  });

  if (!dates.length) return null;
  return [...dates].sort().at(-1) || null;
}

function isValidPhone(num) {
  const normalized = String(num || "").replace(/\s+/g, "");
  return /^07\d{8}$/.test(normalized) || /^\+467\d{8}$/.test(normalized);
}

function getRewardLogo(companyName) {
  return REWARD_OPTIONS.find(item => item.name === companyName)?.logo || "";
}

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function smoothScrollTo(element) {
  if (!element) return;

  const headerOffset = 96;
  const top = element.getBoundingClientRect().top + window.scrollY - headerOffset;

  window.scrollTo({
    top: Math.max(0, top),
    behavior: prefersReducedMotion() ? "auto" : "smooth"
  });
}

function observeRevealElements() {
  if (!revealObserver) {
    document.querySelectorAll(".reveal").forEach(element => {
      element.classList.add("is-visible");
    });
    return;
  }

  document.querySelectorAll(".reveal").forEach((element, index) => {
    if (element.dataset.revealBound === "true") return;
    element.dataset.revealBound = "true";
    if (!element.style.transitionDelay) {
      element.style.transitionDelay = `${Math.min(index * 70, 240)}ms`;
    }
    revealObserver.observe(element);
  });
}

function initRevealSystem() {
  if (prefersReducedMotion()) {
    document.querySelectorAll(".reveal").forEach(element => {
      element.classList.add("is-visible");
    });
    return;
  }

  revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");
      revealObserver.unobserve(entry.target);
    });
  }, {
    threshold: 0.16,
    rootMargin: "0px 0px -8% 0px"
  });

  observeRevealElements();
}

function getEffectiveSelectedOffer() {
  const selectedOffer = getSelectedOffer();
  if (selectedOffer) return selectedOffer;

  const cart = getCart();
  if (!cart.length) return null;

  const latestItem = cart.at(-1);
  return latestItem
    ? {
        id: latestItem.offerId,
        operator: latestItem.operator,
        title: latestItem.title,
        logo: latestItem.logo,
        finalPrice: latestItem.price,
        pricePerPerson: latestItem.pricePerPerson,
        rewardTotal: latestItem.rewardTotal,
        rewardMixLabel: latestItem.rewardMixLabel
      }
    : null;
}

function renderCartSummary() {
  const container = document.getElementById("cartSummaryContainer");
  if (!container) return;

  const cart = getCart();
  const selectedOffer = getEffectiveSelectedOffer();
  const rewardChoice = getRewardChoice();
  const rewardDistribution = getRewardDistribution();

  if (!cart.length && !selectedOffer) {
    container.innerHTML = `
      <div class="pro-card" style="padding:20px;">
        <p>Varukorgen är tom.</p>
      </div>
    `;
    observeRevealElements();
    return;
  }

  const offerPrice = selectedOffer?.finalPrice ?? selectedOffer?.price ?? 0;
  const offerBlock = selectedOffer ? `
    <div class="pro-card reveal" style="padding:20px;">
      <h3 style="margin-bottom:16px;">Valt abonnemang</h3>
      <div style="display:flex;align-items:center;gap:16px;">
        <img src="${escapeHtml(selectedOffer.logo || "")}" alt="${escapeHtml(selectedOffer.operator || "")}" style="width:52px;height:52px;object-fit:contain;border-radius:10px;">
        <div>
          <p><strong>${escapeHtml(selectedOffer.title || "Mobilabonnemang")}</strong></p>
          <p>${escapeHtml(selectedOffer.operator || "")}</p>
          <p><strong>${offerPrice} kr/mån</strong></p>
        </div>
      </div>
    </div>
  ` : "";

  const rewardRows = Object.entries(rewardDistribution)
    .map(([name, value]) => `<div>${escapeHtml(name)}: <strong>${Number(value) || 0} kr</strong></div>`)
    .join("");

  const rewardBlock = `
    <div class="pro-card reveal" style="padding:20px;">
      <h3 style="margin-bottom:16px;">Valt presentkort</h3>
      ${
        rewardChoice
          ? `
            <div style="display:flex;align-items:center;gap:16px;margin-bottom:12px;">
              <div style="width:52px;height:52px;border-radius:10px;display:flex;align-items:center;justify-content:center;background:#fff;">
                <img src="${escapeHtml(getRewardLogo(rewardChoice.company))}" alt="${escapeHtml(rewardChoice.company)}" style="max-width:42px;max-height:42px;object-fit:contain;">
              </div>
              <div>
                <p><strong>${escapeHtml(rewardChoice.company)}</strong></p>
                <p>${Number(rewardChoice.value) || 0} kr</p>
              </div>
            </div>
          `
          : rewardRows
            ? `<p>Preliminärt presentkortsvärde sparat från ditt val.</p>`
            : `<p>Ingen belöning vald.</p>`
      }
      ${rewardRows ? `<div style="display:grid;gap:8px;">${rewardRows}</div>` : ""}
    </div>
  `;

  const cartBlock = cart.length ? `
    <div class="pro-card reveal" style="padding:20px;">
      <h3 style="margin-bottom:16px;">Varukorg</h3>
      <div style="display:grid;gap:10px;">
        ${cart.map((item, index) => `
          <div style="display:flex;justify-content:space-between;gap:16px;">
            <span>${escapeHtml(item.title || `Abonnemang ${index + 1}`)}</span>
            <strong>${Number(item.price) || 0} kr/mån</strong>
          </div>
        `).join("")}
      </div>
    </div>
  ` : "";

  container.innerHTML = `
    <div class="summary-grid" style="display:grid;gap:20px;">
      ${offerBlock}
      ${rewardBlock}
      ${cartBlock}
    </div>
  `;

  observeRevealElements();
}

function bindContactStep() {
  const contactBtn = document.getElementById("contactContinueBtn");
  const emailInput = document.getElementById("contactEmail");
  const phoneInput = document.getElementById("contactPhone");

  if (!contactBtn) return;

  const savedEmail = localStorage.getItem("contactEmail") || "";
  const savedPhone = localStorage.getItem("contactPhone") || "";

  if (emailInput) emailInput.value = savedEmail;
  if (phoneInput) phoneInput.value = savedPhone;

  contactBtn.addEventListener("click", () => {
    const email = emailInput?.value.trim() || "";
    const phone = phoneInput?.value.trim() || "";

    if (!email || !phone) {
      alert("Fyll i både mejl och mobilnummer.");
      return;
    }

    localStorage.setItem("contactEmail", email);
    localStorage.setItem("contactPhone", phone);

    const numberSection = document.getElementById("numberSection");
    numberSection?.classList.remove("is-hidden");
    observeRevealElements();

    const storedNumbers = getCollectedNumbers();
    if (storedNumbers && Object.keys(storedNumbers).length) {
      finishNumbers(storedNumbers);
      smoothScrollTo(numberSection);
      return;
    }

    startNumberFlow();
  });
}

function startNumberFlow() {
  const numberSection = document.getElementById("numberSection");
  const phoneInputsContainer = document.getElementById("phoneInputsContainer");
  const confirmBtn = document.getElementById("confirmNumbersBtn");
  const title = document.getElementById("numberFlowTitle");
  const text = document.getElementById("numberFlowText");
  const abonState = getSavedState();

  if (!numberSection || !phoneInputsContainer || !confirmBtn || !title || !text) return;

  const totalPeople = abonState.persons || 1;
  let currentPerson = 1;
  const collectedNumbers = {};

  numberSection.classList.remove("is-hidden");
  confirmBtn.classList.remove("is-hidden");

  renderPersonStep();
  observeRevealElements();
  smoothScrollTo(numberSection);

  function renderPersonStep() {
    title.textContent = `Person ${currentPerson} av ${totalPeople}`;
    text.textContent = "Välj om numret ska flyttas eller om ett nytt nummer ska skapas.";

    phoneInputsContainer.innerHTML = `
      <div class="number-choice-wrap">
        <button type="button" class="number-choice-btn" data-choice="port">Flytta hit numret</button>
        <button type="button" class="number-choice-btn" data-choice="new">Skaffa nytt nummer</button>
      </div>
      <div id="numberDynamicArea"></div>
    `;

    const dynamicArea = document.getElementById("numberDynamicArea");
    let mode = null;

    phoneInputsContainer.querySelectorAll("[data-choice]").forEach(btn => {
      btn.addEventListener("click", () => {
        phoneInputsContainer.querySelectorAll("[data-choice]").forEach(x => x.classList.remove("active"));
        btn.classList.add("active");
        mode = btn.dataset.choice;

        if (mode === "port") {
          dynamicArea.innerHTML = `
            <div class="form-field" style="margin-top:16px;">
              <label for="portInput">Nummer för person ${currentPerson}</label>
              <input type="tel" id="portInput" placeholder="07XXXXXXXX eller +467XXXXXXXX">
            </div>
          `;
          return;
        }

        dynamicArea.innerHTML = `
          <div class="pro-card" style="margin-top:16px;padding:16px;">
            Nytt nummer kommer att skapas för person ${currentPerson}.
          </div>
        `;
      });
    });

    confirmBtn.textContent = currentPerson < totalPeople ? "Nästa person" : "Slutför";

    confirmBtn.onclick = () => {
      if (!mode) {
        alert("Välj hur du vill göra med numret.");
        return;
      }

      if (mode === "port") {
        const input = document.getElementById("portInput");
        const value = input?.value.trim() || "";

        if (!isValidPhone(value)) {
          alert("Ange ett giltigt svenskt nummer.");
          return;
        }

        collectedNumbers[`person_${currentPerson}`] = {
          type: "port",
          number: value
        };
      } else {
        collectedNumbers[`person_${currentPerson}`] = {
          type: "new",
          number: "nytt nummer"
        };
      }

      if (currentPerson < totalPeople) {
        currentPerson += 1;
        renderPersonStep();
      } else {
        finishNumbers(collectedNumbers);
      }
    };
  }
}

function renderStartDateStep() {
  const startDateSection = document.getElementById("startDateSection");
  const options = document.getElementById("startDateOptions");
  const text = document.getElementById("startDateText");
  const valueEl = document.getElementById("startDateValue");
  const goToSignBtn = document.getElementById("goToSignBtn");
  const abonState = getSavedState();

  if (!startDateSection || !options || !text || !valueEl || !goToSignBtn) return;

  startDateSection.classList.remove("is-hidden");
  options.innerHTML = `
    <button type="button" class="start-option" data-start="now">Starta nu</button>
    <button type="button" class="start-option" data-start="binding">Starta när sista bindningstiden slutar</button>
  `;

  let startChoice = null;
  let actualStartDate = localStorage.getItem("startDateChoice") || null;
  const today = new Date().toISOString().split("T")[0];
  const bindingDate = getLatestBindingEndDate(abonState);

  if (actualStartDate) {
    valueEl.textContent = actualStartDate;
    text.classList.remove("is-hidden");
  } else {
    text.classList.add("is-hidden");
  }

  document.querySelectorAll(".start-option").forEach(btn => {
    if (actualStartDate && btn.dataset.start === "now" && actualStartDate === today) {
      btn.classList.add("active");
      startChoice = "now";
    }

    if (actualStartDate && btn.dataset.start === "binding" && bindingDate && actualStartDate === bindingDate) {
      btn.classList.add("active");
      startChoice = "binding";
    }

    btn.addEventListener("click", () => {
      document.querySelectorAll(".start-option").forEach(x => x.classList.remove("active"));
      btn.classList.add("active");

      startChoice = btn.dataset.start;
      actualStartDate = null;

      if (startChoice === "now") {
        actualStartDate = today;
      }

      if (startChoice === "binding") {
        actualStartDate = bindingDate;
      }

      if (!actualStartDate) {
        alert("Det finns inget bindningsdatum valt.");
        return;
      }

      localStorage.setItem("startDateChoice", actualStartDate);
      valueEl.textContent = actualStartDate;
      text.classList.remove("is-hidden");
    });
  });

  observeRevealElements();

  goToSignBtn.onclick = () => {
    const storedStart = localStorage.getItem("startDateChoice");
    const storedNumbers = localStorage.getItem("collectedNumbers");

    if (!storedNumbers) {
      alert("Fyll i nummeruppgifter först.");
      return;
    }

    if (!storedStart || !startChoice && !actualStartDate) {
      alert("Välj när abonnemanget ska starta.");
      return;
    }

    window.location.href = "signera.html";
  };
}

function finishNumbers(collectedNumbers) {
  localStorage.setItem("collectedNumbers", JSON.stringify(collectedNumbers));

  const phoneInputsContainer = document.getElementById("phoneInputsContainer");
  const confirmBtn = document.getElementById("confirmNumbersBtn");
  const title = document.getElementById("numberFlowTitle");
  const text = document.getElementById("numberFlowText");

  if (!phoneInputsContainer || !confirmBtn || !title || !text) return;

  title.textContent = "Nummer uppdaterade";
  text.textContent = "Dina nummeruppgifter är sparade. Välj nu startdatum.";

  const numbersHtml = Object.entries(collectedNumbers).map(([key, data]) => `
    <div class="pro-card" style="padding:16px;">
      <p><strong>${escapeHtml(key.replace("person_", "Person "))}</strong></p>
      <p>${data.type === "port" ? `Flyttar nummer: <strong>${escapeHtml(data.number)}</strong>` : "Får nytt nummer"}</p>
    </div>
  `).join("");

  phoneInputsContainer.innerHTML = `
    <div class="summary-grid-numbers" style="display:grid;gap:12px;">
      ${numbersHtml}
    </div>
  `;

  confirmBtn.classList.add("is-hidden");
  renderStartDateStep();
  smoothScrollTo(document.getElementById("startDateSection"));
}

function restoreCheckoutProgress() {
  const savedNumbers = getCollectedNumbers();
  if (!savedNumbers || !Object.keys(savedNumbers).length) return;

  document.getElementById("numberSection")?.classList.remove("is-hidden");
  finishNumbers(savedNumbers);
}

document.addEventListener("DOMContentLoaded", initPage);

function initPage() {
  initRevealSystem();
  renderCartSummary();
  bindContactStep();
  restoreCheckoutProgress();
}
