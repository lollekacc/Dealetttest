// assets/quiz.js (renamed from indexbehovsanalys.js)

document.addEventListener("DOMContentLoaded", () => {
  const Quiz = createQuiz();
  Quiz.init();
});

function createQuiz() {
  const state = {
    currentStep: 0,
    persons: null,
    operators: [],
    data: null
  };

  const DOM = {
    intro: document.getElementById("quiz-intro"),
    wrapper: document.getElementById("quiz-steps-wrapper"),
    slot: document.getElementById("quiz-slot"),
    startBtn: document.getElementById("quiz-start"),
    backBtn: document.getElementById("quiz-back"),
    progress: document.getElementById("quiz-progress"),
    stepCurrent: document.getElementById("quiz-step-current"),
    stepTotal: document.getElementById("quiz-step-total"),
    operatorContainer: document.getElementById("operator-per-person"),
    operatorTpl: document.getElementById("operator-picker-template")
  };

  const steps = [...document.querySelectorAll(".quiz-step-card")];
  const TOTAL = steps.length - 1;

  function init() {
    DOM.stepTotal.textContent = TOTAL;
    bindEvents();
  }

  function bindEvents() {
    DOM.startBtn?.addEventListener("click", start);
    DOM.backBtn?.addEventListener("click", goBack);

    DOM.wrapper?.addEventListener("click", handleClick);
  }

  function handleClick(e) {
    const btn = e.target.closest(".quiz-option");
    if (!btn) return;

    const stepId = steps[state.currentStep]?.id;

    if (stepId === "step0") {
      handlePersons(btn);
      return;
    }

    if (stepId === "step1") {
      handleOperator(btn);
      return;
    }

    if (stepId === "step2") {
      state.data = btn.dataset.data;
      next();
      return;
    }

    next();
  }

  function handlePersons(btn) {
    if (!btn.dataset.persons) return;

    state.persons = Number(btn.dataset.persons);
    state.operators = Array(state.persons).fill(null);

    renderOperators();
    next();
  }

  function handleOperator(btn) {
    if (!btn.dataset.operator) return;

    const index = Number(btn.dataset.personIndex);
    if (Number.isNaN(index)) return;

    state.operators[index] = btn.dataset.operator;

    highlightSelection(btn);

    if (state.operators.every(Boolean)) {
      next();
    }
  }

  function highlightSelection(btn) {
    const group = btn.closest(".rounded-xl");
    group?.querySelectorAll(".quiz-option")
      .forEach(b => b.classList.remove("ring-2","ring-emerald-500"));

    btn.classList.add("ring-2","ring-emerald-500");
  }

  function renderOperators() {
    if (!DOM.operatorContainer || !DOM.operatorTpl) return;

    DOM.operatorContainer.innerHTML = "";

    state.operators.forEach((_, i) => {
      const node = DOM.operatorTpl.content.cloneNode(true);
      node.querySelector("[data-person-number]").textContent = i + 1;

      node.querySelectorAll("[data-operator]").forEach(btn => {
        btn.dataset.personIndex = i;
      });

      DOM.operatorContainer.appendChild(node);
    });
  }

  function start() {
    DOM.intro?.classList.add("hidden");
    DOM.wrapper?.classList.remove("hidden");

    showStep(0);
  }

  function next() {
    if (state.currentStep < TOTAL) {
      showStep(state.currentStep + 1);
    } else {
      onComplete();
    }
  }

  function goBack() {
    if (state.currentStep > 0) {
      showStep(state.currentStep - 1);
    }
  }

  function showStep(index) {
    steps[state.currentStep]?.classList.add("hidden");
    steps[index]?.classList.remove("hidden");

    state.currentStep = index;
    updateUI();

    if (index === TOTAL) {
      onComplete();
    }
  }

  function updateUI() {
    const step = state.currentStep + 1;

    DOM.stepCurrent.textContent = step;
    DOM.progress.style.width = `${(step / TOTAL) * 100}%`;

    if (DOM.backBtn) {
      DOM.backBtn.disabled = state.currentStep === 0;
    }
  }

  function onComplete() {
    console.log("Quiz result:", state);

    window.abonState = state; // controlled export

    loadOffers();
  }

  async function loadOffers() {
    if (!window.filterOffers) {
      await import("./offers.js");
    }

    window.filterOffers?.();
  }

  return { init };
}