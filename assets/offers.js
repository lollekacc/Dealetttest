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
  operatorsByPerson: [],
  bindingsByPerson: [],
  bindingEndDatesByPerson: []
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

let revealObserver = null;
let forcedStepGroup = null;
let cursorGlowEl = null;
let heroCountAnimated = false;
let rewardCelebrationTimeout = null;
let catalogFiltersBound = false;
const QUIZ_STEP_TOTAL = 3;

const catalogFilters = {
  query: "",
  operator: "all",
  surf: "all",
  sort: "price-asc"
};

const JOURNEY_GROUP_LABELS = {
  1: "Hushall och surf",
  2: "Operator och bindning",
  3: "Onskemal",
  4: "Resultat"
};

const CARD_GROUPS = {
  persons: 1,
  data: 1,
  operators: 2,
  binding: 2,
  wishes: 3
};

const STAGE_DEFINITIONS = [
  {
    group: 1,
    title: "Steg 1",
    text: "Välj hushåll och surf i samma steg.",
    cards: ["persons", "data"]
  },
  {
    group: 2,
    title: "Steg 2",
    text: "Nuvarande operatör och bindningstid samlas här.",
    cards: ["operators", "binding"]
  },
  {
    group: 3,
    title: "Steg 3",
    text: "Önskemål är valfritt men kan styra rekommendationen.",
    cards: ["wishes"]
  }
];

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function hasFinePointer() {
  return window.matchMedia("(pointer: fine)").matches;
}

function getCardGroup(cardName) {
  return CARD_GROUPS[cardName] || 1;
}

function getCardElement(cardName) {
  return document.querySelector(`.step-card[data-card="${cardName}"]`);
}

function getStageElement(group) {
  return document.querySelector(`.step-stage[data-stage-group="${group}"]`);
}

function getStageCompletion(group) {
  if (group === 1) return isCardComplete("persons") && isCardComplete("data");
  if (group === 2) return isCardComplete("operators") && isCardComplete("binding");
  if (group === 3) return Boolean((abonState.wishes || []).length) || isQuizComplete();
  return false;
}

function getDerivedJourneyGroup() {
  const offersVisible = offersSection && !offersSection.classList.contains("is-hidden");

  if (!abonState.persons || !abonState.data) return 1;
  if (!hasAnsweredOperators(abonState) || !hasAnsweredBindings(abonState)) return 2;
  if (!offersVisible) return 3;
  return 4;
}

function getCurrentJourneyGroup() {
  return forcedStepGroup ?? getDerivedJourneyGroup();
}

function isCardComplete(cardName) {
  if (cardName === "persons") return Number.isFinite(Number(abonState.persons)) && Number(abonState.persons) > 0;
  if (cardName === "data") return Boolean(abonState.data);
  if (cardName === "operators") return hasAnsweredOperators(abonState);
  if (cardName === "binding") return hasAnsweredBindings(abonState);
  if (cardName === "wishes") return (abonState.wishes || []).length > 0;
  return false;
}

function getCardSummaryText(cardName) {
  if (cardName === "persons" && abonState.persons) {
    return `${abonState.persons} ${Number(abonState.persons) === 1 ? "person" : "personer"}`;
  }

  if (cardName === "data" && abonState.data) {
    const labels = {
      low: "Lite surf vald",
      medium: "Lagom surf vald",
      high: "Mycket surf vald"
    };
    return labels[abonState.data] || "";
  }

  if (cardName === "operators" && abonState.persons) {
    const selectedOperators = (abonState.operatorsByPerson || []).filter(Boolean);
    if (!selectedOperators.length) return "";
    return `${selectedOperators.length} av ${abonState.persons} operatorer valda`;
  }

  if (cardName === "binding" && abonState.persons) {
    const bindings = (abonState.bindingsByPerson || []).slice(0, abonState.persons);
    if (!bindings.length || !bindings.some(Boolean)) return "";

    const yesCount = bindings.filter(value => value === "yes").length;
    const noCount = bindings.filter(value => value === "no").length;
    const parts = [];

    if (yesCount) parts.push(`${yesCount} med bindning`);
    if (noCount) parts.push(`${noCount} utan bindning`);
    return parts.join(" · ");
  }

  if (cardName === "wishes" && abonState.wishes?.length) {
    return abonState.wishes.slice(0, 2).join(" · ");
  }

  return "";
}

function ensureStepSummary(card) {
  if (!card) return null;

  let summary = card.querySelector(".step-summary");
  if (summary) return summary;

  summary = document.createElement("div");
  summary.className = "step-summary";
  summary.innerHTML = '<i class="fa-solid fa-circle-check"></i><span></span>';
  card.querySelector(".step-card-head")?.insertAdjacentElement("afterend", summary);
  return summary;
}

function getJourneyProgressPercent() {
  const offersVisible = offersSection && !offersSection.classList.contains("is-hidden");

  if (offersVisible) {
    return window.offerChosen ? 100 : 94;
  }

  let progress = 8;

  if (abonState.persons) progress = 24;
  if (abonState.persons && abonState.data) progress = 42;
  if (hasAnsweredOperators(abonState)) progress = 64;
  if (hasAnsweredBindings(abonState)) progress = 82;
  if ((abonState.wishes || []).length) progress = 90;

  return progress;
}

function updateQuizProgressUI() {
  const labelEl = document.getElementById("quizProgressLabel");
  const fillEl = document.getElementById("quizProgressFill");
  const currentGroup = getCurrentJourneyGroup();
  const currentLabel = JOURNEY_GROUP_LABELS[currentGroup] || JOURNEY_GROUP_LABELS[1];

  if (labelEl) {
    labelEl.textContent = currentGroup > QUIZ_STEP_TOTAL
      ? currentLabel
      : `Steg ${Math.min(currentGroup, QUIZ_STEP_TOTAL)} av ${QUIZ_STEP_TOTAL} · ${currentLabel}`;
  }

  if (fillEl) {
    fillEl.style.width = `${getJourneyProgressPercent()}%`;
  }
}

function bindStepCardInteractions() {
  document.querySelectorAll(".step-card").forEach(card => {
    if (card.dataset.stepBound === "true") return;
    card.dataset.stepBound = "true";
    ensureStepSummary(card);

    card.addEventListener("click", event => {
      if (event.target.closest("button, input, label")) return;
      const group = Number(card.dataset.stepGroup || getCardGroup(card.dataset.card));
      forcedStepGroup = group;
      refreshPremiumUI();
      smoothScrollTo(card);
    });
  });
}

