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

  const TOTAL_QUESTIONS = 5; // step0..step4
  if (stepTotalEl) stepTotalEl.textContent = String(TOTAL_QUESTIONS);

  let currentIndex = 0; // 0..4 questions, 5 result
const state = window.abonState || (window.abonState = {
  persons: null,
  operators: [], // per person
});
const operatorContainer = document.getElementById("operator-per-person");
const operatorTpl = document.getElementById("operator-picker-template");

function renderOperatorPickers(persons) {
  if (!operatorContainer || !operatorTpl) return;
  operatorContainer.innerHTML = "";

  state.operators = Array.from({ length: persons }, () => null);

  for (let i = 0; i < persons; i++) {
    const node = operatorTpl.content.cloneNode(true);
    node.querySelector("[data-person-number]").textContent = String(i + 1);

    // tag buttons with which person they belong to
    node.querySelectorAll(".quiz-option[data-operator]").forEach(btn => {
      btn.dataset.personIndex = String(i);
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
    renderOperatorPickers(state.persons);
    showStep(currentIndex + 1);
    return;
  }

  // STEP 1: operator per person (stay on step until all selected)
  if (steps[currentIndex]?.id === "step1" && btn.dataset.operator) {
    const idx = Number(btn.dataset.personIndex);
    if (!Number.isNaN(idx)) {
      state.operators[idx] = btn.dataset.operator;

      // optional: visual selected state per person group
      const group = btn.closest(".rounded-xl");
      group?.querySelectorAll(".quiz-option[data-operator]").forEach(b => b.classList.remove("ring-2","ring-emerald-500"));
      btn.classList.add("ring-2","ring-emerald-500");
    }

    const done = state.operators.every(Boolean);
    if (done) showStep(currentIndex + 1);
    return;
  }

  // default auto-advance for step2..step4
  if (currentIndex < TOTAL_QUESTIONS - 1) {
    showStep(currentIndex + 1);
  } else if (currentIndex === TOTAL_QUESTIONS - 1) {
    showStep(TOTAL_QUESTIONS);
  }
});
  function setSlotHeightTo(el) {
    if (!slot || !el) return;
    el.classList.remove("hidden"); // ensure measurable
    slot.style.height = el.offsetHeight + "px";
  }

  function updateNav() {
    const onResult = currentIndex >= TOTAL_QUESTIONS;
    const stepNumber = Math.min(currentIndex + 1, TOTAL_QUESTIONS);

    if (stepCurrentEl) stepCurrentEl.textContent = String(stepNumber);
    if (backBtn) backBtn.disabled = currentIndex === 0 || onResult;

    if (progress) {
      progress.style.width = `${(stepNumber / TOTAL_QUESTIONS) * 100}%`;
    }
  }

  function showStep(nextIndex) {
    const prev = steps[currentIndex];
    const next = steps[nextIndex];
    if (!prev || !next) return;

    prev.classList.add("opacity-0");
    setTimeout(() => {
      prev.classList.add("hidden");

      next.classList.remove("hidden");
      setSlotHeightTo(next);

      requestAnimationFrame(() => next.classList.remove("opacity-0"));

      currentIndex = nextIndex;
      updateNav();
    }, 250);
  }

  function startQuiz() {
    if (!intro || !wrapper) return;

    intro.classList.add("opacity-0");
    setTimeout(() => {
      intro.classList.add("hidden");

      wrapper.classList.remove("hidden");
      requestAnimationFrame(() => wrapper.classList.remove("opacity-0"));

      steps.forEach((s, i) => {
        if (i === 0) {
          s.classList.remove("hidden", "opacity-0");
        } else {
          s.classList.add("hidden", "opacity-0");
        }
      });

      currentIndex = 0;
      setSlotHeightTo(steps[0]);
      updateNav();
    }, 250);
  }

  startBtn?.addEventListener("click", startQuiz);

  backBtn?.addEventListener("click", () => {
    if (currentIndex > 0 && currentIndex < TOTAL_QUESTIONS) {
      showStep(currentIndex - 1);
    }
  });
});