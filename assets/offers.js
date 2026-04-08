let offersContainer = null;
let offersSection = null;
let ALL_PLANS = [];

window.offerChosen = false;
window.beloningChosen = false;
window.selectedOfferId = null;

const abonState = window.abonState || {
  persons: null,
  data: null,
  operator: null,
  binding: null,
  bindingEndDate: null,
  wishes: [],
  operatorsByPerson: []
};

window.abonState = abonState;

const COVERAGE_BONUS_BY_OPERATOR = {
  Telia: 4,
  Halebop: 3.75,
  Telenor: 2.5,
  Tele2: 2.25,
  Tre: 1.75
};

const OPERATOR_WISH_ALIASES = {
  Tele2: ["tele2"],
  Telia: ["telia"],
  Telenor: ["telenor"],
  Tre: ["tre"],
  Halebop: ["halebop"]
};

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

document.addEventListener("DOMContentLoaded", initPage);

async function initPage() {
  hydrateElements();
  resetTransientFlowStorage();
  restoreSavedState();
  await loadShell();
  initHeroSlider();
  initWishInput();
  initShowMorePersons();
  await loadPlans();
  initQuiz();
  preselectFromUrl();
  showInitialOffersIfNeeded();
  updateAvailability();
  bindContactStep();
  bindNumberFlowBase();
}

function hydrateElements() {
  offersContainer = document.getElementById("offers-container");
  offersSection = document.getElementById("offersSection");
}

function resetTransientFlowStorage() {
  localStorage.removeItem("rewardChoice");
  localStorage.removeItem("rewardDistribution");
  localStorage.removeItem("selectedOffer");
  localStorage.removeItem("collectedNumbers");
  localStorage.removeItem("startDateChoice");
}

function restoreSavedState() {
  try {
    const savedState = localStorage.getItem("dealettState");
    if (savedState) Object.assign(abonState, JSON.parse(savedState));
  } catch (err) {
    console.warn("Could not restore state:", err);
  }

  abonState.wishes = Array.isArray(abonState.wishes) ? abonState.wishes : [];
  abonState.operatorsByPerson = Array.isArray(abonState.operatorsByPerson)
    ? abonState.operatorsByPerson
    : [];
}

function persistState() {
  try {
    localStorage.setItem("dealettState", JSON.stringify({
      ...abonState,
      wishes: Array.isArray(abonState.wishes) ? abonState.wishes : [],
      operatorsByPerson: Array.isArray(abonState.operatorsByPerson)
        ? abonState.operatorsByPerson
        : []
    }));
  } catch (err) {
    console.warn("Could not persist state:", err);
  }
}

async function loadShell() {
  const headerPlaceholder = document.getElementById("header-placeholder");

  try {
    const headerRes = await fetch("./partials/header.html");
    if (headerRes.ok && headerPlaceholder) {
      headerPlaceholder.innerHTML = await headerRes.text();
    }
  } catch (err) {
    console.warn("Header load failed:", err);
  }

  try {
    const footerRes = await fetch("./partials/footer.html");
    if (footerRes.ok) {
      document.body.insertAdjacentHTML("beforeend", await footerRes.text());
    }
  } catch (err) {
    console.warn("Footer load failed:", err);
  }
}

function initHeroSlider() {
  const slider = document.getElementById("heroSlider");
  const dots = [...document.querySelectorAll(".hero-dot")];
  const prevBtn = document.getElementById("heroPrevBtn");
  const nextBtn = document.getElementById("heroNextBtn");

  if (!slider || !dots.length) return;

  let currentSlide = 0;
  const totalSlides = slider.children.length;
  const autoInterval = 6000;
  let timer = null;

  function updateDots() {
    dots.forEach((dot, i) => dot.classList.toggle("active", i === currentSlide));
  }

  function goToSlide(index) {
    currentSlide = index;
    slider.scrollTo({
      left: slider.clientWidth * currentSlide,
      behavior: "smooth"
    });
    updateDots();
  }

  function nextSlide(step = 1) {
    currentSlide = (currentSlide + step + totalSlides) % totalSlides;
    goToSlide(currentSlide);
  }

  function restartTimer() {
    clearInterval(timer);
    timer = setInterval(() => nextSlide(1), autoInterval);
  }

  prevBtn?.addEventListener("click", () => {
    nextSlide(-1);
    restartTimer();
  });

  nextBtn?.addEventListener("click", () => {
    nextSlide(1);
    restartTimer();
  });

  dots.forEach(dot => {
    dot.addEventListener("click", () => {
      goToSlide(Number(dot.dataset.slide));
      restartTimer();
    });
  });

  window.addEventListener("resize", () => goToSlide(currentSlide));
  updateDots();
  restartTimer();
}

async function loadPlans() {
  if (ALL_PLANS.length) return ALL_PLANS;
  const res = await fetch("./data/plans.json");
  ALL_PLANS = await res.json();
  return ALL_PLANS;
}

function initQuiz() {
  bindPersons();
  bindData();
  bindBinding();
  renderOperators(abonState.persons || 1);
  restoreSelectionsUI();

  if (isQuizComplete()) {
    updateOffers();
  }
}

function bindPersons() {
  document.querySelectorAll("[data-persons]").forEach(btn => {
    btn.addEventListener("click", () => {
      abonState.persons = Number(btn.dataset.persons);
      setSelectedInScope(btn, "[data-persons]");
      renderOperators(abonState.persons);

      window.offerChosen = false;
      window.beloningChosen = false;
      clearRewardAndNextSteps();

      persistState();
      updateAvailability();
      updateOffers();
    });
  });
}

