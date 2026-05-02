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
    heroStartButton: document.getElementById("hero-start-analysis"),
    hero: document.querySelector(".home-hero"),
    heroVisual: document.querySelector(".hero-visual"),
    heroMount: document.getElementById("hero-quiz-mount"),
    operatorContainer: document.getElementById("operator-per-person"),
    operatorTemplate: document.getElementById("operator-picker-template"),
    offersContainer: document.getElementById("offers-container")
  };

  const steps = Array.from(document.querySelectorAll("#quiz-card-stack .quiz-step-card"));
  const questionStepCount = Math.max(steps.length - 1, 0);
  const resultStepIndex = Math.max(steps.length - 1, 0);
  const sectionWrapperAnchor = document.createComment("quiz section mount");
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
    dom.heroStartButton?.addEventListener("click", event => {
      event.preventDefault();
      startQuiz({ inHero: true });
    });
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

  function mountQuizInHero() {
    if (!dom.heroMount || !dom.wrapper) return;

    if (!sectionWrapperAnchor.parentNode) {
      dom.wrapper.parentNode?.insertBefore(sectionWrapperAnchor, dom.wrapper);
    }

    dom.heroMount.appendChild(dom.wrapper);
    dom.hero?.classList.add("quiz-in-hero");
    dom.heroVisual?.classList.add("is-quiz-active");
  }

  function mountQuizInSection() {
    if (!dom.wrapper) return;

    sectionWrapperAnchor.parentNode?.insertBefore(dom.wrapper, sectionWrapperAnchor);
    dom.hero?.classList.remove("quiz-in-hero");
    dom.heroVisual?.classList.remove("is-quiz-active");
  }

  function startQuiz(options = {}) {
    if (options.inHero) {
      mountQuizInHero();
    } else {
      mountQuizInSection();
    }

    dom.intro?.classList.add("hidden");
    dom.wrapper?.classList.remove("hidden");
    document.getElementById("analys")?.classList.add("quiz-running");

    requestAnimationFrame(() => {
      dom.wrapper?.classList.remove("opacity-0");
      showStep(0);
    });
  }

  function showIntro() {
    mountQuizInSection();
    dom.wrapper?.classList.add("hidden", "opacity-0");
    dom.intro?.classList.remove("hidden");
    document.getElementById("analys")?.classList.remove("quiz-running");
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
      step.setAttribute("aria-hidden", index === activeIndex ? "false" : "true");

      if (index < activeIndex) {
        step.classList.add("stacked-card");
      } else if (index === activeIndex) {
        step.classList.add("active-step");
      } else {
        step.classList.add("upcoming-card");
      }
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
    if (dom.stack) dom.stack.style.minHeight = "";
    if (dom.slot)  dom.slot.style.minHeight  = "";
  }

  async function renderRecommendations() {
    if (!dom.offersContainer) return;

    const recommendedPlans = await getRecommendedPlans();
    dom.offersContainer.innerHTML = "";

    if (!recommendedPlans.length) {
      dom.offersContainer.innerHTML = [
        '<article class="offer-card offer-card--empty">',
        '<h4 class="offer-card__title">Inga träffar just nu</h4>',
        '<p class="offer-card__empty-text">Testa att gå tillbaka och justera prisnivå eller surfbehov så visar vi fler relevanta alternativ.</p>',
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
    article.className = index === 0 ? "offer-card offer-card--top" : "offer-card";

    const topLabel = index === 0 ? "Bäst match" : `Alternativ ${index + 1}`;
    const currentOperator = state.operators.includes(plan.operator) ? "Nuvarande operatör" : "Nytt alternativ";
    const isMulti = state.persons && state.persons > 1;
    const priceMain = isMulti ? `${plan.pricePerPerson} kr/p` : `${plan.finalPrice} kr/mån`;
    const priceSub  = isMulti ? `${plan.finalPrice} kr totalt` : null;
    const dataText  = plan.dataAmount >= 999 ? "Obegränsad" : `${plan.dataAmount} GB`;

    article.innerHTML = [
      '<div class="offer-card__accent"></div>',
      '<div class="offer-card__inner">',
      '  <div class="offer-card__top">',
      `    <span class="offer-card__label">${topLabel}</span>`,
      `    <span class="offer-card__type">${currentOperator}</span>`,
      '  </div>',
      '  <div class="offer-card__head">',
      '    <div>',
      `      <h4 class="offer-card__name">${plan.operator}</h4>`,
      `      <p class="offer-card__plan-title">${plan.title}</p>`,
      '    </div>',
      `    <img src="${plan.logo}" alt="${plan.operator}" class="offer-card__logo" />`,
      '  </div>',
      plan.text ? `  <p class="offer-card__desc">${plan.text}</p>` : '',
      '  <div class="offer-card__stats">',
      '    <div class="offer-card__stat">',
      '      <span class="offer-card__stat-icon"><i class="fa-solid fa-signal"></i></span>',
      '      <div>',
      '        <p class="offer-card__stat-label">Surf</p>',
      `        <p class="offer-card__stat-value">${dataText}</p>`,
      '      </div>',
      '    </div>',
      '    <div class="offer-card__stat">',
      '      <span class="offer-card__stat-icon"><i class="fa-solid fa-tag"></i></span>',
      '      <div>',
      '        <p class="offer-card__stat-label">Pris</p>',
      `        <p class="offer-card__stat-value">${priceMain}</p>`,
      priceSub ? `        <p class="offer-card__stat-sub">${priceSub}</p>` : '',
      '      </div>',
      '    </div>',
      '  </div>',
      '  <a href="abonnemang.html" class="offer-card__cta">Se abonnemang <i class="fa-solid fa-arrow-right"></i></a>',
      '</div>'
    ].join("\n");

    return article;
  }

  return { init };
}
