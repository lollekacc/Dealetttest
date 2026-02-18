document.addEventListener("DOMContentLoaded", () => {
  const steps = ["step1", "step2", "step3", "step4", "step5"];
  let current = 0;

  const state = {};

  function showStep(i) {
    steps.forEach((id, idx) => {
      const el = document.getElementById(id);
      if (!el) return;

      if (idx === i) {
        el.classList.remove("hidden", "opacity-0");
      } else {
        el.classList.add("hidden", "opacity-0");
      }
    });
  }

  // CTA → start quiz
  const startBtn = document.querySelector("button.adeala-btn");
  if (startBtn) {
    startBtn.addEventListener("click", () => {
      showStep(0);
      window.scrollBy({ top: 200, behavior: "smooth" });
    });
  }

  // Handle all quiz clicks
  document.querySelectorAll(".quiz-option").forEach(btn => {
    btn.addEventListener("click", () => {
      const data = btn.dataset;
      Object.assign(state, data);

      current++;

      if (current < steps.length) {
        showStep(current);
      }
    });
  });

  // Start hidden
  showStep(-1);
});
