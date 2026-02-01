let ALL_PLANS = [];
window.offerChosen = false;
window.beloningChosen = false;
function getFamilyAddonForOperator(operator) {
  return ALL_PLANS.find(p =>
    p.operator === operator &&
    p.isFamilyPlan === true &&
    p.familyPriceType === "addon"
  );
}
async function filterOffers() {
  if (!ALL_PLANS.length) {
    await loadPlans();
  }

  const offers = ALL_PLANS
    .filter(p => !p.isFamilyPlan)
    .filter(p => !abonState.operator || p.operator === abonState.operator)
    .filter(p => {
      if (abonState.data === "low") return p.dataAmount < 30;
      if (abonState.data === "medium") return p.dataAmount >= 20 && p.dataAmount < 999;
      if (abonState.data === "high") return p.dataAmount >= 999;
      return true;
    })
    .map(p => {
      let totalPrice = p.price;
      let pricePerPerson = p.price;

      if (abonState.persons > 1) {
        const addon = getFamilyAddonForOperator(p.operator);
        if (!addon) return null;

        totalPrice =
          p.price + (abonState.persons - 1) * addon.addonPrice;

        pricePerPerson = Math.round(totalPrice / abonState.persons);
      }

      return {
        ...p,
        finalPrice: totalPrice,
        pricePerPerson
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.finalPrice - b.finalPrice)
    .slice(0, 6);

  renderOffers(offers);
}



async function loadPlans() {
  if (ALL_PLANS.length) return ALL_PLANS;

  const res = await fetch("./data/plans.json");
  ALL_PLANS = await res.json();
  return ALL_PLANS;
}
function hasValidPlanForState(state) {
  return ALL_PLANS.some(p => {
    if (p.isFamilyPlan) return false;

    if (state.operator && state.operator !== "" && p.operator !== state.operator)
      return false;

if (state.data === "low" && p.dataAmount >= 30) return false;

if (state.data === "medium" && (p.dataAmount < 20 || p.dataAmount >= 999))
  return false;

if (state.data === "high" && p.dataAmount < 999)
  return false;

  return true;
  });
}

function isQuizComplete() {
  return (
    abonState.persons !== null &&
    abonState.data !== null
  );
}
function updateDataAvailability() {
  if (!ALL_PLANS.length) return;

  document.querySelectorAll("[data-data]").forEach(btn => {
    const dataValue = btn.dataset.data;

    const valid = hasValidPlanForState({
      ...abonState,
      data: dataValue
    });

    btn.classList.toggle("disabled-option", !valid);
  });
}




/******************************
 LOAD HEADER + FOOTER
******************************/
document.addEventListener("DOMContentLoaded", async () => {

    const headerRes = await fetch("partials/header.html");
        if (headerRes.ok) {
          document.getElementById("header-placeholder").innerHTML = await headerRes.text();
          }
  
          const chatRes = await fetch("./partials/chat.html");
          if (chatRes.ok) {
            document.body.insertAdjacentHTML("beforeend", await chatRes.text());
          }
  
          const footerRes = await fetch("partials/footer.html");
          if (footerRes.ok) {
            document.body.insertAdjacentHTML("beforeend", await footerRes.text());
          }
  
  
    // 🔥 LOAD CHAT.JS *AFTER* CHAT HTML EXISTS
    const chatScript = document.createElement("script");
    chatScript.src = "./assets/chat.js";
    document.body.appendChild(chatScript);
  });
  
  const abonState = {
    persons: null,
    data: null,
    operator: null
  };
function updateOperatorAvailability() {
  if (!ALL_PLANS.length) return;

  document.querySelectorAll("[data-operator]").forEach(btn => {
    const operatorValue = btn.dataset.operator;

    const valid = hasValidPlanForState({
      ...abonState,
      operator: operatorValue
    });

    btn.classList.toggle("disabled-option", !valid);
  });
}



document.querySelectorAll(".abon-opt").forEach(btn => {
  btn.addEventListener("click", async () => {
    if (!ALL_PLANS.length) {
      await loadPlans();
    }

    btn.closest(".quiz-card")
      .querySelectorAll(".abon-opt")
      .forEach(b => b.classList.remove("active"));

    btn.classList.add("active");

    if (btn.dataset.persons)
      abonState.persons = Number(btn.dataset.persons);

    if (btn.dataset.data)
      abonState.data = btn.dataset.data;

    if (btn.dataset.operator !== undefined)
      abonState.operator = btn.dataset.operator;

    updateDataAvailability();
    updateOperatorAvailability();
if (isQuizComplete()) {
  offersSection.classList.remove("hidden");
  filterOffers();
  smoothScrollTo(offersSection);
}


  });
});

  /******************************
   QUIZ SECTIONS
  ******************************/
  const offersSection = document.getElementById("offersSection");
  const offersContainer = document.getElementById("offers-container");
  function buildOfferCard(o, stateOverride = null) {
  const state = stateOverride || abonState;
  const reward = calculateReward(o.finalPrice);

  const card = document.createElement("div");
  card.className =
    "relative offer-choice text-left border rounded-2xl shadow bg-white p-6 flex flex-col justify-between";

  card.innerHTML = `
    <div class="flex flex-col items-center gap-1 absolute -top-6 -right-6">
      <button
        class="reward-circle gift-btn"
        data-reward="${reward}"
        data-offer-id="${o.id}"
        type="button">
        <div class="reward-inner">
          <span class="reward-text">Välj presentkort</span>
          <span class="reward-amount">${reward} kr</span>
        </div>
      </button>
    </div>

    <div>
      <img src="${o.logo}" class="h-16 mx-auto mb-4 object-contain">
      <p class="text-sm text-gray-500 mb-1">${o.operator}</p>
      <h3 class="text-xl font-semibold mb-1 text-[#0C4A3C]">${o.title}</h3>
      <p class="text-gray-600 text-sm mb-3">${o.text || ""}</p>
      <p class="font-medium mb-1">${o.data}</p>
    </div>

    <div>
      ${
        state.persons > 1
          ? `
            <p class="text-xl font-bold text-[#0C4A3C]">
              ${o.pricePerPerson} kr / person
            </p>
            <p class="text-sm text-gray-500 mt-1">
              ${o.finalPrice} kr/mån totalt (${state.persons} personer)
            </p>`
          : `
            <p class="text-xl font-bold text-[#0C4A3C]">
              ${o.finalPrice} kr/mån
            </p>`
      }
    </div>
  `;

  return card;
}

  /******************************
   OFFER RENDER
  ******************************/
  function renderOffers(offers) {
    offersContainer.innerHTML = "";
    const limited = offers.slice(0, 6);
  
    limited.forEach(o => {
  
const card = buildOfferCard(o);
card.addEventListener("click", () => {
  document.querySelectorAll(".offer-choice")
    .forEach(c => c.classList.remove("active"));

  card.classList.add("active");

  window.offerChosen = true;
  window.selectedOfferId = o.id;
});



const rewardBtn = card.querySelector(".gift-btn");

if (rewardBtn) {
  rewardBtn.addEventListener("click", (e) => {
    e.stopPropagation();

    const rewardValue = Number(rewardBtn.dataset.reward);
    const offerId = rewardBtn.dataset.offerId || "";

    openPchoicePopup(rewardValue, offerId);
  });
}
      offersContainer.appendChild(card);
    });
  }

  document.getElementById("closePchoice").addEventListener("click", () => {
    const modal = document.getElementById("pchoiceModal");
    const frame = document.getElementById("pchoiceFrame");
  
    modal.classList.remove("show");
  
    setTimeout(() => {
      frame.src = "";
    }, 300);
  });
  
  /******************************
   NUMBER VALIDATION
  ******************************/
  function isValidPhone(num) {
    num = num.replace(/\s+/g, "");
    return /^07\d{8}$/.test(num) || /^\+467\d{8}$/.test(num);
  }
  
  /******************************
   STEP-BY-STEP NUMBER FLOW
  ******************************/
  const sectionNumbers = document.getElementById("numberSection");
  const sectionPort = document.getElementById("portNumberSection");
  const questionTitle = document.querySelector("#portNumberSection h2");
  const phoneInputs = document.getElementById("phoneInputsContainer");
  const btnConfirm = document.getElementById("confirmNumbersBtn");
  
  let totalPeople = 1;
  let currentPerson = 1;
  let collectedNumbers = {};
  
  function getFamilySize() {
    return abonState.persons || 1;
  }
  
  function startNumberFlow() {
    totalPeople = getFamilySize();
    currentPerson = 1;
    collectedNumbers = {};
    sectionNumbers.classList.remove("hidden");
  
    smoothScrollTo(sectionNumbers); // ✅ scroll here
  
    askNextPerson();
  }
  
  
  function askNextPerson() {
    phoneInputs.innerHTML = "";
    questionTitle.textContent = `Person ${currentPerson} – Hur vill du göra med numret?`;
  
    const wrapper = document.createElement("div");
    wrapper.className = "flex flex-col gap-6 mt-10";
  
    const btnMove = document.createElement("button");
    btnMove.className = "adeala-btn py-4 text-lg";
    btnMove.textContent = "Flytta hit numret";
    btnMove.onclick = () => showNumberInput("port");
  
    const btnNew = document.createElement("button");
    btnNew.className = "adeala-btn py-4 text-lg";
    btnNew.textContent = "Skaffa nytt nummer";
    btnNew.onclick = () => showNumberInput("new");
  
    wrapper.appendChild(btnMove);
    wrapper.appendChild(btnNew);
  
    phoneInputs.appendChild(wrapper);
    sectionPort.classList.remove("hidden");
    smoothScrollTo(sectionPort);

  }
  
  function showNumberInput(type) {
    phoneInputs.innerHTML = "";
  
    const label = document.createElement("label");
    label.className = "font-semibold mb-2";
    label.textContent =
      type === "port"
        ? `Person ${currentPerson} – skriv numret som ska flyttas`
        : `Person ${currentPerson} – nytt nummer skapas automatiskt`;
  
    const input = document.createElement("input");
    input.className = "border p-3 rounded-xl w-full";
    input.placeholder = type === "port" ? "07XXXXXXXX eller +467XXXXXXXX" : "";
    input.readOnly = type === "new";  // ⭐ FIXEN
  
    phoneInputs.appendChild(label);
    phoneInputs.appendChild(input);
  
    btnConfirm.classList.remove("hidden");
    btnConfirm.textContent =
      currentPerson < totalPeople ? "Nästa person" : "Slutför";
  
    btnConfirm.onclick = () => {
  
      if (type === "port") {
        const num = input.value.trim();
        if (!isValidPhone(num)) {
          alert("Ange ett giltigt svenskt nummer: 07XXXXXXXX eller +467XXXXXXXX");
          return;
        }
        collectedNumbers[`person_${currentPerson}`] = {
          type: "port",
          number: num
        };
      } else {
        collectedNumbers[`person_${currentPerson}`] = {
          type: "new",
          number: "nytt nummer"
        };
      }
  
      currentPerson++;
  
      if (currentPerson <= totalPeople) askNextPerson();
      else finishNumbers();
    };
  }
  
  const REWARD_LOGOS = {
    "ICA Maxi": "https://detailproduktion.se/wp-content/uploads/2014/04/ica-maxi-stormarknad-logo.png",
    "Amazon": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/Amazon_logo.svg/2560px-Amazon_logo.svg.png",
    "MIO": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/MIO_Logo.svg/2560px-MIO_Logo.svg.png",
    "Coop": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/Coop_logo.svg/2560px-Coop_logo.svg.png",
    "H&M": "https://upload.wikimedia.org/wikipedia/commons/5/53/H%26M-Logo.svg",
    "MQ": "https://www.kungsmassan.se/Images/Butiker/MQMARQET_1080x1080.png",
    "Guldfynd": "https://www.datocms-assets.com/138720/1732112442-guldfynd.png",
    "Hemtex": "https://images.seeklogo.com/logo-png/32/1/hemtex-logo-png_seeklogo-329500.png",
    "Hemköp": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/ce/Hemkop_logo.svg/1280px-Hemkop_logo.svg.png",
    "Specsavers": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/78/Specsavers_logo.svg/1200px-Specsavers_logo.svg.png",
    "Synsam": "https://kraftenifinspang.se/wp-content/uploads/2024/09/Loggor-centrumbutikerna_Synsam-1024x503.png",
    "SATS": "https://cdn.sanity.io/images/xkmfhygb/production/7a8c8bd647ab4949343baef3fe30dc92281489e7-1920x1080.jpg"
  };
  
  function finishNumbers() {
    console.log("Alla nummer valda:", collectedNumbers);
  
    questionTitle.textContent = "Sammanfattning";
  
    // Hämta valt erbjudande
let chosenOffer = document.querySelector(".offer-choice.active");

if (!chosenOffer && window.selectedOfferId) {
  chosenOffer = [...document.querySelectorAll(".offer-choice")]
    .find(c =>
      c.querySelector(".gift-btn")?.dataset.offerId === window.selectedOfferId
    );
}

if (!chosenOffer) {
  console.error("No chosen offer found");
  return;
}

  
  const offerTitle = chosenOffer
    ? chosenOffer.querySelector("h3").textContent
    : "Okänt erbjudande";
  
  const offerOperator = chosenOffer
    ? chosenOffer.querySelector("p.text-sm").textContent
    : "";
  
  const offerLogo = chosenOffer
    ? chosenOffer.querySelector("img").src
    : "";
  
  const priceEl = chosenOffer?.querySelector(".text-xl.font-bold");
const offerPrice = priceEl ? priceEl.textContent.trim() : "";
    const rewardDistribution =
    JSON.parse(localStorage.getItem("rewardDistribution")) || {};
    let rewardsHTML = Object.entries(rewardDistribution)
  .filter(([_, v]) => v >= 100)
  .map(([company, value]) => {
    const logo = REWARD_LOGOS[company];

    return `
      <div class="reward-row">
        <img
          src="${logo}"
          alt="${company}"
          class="h-8 object-contain"
        />
        <span class="reward-amount-badge">${value} kr</span>
      </div>
    `;
  })
  .join("");


  

  let summaryHTML = `
  <div class="p-6 bg-white rounded-2xl shadow text-left">
    <div class="grid grid-cols-1 md:grid-cols-4 gap-8">
  
      <!-- LEFT COLUMN -->
      <div class="md:col-span-2 space-y-6">
  
        <h3 class="text-2xl font-bold text-[#0C4A3C]">Valt erbjudande</h3>
  
        <div class="flex items-center gap-4 mt-4">
          <img src="${offerLogo}" class="h-12 w-12 object-contain rounded-md border" />
          <div>
            <p class="text-lg font-semibold">${offerTitle}</p>
            <p class="text-gray-700 text-md">från ${offerOperator}</p>
            <p class="text-[#0C4A3C] font-bold mt-1">${offerPrice}</p>
          </div>
        </div>
  `;
  
  Object.keys(collectedNumbers).forEach(key => {
    const p = collectedNumbers[key];
    summaryHTML += `
      <div class="border p-4 rounded-xl bg-gray-50">
        <p class="font-semibold">🧑 ${key.replace("person_", "Person ")}</p>
        <p class="text-gray-700">
          ${p.type === "port"
            ? `Flyttar nummer: <strong>${p.number}</strong>`
            : `Får nytt nummer`}
        </p>
      </div>
    `;
  });
  
  summaryHTML += `
      </div>
  
      <!-- RIGHT COLUMN -->
      <div class="md:col-span-2">
        <h3 class="text-2xl font-bold text-[#0C4A3C] mb-4">
          Valda belöningar
        </h3>
  
        <div class="reward-summary">
          ${rewardsHTML || "<p class='text-gray-500'>Inga belöningar valda</p>"}
        </div>

      </div>
  
    </div>
    <!-- START DATE QUESTION -->
    <div class="mt-8">
      <h3 class="text-xl font-bold text-[#0C4A3C] mb-4">
        När vill du starta ditt abonnemang?
      </h3>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button
          class="start-option"
          data-start="now"
          type="button">
          Starta nu
        </button>

        <button
          class="start-option"
          data-start="30"
          type="button">
          Fr.o.m 30 dagar
        </button>
      </div>
    </div>

    <button id="goToCheckout"
      class="w-full adeala-btn mt-8 py-4 text-lg rounded-xl">
      Fortsätt till signering
    </button>
  </div>
  `;
  
  
    phoneInputs.innerHTML = summaryHTML;
    smoothScrollTo(sectionPort);

    btnConfirm.classList.add("hidden");
    let startChoice = null;

    document.querySelectorAll(".start-option").forEach(btn => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".start-option").forEach(b =>
          b.classList.remove("active")
        );
    
        btn.classList.add("active");
        startChoice = btn.dataset.start;
    
        localStorage.setItem("startDateChoice", startChoice);
      });
    });
    
    // Click → next page
    document.getElementById("goToCheckout").onclick = () => {
      if (!startChoice) {
        alert("Välj när ditt abonnemang ska starta.");
        return;
      }
    
      window.location.href = "signera.html";
    };
    
  }
  /******************************
   CHECK IF READY FOR NUMBERS
  ******************************/
