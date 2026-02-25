let ALL_PLANS = [];
let plansReady = false;

async function loadPlans() {
  if (ALL_PLANS.length) return ALL_PLANS;

  const res = await fetch("./data/plans.json");
  ALL_PLANS = await res.json();
  plansReady = true;
  return ALL_PLANS;
}

document.addEventListener("DOMContentLoaded", loadPlans);
function hasValidPlan(state, override = {}) {
  if (!plansReady) return false;

  const s = { ...state, ...override };

  return ALL_PLANS.some(p => {
    if (p.isFamilyPlan) return false;
    if (s.operator && p.operator !== s.operator) return false;

    if (s.dataNeed && p.tier !== s.dataNeed) return false;

    if (s.budget && p.price > s.budget) return false;
    return true;
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
  
          const chatRes = await fetch("partials/chat.html");
          if (chatRes.ok) {
            document.body.insertAdjacentHTML("beforeend", await chatRes.text());
          }
  
          const footerRes = await fetch("partials/footer.html");
          if (footerRes.ok) {
            document.body.insertAdjacentHTML("beforeend", await footerRes.text());
          }
  
  
    // 🔥 LOAD CHAT.JS *AFTER* CHAT HTML EXISTS
    const chatScript = document.createElement("script");
    chatScript.src = "/assets/chat.js";
    document.body.appendChild(chatScript);
  
  });
  
  const mobilState = {
    dataNeed: null,
    budget: null,
    operator: null
  };
  const familjState = {
  peopleCount: null,
  dataNeed: null,
  budget: null,
  operator: null
  };


function updateMobilAvailability() {

    // Q1 – data
    document.querySelectorAll('#qMobil1 .quiz-option').forEach(btn => {
      const dataNeed = btn.dataset.answer;
      const valid = hasValidPlan(mobilState, { dataNeed });
      btn.classList.toggle("disabled-option", !valid);
    });
  
    // Q2 – budget
    document.querySelectorAll('#qMobil2 .quiz-option').forEach(btn => {
      const budget = Number(btn.dataset.answer);
      const valid = hasValidPlan(mobilState, { budget });
      btn.classList.toggle("disabled-option", !valid);
    });
  
    // Q3 – operator
    document.querySelectorAll('#qMobil3 .quiz-option').forEach(btn => {
      const operator = btn.dataset.answer || null;
      const valid = hasValidPlan(mobilState, { operator });
      btn.classList.toggle("disabled-option", !valid);
    });
  }
  
  /******************************
   QUIZ SECTIONS
  ******************************/
  const mobilSection = document.getElementById("mobilQuizSection");
  const familjSection = document.getElementById("familjQuizSection");

  
  
  document.addEventListener("DOMContentLoaded", () => {
    const params = new URLSearchParams(window.location.search);
    const operator = params.get("op");
    if (!operator) return;
  
    mobilSection.classList.add("hidden");
    familjSection.classList.add("hidden");
  
    loadOffers({
      category: "mobil",
      peopleCount: 1,
      dataNeed: "high",
      budget: 99999,
      preferredOperator: operator,
      speedNeed: "high"
    });
  });
  
  /******************************
   QUIZ SWITCH
  ******************************/
   document.getElementById("startMobilQuiz").onclick = () => {
    window.currentFlow = "mobil";
  
    // reset state
    window.offerChosen = false;
    window.beloningChosen = false;
    document.getElementById("numberSection").classList.add("hidden");
    document.getElementById("portNumberSection").classList.add("hidden");
  
    familjSection.classList.add("hidden");
    mobilSection.classList.remove("hidden");
  
    // ✅ scroll to quiz
    smoothScrollTo(mobilSection);
  };
  
  
  
  
  document.getElementById("startFamiljQuiz").onclick = () => {
    window.currentFlow = "familj";
  
    mobilSection.classList.add("hidden");
    familjSection.classList.remove("hidden");
    updateFamiljAvailability();
    // ✅ scroll to quiz
    smoothScrollTo(familjSection);
  };
  
  
  /******************************
   OFFER RENDER
  ******************************/
  function renderOffers(offers) {
    offersContainer.innerHTML = "";
    const limited = offers.slice(0, 6);
  
    limited.forEach(o => {
  
      const reward = calculateReward(o.finalPrice);
  
      const card = document.createElement("div");
      card.className =
        "relative offer-choice text-left border rounded-2xl shadow bg-white p-6 flex flex-col justify-between cursor-pointer transition hover:shadow-lg";
  
      card.dataset.choiceId = o.id || "";
  
      card.addEventListener("click", () => {
        document.querySelectorAll(".offer-choice").forEach(c => {
          c.classList.remove("active");
          c.classList.add("faded");
          c.querySelector(".reward-circle")?.classList.remove("reward-selected");
        });
      
        card.classList.add("active");
        card.classList.remove("faded");
        card.querySelector(".reward-circle")?.classList.add("reward-selected");
      
        window.offerChosen = true;
        checkGoToNumberStep();
      });
      
      
      
      
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
      <img src="${o.logo || 'assets/logo-placeholder.png'}"
           class="h-16 mx-auto mb-4 object-contain">
      <p class="text-sm text-gray-500 mb-1">${o.operator || ''}</p>
      <h3 class="text-xl font-semibold mb-1 text-[#0C4A3C]">${o.title}</h3>
      <p class="text-gray-600 text-sm mb-3">${o.text || ''}</p>
      <p class="font-medium mb-1">${o.data || ''}</p>
    </div>
  
    <div>
      <p class="font-semibold text-lg mb-4">${o.finalPrice} kr/mån</p>
    </div>
  `;
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
async function renderAllOffersAtBottom() {
  await loadPlans();

  const offers = ALL_PLANS
    .filter(p => p.category === "mobil" && !p.isFamilyPlan)
    .map(p => ({ ...p, finalPrice: p.price }));

  renderOffers(offers);
  offersSection.classList.remove("hidden");
}  
function renderFamilyOffers(offers) {
  offersContainer.innerHTML = "";
  
  if (!offers.length) {
    offersContainer.innerHTML = `
      <p class="text-center text-gray-500 col-span-full">
        Inga abonnemang matchar dina val.
      </p>`;
    offersSection.classList.remove("hidden");
    return;
  }

  offers.slice(0, 6).forEach(o => {

    // ✅ SAME reward logic as Mobil
    const reward = calculateReward(o.totalPrice);

    const card = document.createElement("div");
    card.className =
      "relative offer-choice text-left border rounded-2xl shadow bg-white p-6 flex flex-col justify-between cursor-pointer transition hover:shadow-lg";

    card.innerHTML = `
      <!-- REWARD (IDENTICAL TO MOBIL) -->
      <div class="flex flex-col items-center gap-1 absolute -top-6 -right-6">
        <button
          class="reward-circle gift-btn"
          data-reward="${reward}"
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
        <p class="text-gray-600 text-sm mb-3">${o.data}</p>
        <p class="font-medium mb-1">${o.peopleCount} personer</p>
      </div>

      <div>
        <p class="font-semibold text-lg mb-1">${o.pricePerPerson} kr / person</p>
        <p class="text-sm text-gray-500">${o.totalPrice} kr/mån totalt</p>
      </div>
    `;

    // ✅ SAME click behavior as Mobil
    card.addEventListener("click", () => {
  document.querySelectorAll(".offer-choice").forEach(c => {
    c.classList.remove("active");
    c.classList.add("faded");
    c.querySelector(".reward-circle")?.classList.remove("reward-selected");
  });

  card.classList.add("active");
  card.classList.remove("faded");

  // ✅ ADD THIS LINE
  card.querySelector(".reward-circle")
    ?.classList.add("reward-selected");

  window.offerChosen = true;
  checkGoToNumberStep();
});


    // ✅ SAME reward popup as Mobil
    const rewardBtn = card.querySelector(".gift-btn");

if (rewardBtn) {
  rewardBtn.addEventListener("click", e => {
    e.stopPropagation();
    openPchoicePopup(reward);
  });
}

    offersContainer.appendChild(card);
  });

  offersSection.classList.remove("hidden");
  offersSection.scrollIntoView({ behavior: "smooth" });
}

  function getFamilyOffers(allPlans, filters) {
    const { peopleCount, dataNeed, preferredOperator } = filters;
  
    // 1. Group by operator
    const operators = [...new Set(allPlans.map(p => p.operator))];
  
    let results = [];
  
    for (const operator of operators) {
  
      if (preferredOperator && operator !== preferredOperator) continue;
  
      const basePlans = allPlans.filter(p =>
        p.operator === operator &&
        !p.isFamilyPlan
      );
  
      const addon = allPlans.find(p =>
        p.operator === operator &&
        p.isFamilyPlan &&
        p.familyPriceType === "addon"
      );
  
      if (!addon) continue; // operator does not support family
  
      for (const base of basePlans) {
  
        // 2. Match data need
        if (dataNeed && base.tier !== dataNeed) continue;
  
        // 3. Calculate price
        const totalPrice =
          base.price + (peopleCount - 1) * addon.addonPrice;
  
        const perPerson =
          Math.round(totalPrice / peopleCount);
        // Budget = TOTAL household budget
        if (totalPrice > filters.budget) continue;
  
        results.push({
          operator,
          title: base.title,
          data: base.data,
          peopleCount,
          totalPrice,
          pricePerPerson: perPerson,
          logo: base.logo,
          text: `${peopleCount} personer • ${perPerson} kr/person`
        });
      }
    }
  
    // 4. Sort best value first
    return results.sort((a, b) => a.pricePerPerson - b.pricePerPerson);
  }
/******************************
 LOAD OFFERS (ROUTER)
******************************/
async function loadOffers(filters) {
  if (!ALL_PLANS.length) {
  await loadPlans();
}
const allPlans = ALL_PLANS;
  try {


    // OPERATOR CLICK MODE
    if (filters.preferredOperator && filters.category === "mobil") {
      renderOperatorOffers(allPlans, filters);
      return;
    }

    // FAMILY QUIZ MODE
    if (filters.category === "familj") {
      const familyOffers = getFamilyOffers(allPlans, filters);
      renderFamilyOffers(familyOffers);
      return;
    }

    // NORMAL MOBIL QUIZ MODE
    renderMobilQuizOffers(allPlans, filters);

  } catch (err) {
    console.error("loadOffers error:", err);
    renderOffers([]);
  }
}

/******************************
 MOBIL QUIZ FILTER
******************************/
function renderMobilQuizOffers(allPlans, filters) {
  const offers = allPlans
    .filter(p => p.category === "mobil")
    .filter(p => !p.isFamilyPlan)
    .filter(p => !filters.preferredOperator || p.operator === filters.preferredOperator)
    .map(p => ({ ...p, finalPrice: p.price }))
    .filter(p => p.finalPrice <= filters.budget)
    .filter(p => !filters.dataNeed || p.tier === filters.dataNeed)
    .sort((a, b) => a.finalPrice - b.finalPrice)
    .slice(0, 6);

  renderOffers(offers);
  offersSection.classList.remove("hidden");
  offersSection.scrollIntoView({ behavior: "smooth" });
}

/******************************
 OPERATOR CLICK FILTER
******************************/
function renderOperatorOffers(allPlans, filters) {
  const operatorPlans = allPlans.filter(
    p =>
      p.operator === filters.preferredOperator &&
      !p.isFamilyPlan &&
      (!filters.dataNeed || p.tier === filters.dataNeed)
  );

  const tiers = {
    low: operatorPlans.find(p => p.tier === "low"),
    medium: operatorPlans.find(p => p.tier === "medium"),
    high: operatorPlans.find(p => p.tier === "high")
  };

  const offers = Object.values(tiers)
    .filter(Boolean)
    .map(p => ({ ...p, finalPrice: p.price }));

  renderOffers(offers);
  offersSection.classList.remove("hidden");
  offersSection.scrollIntoView({ behavior: "smooth" });
}


  function activateButton(btn) {
    const card = btn.closest(".quiz-card");
  
    if (btn.classList.contains("active")) {
      btn.classList.remove("active");
      return;
    }
  
    card.querySelectorAll(".quiz-option").forEach(x =>
      x.classList.remove("active")
    );
    btn.classList.add("active");
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
   MOBIL QUIZ LOGIC
  ******************************/
   document.querySelectorAll('.mobil-opt').forEach(btn =>
    btn.addEventListener('click', () => {
      activateButton(btn);
  
      mobilState.dataNeed =
        document.querySelector('#qMobil1 .active')?.dataset.answer || null;
  
      mobilState.budget =
        Number(document.querySelector('#qMobil2 .active')?.dataset.answer) || null;
  
      mobilState.operator =
        document.querySelector('#qMobil3 .active')?.dataset.answer || null;
  
      updateMobilAvailability();
      checkMobil();
    })
  );
  
  
  function checkMobil() {
    const q1 = document.querySelector('#qMobil1 .active');
    const q2 = document.querySelector('#qMobil2 .active');
    const q3 = document.querySelector('#qMobil3 .active');
  
    if (q1 && q2 && q3) {
      loadOffers({
        category: "mobil",
        peopleCount: 1,
        dataNeed: q1.dataset.answer,
        budget: Number(q2.dataset.answer),
        preferredOperator: q3.dataset.answer || null,
        speedNeed: "high"
      });
    }
}
  
  
  /******************************
   FAMILJ QUIZ LOGIC
  ******************************/

  function hasValidFamilyCombination(state, override = {}) {
  if (!ALL_PLANS.length) return true;
  const testState = { ...state, ...override };

  // require minimum inputs
  if (!testState.peopleCount || !testState.dataNeed || !testState.budget)
    return true;

  const offers = getFamilyOffers(ALL_PLANS, {
    category: "familj",
    peopleCount: testState.peopleCount,
    dataNeed: testState.dataNeed,
    budget: testState.budget,
    preferredOperator: testState.operator
  });

  return offers.length > 0;
  }

  function checkFamilj() {
    const q1 = document.querySelector('#qFam1 .active');
    const q2 = document.querySelector('#qFam2 .active');
    const q3 = document.querySelector('#qFam3 .active');
    const q4 = document.querySelector('#qFam4 .active');
  
    if (q1 && q2 && q3 && q4) {
      loadOffers({
        category: "familj",
        peopleCount: Number(q1.dataset.answer),
        dataNeed: q2.dataset.answer,
        budget: Number(q3.dataset.answer),
        preferredOperator: q4.dataset.answer || null,
        speedNeed: "high"
      });
    }
  
  }
function isPerfectMatch(plan, filters) {
  if (filters.preferredOperator && plan.operator !== filters.preferredOperator)
    return false;

  if (filters.dataNeed && plan.tier !== filters.dataNeed)
    return false;

  if (plan.price > filters.budget)
    return false;

  return true;
}

  function updateFamiljAvailability() {

  // Q1 – family size
  document.querySelectorAll('#qFam1 .quiz-option').forEach(btn => {
    const peopleCount = Number(btn.dataset.answer);
    btn.classList.toggle(
      "disabled-option",
      !hasValidFamilyCombination(familjState, { peopleCount })
    );
  });

  // Q2 – data need
  document.querySelectorAll('#qFam2 .quiz-option').forEach(btn => {
    const dataNeed = btn.dataset.answer;
    btn.classList.toggle(
      "disabled-option",
      !hasValidFamilyCombination(familjState, { dataNeed })
    );
  });

  // Q3 – budget
  document.querySelectorAll('#qFam3 .quiz-option').forEach(btn => {
    const budget = Number(btn.dataset.answer);
    btn.classList.toggle(
      "disabled-option",
      !hasValidFamilyCombination(familjState, { budget })
    );
  });

  // Q4 – operator
  document.querySelectorAll('#qFam4 .quiz-option').forEach(btn => {
    const operator = btn.dataset.answer || null;
    btn.classList.toggle(
      "disabled-option",
      !hasValidFamilyCombination(familjState, { operator })
    );
  });
}
document.querySelectorAll('.familj-opt').forEach(btn =>
  btn.addEventListener('click', () => {
    if (btn.classList.contains("disabled-option")) return;

    activateButton(btn);

    familjState.peopleCount =
      Number(document.querySelector('#qFam1 .active')?.dataset.answer) || null;

    familjState.dataNeed =
      document.querySelector('#qFam2 .active')?.dataset.answer || null;

    familjState.budget =
      Number(document.querySelector('#qFam3 .active')?.dataset.answer) || null;

    familjState.operator =
      document.querySelector('#qFam4 .active')?.dataset.answer || null;

    updateFamiljAvailability();
    checkFamilj();
  })
);

function isNearMatch(plan, filters) {
  if (plan.category !== "mobil") return false;

  if (plan.price > filters.budget * 1.2) return false;

  if (filters.dataNeed && plan.tier !== filters.dataNeed)
    return false;

  return true;
}


  
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
    const active = document.querySelector("#qFam1 .active");
    return active ? (active.dataset.answer === "6" ? 6 : Number(active.dataset.answer)) : 1;
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
  const chosenOffer = document.querySelector(".offer-choice.active");
  if (!chosenOffer) return;
  
  const offerTitle = chosenOffer
    ? chosenOffer.querySelector("h3").textContent
    : "Okänt erbjudande";
  
  const offerOperator = chosenOffer
    ? chosenOffer.querySelector("p.text-sm").textContent
    : "";
  
  const offerLogo = chosenOffer
    ? chosenOffer.querySelector("img").src
    : "";
  
  const offerPrice = chosenOffer
    ? chosenOffer.querySelector(".font-semibold.text-lg").textContent.trim()
    : "";
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
  let startChoice = null;
  
document.querySelectorAll(".start-option").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".start-option").forEach(b =>
      b.classList.remove("active")
    );

    btn.classList.add("active");
    startChoice = btn.dataset.start;

    // persist choice if needed
    localStorage.setItem("startDateChoice", startChoice);
  });
});
  /******************************
   CHECK IF READY FOR NUMBERS
  ******************************/
  function checkGoToNumberStep() {
    if (!window.offerChosen || !window.beloningChosen) return;
  
    startNumberFlow(); // ✅ always go to number step
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
  
    window.beloningChosen = true;
  
    const modal = document.getElementById("pchoiceModal");
    const frame = document.getElementById("pchoiceFrame");
  
    frame.src = "pchoice.html";
  
    // trigger animation
    modal.offsetHeight;
    modal.classList.add("show");
  }
  
  
  window.addEventListener("message", e => {
    if (e.data === "rewardDone") {
      const modal = document.getElementById("pchoiceModal");
      const frame = document.getElementById("pchoiceFrame");
  
      modal.classList.remove("show");
  
      setTimeout(() => {
        frame.src = "";
        checkGoToNumberStep();
      }, 300);
    }
  });
  function smoothScrollTo(element) {
    if (!element) return;
  
    element.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }
document.addEventListener("DOMContentLoaded", async () => {
  await renderAllOffersAtBottom();
});
document.addEventListener("DOMContentLoaded", async () => {
  const offersSection = document.getElementById("offersSection");
  const offersContainer = document.getElementById("offers-container");

  if (!offersSection || !offersContainer) {
    console.error("Offers DOM not found");
    return;
  }

  await loadPlans();

  const offers = ALL_PLANS
    .filter(p => p.category === "mobil" && !p.isFamilyPlan)
    .map(p => ({ ...p, finalPrice: p.price }));

  offersSection.classList.remove("hidden");
  renderOffers(offers);
});