function bindData() {
  document.querySelectorAll("[data-data]").forEach(btn => {
    btn.addEventListener("click", () => {
      if (btn.classList.contains("disabled-option")) return;

      abonState.data = btn.dataset.data;
      setSelectedInScope(btn, "[data-data]");

      window.offerChosen = false;
      window.beloningChosen = false;
      clearRewardAndNextSteps();

      persistState();
      updateAvailability();
      updateOffers();
    });
  });
}

function bindBinding() {
  const bindingDateWrapper = document.getElementById("bindingDateWrapper");
  const bindingInput = document.getElementById("bindingEndDate");

  document.querySelectorAll("[data-binding]").forEach(btn => {
    btn.addEventListener("click", () => {
      abonState.binding = btn.dataset.binding;
      setSelectedInScope(btn, "[data-binding]");

      if (abonState.binding === "yes") {
        bindingDateWrapper?.classList.remove("is-hidden");
      } else {
        abonState.bindingEndDate = null;
        if (bindingInput) bindingInput.value = "";
        bindingDateWrapper?.classList.add("is-hidden");
      }

      window.offerChosen = false;
      window.beloningChosen = false;
      clearRewardAndNextSteps();

      persistState();
      updateOffers();
    });
  });

  bindingInput?.addEventListener("change", () => {
    abonState.bindingEndDate = bindingInput.value || null;
    persistState();
  });
}

function initShowMorePersons() {
  const btn = document.getElementById("showMorePersons");
  const extra = document.getElementById("personsExtra");
  if (!btn || !extra) return;

  btn.addEventListener("click", () => {
    extra.classList.toggle("is-hidden");
    btn.textContent = extra.classList.contains("is-hidden") ? "Visa fler" : "Visa färre";
  });
}

function initWishInput() {
  const input = document.getElementById("operatorFreeInput");
  const addBtn = document.getElementById("wishAddBtn");
  const list = document.getElementById("operatorFreeList");

  if (!input || !addBtn || !list) return;

  function renderWishList() {
    list.innerHTML = "";
    abonState.wishes.forEach(text => {
      const item = document.createElement("div");
      item.className = "wish-tag";

      const label = document.createElement("span");
      label.className = "wish-tag-label";
      label.textContent = text;

      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "wish-tag-remove";
      remove.innerHTML = '<i class="fa-solid fa-xmark"></i>';
      remove.addEventListener("click", () => {
        abonState.wishes = abonState.wishes.filter(x => x !== text);

        window.offerChosen = false;
        window.beloningChosen = false;
        clearRewardAndNextSteps();

        persistState();
        renderWishList();
        updateOffers();
      });

      item.append(label, remove);
      list.appendChild(item);
    });
  }

  function addWish(text) {
    const clean = (text || "").trim();
    if (!clean) return;
    if (abonState.wishes.some(x => x.toLowerCase() === clean.toLowerCase())) return;
    abonState.wishes.push(clean);

    window.offerChosen = false;
    window.beloningChosen = false;
    clearRewardAndNextSteps();

    persistState();
    renderWishList();
    updateOffers();
  }

  addBtn.addEventListener("click", () => {
    addWish(input.value);
    input.value = "";
  });

  input.addEventListener("keydown", e => {
    if (e.key === "Enter") {
      e.preventDefault();
      addWish(input.value);
      input.value = "";
    }
  });

  document.querySelectorAll("[data-suggest]").forEach(btn => {
    btn.addEventListener("click", () => addWish(btn.dataset.suggest));
  });

  renderWishList();
}

function renderOperators(count) {
  const wrapper = document.getElementById("operatorWrapper");
  if (!wrapper) return;

  if (!Array.isArray(abonState.operatorsByPerson)) {
    abonState.operatorsByPerson = [];
  }

  while (abonState.operatorsByPerson.length < count) {
    abonState.operatorsByPerson.push(null);
  }

  abonState.operatorsByPerson.length = count;
  wrapper.innerHTML = "";

  for (let i = 0; i < count; i++) {
    const card = document.createElement("div");
    card.className = "operator-person-card";
    card.innerHTML = `
      <p class="operator-person-title">Vad har du för operatör idag? (Person ${i + 1})</p>

      <div class="operator-logos">
        ${buildOperatorButton("Tele2", "images/tele2.jpg")}
        ${buildOperatorButton("Telia", "images/telia.png")}
        ${buildOperatorButton("Telenor", "images/telenor.jpg")}
        ${buildOperatorButton("Tre", "images/tre.jpg")}
        ${buildOperatorButton("Halebop", "images/halebop.webp")}
        <button type="button" class="quiz-option operator-text-btn" data-operator="Andra / Ingen">Andra / Ingen</button>
      </div>
    `;

    const selectedValue = abonState.operatorsByPerson[i];

    card.querySelectorAll("[data-operator]").forEach(btn => {
      if (selectedValue === btn.dataset.operator) {
        btn.classList.add("selected");
      }

      btn.addEventListener("click", () => {
        if (btn.classList.contains("disabled-option")) return;

        card.querySelectorAll("[data-operator]").forEach(x => x.classList.remove("selected"));
        btn.classList.add("selected");

        abonState.operatorsByPerson[i] = btn.dataset.operator;
        abonState.operator = getMainChosenOperator();

        window.offerChosen = false;
        window.beloningChosen = false;
        clearRewardAndNextSteps();

        persistState();
        updateAvailability();
        updateOffers();
      });
    });

    wrapper.appendChild(card);
  }
}