function updateStepJourneyUI() {
  const currentGroup = getCurrentJourneyGroup();
  const offersStrip = document.getElementById("offersStrip");

  document.querySelectorAll(".step-card").forEach(card => {
    const cardName = card.dataset.card;
    const group = Number(card.dataset.stepGroup || getCardGroup(cardName));
    const complete = isCardComplete(cardName);
    const active = group === currentGroup;
    const upcoming = group > currentGroup;
    const summaryText = getCardSummaryText(cardName);
    const summary = ensureStepSummary(card);

    if (summary) {
      const label = summary.querySelector("span");
      if (label) label.textContent = summaryText;
    }

    card.classList.toggle("has-summary", Boolean(summaryText));
    card.classList.toggle("is-active", active);
    card.classList.toggle("is-complete", complete);
    card.classList.toggle("is-upcoming", upcoming);
  });

  offersStrip?.classList.toggle("is-focus", currentGroup === 4);
}

function updateStageJourneyUI() {
  const currentGroup = Math.min(getCurrentJourneyGroup(), QUIZ_STEP_TOTAL);

  document.querySelectorAll(".step-stage").forEach(stage => {
    const group = Number(stage.dataset.stageGroup || 1);
    const active = group === currentGroup;
    const complete = getStageCompletion(group);
    const upcoming = group > currentGroup;

    stage.classList.toggle("is-active", active);
    stage.classList.toggle("is-complete", complete);
    stage.classList.toggle("is-upcoming", upcoming);
  });
}

function getNextFocusTarget() {
  if (!abonState.persons) return getCardElement("persons");
  if (!abonState.data) return getCardElement("data");
  if (!hasAnsweredOperators(abonState)) return getCardElement("operators");
  if (!hasAnsweredBindings(abonState)) return getCardElement("binding");
  if (offersSection && !offersSection.classList.contains("is-hidden") && !window.offerChosen) return offersSection;
  if (!document.getElementById("rewardSection")?.classList.contains("is-hidden") && !window.beloningChosen) {
    return document.getElementById("rewardSection");
  }
  return null;
}

function autoAdvanceToNextFocus(sourceCardName = null) {
  const target = getNextFocusTarget();
  const source = sourceCardName ? getCardElement(sourceCardName) : null;

  if (!target) return;
  if (source && target === source) return;

  window.setTimeout(() => {
    smoothScrollTo(target);
  }, 120);
}

function observeRevealElements() {
  if (!revealObserver) return;

  const dynamicTargets = [
    ...document.querySelectorAll(".offer-card-pro"),
    ...document.querySelectorAll(".reward-option-card"),
    ...document.querySelectorAll(".operator-person-card")
  ];

  dynamicTargets.forEach((element, index) => {
    if (!element.classList.contains("reveal")) {
      element.classList.add("reveal");
    }

    if (!element.style.transitionDelay) {
      element.style.transitionDelay = `${Math.min(index * 60, 240)}ms`;
    }
  });

  document.querySelectorAll(".reveal").forEach((element, index) => {
    if (element.dataset.revealBound === "true") return;
    element.dataset.revealBound = "true";
    if (!element.style.transitionDelay) {
      element.style.transitionDelay = `${Math.min(index * 45, 240)}ms`;
    }
    revealObserver.observe(element);
  });
}

