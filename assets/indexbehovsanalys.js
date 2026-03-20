document.addEventListener("DOMContentLoaded", () => {
  const intro = document.getElementById("quiz-intro");
  const wrapper = document.getElementById("quiz-steps-wrapper");
  const startBtn = document.getElementById("quiz-start");
  const backBtn = document.getElementById("quiz-back");
  const stepCurrentEl = document.getElementById("quiz-step-current");
  const stepTotalEl = document.getElementById("quiz-step-total");
  const stepLabel = document.getElementById("quiz-step-label");
  const progress = document.getElementById("quiz-progress");

  const steps = [
    document.getElementById("step0"),
    document.getElementById("step1"),
    document.getElementById("step2"),
    document.getElementById("step3"),
    document.getElementById("step4"),
    document.getElementById("step5"),
  ].filter(Boolean);

  const TOTAL_QUESTIONS = 5; // step0..step4 are questions, step5 is result

  let currentStep = 0;
  let firstRender = true;

  window.abonState = window.abonState || {
    persons: null,
    data: null,
    operator: null,
    operators: []
  };

  const state = window.abonState;
  const operatorContainer = document.getElementById("operator-per-person");
  const operatorTpl = document.getElementById("operator-picker-template");

  if (stepTotalEl) stepTotalEl.textContent = String(TOTAL_QUESTIONS);

  function renderOperatorPickers(persons) {
    if (!operatorContainer || !operatorTpl) return;

    operatorContainer.innerHTML = "";
    state.operators = Array.from({ length: persons }, () => null);

    for (let i = 0; i < persons; i++) {
      const node = operatorTpl.content.cloneNode(true);

      const personNumberEl = node.querySelector("[data-person-number]");
      if (personNumberEl) personNumberEl.textContent = i + 1;

      node.querySelectorAll(".quiz-option[data-operator]").forEach(btn => {
        btn.dataset.personIndex = i;
      });

      operatorContainer.appendChild(node);
    }
  }

  function updateProgress() {
    const isResultStep = currentStep >= TOTAL_QUESTIONS;
    const visibleStep = isResultStep ? TOTAL_QUESTIONS : currentStep + 1;

    document.querySelectorAll(".quiz-step-current")
  .forEach(el => el.textContent = visibleStep);

document.querySelectorAll(".quiz-step-total")
  .forEach(el => el.textContent = TOTAL_QUESTIONS);

    if (stepLabel) {
      if (isResultStep) {
        stepLabel.textContent = "Resultat";
      } else {
        stepLabel.innerHTML = `Steg <span id="quiz-step-current">${visibleStep}</span> / <span id="quiz-step-total">${TOTAL_QUESTIONS}</span>`;
      }
    }

const percent = (Math.min(currentStep, TOTAL_QUESTIONS) / TOTAL_QUESTIONS) * 100;

document.querySelectorAll(".quiz-progress-inline")
  .forEach(el => el.style.width = percent + "%");

if (progress) {
  progress.style.width = percent + "%"; // keeps global working if used
}

    if (backBtn) {
      backBtn.disabled = currentStep === 0;
    }

if (typeof updateInlineStepUI === "function") {
  updateInlineStepUI(visibleStep, TOTAL_QUESTIONS);
}
  }

  function renderStack() {
    const STACK_GAP = 48;

    steps.forEach((step, index) => {
      if (!step) return;

      if (firstRender) {
        step.style.transition = "none";
      }

      step.className = "quiz-step-card";

      const offset = Math.min(index, currentStep) * STACK_GAP;
      step.style.setProperty("--card-top", `${offset}px`);

      if (index < currentStep) {
        step.classList.add("stacked-card");
        step.style.zIndex = 100 + index;
        step.dataset.stepIndex = index;
        step.style.pointerEvents = "auto";
      } else if (index === currentStep) {
        step.classList.add("active-step");
        step.style.zIndex = 200;
        step.style.pointerEvents = "auto";
        step.dataset.stepIndex = index;
      } else {
        step.classList.add("upcoming-card");
        step.style.zIndex = 50 - index;
        step.style.pointerEvents = "none";
        step.dataset.stepIndex = index;
      }
    });

    updateProgress();

    if (firstRender) {
      requestAnimationFrame(() => {
        steps.forEach(step => {
          if (step) step.style.transition = "";
        });
      });
      firstRender = false;
    }
  }

  function goToStep(nextIndex) {
    if (nextIndex < 0 || nextIndex >= steps.length) return;

    currentStep = nextIndex;
    renderStack();

    if (nextIndex === 5) {
      loadOffersScript().then(() => {
        if (typeof window.filterOffers === "function") {
          window.filterOffers();
        }
      });
    }
  }

  function handleOptionClick(option) {
    const activeStep = steps[currentStep];
    if (!activeStep) return;

    // STEP 0: persons
    if (activeStep.id === "step0" && option.dataset.persons) {
      state.persons = Number(option.dataset.persons);
      window.abonState.persons = state.persons;
      renderOperatorPickers(state.persons);
      goToStep(currentStep + 1);
      return;
    }

    // STEP 1: operator per person
    if (activeStep.id === "step1" && option.dataset.operator) {
      const idx = Number(option.dataset.personIndex);

      if (!Number.isNaN(idx)) {
        state.operators[idx] = option.dataset.operator;
        window.abonState.operator = option.dataset.operator;

        const group = option.closest(".rounded-xl");
        group?.querySelectorAll(".quiz-option[data-operator]").forEach(btn => {
          btn.classList.remove("ring-2", "ring-emerald-500");
        });
        option.classList.add("ring-2", "ring-emerald-500");
      }

      const done = state.operators.length > 0 && state.operators.every(Boolean);
      if (done) goToStep(currentStep + 1);
      return;
    }

    // STEP 2: data
    if (activeStep.id === "step2" && option.dataset.data) {
      state.data = option.dataset.data;
      window.abonState.data = option.dataset.data;
      goToStep(currentStep + 1);
      return;
    }

    // Default auto-advance for remaining quiz options
    if (currentStep < steps.length - 1) {
      goToStep(currentStep + 1);
    }
  }

  if (startBtn && intro && wrapper) {
    startBtn.addEventListener("click", () => {
      intro.classList.add("hidden");
      wrapper.classList.remove("hidden");
      requestAnimationFrame(() => wrapper.classList.remove("opacity-0"));
      goToStep(0);
    });
  }

  document.addEventListener("click", (e) => {
    const oldCard = e.target.closest(".stacked-card");
    if (oldCard && oldCard.dataset.stepIndex) {
      goToStep(Number(oldCard.dataset.stepIndex));
      return;
    }

    const option = e.target.closest(".quiz-option");
    if (!option) return;

    handleOptionClick(option);
  });

  if (backBtn) {
    backBtn.addEventListener("click", () => {
      if (currentStep > 0) goToStep(currentStep - 1);
    });
  }

  renderStack();
});

function loadOffersScript() {
  return new Promise((resolve) => {
    if (window.filterOffers) {
      resolve();
      return;
    }

    const existing = document.getElementById("offers-script");
    if (existing) {
      existing.addEventListener("load", resolve, { once: true });
      return;
    }

    const script = document.createElement("script");
    script.id = "offers-script";
    script.src = "./assets/offers.js";
    script.onload = resolve;
    document.body.appendChild(script);
  });
}