function buildOperatorButton(operator, logoPath) {
  return `
    <button type="button" class="quiz-option operator-btn" data-operator="${operator}">
      <img src="${logoPath}" alt="${operator}">
    </button>
  `;
}

function getMainChosenOperator() {
  const firstReal = (abonState.operatorsByPerson || []).find(Boolean);
  if (!firstReal || firstReal === "Andra / Ingen") return null;
  return firstReal;
}

function restoreSelectionsUI() {
  if (abonState.persons) {
    const btn = document.querySelector(`[data-persons="${abonState.persons}"]`);
    if (btn) setSelectedInScope(btn, "[data-persons]");
  }

  if (abonState.data) {
    const btn = document.querySelector(`[data-data="${abonState.data}"]`);
    if (btn) setSelectedInScope(btn, "[data-data]");
  }

  if (abonState.binding) {
    const btn = document.querySelector(`[data-binding="${abonState.binding}"]`);
    if (btn) {
      setSelectedInScope(btn, "[data-binding]");
      document.getElementById("bindingDateWrapper")?.classList.toggle("is-hidden", abonState.binding !== "yes");
    }
  }

  if (abonState.bindingEndDate) {
    const input = document.getElementById("bindingEndDate");
    if (input) input.value = abonState.bindingEndDate;
  }
}

function preselectFromUrl() {
  const urlOp =
    new URLSearchParams(window.location.search).get("op") ||
    sessionStorage.getItem("preferredOperator");

  if (!urlOp) return;

  if (!abonState.persons) {
    abonState.persons = 1;
    const personsBtn = document.querySelector('[data-persons="1"]');
    if (personsBtn) setSelectedInScope(personsBtn, "[data-persons]");
  }

  abonState.operatorsByPerson = abonState.operatorsByPerson || [];
  abonState.operatorsByPerson[0] = urlOp;
  abonState.operator = urlOp;

  renderOperators(abonState.persons || 1);
  persistState();
}

function setSelectedInScope(button, selector) {
  const parent = button.closest(".step-card, .operator-person-card");
  if (!parent) return;
  parent.querySelectorAll(selector).forEach(btn => btn.classList.remove("selected", "active"));
  button.classList.add("selected", "active");
}



function isQuizComplete() {
  return abonState.persons !== null && abonState.data !== null;
}

