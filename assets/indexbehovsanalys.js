document.addEventListener("DOMContentLoaded", () => {
  const intro = document.getElementById("quiz-intro");
  const wrapper = document.getElementById("quiz-steps-wrapper");
  const slot = document.getElementById("quiz-slot");

  const startBtn = document.getElementById("quiz-start");
  const backBtn = document.getElementById("quiz-back");

  const stepCurrentEl = document.getElementById("quiz-step-current");
  const stepTotalEl = document.getElementById("quiz-step-total");
  const progress = document.getElementById("quiz-progress");

  // step0..step4 questions, step5 result
  const steps = [
    document.getElementById("step0"),
    document.getElementById("step1"),
    document.getElementById("step2"),
    document.getElementById("step3"),
    document.getElementById("step4"),
    document.getElementById("step5"),
  ].filter(Boolean);

  const TOTAL_QUESTIONS = 6; // step0..step4
  if (stepTotalEl) stepTotalEl.textContent = String(TOTAL_QUESTIONS);

  let currentIndex = 0; // 0..4 questions, 5 result
window.abonState = window.abonState || {
  persons: null,
  data: null,
  operator: null,
  operators: []
};

const state = window.abonState;
const operatorContainer = document.getElementById("operator-per-person");
const operatorTpl = document.getElementById("operator-picker-template");

function renderOperatorPickers(persons) {
  if (!operatorContainer || !operatorTpl) return;

  operatorContainer.innerHTML = "";
  state.operators = Array.from({ length: persons }, () => null);

  for (let i = 0; i < persons; i++) {
    const node = operatorTpl.content.cloneNode(true);

    node.querySelector("[data-person-number]").textContent = i + 1;

    node.querySelectorAll(".quiz-option[data-operator]").forEach(btn => {
      btn.dataset.personIndex = i;
    });

    operatorContainer.appendChild(node);
  }
}
wrapper?.addEventListener("click", (e) => {
  const btn = e.target.closest(".quiz-option");
  if (!btn) return;

  // STEP 0: persons
  if (steps[currentIndex]?.id === "step0" && btn.dataset.persons) {
    state.persons = Number(btn.dataset.persons);
    window.abonState.persons = state.persons;
    renderOperatorPickers(state.persons);
    showStep(currentIndex + 1);
    return;
  }

  // STEP 1: operator per person (stay on step until all selected)
  if (steps[currentIndex]?.id === "step1" && btn.dataset.operator) {
    const idx = Number(btn.dataset.personIndex);
    if (!Number.isNaN(idx)) {
      state.operators[idx] = btn.dataset.operator;

      window.abonState.operator = btn.dataset.operator;

      // optional: visual selected state per person group
      const group = btn.closest(".rounded-xl");
      group?.querySelectorAll(".quiz-option[data-operator]").forEach(b => b.classList.remove("ring-2","ring-emerald-500"));
      btn.classList.add("ring-2","ring-emerald-500");
    }

    const done = state.operators.every(Boolean);
    if (done) showStep(currentIndex + 1);
    return;
  }
  if (steps[currentIndex]?.id === "step2" && btn.dataset.data) {
  state.data = btn.dataset.data;
  window.abonState.data = btn.dataset.data;
  showStep(currentIndex + 1);
  return;
}
  // default auto-advance for step2..step4
  if (currentIndex < TOTAL_QUESTIONS - 1) {
    showStep(currentIndex + 1);
} if (currentIndex < TOTAL_QUESTIONS - 1) {
  showStep(currentIndex + 1);
}
});

function updateNav() {
  const onResult = currentIndex === TOTAL_QUESTIONS;

  if (backBtn) backBtn.disabled = currentIndex === 0;

  if (progress) {
    const progressStep = onResult ? TOTAL_QUESTIONS : currentIndex + 1;
    progress.style.width = `${(progressStep / TOTAL_QUESTIONS) * 100}%`;
  }

  const stepLabel = document.getElementById("quiz-step-label");

  if (onResult) {
    if (stepLabel) stepLabel.textContent = "Resultat";
  } else {
    if (stepLabel) {
      stepLabel.innerHTML = `Steg <span id="quiz-step-current">${currentIndex + 1}</span> / <span id="quiz-step-total">${TOTAL_QUESTIONS}</span>`;
    } else {
      if (stepCurrentEl) stepCurrentEl.textContent = String(currentIndex + 1);
      if (stepTotalEl) stepTotalEl.textContent = String(TOTAL_QUESTIONS);
    }
  }
}
function showStep(nextIndex) {
  const prev = steps[currentIndex];
  const next = steps[nextIndex];
  if (!prev || !next) return;

  const startHeight = wrapper.offsetHeight;

  // fade out
  prev.classList.add("opacity-0");

  setTimeout(() => {
    prev.classList.add("hidden");

    // show next but invisible
    next.classList.remove("hidden");
    next.style.opacity = "0";

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {

        const endHeight = wrapper.scrollHeight;

        wrapper.style.height = startHeight + "px";

        requestAnimationFrame(() => {
          wrapper.style.height = endHeight + "px";
          next.style.opacity = "1";
        });

        setTimeout(() => {
          wrapper.style.height = "auto";
        }, 300);

      });
    });

currentIndex = nextIndex;
updateNav();

if (nextIndex === 5) {
  console.log("Quiz finished", window.abonState);

  loadOffersScript().then(() => {
    console.log("filterOffers exists:", typeof window.filterOffers);

    if (window.filterOffers) {
      filterOffers();
    }
  });
}
  }, 250);
}
function startQuiz() {
  if (!intro || !wrapper || !slot) return;

  const startHeight = slot.offsetHeight;

  intro.classList.add("opacity-0");

  setTimeout(() => {
    intro.classList.add("hidden");

    wrapper.classList.remove("hidden");
    wrapper.classList.add("opacity-0");

    // allow DOM to render
    requestAnimationFrame(() => {
      const endHeight = wrapper.scrollHeight;

      slot.style.height = startHeight + "px";

      requestAnimationFrame(() => {
        slot.style.height = endHeight + "px";
        wrapper.classList.remove("opacity-0");
      });

      setTimeout(() => {
        slot.style.height = "auto";
      }, 300);
    });

    steps.forEach((s, i) => {
      if (i === 0) {
        s.classList.remove("hidden", "opacity-0");
      } else {
        s.classList.add("hidden", "opacity-0");
      }
    });

    currentIndex = 0;
    updateNav();
  }, 250);
}

  startBtn?.addEventListener("click", startQuiz);

  backBtn?.addEventListener("click", () => {
if (currentIndex > 0) {
  showStep(currentIndex - 1);
}
  });
});
function loadOffersScript() {
  return new Promise((resolve) => {

    // already loaded
    if (window.filterOffers) {
      resolve();
      return;
    }

    // script already being added
    const existing = document.getElementById("offers-script");
    if (existing) {
      existing.onload = resolve;
      return;
    }

    const script = document.createElement("script");
    script.id = "offers-script";
    script.src = "./assets/offers.js";

script.onload = () => {
  resolve();
};

    document.body.appendChild(script);
  });
}