function initRevealSystem() {
  if (revealObserver) return;

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

function initCursorGlow() {
  if (prefersReducedMotion() || !hasFinePointer() || cursorGlowEl) return;

  cursorGlowEl = document.createElement("div");
  cursorGlowEl.className = "cursor-glow";
  document.body.appendChild(cursorGlowEl);

  window.addEventListener("pointermove", event => {
    cursorGlowEl.style.transform = `translate(${event.clientX - 110}px, ${event.clientY - 110}px)`;
  }, { passive: true });

  document.body.addEventListener("pointerover", event => {
    cursorGlowEl.style.opacity = event.target.closest("button, a, input, .offer-card-pro, .reward-option-card")
      ? "1"
      : "0";
  });

  document.body.addEventListener("pointerleave", () => {
    cursorGlowEl.style.opacity = "0";
  });
}

function animateCountTo(element, target, {
  duration = 900,
  suffix = "",
  prefix = ""
} = {}) {
  if (!element) return;

  const endValue = Number(target) || 0;
  const startValue = Number(element.dataset.currentValue || 0);
  const startTime = performance.now();

  function frame(now) {
    const progress = Math.min((now - startTime) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const nextValue = Math.round(startValue + (endValue - startValue) * eased);
    element.dataset.currentValue = String(nextValue);
    element.textContent = `${prefix}${nextValue}${suffix}`;

    if (progress < 1) {
      requestAnimationFrame(frame);
    }
  }

  requestAnimationFrame(frame);
}

function runHeroCountUps() {
  if (heroCountAnimated) return;
  heroCountAnimated = true;

  document.querySelectorAll(".hero-count").forEach(element => {
    animateCountTo(element, Number(element.dataset.count || 0), {
      duration: 1100,
      suffix: element.dataset.suffix || ""
    });
  });
}

function bindTiltCard(card, maxTilt = 8) {
  if (!card || card.dataset.tiltBound === "true" || prefersReducedMotion() || !hasFinePointer()) return;
  card.dataset.tiltBound = "true";

  card.addEventListener("mousemove", event => {
    const rect = card.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    const rotateY = x * maxTilt;
    const rotateX = y * -maxTilt;
    const lift = card.classList.contains("active") ? -12 : -8;

    card.style.transform = `perspective(1200px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(${lift}px)`;
  });

  card.addEventListener("mouseleave", () => {
    card.style.transform = "";
  });
}

function refreshTiltCards() {
  document.querySelectorAll(".offer-card-pro").forEach(card => bindTiltCard(card, 9));
  document.querySelectorAll(".reward-option-card").forEach(card => bindTiltCard(card, 7));
}

function initOffersParallax() {
  const strip = document.getElementById("offersStrip");
  const container = document.getElementById("offers-container");

  if (!strip || !container || strip.dataset.parallaxBound === "true" || prefersReducedMotion() || !hasFinePointer()) {
    return;
  }

  strip.dataset.parallaxBound = "true";

  strip.addEventListener("mousemove", event => {
    if (window.innerWidth <= 980) return;
    const rect = strip.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    container.style.transform = `translateX(${x * 14}px)`;
  });

  strip.addEventListener("mouseleave", () => {
    container.style.transform = "";
  });
}

function refreshPremiumUI() {
  if (isDirectCatalogPage()) {
    return;
  }

  bindStepCardInteractions();
  updateQuizProgressUI();
  updateStageJourneyUI();
  updateStepJourneyUI();
  observeRevealElements();
  refreshTiltCards();
  initOffersParallax();
}

function syncPremiumExperience(sourceCardName = null, { scroll = true } = {}) {
  forcedStepGroup = null;

  requestAnimationFrame(() => {
    refreshPremiumUI();
    if (scroll) autoAdvanceToNextFocus(sourceCardName);
  });
}

function shouldAutoScrollAfterAnswer(sourceCardName) {
  const group = getCardGroup(sourceCardName);

  if (group === 1) {
    return isCardComplete("persons") && isCardComplete("data");
  }

  if (group === 2) {
    return isCardComplete("operators") && isCardComplete("binding");
  }

  return true;
}

function syncPremiumExperienceAfterAnswer(sourceCardName) {
  syncPremiumExperience(sourceCardName, {
    scroll: shouldAutoScrollAfterAnswer(sourceCardName)
  });
}

function initPremiumExperience() {
  if (isDirectCatalogPage()) {
    return;
  }

  initRevealSystem();
  initCursorGlow();
  runHeroCountUps();
  refreshPremiumUI();
}

document.addEventListener("DOMContentLoaded", initPage);

async function initPage() {
  hydrateElements();
  applyQuizLayout();
  resetTransientFlowStorage();
  restoreSavedState();
  await loadShell();
  initHeroSlider();
  initWishInput();
  initShowMorePersons();
  bindResetQuizButton();
  await loadPlans();
  bindCatalogFilters();
  initQuiz();
  preselectFromUrl();
  showInitialOffersIfNeeded();
  updateAvailability();
  initPremiumExperience();
}

function applyQuizLayout() {
  const grid = document.querySelector(".quiz-steps-grid");
  if (!grid) return;

  const cards = {
    persons: grid.querySelector('[data-card="persons"]'),
    data: grid.querySelector('[data-card="data"]'),
    operators: grid.querySelector('[data-card="operators"]'),
    binding: grid.querySelector('[data-card="binding"]'),
    wishes: grid.querySelector('[data-card="wishes"]')
  };

  [cards.operators, cards.binding, cards.wishes].forEach(card => {
    card?.classList.add("step-card-wide");
  });

  if (cards.operators) {
    const step = cards.operators.querySelector(".card-step");
    if (step) step.textContent = "Steg 2";
  }

  if (cards.binding) {
    const step = cards.binding.querySelector(".card-step");
    if (step) step.textContent = "Steg 2";

    const title = cards.binding.querySelector(".quiz-title");
    if (title) title.textContent = "Har ni bindningstid idag?";

    const subtitle = cards.binding.querySelector(".quiz-subtitle");
    if (subtitle) {
      subtitle.textContent = "Svar per person hjälper oss räkna rätt rekommendation och startdatum.";
    }

    cards.binding.querySelector(".inline-options.equal-buttons")?.remove();
    cards.binding.querySelector("#bindingDateWrapper")?.remove();

    if (!cards.binding.querySelector("#bindingWrapper")) {
      cards.binding
        .querySelector(".step-card-head")
        ?.insertAdjacentHTML("afterend", '<div id="bindingWrapper" class="operator-wrapper binding-wrapper"></div>');
    }
  }

  if (cards.wishes) {
    const step = cards.wishes.querySelector(".card-step");
    if (step) step.textContent = "Steg 3";

    const subtitle = cards.wishes.querySelector(".quiz-subtitle");
    if (subtitle) {
      subtitle.textContent = "Valfritt, men om du fyller i detta styr det vilken rekommendation som lyfts fram.";
    }
  }

  grid.innerHTML = "";

  STAGE_DEFINITIONS.forEach(stageDef => {
    const stage = document.createElement("section");
    stage.className = "step-stage reveal";
    stage.dataset.stageGroup = String(stageDef.group);

    const cardsMarkup = stageDef.cards
      .map(cardName => cards[cardName])
      .filter(Boolean);

    stage.innerHTML = `
      <div class="step-stage-shell">
        <div class="step-stage-head">
          <div>
            <span class="step-stage-kicker">${stageDef.title}</span>
            <h3 class="step-stage-title">${JOURNEY_GROUP_LABELS[stageDef.group]}</h3>
          </div>
          <p class="step-stage-text">${stageDef.text}</p>
        </div>
        <div class="step-stage-grid"></div>
      </div>
    `;

    const stageGrid = stage.querySelector(".step-stage-grid");
    cardsMarkup.forEach(card => stageGrid?.appendChild(card));
    grid.appendChild(stage);
  });
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
  localStorage.removeItem("contactEmail");
  localStorage.removeItem("contactPhone");
}

function bindResetQuizButton() {
  const button = document.getElementById("resetQuizBtn");
  if (!button || button.dataset.bound === "true") return;

  button.dataset.bound = "true";
  button.addEventListener("click", resetQuizFlow);
}

function resetQuizFlow() {
  localStorage.removeItem("dealettState");
  resetTransientFlowStorage();

  abonState.persons = null;
  abonState.data = null;
  abonState.operator = null;
  abonState.binding = null;
  abonState.bindingEndDate = null;
  abonState.wishes = [];
  abonState.operatorsByPerson = [];
  abonState.bindingsByPerson = [];
  abonState.bindingEndDatesByPerson = [];

  window.offerChosen = false;
  window.beloningChosen = false;
  window.selectedOfferId = null;
  forcedStepGroup = 1;

  document.querySelectorAll(".quiz-option.selected, .quiz-option.active").forEach(button => {
    button.classList.remove("selected", "active");
  });

  const showMoreButton = document.getElementById("showMorePersons");
  const extraPersons = document.getElementById("personsExtra");
  if (extraPersons) extraPersons.classList.add("is-hidden");
  if (showMoreButton) showMoreButton.textContent = "Visa fler";

  const wishInput = document.getElementById("operatorFreeInput");
  const wishList = document.getElementById("operatorFreeList");
  if (wishInput) wishInput.value = "";
  if (wishList) wishList.innerHTML = "";

  clearRewardAndNextSteps();
  offersContainer?.replaceChildren();
  offersSection?.classList.add("is-hidden");

  renderOperators(1);
  renderBindings(1);
  updateAvailability();
  refreshPremiumUI();
  smoothScrollTo(document.getElementById("abonnemangQuizSection"));
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
  abonState.bindingsByPerson = Array.isArray(abonState.bindingsByPerson)
    ? abonState.bindingsByPerson
    : [];
  abonState.bindingEndDatesByPerson = Array.isArray(abonState.bindingEndDatesByPerson)
    ? abonState.bindingEndDatesByPerson
    : [];

  if (!abonState.bindingsByPerson.length && abonState.binding !== null) {
    const persons = Math.max(1, Number(abonState.persons) || 1);
    abonState.bindingsByPerson = Array.from({ length: persons }, () => abonState.binding);
  }

  if (!abonState.bindingEndDatesByPerson.length && abonState.bindingEndDate) {
    const persons = Math.max(1, Number(abonState.persons) || 1);
    abonState.bindingEndDatesByPerson = Array.from(
      { length: persons },
      () => abonState.bindingEndDate
    );
  }

  syncBindingSummary();
}

function persistState() {
  try {
    localStorage.setItem("dealettState", JSON.stringify({
      ...abonState,
      wishes: Array.isArray(abonState.wishes) ? abonState.wishes : [],
      operatorsByPerson: Array.isArray(abonState.operatorsByPerson)
        ? abonState.operatorsByPerson
        : [],
      bindingsByPerson: Array.isArray(abonState.bindingsByPerson)
        ? abonState.bindingsByPerson
        : [],
      bindingEndDatesByPerson: Array.isArray(abonState.bindingEndDatesByPerson)
        ? abonState.bindingEndDatesByPerson
        : []
    }));
  } catch (err) {
    console.warn("Could not persist state:", err);
  }
}

function ensurePerPersonState(count) {
  const safeCount = Math.max(1, Number(count) || 1);

  if (!Array.isArray(abonState.operatorsByPerson)) abonState.operatorsByPerson = [];
  if (!Array.isArray(abonState.bindingsByPerson)) abonState.bindingsByPerson = [];
  if (!Array.isArray(abonState.bindingEndDatesByPerson)) abonState.bindingEndDatesByPerson = [];

  while (abonState.operatorsByPerson.length < safeCount) {
    abonState.operatorsByPerson.push(null);
  }

  while (abonState.bindingsByPerson.length < safeCount) {
    abonState.bindingsByPerson.push(abonState.binding ?? null);
  }

  while (abonState.bindingEndDatesByPerson.length < safeCount) {
    abonState.bindingEndDatesByPerson.push(abonState.bindingEndDate ?? null);
  }

  abonState.operatorsByPerson.length = safeCount;
  abonState.bindingsByPerson.length = safeCount;
  abonState.bindingEndDatesByPerson.length = safeCount;

  syncBindingSummary();
}

function getLatestBindingEndDate(state = abonState) {
  const dates = (state.bindingEndDatesByPerson || []).filter((date, index) => {
    return state.bindingsByPerson?.[index] === "yes" && Boolean(date);
  });

  if (!dates.length) return null;
  return [...dates].sort().at(-1) || null;
}

function syncBindingSummary(state = abonState) {
  const bindings = (state.bindingsByPerson || []).filter(Boolean);

  if (!bindings.length) {
    state.binding = null;
  } else if (bindings.every(value => value === "yes")) {
    state.binding = "yes";
  } else if (bindings.every(value => value === "no")) {
    state.binding = "no";
  } else {
    state.binding = "mixed";
  }

  state.bindingEndDate = getLatestBindingEndDate(state);
}

function hasAnsweredOperators(state = abonState) {
  const persons = Number(state.persons) || 0;
  if (!persons) return false;

  return Array.isArray(state.operatorsByPerson) &&
    state.operatorsByPerson.length >= persons &&
    state.operatorsByPerson.slice(0, persons).every(Boolean);
}

function hasAnsweredBindings(state = abonState) {
  const persons = Number(state.persons) || 0;
  if (!persons) return false;

  return Array.isArray(state.bindingsByPerson) &&
    state.bindingsByPerson.length >= persons &&
    state.bindingsByPerson
      .slice(0, persons)
      .every(value => value === "yes" || value === "no");
}

async function loadShell() {
  const hasSharedLayoutScript = Boolean(
    document.querySelector('script[src$="assets/layout.js"], script[src$="./assets/layout.js"]')
  );

  if (window.DEALETT_SHARED_LAYOUT_ACTIVE || hasSharedLayoutScript) {
    return;
  }

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
    const footerPlaceholder = document.getElementById("footer-placeholder");
    if (footerPlaceholder && footerPlaceholder.dataset.sharedLoaded !== "true") {
      const footerRes = await fetch("./partials/footer.html");
      if (footerRes.ok) {
        footerPlaceholder.innerHTML = await footerRes.text();
        footerPlaceholder.dataset.sharedLoaded = "true";
      }
    }
  } catch (err) {
    console.warn("Footer load failed:", err);
  }
}

function initHeroSlider() {
  const slider = document.getElementById("heroSlider");
  const slides = [...slider?.querySelectorAll(".hero-slide") || []];
  const dots = [...document.querySelectorAll(".hero-dot")];
  const prevBtn = document.getElementById("heroPrevBtn");
  const nextBtn = document.getElementById("heroNextBtn");
  const heroWrap = document.querySelector(".hero-slider-wrap");
  const heroContent = document.querySelector(".hero-content");

  if (!slider || !slides.length || !dots.length) return;

  let currentSlide = Math.max(0, slides.findIndex(slide => slide.classList.contains("is-active")));
  const totalSlides = slides.length;
  const autoInterval = prefersReducedMotion() ? 8000 : 6200;
  let timer = null;

  function restartDotAnimation(dot) {
    const fill = dot.querySelector(".hero-dot-fill");
    if (!fill) return;
    fill.style.animation = "none";
    void fill.offsetWidth;
    fill.style.animation = "";
  }

  function updateDots() {
    dots.forEach((dot, i) => {
      dot.classList.toggle("active", i === currentSlide);
      dot.style.setProperty("--hero-duration", `${autoInterval}ms`);

      if (i === currentSlide) {
        restartDotAnimation(dot);
      }
    });
  }

  function goToSlide(index) {
    currentSlide = index;
    slides.forEach((slide, i) => {
      slide.classList.toggle("is-active", i === currentSlide);
      slide.setAttribute("aria-hidden", i === currentSlide ? "false" : "true");
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

  updateDots();
  goToSlide(currentSlide);
  restartTimer();
}

async function loadPlans() {
  if (ALL_PLANS.length) return ALL_PLANS;
  const res = await fetch("./data/plans.json");
  ALL_PLANS = await res.json();
  return ALL_PLANS;
}

function isDirectCatalogPage() {
  return !document.getElementById("abonnemangQuizSection");
}

function resetCatalogState() {
  localStorage.removeItem("dealettState");

  abonState.persons = 1;
  abonState.data = null;
  abonState.operator = null;
  abonState.binding = null;
  abonState.bindingEndDate = null;
  abonState.wishes = [];
  abonState.operatorsByPerson = [];
  abonState.bindingsByPerson = [];
  abonState.bindingEndDatesByPerson = [];

  syncBindingSummary();
}

function getCatalogState() {
  return {
    ...abonState,
    persons: 1,
    data: null,
    operator: null,
    binding: null,
    bindingEndDate: null,
    wishes: [],
    operatorsByPerson: [],
    bindingsByPerson: [],
    bindingEndDatesByPerson: []
  };
}

function bindCatalogFilters() {
  const filterPanel = document.getElementById("catalogFilters");
  if (!filterPanel || catalogFiltersBound) return;

  catalogFiltersBound = true;

  const searchInput = document.getElementById("catalogSearch");
  const operatorSelect = document.getElementById("catalogOperatorFilter");
  const surfSelect = document.getElementById("catalogSurfFilter");
  const sortSelect = document.getElementById("catalogSortFilter");
  const clearButton = document.getElementById("clearCatalogFilters");

  searchInput?.addEventListener("input", () => {
    catalogFilters.query = searchInput.value.trim();
    applyCatalogFilterChange();
  });

  operatorSelect?.addEventListener("change", () => {
    catalogFilters.operator = operatorSelect.value;
    applyCatalogFilterChange();
  });

  surfSelect?.addEventListener("change", () => {
    catalogFilters.surf = surfSelect.value;
    applyCatalogFilterChange();
  });

  sortSelect?.addEventListener("change", () => {
    catalogFilters.sort = sortSelect.value;
    applyCatalogFilterChange();
  });

  clearButton?.addEventListener("click", () => {
    catalogFilters.query = "";
    catalogFilters.operator = "all";
    catalogFilters.surf = "all";
    catalogFilters.sort = "price-asc";

    if (searchInput) searchInput.value = "";
    if (operatorSelect) operatorSelect.value = "all";
    if (surfSelect) surfSelect.value = "all";
    if (sortSelect) sortSelect.value = "price-asc";

    applyCatalogFilterChange();
  });
}

function applyCatalogFilterChange() {
  window.offerChosen = false;
  window.beloningChosen = false;
  window.selectedOfferId = null;
  clearRewardAndNextSteps();
  void renderCatalogOffers();
}

function planMatchesCatalogQuery(plan) {
  const query = normalizeSearchText(catalogFilters.query);
  if (!query) return true;

  const searchable = normalizeSearchText([
    plan.operator,
    plan.title,
    plan.data,
    plan.text,
    `${plan.dataAmount} GB`,
    plan.dataAmount >= 999 ? "obegransad unlimited fri surf" : ""
  ].filter(Boolean).join(" "));

  return searchable.includes(query);
}

function planMatchesCatalogOperator(plan) {
  return catalogFilters.operator === "all" || plan.operator === catalogFilters.operator;
}

function planMatchesCatalogSurf(plan) {
  const dataAmount = Number(plan.dataAmount) || 0;

  if (catalogFilters.surf === "small") return dataAmount <= 10;
  if (catalogFilters.surf === "medium") return dataAmount > 10 && dataAmount < 40;
  if (catalogFilters.surf === "large") return dataAmount >= 40 && dataAmount < 999;
  if (catalogFilters.surf === "unlimited") return dataAmount >= 999;

  return true;
}

function sortCatalogOffers(offers) {
  return [...offers].sort((left, right) => {
    if (catalogFilters.sort === "price-desc") {
      if (right.price !== left.price) return right.price - left.price;
    } else if (catalogFilters.sort === "data-desc") {
      if (right.dataAmount !== left.dataAmount) return right.dataAmount - left.dataAmount;
    } else if (catalogFilters.sort === "data-asc") {
      if (left.dataAmount !== right.dataAmount) return left.dataAmount - right.dataAmount;
    } else if (catalogFilters.sort === "operator") {
      const operatorSort = left.operator.localeCompare(right.operator, "sv");
      if (operatorSort !== 0) return operatorSort;
    } else if (left.price !== right.price) {
      return left.price - right.price;
    }

    if (left.price !== right.price) return left.price - right.price;
    if (left.dataAmount !== right.dataAmount) return left.dataAmount - right.dataAmount;
    return left.operator.localeCompare(right.operator, "sv");
  });
}

function updateCatalogResultCount(visibleCount, totalCount) {
  const countEl = document.getElementById("catalogResultCount");
  if (!countEl) return;

  countEl.textContent = visibleCount === totalCount
    ? `Visar alla ${totalCount} abonnemang`
    : `Visar ${visibleCount} av ${totalCount} abonnemang`;
}

function buildCatalogOffers() {
  const catalogState = getCatalogState();
  const allOffers = ALL_PLANS
    .filter(plan => !plan.isFamilyPlan)
    .map(plan => enrichOfferForState(plan, catalogState))
    .filter(Boolean);

  const filteredOffers = sortCatalogOffers(
    allOffers
      .filter(planMatchesCatalogQuery)
      .filter(planMatchesCatalogOperator)
      .filter(planMatchesCatalogSurf)
  );

  updateCatalogResultCount(filteredOffers.length, allOffers.length);

  return filteredOffers
    .map((plan, index) => ({
      ...plan,
      isRecommended: false,
      recommendationRank: index + 1,
      rewardDetails: getOfferRewardDetails(plan, catalogState)
    }));
}

async function renderCatalogOffers() {
  stopOffersScroll();
  if (!ALL_PLANS.length) await loadPlans();
  resetCatalogState();
  renderOffers(buildCatalogOffers());
}

function initQuiz() {
  bindPersons();
  bindData();
  renderOperators(abonState.persons || 1);
  renderBindings(abonState.persons || 1);
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
      ensurePerPersonState(abonState.persons);
      renderOperators(abonState.persons);
      renderBindings(abonState.persons);

      window.offerChosen = false;
      window.beloningChosen = false;
      clearRewardAndNextSteps();

      persistState();
      updateAvailability();
      updateOffers().finally(() => syncPremiumExperienceAfterAnswer("persons"));
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
      updateOffers().finally(() => syncPremiumExperienceAfterAnswer("data"));
    });
  });
}