function normalizeSearchText(text = "") {
  return String(text)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function getStateWishText(state = abonState) {
  return normalizeSearchText((state.wishes || []).join(" "));
}

function stateHasWish(state, keywords) {
  const text = getStateWishText(state);
  return keywords.some(keyword => text.includes(keyword));
}

function matchesSelectedData(plan, dataSelection) {
  if (dataSelection === "low") return plan.dataAmount < 30;
  if (dataSelection === "medium") return plan.dataAmount >= 20 && plan.dataAmount < 999;
  if (dataSelection === "high") return plan.dataAmount >= 999;
  return true;
}

function getSelectedOperators(state = abonState) {
  return (state.operatorsByPerson || []).filter(operator => operator && operator !== "Andra / Ingen");
}

function getOfferOperatorMatchCount(plan, state = abonState) {
  return getSelectedOperators(state).filter(operator => operator === plan.operator).length;
}

function getRankBonus(items, currentId, selector, descending = false, maxPoints = 4) {
  const ranked = [...items].sort((left, right) => {
    const leftValue = selector(left);
    const rightValue = selector(right);

    if (leftValue === rightValue) {
      return left.operator.localeCompare(right.operator, "sv");
    }

    return descending ? rightValue - leftValue : leftValue - rightValue;
  });

  const index = ranked.findIndex(item => item.id === currentId);
  if (index < 0) return 0;

  return Math.max(0, maxPoints - index);
}

function getDataFitBonus(plan, state = abonState) {
  if (state.data === "low") {
    if (plan.dataAmount <= 10) return 4;
    if (plan.dataAmount <= 15) return 3;
    return 2;
  }

  if (state.data === "medium") {
    if (plan.dataAmount >= 30 && plan.dataAmount <= 50) return 4;
    if (plan.dataAmount >= 20 && plan.dataAmount <= 80) return 3;
    return 1;
  }

  if (state.data === "high") {
    return plan.dataAmount >= 999 ? 4 : 0;
  }

  return 0;
}

function getWishOperatorBonus(plan, state = abonState) {
  const wishText = getStateWishText(state);
  const aliases = OPERATOR_WISH_ALIASES[plan.operator] || [];
  return aliases.some(alias => wishText.includes(alias)) ? 4 : 0;
}

function scoreOffer(plan, candidates, state = abonState) {
  let score = 0;
  const persons = state.persons || 1;
  const operatorMatches = getOfferOperatorMatchCount(plan, state);
  const hasOperatorContext = getSelectedOperators(state).length > 0;

  const wantsCheap = stateHasWish(state, [
    "billig",
    "billigast",
    "budget",
    "lag kostnad",
    "lagt pris",
    "prisvard"
  ]);
  const wantsCoverage = stateHasWish(state, [
    "tackning",
    "coverage",
    "signal"
  ]);
  const wantsLotsOfData = stateHasWish(state, [
    "mycket surf",
    "mycket data",
    "obegransad",
    "surfar mycket",
    "streaming"
  ]);
  const wantsFamily = stateHasWish(state, [
    "familj",
    "familjeabonnemang",
    "familje"
  ]);

  score += getDataFitBonus(plan, state);
  score += getRankBonus(candidates, plan.id, item => item.finalPrice, false, 4);

  if (persons > 1) {
    score += getRankBonus(candidates, plan.id, item => item.pricePerPerson, false, 3);
  }

  if (operatorMatches > 0) {
    score += operatorMatches * (state.binding === "yes" ? 3.5 : 2);
  } else if (hasOperatorContext && state.binding === "no") {
    score += 1.5;
  }

  if (wantsCheap) {
    score += getRankBonus(candidates, plan.id, item => item.finalPrice, false, 5);
  }

  if (wantsCoverage) {
    score += COVERAGE_BONUS_BY_OPERATOR[plan.operator] || 0;
  }

  if (wantsLotsOfData) {
    score += getRankBonus(
      candidates,
      plan.id,
      item => Math.min(item.dataAmount || 0, 999),
      true,
      4
    );
  }

  if (wantsFamily && persons > 1) {
    score += getRankBonus(candidates, plan.id, item => item.finalPrice, false, 4);
  }

  score += getWishOperatorBonus(plan, state);

  return Number(score.toFixed(3));
}

function hasValidPlanForState(state) {
  return ALL_PLANS.some(p => {
    if (p.isFamilyPlan) return false;

    if (state.operator && p.operator !== state.operator) return false;
    if (!matchesSelectedData(p, state.data)) return false;

    if ((state.persons || 1) > 1) {
      const addon = getFamilyAddonForOperator(p.operator);
      if (!addon) return false;
    }

    return true;
  });
}

function updateDataAvailability() {
  document.querySelectorAll("[data-data]").forEach(btn => {
    const valid = hasValidPlanForState({
      ...abonState,
      data: btn.dataset.data
    });
    btn.classList.toggle("disabled-option", !valid);
  });
}

function updateOperatorAvailability() {
  const operatorButtons = document.querySelectorAll("#operatorWrapper [data-operator]");

  operatorButtons.forEach(btn => {
    const operatorValue = btn.dataset.operator;

    if (operatorValue === "Andra / Ingen") {
      btn.classList.remove("disabled-option");
      return;
    }

    const valid = hasValidPlanForState({
      ...abonState,
      operator: operatorValue
    });

    btn.classList.toggle("disabled-option", !valid);
  });
}

function updateAvailability() {
  updateDataAvailability();
  updateOperatorAvailability();
}

function getFamilyAddonForOperator(operator) {
  return ALL_PLANS.find(p =>
    p.operator === operator &&
    p.isFamilyPlan === true &&
    p.familyPriceType === "addon"
  );
}

function enrichOfferForState(plan, state = abonState) {
  let totalPrice = plan.price;
  let pricePerPerson = plan.price;

  if ((state.persons || 1) > 1) {
    const addon = getFamilyAddonForOperator(plan.operator);
    if (!addon) return null;

    totalPrice = plan.price + ((state.persons || 1) - 1) * addon.addonPrice;
    pricePerPerson = Math.round(totalPrice / (state.persons || 1));
  }

  return {
    ...plan,
    finalPrice: totalPrice,
    pricePerPerson
  };
}

function buildAdaptiveOffers(state = abonState) {
  const candidates = ALL_PLANS
    .filter(plan => !plan.isFamilyPlan)
    .filter(plan => matchesSelectedData(plan, state.data))
    .map(plan => enrichOfferForState(plan, state))
    .filter(Boolean);

  const ranked = candidates
    .map(plan => ({
      ...plan,
      matchScore: scoreOffer(plan, candidates, state)
    }))
    .sort((left, right) => {
      if (right.matchScore !== left.matchScore) return right.matchScore - left.matchScore;
      if (left.finalPrice !== right.finalPrice) return left.finalPrice - right.finalPrice;
      if (right.dataAmount !== left.dataAmount) return right.dataAmount - left.dataAmount;
      return left.operator.localeCompare(right.operator, "sv");
    })
    .slice(0, 3);

  if (ranked.length >= 3) {
    return [
      { ...ranked[1], isRecommended: false, recommendationRank: 2 },
      { ...ranked[0], isRecommended: true, recommendationRank: 1 },
      { ...ranked[2], isRecommended: false, recommendationRank: 3 }
    ];
  }

  return ranked.map((plan, index) => ({
    ...plan,
    isRecommended: index === 0,
    recommendationRank: index + 1
  }));
}

function stopOffersScroll() {
  const track = document.getElementById("offersTrack");
  const strip = document.querySelector(".offers-strip");
  if (!track) return;

  track.style.animation = "none";
  track.style.transform = "translateX(0)";
  track.classList.add("no-scroll");
  if (strip) strip.classList.add("no-fade");
}

function showInitialOffersIfNeeded() {
  if (isQuizComplete()) {
    updateOffers();
    return;
  }

  if (!ALL_PLANS.length) return;

  stopOffersScroll();

  const offers = ALL_PLANS
    .filter(p => !p.isFamilyPlan)
    .map(p => ({
      ...p,
      finalPrice: p.price,
      pricePerPerson: p.price
    }))
    .sort((a, b) => a.finalPrice - b.finalPrice)
    .slice(0, 6);

  renderOffers(offers);
}

async function updateOffers() {
  if (!isQuizComplete()) return;
  await filterOffers();
  offersSection?.classList.remove("is-hidden");
}

async function filterOffers() {
  stopOffersScroll();
  if (!ALL_PLANS.length) await loadPlans();

  const mainOperator = getMainChosenOperator();
  abonState.operator = mainOperator || null;

  const offers = buildAdaptiveOffers(abonState);

  renderOffers(offers);
}

function calculateReward(price) {
  if (price < 299) return 2000;
  if (price < 399) return 3000;
  if (price < 499) return 4000;
  if (price < 699) return 5000;
  return 1000;
}

function calculateRenewalReward(price) {
  return Math.round(calculateReward(price) / 2);
}

function getRewardPeopleCount(state = abonState) {
  return Math.max(1, Number(state.persons) || 1);
}

function isExistingCustomerForPlan(currentOperator, planOperator) {
  return Boolean(
    currentOperator &&
    currentOperator !== "Andra / Ingen" &&
    currentOperator === planOperator
  );
}

function getRewardMixCounts(plan, state = abonState) {
  const persons = getRewardPeopleCount(state);
  const operators = Array.isArray(state.operatorsByPerson) ? state.operatorsByPerson : [];

  let newCount = 0;
  let existingCount = 0;
  let unknownCount = 0;

  for (let i = 0; i < persons; i++) {
    const currentOperator = operators[i];

    if (!currentOperator) {
      unknownCount += 1;
      continue;
    }

    if (isExistingCustomerForPlan(currentOperator, plan.operator)) {
      existingCount += 1;
    } else {
      newCount += 1;
    }
  }

  newCount += unknownCount;

  return {
    persons,
    newCount,
    existingCount,
    unknownCount
  };
}

function getExistingCustomerShortLabel(state = abonState) {
  return state.binding === "yes" ? "förl." : "bef.";
}

function getExistingCustomerSingleLabel(state = abonState) {
  return state.binding === "yes" ? "Förlängning" : "Befintlig kund";
}

function formatRewardMixText(rewardMix, state = abonState) {
  const { persons, newCount, existingCount } = rewardMix;
  const existingShort = getExistingCustomerShortLabel(state);

  if (persons === 1) {
    return existingCount ? getExistingCustomerSingleLabel(state) : "Ny kund";
  }

  const parts = [];

  if (newCount > 0) {
    parts.push(`${newCount} ${newCount === 1 ? "ny" : "nya"}`);
  }

  if (existingCount > 0) {
    parts.push(`${existingCount} ${existingShort}`);
  }

  return parts.join(" + ") || "Ny kund";
}

function buildRewardLineItems(plan, rewardMix) {
  const { persons, newCount, existingCount } = rewardMix;
  const lineItems = [];

  if (persons <= 1) {
    const isExisting = existingCount > 0;
    lineItems.push({
      type: isExisting ? "existing" : "new",
      reward: isExisting
        ? calculateRenewalReward(plan.finalPrice)
        : calculateReward(plan.finalPrice)
    });

    return lineItems;
  }

  const addon = getFamilyAddonForOperator(plan.operator);
  const addonPrice = addon?.addonPrice || plan.price;

  if (newCount > 0) {
    lineItems.push({
      type: "new",
      reward: calculateReward(plan.price)
    });

    for (let i = 0; i < newCount - 1; i++) {
      lineItems.push({
        type: "new",
        reward: calculateReward(addonPrice)
      });
    }

    for (let i = 0; i < existingCount; i++) {
      lineItems.push({
        type: "existing",
        reward: calculateRenewalReward(addonPrice)
      });
    }

    return lineItems;
  }

  lineItems.push({
    type: "existing",
    reward: calculateRenewalReward(plan.price)
  });

  for (let i = 1; i < persons; i++) {
    lineItems.push({
      type: "existing",
      reward: calculateRenewalReward(addonPrice)
    });
  }

  return lineItems;
}

function getOfferRewardDetails(plan, state = abonState) {
  const rewardMix = getRewardMixCounts(plan, state);
  const lineItems = buildRewardLineItems(plan, rewardMix);
  const totalReward = lineItems.reduce((sum, item) => sum + item.reward, 0);

  return {
    ...rewardMix,
    lineItems,
    totalReward,
    mixLabel: rewardMix.persons > 1 ? "Beräkning" : "Kundtyp",
    mixText: formatRewardMixText(rewardMix, state),
    totalLabel: "Presentkort totalt"
  };
}

function buildOfferCard(plan, stateOverride = null) {
  const state = stateOverride || abonState;
  const rewardDetails = plan.rewardDetails || getOfferRewardDetails(plan, state);
  const isFamily = (state.persons || 1) > 1;

  const card = document.createElement("div");
  card.className = "offer-choice offer-card-pro";

  card.innerHTML = `
    <div class="offer-card-top">
      <button
        type="button"
        class="reward-pill reward-pill-blue gift-btn"
        data-reward="${rewardDetails.totalReward}"
        data-offer-id="${plan.id}"
        data-type="mix"
      >
        <span class="reward-pill-label">${rewardDetails.mixLabel}</span>
        <span class="reward-pill-value">${rewardDetails.mixText}</span>
      </button>

      <button
        type="button"
        class="reward-pill reward-pill-green gift-btn"
        data-reward="${rewardDetails.totalReward}"
        data-offer-id="${plan.id}"
        data-type="total"
      >
        <span class="reward-pill-label">${rewardDetails.totalLabel}</span>
        <span class="reward-pill-value">${rewardDetails.totalReward} kr</span>
      </button>
    </div>

    <div class="offer-card-body">
      <div class="offer-brand-wrap">
        <div class="offer-logo-wrap">
          <img src="${plan.logo}" alt="${plan.operator}" class="offer-logo-img">
        </div>
        <p class="offer-operator">${plan.operator}</p>
      </div>

      <div class="offer-main">
        ${
          plan.isRecommended
            ? `
              <div style="display:flex;justify-content:center;margin-bottom:14px;">
                <span class="offers-strip-badge">Rekommenderat</span>
              </div>
            `
            : ""
        }
        <h3 class="offer-title">${plan.title}</h3>
        <p class="offer-desc">${plan.text || "Mobilabonnemang med tydligt upplägg och konkurrenskraftigt pris."}</p>
      </div>

      <div class="offer-meta">
        <div class="offer-data-badge">
          <i class="fa-solid fa-wifi"></i>
          <span>${plan.dataAmount >= 999 ? "Obegränsad surf" : `${plan.dataAmount} GB surf`}</span>
        </div>

        ${
          isFamily
            ? `
              <div class="offer-price-wrap">
                <p class="offer-price-main">${plan.pricePerPerson} kr <span>/ person</span></p>
                <p class="offer-price-sub">${plan.finalPrice} kr/mån totalt · ${state.persons} personer</p>
              </div>
            `
            : `
              <div class="offer-price-wrap">
                <p class="offer-price-main">${plan.finalPrice} kr <span>/ mån</span></p>
                <p class="offer-price-sub">Tydlig månadskostnad och enkel överblick</p>
              </div>
            `
        }
      </div>

      <div class="offer-card-bottom">
        <div class="offer-select-text">
          <i class="fa-solid fa-circle-check"></i>
          <span>Välj detta erbjudande</span>
        </div>
      </div>
    </div>
  `;

  return card;
}

function renderOffers(offers) {
  if (!offersContainer) hydrateElements();
  if (!offersContainer) return;

  offersContainer.innerHTML = "";

  if (!offers.length) {
    offersContainer.innerHTML = `
      <div class="pro-card" style="width:100%;max-width:720px;margin:0 auto;text-align:center;">
        <h3>Inga träffar</h3>
        <p>Testa att byta surfnivå eller operatör.</p>
      </div>
    `;
    offersSection?.classList.remove("is-hidden");
    return;
  }

  offers.forEach(rawPlan => {
    const plan = {
      ...rawPlan,
      rewardDetails: rawPlan.rewardDetails || getOfferRewardDetails(rawPlan)
    };
    const card = buildOfferCard(plan);

    card.addEventListener("click", () => {
      selectOfferCard(card, plan);
    });

    card.querySelectorAll(".gift-btn").forEach(rewardBtn => {
      rewardBtn.addEventListener("click", e => {
        e.stopPropagation();
        selectOfferCard(card, plan);
      });
    });

    offersContainer.appendChild(card);
  });

  offersSection?.classList.remove("is-hidden");
}

function selectOfferCard(card, plan) {
  const rewardDetails = plan.rewardDetails || getOfferRewardDetails(plan);

  document.querySelectorAll(".offer-choice").forEach(c => c.classList.remove("active"));
  card.classList.add("active");

  window.offerChosen = true;
  window.beloningChosen = false;
  window.selectedOfferId = plan.id;

  localStorage.setItem("selectedOffer", JSON.stringify({
    id: plan.id,
    operator: plan.operator,
    title: plan.title,
    logo: plan.logo,
    dataAmount: plan.dataAmount,
    finalPrice: plan.finalPrice,
    pricePerPerson: plan.pricePerPerson,
    rewardTotal: rewardDetails.totalReward,
    rewardMixLabel: rewardDetails.mixText
  }));

  localStorage.removeItem("rewardChoice");
  localStorage.removeItem("rewardDistribution");

  hideNextSteps();
  openRewardSection(rewardDetails.totalReward, plan.id);
}

function openRewardSection(totalReward, offerId) {
  const rewardSection = document.getElementById("rewardSection");
  const rewardGrid = document.getElementById("rewardGrid");
  const totalRewardEl = document.getElementById("totalReward");
  const remainingSumEl = document.getElementById("remainingSum");
  const rewardProgressFill = document.getElementById("rewardProgressFill");
  const continueBtn = document.getElementById("rewardContinueBtn");

  totalRewardEl.textContent = totalReward;
  rewardGrid.innerHTML = "";

  const selections = {};
  let remaining = totalReward;

  function updateUI() {
    const used = Object.values(selections).reduce((a, b) => a + b, 0);
    remaining = totalReward - used;

    remainingSumEl.textContent = remaining;
    rewardProgressFill.style.width = `${(used / totalReward) * 100}%`;

    const valid =
      remaining === 0 &&
      Object.values(selections).every(v => v === 0 || v >= 200);

    continueBtn.disabled = !valid;
  }

  REWARD_OPTIONS.forEach(opt => {
    const card = document.createElement("div");
    card.className = "reward-option-card";

    card.innerHTML = `
      <div class="reward-option-logo-wrap">
        <img src="${opt.logo}" class="reward-option-logo">
      </div>

      <strong>${opt.name}</strong>

      <input 
        type="number" 
        min="0" 
        step="100"
        placeholder="0"
        class="reward-input"
      />

      <span class="reward-error hidden">Minst 200 kr</span>
    `;

    const input = card.querySelector("input");
    const error = card.querySelector(".reward-error");

    input.addEventListener("input", () => {
      let val = Number(input.value) || 0;

      error.classList.add("hidden");

      if (val > 0 && val < 200) {
        error.classList.remove("hidden");
        selections[opt.name] = 0;
      } else {
        selections[opt.name] = val;
      }

      updateUI();
    });

    rewardGrid.appendChild(card);
  });

  continueBtn.onclick = () => { 
    const selectedOffer = JSON.parse(localStorage.getItem("selectedOffer") || "null");
    if (!selectedOffer) return;
  
    const cartItem = {
      offerId: selectedOffer.id,
      operator: selectedOffer.operator,
      title: selectedOffer.title,
      logo: selectedOffer.logo,
      price: selectedOffer.finalPrice,
      pricePerPerson: selectedOffer.pricePerPerson,
      rewardTotal: selectedOffer.rewardTotal || totalReward,
      rewardMixLabel: selectedOffer.rewardMixLabel || "",
      rewards: selections
    };
  
    // ✅ use global cart API only
    if (window.cartAPI) {
      window.cartAPI.addToCart(cartItem);
    }
  
    // mark flow done
    window.beloningChosen = true;
  
    // open drawer instead of redirect
    if (window.openCart) {
      window.openCart();
    }
  
    // continue flow
    checkGoToNumberStep();
  };
  rewardSection.classList.remove("is-hidden");
  smoothScrollTo(rewardSection);
}

function remainingElState(value, remainingSumEl, remainingSumWrap) {
  remainingSumEl.textContent = value;
  remainingSumWrap.classList.remove("is-good", "is-negative");
  remainingSumWrap.classList.add(value === 0 ? "is-good" : "is-negative");
}

function bindContactStep() {
  const contactBtn = document.getElementById("contactContinueBtn");
  if (!contactBtn) return;

  contactBtn.addEventListener("click", () => {
    const email = document.getElementById("contactEmail")?.value.trim() || "";
    const phone = document.getElementById("contactPhone")?.value.trim() || "";

    if (!email || !phone) {
      alert("Fyll i både mejl och mobilnummer.");
      return;
    }

    localStorage.setItem("contactEmail", email);
    localStorage.setItem("contactPhone", phone);

    document.getElementById("contactSection")?.classList.add("is-hidden");
    startNumberFlow();
  });
}

function checkGoToNumberStep() {
  if (!window.offerChosen) return;
  if (!window.beloningChosen) return;

  const contactSection = document.getElementById("contactSection");
  if (!contactSection) return;

  contactSection.classList.remove("is-hidden");
  smoothScrollTo(contactSection);
}

function bindNumberFlowBase() {
  const confirmBtn = document.getElementById("confirmNumbersBtn");
  if (confirmBtn) confirmBtn.classList.add("is-hidden");
}

function isValidPhone(num) {
  const normalized = num.replace(/\s+/g, "");
  return /^07\d{8}$/.test(normalized) || /^\+467\d{8}$/.test(normalized);
}

function startNumberFlow() {
  const numberSection = document.getElementById("numberSection");
  const portSection = document.getElementById("portNumberSection");
  const phoneInputsContainer = document.getElementById("phoneInputsContainer");
  const confirmBtn = document.getElementById("confirmNumbersBtn");
  const title = document.getElementById("numberFlowTitle");
  const text = document.getElementById("numberFlowText");

  if (!numberSection || !portSection || !phoneInputsContainer || !confirmBtn || !title || !text) return;

  numberSection.classList.remove("is-hidden");
  portSection.classList.remove("is-hidden");
  confirmBtn.classList.remove("is-hidden");

  const totalPeople = abonState.persons || 1;
  let currentPerson = 1;
  const collectedNumbers = {};

  renderPersonStep();
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
        } else {
          dynamicArea.innerHTML = `
            <div class="pro-card" style="margin-top:16px;padding:16px;">
              Nytt nummer kommer att skapas för person ${currentPerson}.
            </div>
          `;
        }
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

function finishNumbers(collectedNumbers) {
  const phoneInputsContainer = document.getElementById("phoneInputsContainer");
  const confirmBtn = document.getElementById("confirmNumbersBtn");
  const title = document.getElementById("numberFlowTitle");
  const text = document.getElementById("numberFlowText");

  if (!phoneInputsContainer || !confirmBtn || !title || !text) return;

  title.textContent = "Sammanfattning";
  text.textContent = "Kontrollera uppgifterna innan du går vidare.";

  const selectedOffer = JSON.parse(localStorage.getItem("selectedOffer") || "null");
  const rewardChoice = JSON.parse(localStorage.getItem("rewardChoice") || "null");

  const numbersHtml = Object.entries(collectedNumbers).map(([key, data]) => `
    <div class="pro-card" style="padding:16px;">
      <p><strong>${key.replace("person_", "Person ")}</strong></p>
      <p>${data.type === "port" ? `Flyttar nummer: <strong>${data.number}</strong>` : "Får nytt nummer"}</p>
    </div>
  `).join("");

  phoneInputsContainer.innerHTML = `
    <div class="summary-grid" style="display:grid;gap:20px;">
      <div class="pro-card" style="padding:20px;">
        <h3 style="margin-bottom:16px;">Valt erbjudande</h3>
        ${
          selectedOffer
            ? `
              <div style="display:flex;align-items:center;gap:16px;">
                <img src="${selectedOffer.logo}" alt="${selectedOffer.operator}" style="width:52px;height:52px;object-fit:contain;border-radius:10px;">
                <div>
                  <p><strong>${selectedOffer.title}</strong></p>
                  <p>${selectedOffer.operator}</p>
                  <p><strong>${selectedOffer.finalPrice} kr/mån</strong></p>
                </div>
              </div>
            `
            : `<p>Inget erbjudande valt.</p>`
        }
      </div>

      <div class="pro-card" style="padding:20px;">
        <h3 style="margin-bottom:16px;">Vald belöning</h3>
        ${
          rewardChoice
            ? `
              <div style="display:flex;align-items:center;gap:16px;">
                <div style="width:52px;height:52px;border-radius:10px;display:flex;align-items:center;justify-content:center;background:#fff;">
                  <img src="${getRewardLogo(rewardChoice.company)}" alt="${rewardChoice.company}" style="max-width:42px;max-height:42px;object-fit:contain;">
                </div>
                <div>
                  <p><strong>${rewardChoice.company}</strong></p>
                  <p>${rewardChoice.value} kr</p>
                </div>
              </div>
            `
            : `<p>Ingen belöning vald.</p>`
        }
      </div>

      <div class="summary-grid-numbers" style="display:grid;gap:12px;">
        ${numbersHtml}
      </div>

      <div class="pro-card" style="padding:20px;">
        <h3 style="margin-bottom:16px;">Startdatum</h3>
        <div style="display:grid;gap:12px;">
          <button type="button" class="start-option" data-start="now">Starta nu</button>
          <button type="button" class="start-option" data-start="binding">Starta när bindningstiden slutar</button>
          <p id="startDateText" class="is-hidden">Startdatum: <strong id="startDateValue"></strong></p>
        </div>
      </div>
    </div>
  `;

  confirmBtn.classList.remove("is-hidden");
  confirmBtn.textContent = "Fortsätt till signering";

  let startChoice = null;

  document.querySelectorAll(".start-option").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".start-option").forEach(x => x.classList.remove("active"));
      btn.classList.add("active");

      startChoice = btn.dataset.start;
      let actualStartDate = null;

      if (startChoice === "now") {
        actualStartDate = new Date().toISOString().split("T")[0];
      }

      if (startChoice === "binding") {
        actualStartDate = abonState.bindingEndDate;
      }

      if (!actualStartDate) {
        alert("Det finns inget bindningsdatum valt.");
        return;
      }

      localStorage.setItem("startDateChoice", actualStartDate);
      document.getElementById("startDateValue").textContent = actualStartDate;
      document.getElementById("startDateText").classList.remove("is-hidden");
    });
  });

  confirmBtn.onclick = () => {
    if (!startChoice) {
      alert("Välj när abonnemanget ska starta.");
      return;
    }

    localStorage.setItem("collectedNumbers", JSON.stringify(collectedNumbers));
    window.location.href = "signera.html";
  };
}

