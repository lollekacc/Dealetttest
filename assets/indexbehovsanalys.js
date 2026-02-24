document.addEventListener("DOMContentLoaded", () => {
  const steps = ["step0", "step1", "step2", "step3", "step4", "step5"];
  let current = 0;
  const state = {};

  const slot = document.getElementById("quiz-slot");
  const intro = document.getElementById("quiz-intro");
  const wrapper = document.getElementById("quiz-steps-wrapper");
  const startBtn = document.getElementById("quiz-start");

  function syncSlotHeight(el) {
    if (!slot || !el) return;
    slot.style.height = el.offsetHeight + "px";
  }

  function showStep(i) {
    steps.forEach((id, idx) => {
      const el = document.getElementById(id);
      if (!el) return;

      if (idx === i) {
        el.classList.remove("hidden");
        requestAnimationFrame(() => {
          el.classList.remove("opacity-0");
          syncSlotHeight(el);
        });
      } else {
        el.classList.add("opacity-0");
        setTimeout(() => el.classList.add("hidden"), 500);
      }
    });
  }

  if (startBtn && intro && wrapper) {
    startBtn.addEventListener("click", () => {
      syncSlotHeight(intro);
      intro.classList.add("opacity-0");

      setTimeout(() => {
        intro.classList.add("hidden");

        wrapper.classList.remove("hidden");
        requestAnimationFrame(() => {
          wrapper.classList.remove("opacity-0");
          showStep(0);
        });
      }, 300);
    });
  }

  document.querySelectorAll(".quiz-option").forEach(btn => {
    btn.addEventListener("click", () => {
      Object.assign(state, btn.dataset);
      if (current < steps.length - 1) {
        current++;
        showStep(current);
      }
    });
  });
});
document.addEventListener("DOMContentLoaded", () => {
  const intro = document.getElementById("quiz-intro");
  const wrapper = document.getElementById("quiz-steps-wrapper");
  const slot = document.getElementById("quiz-slot");

  const startBtn = document.getElementById("quiz-start");

  const backBtn = document.getElementById("quiz-back");
  const stepCurrentEl = document.getElementById("quiz-step-current");
  const stepTotalEl = document.getElementById("quiz-step-total");
  
  const steps = [
    document.getElementById("step1"),
    document.getElementById("step2"),
    document.getElementById("step3"),
    document.getElementById("step4"),
    document.getElementById("step5"), // result
  ];

  const TOTAL_QUESTIONS = 4; // step1-4
  stepTotalEl.textContent = String(TOTAL_QUESTIONS);

  let currentIndex = 0; // 0..3 questions, 4 result

  function setSlotHeightTo(el) {
    if (!slot || !el) return;
    // measure even if hidden
    el.classList.remove("hidden");
    const h = el.offsetHeight;
    slot.style.height = h + "px";
  }

  function updateNav() {
    const onResult = currentIndex >= TOTAL_QUESTIONS;
    const stepNumber = Math.min(currentIndex + 1, TOTAL_QUESTIONS);
    const progress = document.getElementById("quiz-progress");
if (progress) {
  const step = Math.min(currentIndex + 1, TOTAL_QUESTIONS); // 1..4
  progress.style.width = `${(step / TOTAL_QUESTIONS) * 100}%`;
}
    stepCurrentEl.textContent = String(stepNumber);
    backBtn.disabled = currentIndex === 0 || onResult;
  }

  function showStep(nextIndex) {
    const prev = steps[currentIndex];
    const next = steps[nextIndex];

    // fade out prev
    prev.classList.add("opacity-0");
    setTimeout(() => {
      prev.classList.add("hidden");

      // show next
      next.classList.remove("hidden");
      // set height before fade in
      setSlotHeightTo(next);

      requestAnimationFrame(() => {
        next.classList.remove("opacity-0");
      });

      currentIndex = nextIndex;
      updateNav();
    }, 250);
  }

  function startQuiz() {
    // swap intro -> wrapper
    intro.classList.add("opacity-0");
    setTimeout(() => {
      intro.classList.add("hidden");

      wrapper.classList.remove("hidden");
      setSlotHeightTo(steps[0]);

      requestAnimationFrame(() => {
        wrapper.classList.remove("opacity-0");
      });

      // ensure only step1 visible
      steps.forEach((s, i) => {
        if (i === 0) {
          s.classList.remove("hidden");
          s.classList.remove("opacity-0");
        } else {
          s.classList.add("hidden");
          s.classList.add("opacity-0");
        }
      });

      currentIndex = 0;
      updateNav();
    }, 250);
  }

  // Start
  startBtn?.addEventListener("click", startQuiz);

  // Back
  backBtn?.addEventListener("click", () => {
    if (currentIndex > 0 && currentIndex < TOTAL_QUESTIONS) {
      showStep(currentIndex - 1);
    }
  });

  // Next on option click (auto-advance for step1-4)
  wrapper?.addEventListener("click", (e) => {
    const btn = e.target.closest(".quiz-option");
    if (!btn) return;

    // If you store state from data-* attributes, do it here:
    // e.g. window.abonState = window.abonState || {};
    // if (btn.dataset.persons) window.abonState.persons = btn.dataset.persons;
    // ...

    if (currentIndex < TOTAL_QUESTIONS - 1) {
      showStep(currentIndex + 1);
    } else if (currentIndex === TOTAL_QUESTIONS - 1) {
      // after step4 -> result step5
      showStep(TOTAL_QUESTIONS);
    }
  });
});