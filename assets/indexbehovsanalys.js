document.addEventListener("DOMContentLoaded", () => {
  const steps = ["step1", "step2", "step3", "step4", "step5"];
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