function getRewardLogo(companyName) {
  return REWARD_OPTIONS.find(item => item.name === companyName)?.logo || "";
}

function clearRewardAndNextSteps() {
  localStorage.removeItem("rewardChoice");
  localStorage.removeItem("rewardDistribution");
  localStorage.removeItem("selectedOffer");
  localStorage.removeItem("collectedNumbers");
  localStorage.removeItem("startDateChoice");

  const rewardSection = document.getElementById("rewardSection");
  const contactSection = document.getElementById("contactSection");
  const numberSection = document.getElementById("numberSection");
  const portNumberSection = document.getElementById("portNumberSection");
  const rewardGrid = document.getElementById("rewardGrid");
  const continueBtn = document.getElementById("rewardContinueBtn");
  const totalRewardEl = document.getElementById("totalReward");
  const remainingSumEl = document.getElementById("remainingSum");
  const rewardProgressFill = document.getElementById("rewardProgressFill");

  rewardSection?.classList.add("is-hidden");
  contactSection?.classList.add("is-hidden");
  numberSection?.classList.add("is-hidden");
  portNumberSection?.classList.add("is-hidden");

  if (rewardGrid) rewardGrid.innerHTML = "";
  if (continueBtn) continueBtn.disabled = true;
  if (totalRewardEl) totalRewardEl.textContent = "0";
  if (remainingSumEl) remainingSumEl.textContent = "0";
  if (rewardProgressFill) rewardProgressFill.style.width = "0%";
}

function hideNextSteps() {
  document.getElementById("contactSection")?.classList.add("is-hidden");
  document.getElementById("numberSection")?.classList.add("is-hidden");
  document.getElementById("portNumberSection")?.classList.add("is-hidden");
}

function smoothScrollTo(element) {
  if (!element) return;
  element.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
}

window.updateOffers = updateOffers;
window.filterOffers = filterOffers;
window.renderSingleOfferCard = function(plan, payload = {}) {
  const fakeState = {
    persons: payload.persons || 1,
    data: payload.data || "high",
    operator: payload.operator || plan.operator
  };

  return buildOfferCard(
    {
      ...plan,
      finalPrice: plan.price,
      pricePerPerson: plan.price
    },
    fakeState
  );
};