function checkGoToNumberStep() {
  if (!window.offerChosen) return;

  // allow number flow even without reward
  startNumberFlow();
}


  
  
  function calculateReward(price) {
    if (price < 299) return 2000;
    if (price < 399) return 3000;
    if (price < 499) return 4000;
    if (price < 699) return 5000;
    return 1000;
  }
function openPchoicePopup(rewardValue, offerId) {
  localStorage.setItem(
    "rewardChoice",
    JSON.stringify({ reward: rewardValue, offerId })
  );

  const modal = document.getElementById("pchoiceModal");
  const frame = document.getElementById("pchoiceFrame");

  frame.src = "pchoice.html";
  modal.style.display = "block";   // 👈 REQUIRED
  modal.offsetHeight;              // force reflow
  modal.classList.add("show");
}

window.addEventListener("message", e => {
  if (e.data !== "rewardDone") return;

  window.beloningChosen = true;

  const modal = document.getElementById("pchoiceModal");
  const frame = document.getElementById("pchoiceFrame");

  modal.classList.remove("show");
  modal.style.display = "none";

  setTimeout(() => {
    frame.src = "";
    checkGoToNumberStep();
  }, 300);
});

  function smoothScrollTo(element) {
    if (!element) return;
  
    element.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }
window.renderSingleOfferCard = function (plan, payload = {}) {
  const fakeState = {
    persons: payload.persons || 1,
    data: payload.data || "high",
    operator: payload.operator || plan.operator
  };

  return buildOfferCard(
    {
      ...plan,
      finalPrice: plan.price,
      pricePerPerson: plan.price
    },
    fakeState
  );
};


  