function bindBinding() {
  renderBindings(abonState.persons || 1);
}

function initShowMorePersons() {
  const btn = document.getElementById("showMorePersons");
  const extra = document.getElementById("personsExtra");
  if (!btn || !extra) return;

  btn.addEventListener("click", () => {
    extra.classList.toggle("is-hidden");
    btn.textContent = extra.classList.contains("is-hidden") ? "Visa fler" : "Visa färre";
    refreshPremiumUI();
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
        updateOffers().finally(() => syncPremiumExperience("wishes", { scroll: false }));
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
    updateOffers().finally(() => syncPremiumExperience("wishes"));
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

  ensurePerPersonState(count);
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
        updateOffers().finally(() => syncPremiumExperienceAfterAnswer("operators"));
      });
    });

    wrapper.appendChild(card);
  }
}

function renderBindings(count) {
  const wrapper = document.getElementById("bindingWrapper");
  if (!wrapper) return;

  ensurePerPersonState(count);
  wrapper.innerHTML = "";

  for (let i = 0; i < count; i++) {
    const card = document.createElement("div");
    card.className = "operator-person-card binding-person-card";

    const selectedValue = abonState.bindingsByPerson[i];
    const selectedDate = abonState.bindingEndDatesByPerson[i] || "";

    card.innerHTML = `
      <p class="operator-person-title">Har person ${i + 1} bindningstid idag?</p>

      <div class="inline-options equal-buttons">
        <button type="button" class="quiz-option abon-opt" data-binding="no">Nej</button>
        <button type="button" class="quiz-option abon-opt" data-binding="yes">Ja</button>
      </div>

      <div class="binding-date ${selectedValue === "yes" ? "" : "is-hidden"}">
        <label for="bindingEndDate_${i}">När slutar den?</label>
        <input type="date" id="bindingEndDate_${i}" value="${selectedDate}">
      </div>
    `;

    const dateWrapper = card.querySelector(".binding-date");
    const dateInput = card.querySelector("input");

    card.querySelectorAll("[data-binding]").forEach(btn => {
      if (selectedValue === btn.dataset.binding) {
        btn.classList.add("selected", "active");
      }

      btn.addEventListener("click", () => {
        setSelectedInScope(btn, "[data-binding]");
        abonState.bindingsByPerson[i] = btn.dataset.binding;

        if (btn.dataset.binding === "yes") {
          dateWrapper?.classList.remove("is-hidden");
        } else {
          abonState.bindingEndDatesByPerson[i] = null;
          if (dateInput) dateInput.value = "";
          dateWrapper?.classList.add("is-hidden");
        }

        syncBindingSummary();
        window.offerChosen = false;
        window.beloningChosen = false;
        clearRewardAndNextSteps();

        persistState();
        updateOffers().finally(() => syncPremiumExperienceAfterAnswer("binding"));
      });
    });

    dateInput?.addEventListener("change", () => {
      abonState.bindingEndDatesByPerson[i] = dateInput.value || null;
      syncBindingSummary();
      persistState();
      syncPremiumExperience("binding", { scroll: false });
    });

    wrapper.appendChild(card);
  }
}

