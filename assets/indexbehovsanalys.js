document.addEventListener("DOMContentLoaded", () => {

  const step1 = document.getElementById("step1");
  const step2 = document.getElementById("step2");
  const step3 = document.getElementById("step3");

  if (!step1) return;

  const abonState = window.abonState || {
    persons: null,
    data: null,
    operator: null,
    binding: null,
    bindingEndDate: null
  };

  window.abonState = abonState;

  function showStep(current, next) {
    current.classList.add("opacity-0");

    setTimeout(() => {
      current.classList.add("hidden");
      next.classList.remove("hidden");

      setTimeout(() => {
        next.classList.remove("opacity-0");
      }, 20);

    }, 500);
  }

  /* STEP 1 – OPERATOR */
  step1.querySelectorAll("[data-operator]").forEach(btn => {
    btn.addEventListener("click", () => {
      abonState.operator = btn.dataset.operator || null;
      showStep(step1, step2);
    });
  });

  /* STEP 2 – BINDING */
  step2.querySelectorAll("button").forEach(btn => {
    btn.addEventListener("click", () => {
      abonState.binding = btn.textContent.trim();
      showStep(step2, step3);
    });
  });
let personsChosen = false;
let dataChosen = false;

function redirectToOffers() {
  localStorage.setItem("dealettState", JSON.stringify(abonState));
  window.location.href = "abonnemang.html";
}

function checkReady() {
  if (personsChosen && dataChosen) {
    redirectToOffers();
  }
}

  /* STEP 3 – PERSONS */
step3.querySelectorAll("[data-persons]").forEach(btn => {
  btn.addEventListener("click", () => {
    abonState.persons = Number(btn.dataset.persons);
    personsChosen = true;
    checkReady();
  });
});

  /* STEP 3 – DATA */
step3.querySelectorAll("[data-data]").forEach(btn => {
  btn.addEventListener("click", () => {
    abonState.data = btn.dataset.data;
    dataChosen = true;
    checkReady();
  });
});

});
