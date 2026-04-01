document.addEventListener("DOMContentLoaded", () => {
  const quiz = createIndexQuiz();
  quiz.init();
});

function createIndexQuiz() {
  const state = {
    currentStep: 0,
    persons: null,
    operators: [],
    data: null,
    price: null,
    binding: null
  };

  const dom = {
    intro: document.getElementById("quiz-intro"),
    wrapper: document.getElementById("quiz-steps-wrapper"),
    slot: document.getElementById("quiz-slot"),
    stack: document.getElementById("quiz-card-stack"),
    startButton: document.getElementById("quiz-start"),
    operatorContainer: document.getElementById("operator-per-person"),
    operatorTemplate: document.getElementById("operator-picker-template"),
    offersContainer: document.getElementById("offers-container")
  };

  const steps = Array.from(document.querySelectorAll("#quiz-card-stack .quiz-step-card"));
  const questionStepCount = Math.max(steps.length - 1, 0);
  const resultStepIndex = Math.max(steps.length - 1, 0);
  let plans = null;

  function init() {
    if (!dom.startButton || !dom.wrapper || !dom.stack || !steps.length) return;

    window.abonState = state;

    bindEvents();
    updateStepState(0);
    syncProgress();
    syncStackHeight();
  }

  function bindEvents() {
    dom.startButton.addEventListener("click", startQuiz);
    dom.wrapper.addEventListener("click", handleWrapperClick);
    window.addEventListener("resize", syncStackHeight);

    steps.forEach((step, index) => {
      const backButton = step.querySelector(".quiz-back-inline");
      backButton?.addEventListener("click", event => {
        event.preventDefault();

        if (index === 0) {
          showIntro();
          return;
        }

        showStep(index - 1);
      });
    });
  }

  function handleWrapperClick(event) {
    const option = event.target.closest(".quiz-option");
    if (option) {
      handleOptionClick(option);
      return;
    }

    const stackedStep = event.target.closest(".quiz-step-card.stacked-card");
    if (!stackedStep || event.target.closest("button")) return;

    const stackedIndex = steps.indexOf(stackedStep);
    if (stackedIndex >= 0) {
      showStep(stackedIndex);
    }
  }

  function handleOptionClick(option) {
    const step = option.closest(".quiz-step-card");
    if (!step) return;

    const stepIndex = steps.indexOf(step);
    if (stepIndex < 0) return;

    switch (stepIndex) {
      case 0:
        handlePersonsStep(option, step);
        break;
      case 1:
        handleOperatorStep(option);
        break;
      case 2:
        handleSingleChoiceStep(step, "[data-data]", option, () => {
          state.data = option.dataset.data || null;
        });
        break;
      case 3:
        handleSingleChoiceStep(step, "[data-price]", option, () => {
          state.price = option.dataset.price || null;
        });
        break;
      case 4:
        handleSingleChoiceStep(step, "[data-binding]", option, () => {
          state.binding = option.dataset.binding || null;
        });
        break;
      default:
        break;
    }
  }

  function handlePersonsStep(option, step) {
    const persons = Number(option.dataset.persons);
    if (!persons) return;

    state.persons = persons;
    state.operators = Array.from({ length: persons }, (_, index) => state.operators[index] || null);

    setSelected(step, "[data-persons]", option);
    renderOperatorChoices();
    showStep(1);
  }

  function handleOperatorStep(option) {
    const personIndex = Number(option.dataset.personIndex);
    if (Number.isNaN(personIndex)) return;

    state.operators[personIndex] = option.dataset.operator || null;

    const group = option.closest("[data-operator-group]");
    if (!group) return;

    setSelected(group, "[data-operator]", option);

    if (state.operators.every(Boolean)) {
      showStep(2);
    }
  }

  function handleSingleChoiceStep(step, selector, option, applyState) {
    applyState();
    setSelected(step, selector, option);

    const nextIndex = Math.min(state.currentStep + 1, resultStepIndex);
    showStep(nextIndex);
  }

  function setSelected(scope, selector, activeOption) {
    scope.querySelectorAll(selector).forEach(button => {
      button.classList.remove("selected", "active");
      button.setAttribute("aria-pressed", button === activeOption ? "true" : "false");
    });

    activeOption.classList.add("selected", "active");
    activeOption.setAttribute("aria-pressed", "true");
  }

  function renderOperatorChoices() {
    if (!dom.operatorContainer || !dom.operatorTemplate || !state.persons) return;

    dom.operatorContainer.innerHTML = "";

    state.operators.forEach((selectedOperator, personIndex) => {
      const fragment = dom.operatorTemplate.content.cloneNode(true);
      const card = fragment.firstElementChild;

      card?.setAttribute("data-operator-group", "");

      const personNumber = fragment.querySelector("[data-person-number]");
      if (personNumber) {
        personNumber.textContent = String(personIndex + 1);
      }

      fragment.querySelectorAll("[data-operator]").forEach(button => {
        button.dataset.personIndex = String(personIndex);
        button.setAttribute("aria-pressed", button.dataset.operator === selectedOperator ? "true" : "false");

        if (button.dataset.operator === selectedOperator) {
          button.classList.add("selected", "active");
        } else {
          button.classList.remove("selected", "active");
        }
      });

      dom.operatorContainer.appendChild(fragment);
    });

    syncStackHeight();
  }

  function startQuiz() {
    dom.intro?.classList.add("hidden");
    dom.wrapper?.classList.remove("hidden");

    requestAnimationFrame(() => {
      dom.wrapper?.classList.remove("opacity-0");
      showStep(0);
    });
  }

  function showIntro() {
    dom.wrapper?.classList.add("hidden", "opacity-0");
    dom.intro?.classList.remove("hidden");
    updateStepState(0);
    syncProgress();
  }

  function showStep(index) {
    const safeIndex = Math.max(0, Math.min(index, resultStepIndex));

    state.currentStep = safeIndex;
    updateStepState(safeIndex);
    syncProgress();
    syncStackHeight();

    if (safeIndex === resultStepIndex) {
      renderRecommendations();
    }
  }

  function updateStepState(activeIndex) {
    steps.forEach((step, index) => {
      step.classList.remove("active-step", "stacked-card", "upcoming-card", "hidden-step");

      let topOffset = 0;
      let zIndex = 120 - index;

      if (index < activeIndex) {
        const depth = activeIndex - index;
        topOffset = depth * 18;
        zIndex = 180 - depth;
        step.classList.add("stacked-card");
      } else if (index === activeIndex) {
        step.classList.add("active-step");
        zIndex = 220;
      } else {
        const depth = index - activeIndex;
        topOffset = depth * 22;
        zIndex = 120 - depth;
        step.classList.add("upcoming-card");
      }

      step.style.setProperty("--card-top", `${topOffset}px`);
      step.style.setProperty("--stack-offset", `${-topOffset}px`);
      step.style.zIndex = String(zIndex);
      step.setAttribute("aria-hidden", index === activeIndex ? "false" : "true");
    });
  }

  function syncProgress() {
    const visibleStep = Math.min(state.currentStep + 1, questionStepCount);
    const progressWidth = questionStepCount
      ? `${(visibleStep / questionStepCount) * 100}%`
      : "0%";

    document.querySelectorAll(".quiz-step-current").forEach(node => {
      node.textContent = String(visibleStep);
    });

    document.querySelectorAll(".quiz-step-total").forEach(node => {
      node.textContent = String(questionStepCount);
    });

    document.querySelectorAll(".quiz-progress-inline").forEach(node => {
      node.style.width = progressWidth;
    });
  }

  function syncStackHeight() {
    const activeStep = steps[state.currentStep];
    if (!activeStep || !dom.stack) return;

    requestAnimationFrame(() => {
      const activeCard = activeStep.querySelector(".quiz-card");
      const activeHeight = activeCard ? activeCard.offsetHeight : activeStep.offsetHeight;
      const previewDepth = Math.max(0, steps.length - state.currentStep - 1) * 20;
      const targetHeight = Math.max(560, activeHeight + previewDepth + 24);

      dom.stack.style.minHeight = `${targetHeight}px`;

      if (dom.slot) {
        dom.slot.style.minHeight = `${Math.max(560, targetHeight + 32)}px`;
      }
    });
  }

  async function renderRecommendations() {
    if (!dom.offersContainer) return;

    const recommendedPlans = await getRecommendedPlans();
    dom.offersContainer.innerHTML = "";

    if (!recommendedPlans.length) {
      dom.offersContainer.innerHTML = [
        '<article class="rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-sm">',
        '<h4 class="text-xl font-bold text-slate-950">Inga träffar just nu</h4>',
        '<p class="mt-3 text-sm leading-6 text-slate-600">Testa att gå tillbaka och justera prisnivå eller surfbehov så visar vi fler relevanta alternativ.</p>',
        "</article>"
      ].join("");
      syncStackHeight();
      return;
    }

    recommendedPlans.forEach((plan, index) => {
      dom.offersContainer.appendChild(buildRecommendationCard(plan, index));
    });

    syncStackHeight();
  }

  async function getRecommendedPlans() {
    const allPlans = await loadPlans();
    const basePlans = allPlans.filter(plan => plan.category === "mobil" && !plan.isFamilyPlan);
    const currentOperators = new Set(
      state.operators
        .filter(Boolean)
        .filter(operator => operator !== "Other")
    );

    const candidates = basePlans
      .map(plan => enrichPlan(plan, allPlans))
      .filter(Boolean)
      .filter(plan => !state.data || plan.tier === state.data)
      .map(plan => ({
        ...plan,
        score: scorePlan(plan, currentOperators)
      }))
      .sort((left, right) => {
        if (right.score !== left.score) return right.score - left.score;
        if (left.finalPrice !== right.finalPrice) return left.finalPrice - right.finalPrice;
        return left.operator.localeCompare(right.operator, "sv");
      });

    return candidates.slice(0, 3);
  }

  function enrichPlan(plan, allPlans) {
    const persons = state.persons || 1;
    let finalPrice = plan.price;
    let pricePerPerson = plan.price;

    if (persons > 1) {
      const addon = allPlans.find(candidate =>
        candidate.operator === plan.operator &&
        candidate.isFamilyPlan === true &&
        candidate.familyPriceType === "addon"
      );

      if (!addon) return null;

      finalPrice = plan.price + (persons - 1) * addon.addonPrice;
      pricePerPerson = Math.round(finalPrice / persons);
    }

    return {
      ...plan,
      finalPrice,
      pricePerPerson
    };
  }

  function scorePlan(plan, currentOperators) {
    let score = 0;

    if (matchesPriceExpectation(plan.pricePerPerson)) {
      score += 4;
    }

    if (currentOperators.has(plan.operator)) {
      score += 2;
    }

    if (state.binding === "yes" && currentOperators.has(plan.operator)) {
      score += 1;
    }

    if (state.binding === "no" && !currentOperators.has(plan.operator)) {
      score += 1;
    }

    return score;
  }

  function matchesPriceExpectation(pricePerPerson) {
    if (!state.price) return true;

    if (state.price === "under300") return pricePerPerson < 300;
    if (state.price === "300-400") return pricePerPerson >= 300 && pricePerPerson < 400;
    if (state.price === "400-500") return pricePerPerson >= 400;

    return true;
  }

  async function loadPlans() {
    if (plans) return plans;

    const response = await fetch("./data/plans.json");
    plans = await response.json();
    return plans;
  }

  function buildRecommendationCard(plan, index) {
    const article = document.createElement("article");
    article.className = "rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg";

    const topLabel = index === 0 ? "Bäst match" : `Alternativ ${index + 1}`;
    const currentOperator = state.operators.includes(plan.operator) ? "Nuvarande operatör" : "Nytt alternativ";
    const priceText = state.persons && state.persons > 1
      ? `${plan.pricePerPerson} kr/person · ${plan.finalPrice} kr/mån totalt`
      : `${plan.finalPrice} kr/mån`;

    article.innerHTML = [
      '<div class="flex items-start justify-between gap-4">',
      '  <div>',
      `    <p class="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-emerald-700">${topLabel}</p>`,
      `    <p class="mt-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">${currentOperator}</p>`,
      `    <h4 class="mt-2 text-2xl font-bold text-slate-950">${plan.operator}</h4>`,
      `    <p class="mt-1 text-base font-semibold text-slate-700">${plan.title}</p>`,
      "  </div>",
      `  <img src="${plan.logo}" alt="${plan.operator}" class="h-12 w-auto rounded-xl object-contain" />`,
      "</div>",
      `  <p class="mt-5 text-sm leading-6 text-slate-600">${plan.text || "Mobilabonnemang med tydlig prisbild och relevant surfmängd."}</p>`,
      '  <div class="mt-6 grid gap-3 sm:grid-cols-2">',
      '    <div class="rounded-2xl bg-slate-50 px-4 py-3">',
      '      <p class="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Surf</p>',
      `      <p class="mt-2 text-lg font-bold text-slate-950">${plan.dataAmount >= 999 ? "Obegränsad" : `${plan.dataAmount} GB`}</p>`,
      "    </div>",
      '    <div class="rounded-2xl bg-slate-50 px-4 py-3">',
      '      <p class="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Pris</p>',
      `      <p class="mt-2 text-lg font-bold text-slate-950">${priceText}</p>`,
      "    </div>",
      "  </div>"
    ].join("");

    return article;
  }

  return { init };
}