function buildOperatorButton(operator, logoPath) {
  return `
    <button type="button" class="quiz-option operator-btn" data-operator="${operator}">
      <img src="${logoPath}" alt="${operator}" loading="lazy" decoding="async">
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

  ensurePerPersonState(abonState.persons || 1);
  renderOperators(abonState.persons || 1);
  renderBindings(abonState.persons || 1);
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

  ensurePerPersonState(abonState.persons || 1);
  renderOperators(abonState.persons || 1);
  renderBindings(abonState.persons || 1);
  persistState();
}

function setSelectedInScope(button, selector) {
  const parent = button.closest(".step-card, .operator-person-card");
  if (!parent) return;
  parent.querySelectorAll(selector).forEach(btn => btn.classList.remove("selected", "active"));
  button.classList.add("selected", "active");
}



function isQuizComplete() {
  return abonState.persons !== null &&
    abonState.data !== null &&
    hasAnsweredOperators(abonState) &&
    hasAnsweredBindings(abonState);
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

function getOfferRelationshipCounts(plan, state = abonState) {
  const persons = Math.max(1, Number(state.persons) || 1);
  const operators = Array.isArray(state.operatorsByPerson) ? state.operatorsByPerson : [];
  const bindings = Array.isArray(state.bindingsByPerson) ? state.bindingsByPerson : [];

  let matchedWithBinding = 0;
  let matchedWithoutBinding = 0;
  let switchReadyCount = 0;

  for (let i = 0; i < persons; i++) {
    const currentOperator = operators[i];
    const binding = bindings[i];

    if (!currentOperator) continue;

    if (isExistingCustomerForPlan(currentOperator, plan.operator)) {
      if (binding === "yes") {
        matchedWithBinding += 1;
      } else {
        matchedWithoutBinding += 1;
      }
      continue;
    }

    if (binding === "no") {
      switchReadyCount += 1;
    }
  }

  return {
    matchedWithBinding,
    matchedWithoutBinding,
    sameOperatorCount: matchedWithBinding + matchedWithoutBinding,
    switchReadyCount
  };
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

function getNetCostAfterReward(plan, state = abonState) {
  const rewardDetails = plan.rewardDetails || getOfferRewardDetails(plan, state);
  return plan.finalPrice - rewardDetails.totalReward;
}

function hasWishPreferences(state = abonState) {
  return Array.isArray(state.wishes) && state.wishes.length > 0;
}

function getWishDrivenScore(plan, candidates, state = abonState) {
  let score = 0;

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

  if (wantsCheap) {
    score += getRankBonus(candidates, plan.id, item => getNetCostAfterReward(item, state), false, 14);
  }

  if (wantsCoverage) {
    score += getRankBonus(
      candidates,
      plan.id,
      item => COVERAGE_BONUS_BY_OPERATOR[item.operator] || 0,
      true,
      12
    );
  }

  if (wantsLotsOfData) {
    score += getRankBonus(
      candidates,
      plan.id,
      item => Math.min(item.dataAmount || 0, 999),
      true,
      12
    );
  }

  if (wantsFamily) {
    if ((state.persons || 1) > 1) {
      score += getRankBonus(candidates, plan.id, item => item.pricePerPerson, false, 12);
      score += getRankBonus(candidates, plan.id, item => getNetCostAfterReward(item, state), false, 8);
    } else {
      score += getRankBonus(candidates, plan.id, item => item.finalPrice, false, 4);
    }
  }

  score += getWishOperatorBonus(plan, state) * 6;

  return Number(score.toFixed(3));
}

function scoreOffer(plan, candidates, state = abonState) {
  let score = 0;
  const persons = state.persons || 1;
  const relationshipCounts = getOfferRelationshipCounts(plan, state);

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

  score += relationshipCounts.matchedWithBinding * 3.5;
  score += relationshipCounts.matchedWithoutBinding * 2;

  if (!relationshipCounts.sameOperatorCount && relationshipCounts.switchReadyCount > 0) {
    score += Math.min(2, relationshipCounts.switchReadyCount * 0.75);
  } else if (relationshipCounts.switchReadyCount > 0) {
    score += Math.min(1.5, relationshipCounts.switchReadyCount * 0.35);
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
  const wishDriven = hasWishPreferences(state);
  const candidates = ALL_PLANS
    .filter(plan => !plan.isFamilyPlan)
    .filter(plan => matchesSelectedData(plan, state.data))
    .map(plan => enrichOfferForState(plan, state))
    .filter(Boolean);

  const ranked = candidates
    .map(plan => ({
      ...plan,
      rewardDetails: getOfferRewardDetails(plan, state),
      matchScore: scoreOffer(plan, candidates, state),
      wishScore: getWishDrivenScore(plan, candidates, state),
      netCostAfterReward: getNetCostAfterReward(plan, state)
    }))
    .sort((left, right) => {
      if (wishDriven && right.wishScore !== left.wishScore) {
        return right.wishScore - left.wishScore;
      }

      if (wishDriven && left.netCostAfterReward !== right.netCostAfterReward) {
        return left.netCostAfterReward - right.netCostAfterReward;
      }

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
  if (isDirectCatalogPage()) {
    renderCatalogOffers();
    return;
  }

  if (isQuizComplete()) {
    updateOffers();
    return;
  }

  offersContainer?.replaceChildren();
  offersSection?.classList.add("is-hidden");
  refreshPremiumUI();
}

async function updateOffers() {
  if (isDirectCatalogPage()) {
    await renderCatalogOffers();
    return;
  }

  if (!isQuizComplete()) {
    offersSection?.classList.add("is-hidden");
    refreshPremiumUI();
    return;
  }
  await filterOffers();
  offersSection?.classList.remove("is-hidden");
  refreshPremiumUI();
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
  const bindings = Array.isArray(state.bindingsByPerson) ? state.bindingsByPerson : [];

  let newCount = 0;
  let renewalCount = 0;
  let existingCount = 0;
  let unknownCount = 0;

  for (let i = 0; i < persons; i++) {
    const currentOperator = operators[i];
    const binding = bindings[i];

    if (!currentOperator) {
      unknownCount += 1;
      continue;
    }

    if (isExistingCustomerForPlan(currentOperator, plan.operator)) {
      if (binding === "yes") {
        renewalCount += 1;
      } else {
        existingCount += 1;
      }
    } else {
      newCount += 1;
    }
  }

  newCount += unknownCount;

  return {
    persons,
    newCount,
    renewalCount,
    existingCount,
    oldCount: renewalCount + existingCount,
    unknownCount
  };
}

function formatRewardMixText(rewardMix) {
  const { persons, newCount, renewalCount, existingCount } = rewardMix;

  if (persons === 1) {
    if (renewalCount) return "Förlängning";
    if (existingCount) return "Befintlig kund";
    return "Ny kund";
  }

  const parts = [];

  if (newCount > 0) {
    parts.push(`${newCount} ${newCount === 1 ? "ny" : "nya"}`);
  }

  if (renewalCount > 0) {
    parts.push(`${renewalCount} förl.`);
  }

  if (existingCount > 0) {
    parts.push(`${existingCount} bef.`);
  }

  return parts.join(" + ") || "Ny kund";
}

function buildRewardLineItems(plan, rewardMix) {
  const { persons, newCount, oldCount } = rewardMix;
  const lineItems = [];

  if (persons <= 1) {
    const isExisting = oldCount > 0;
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

    for (let i = 0; i < oldCount; i++) {
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
    mixText: formatRewardMixText(rewardMix),
    totalLabel: "Presentkort totalt"
  };
}

function buildOfferCard(plan, stateOverride = null) {
  const state = stateOverride || abonState;
  const rewardDetails = plan.rewardDetails || getOfferRewardDetails(plan, state);
  const isFamily = (state.persons || 1) > 1;
  const dataLabel = plan.dataAmount >= 999 ? "Obegränsad" : `${plan.dataAmount} GB`;
  const promoLabel = plan.dataAmount >= 999 ? "Mycket surf" : "Endast online";

  const card = document.createElement("div");
  card.className = `offer-choice offer-card-pro${plan.isRecommended ? " recommended" : ""}`;

  card.innerHTML = `
    <div class="offer-card-body">
      <span class="deal-promo-badge">${promoLabel}</span>

      <div class="offer-brand-wrap">
        <div class="offer-logo-wrap">
          <img src="${plan.logo}" alt="${plan.operator}" class="offer-logo-img" loading="lazy" decoding="async">
        </div>
        <div>
          <p class="offer-operator-label">Mobilabonnemang</p>
          <p class="offer-operator">${plan.operator}</p>
        </div>
      </div>

      <div class="offer-divider"></div>

      <div class="offer-main">
        <h3 class="offer-title">${dataLabel}</h3>
        <p class="offer-desc">${plan.text || "Mobilabonnemang med tydligt upplägg och konkurrenskraftigt pris."}</p>
      </div>

      <div class="offer-meta">
        <div class="offer-data-badge">
          <i class="fa-solid fa-wifi"></i>
          <span>${plan.dataAmount >= 999 ? "Obegränsad surf i Sverige" : `${plan.dataAmount} GB surf`}</span>
        </div>

        <ul class="offer-benefits">
          <li><i class="fa-solid fa-check"></i> Fria samtal och sms</li>
          <li><i class="fa-solid fa-check"></i> 5G i operatörens nät</li>
          <li><i class="fa-solid fa-check"></i> Presentkort ${rewardDetails.totalReward} kr</li>
        </ul>

        ${isFamily
          ? `<div class="offer-price-wrap">
               <p class="offer-price-main">${plan.pricePerPerson} kr <span>/ person</span></p>
               <p class="offer-price-sub">${plan.finalPrice} kr/mån totalt · ${state.persons} personer</p>
             </div>`
          : `<div class="offer-price-wrap">
               <p class="offer-price-main">${plan.finalPrice} kr <span>/ mån</span></p>
             </div>`
        }
      </div>

      <div class="offer-card-bottom">
        <button type="button" class="offer-select-text${plan.isRecommended ? ' offer-select-text--primary' : ''}">
          <span>Beställ</span>
        </button>
      </div>
    </div>
  `;

  return card;
}

function syncOfferSelectionLabels() {
  document.querySelectorAll(".offer-choice").forEach(card => {
    const label = card.querySelector(".offer-select-text span");
    if (!label) return;

    if (isDirectCatalogPage()) {
      label.textContent = card.classList.contains("active") ? "Valt" : "Beställ";
      return;
    }

    if (card.classList.contains("active")) {
      label.textContent = "Valt erbjudande";
      return;
    }

    label.textContent = card.classList.contains("recommended")
      ? "Välj rekommenderat erbjudande"
      : "Välj detta erbjudande";
  });
}

function renderOffers(offers) {
  if (!offersContainer) hydrateElements();
  if (!offersContainer) return;

  offersContainer.innerHTML = "";

  if (!offers.length) {
    offersContainer.innerHTML = `
      <div class="pro-card" style="width:100%;max-width:720px;margin:0 auto;text-align:center;">
        <h3>Inga träffar</h3>
        <p>${isDirectCatalogPage() ? "Testa att ändra eller rensa filtret." : "Testa att byta surfnivå eller operatör."}</p>
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

    if (plan.isRecommended) {
      const wrapper = document.createElement("div");
      wrapper.className = "offer-card-wrapper offer-card-wrapper--rec";
      const badge = document.createElement("div");
      badge.className = "offer-rec-badge-float";
      badge.innerHTML = '<i class="fa-solid fa-star"></i> Rekommenderat';
      wrapper.appendChild(badge);
      wrapper.appendChild(card);
      offersContainer.appendChild(wrapper);
    } else {
      const wrapper = document.createElement("div");
      wrapper.className = "offer-card-wrapper";
      wrapper.appendChild(card);
      offersContainer.appendChild(wrapper);
    }
  });

  offersSection?.classList.remove("is-hidden");
  syncOfferSelectionLabels();
  refreshPremiumUI();
}

function selectOfferCard(card, plan) {
  const rewardDetails = plan.rewardDetails || getOfferRewardDetails(plan);

  document.querySelectorAll(".offer-choice").forEach(c => c.classList.remove("active"));
  card.classList.add("active");
  syncOfferSelectionLabels();

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
  syncPremiumExperience(null, { scroll: false });
}

function openRewardSection(totalReward, offerId) {
  const rewardSection = document.getElementById("rewardSection");
  const rewardGrid = document.getElementById("rewardGrid");
  const totalRewardEl = document.getElementById("totalReward");
  const remainingSumEl = document.getElementById("remainingSum");
  const remainingSumWrap = document.getElementById("remainingSumWrap");
  const rewardProgressFill = document.getElementById("rewardProgressFill");
  const continueBtn = document.getElementById("rewardContinueBtn");
  const rewardPanel = document.querySelector(".reward-panel");

  animateCountTo(totalRewardEl, totalReward);
  rewardGrid.innerHTML = "";
  continueBtn.disabled = true;

  const selections = {};
  let remaining = totalReward;
  let hasCelebrated = false;

  function updateUI() {
    const used = Object.values(selections).reduce((a, b) => a + b, 0);
    remaining = totalReward - used;

    remainingElState(remaining, remainingSumEl, remainingSumWrap);
    rewardProgressFill.style.width = `${(used / totalReward) * 100}%`;

    const valid =
      remaining === 0 &&
      Object.values(selections).every(v => v === 0 || v >= 200);

    continueBtn.disabled = !valid;

    if (valid && !hasCelebrated) {
      rewardPanel?.classList.add("is-celebrating");
      clearTimeout(rewardCelebrationTimeout);
      rewardCelebrationTimeout = window.setTimeout(() => {
        rewardPanel?.classList.remove("is-celebrating");
      }, 1000);
      hasCelebrated = true;
    }

    if (!valid) {
      hasCelebrated = false;
    }
  }

  REWARD_OPTIONS.forEach(opt => {
    const card = document.createElement("div");
    card.className = "reward-option-card";

    card.innerHTML = `
      <div class="reward-option-logo-wrap">
        <img src="${opt.logo}" class="reward-option-logo" loading="lazy" decoding="async">
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

      card.classList.toggle("has-value", val >= 200);
      updateUI();
    });

    rewardGrid.appendChild(card);
  });

  updateUI();

  continueBtn.onclick = () => { 
    let selectedOffer = null;
    try {
      selectedOffer = JSON.parse(localStorage.getItem("selectedOffer") || "null");
    } catch (error) {
      console.warn("Could not read selectedOffer from storage:", error);
    }
    if (!selectedOffer) return;

    const distributedRewards = Object.fromEntries(
      Object.entries(selections).filter(([, value]) => value > 0)
    );

    const primaryReward = Object.entries(distributedRewards)
      .sort((left, right) => right[1] - left[1])[0];

    localStorage.setItem("rewardDistribution", JSON.stringify(distributedRewards));

    if (primaryReward) {
      localStorage.setItem("rewardChoice", JSON.stringify({
        company: primaryReward[0],
        value: primaryReward[1]
      }));
    }
  
    const cartItem = {
      cartItemId: `${selectedOffer.id}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      offerId: selectedOffer.id,
      operator: selectedOffer.operator,
      title: selectedOffer.title,
      logo: selectedOffer.logo,
      dataAmount: selectedOffer.dataAmount,
      price: selectedOffer.finalPrice,
      pricePerPerson: selectedOffer.pricePerPerson,
      rewardTotal: selectedOffer.rewardTotal || totalReward,
      rewardMixLabel: selectedOffer.rewardMixLabel || "",
      rewards: distributedRewards
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

    refreshPremiumUI();
  };
  rewardSection.classList.remove("is-hidden");
  refreshPremiumUI();
  smoothScrollTo(rewardSection);
}

function remainingElState(value, remainingSumEl, remainingSumWrap) {
  animateCountTo(remainingSumEl, value);
  remainingSumWrap.classList.remove("is-good", "is-negative");
  remainingSumWrap.classList.add(value === 0 ? "is-good" : "is-negative");
}

function clearRewardAndNextSteps() {
  localStorage.removeItem("rewardChoice");
  localStorage.removeItem("rewardDistribution");
  localStorage.removeItem("selectedOffer");
  localStorage.removeItem("collectedNumbers");
  localStorage.removeItem("startDateChoice");
  localStorage.removeItem("contactEmail");
  localStorage.removeItem("contactPhone");

  const rewardSection = document.getElementById("rewardSection");
  const rewardGrid = document.getElementById("rewardGrid");
  const continueBtn = document.getElementById("rewardContinueBtn");
  const totalRewardEl = document.getElementById("totalReward");
  const remainingSumEl = document.getElementById("remainingSum");
  const rewardProgressFill = document.getElementById("rewardProgressFill");

  rewardSection?.classList.add("is-hidden");

  if (rewardGrid) rewardGrid.innerHTML = "";
  if (continueBtn) continueBtn.disabled = true;
  if (totalRewardEl) totalRewardEl.textContent = "0";
  if (remainingSumEl) remainingSumEl.textContent = "0";
  if (rewardProgressFill) rewardProgressFill.style.width = "0%";
}

function hideNextSteps() {
  // no-op: downstream checkout now happens on varukorg.html
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
