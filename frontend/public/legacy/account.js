document.addEventListener("DOMContentLoaded", async () => {
  await loadPartials();
  initAccountPage();
});

async function loadPartials() {
  try {
    const headerRes = await fetch("./partials/header.html");
    if (headerRes.ok) {
      document.getElementById("header-placeholder").innerHTML =
        await headerRes.text();
    }
  } catch (err) {}

  try {
    const footerRes = await fetch("./partials/footer.html");
    if (footerRes.ok) {
      document.body.insertAdjacentHTML("beforeend", await footerRes.text());
    }
  } catch (err) {}
}

function initAccountPage() {
  const user = readStorage("dealett_user");

  if (!user) {
    window.location.href = "login.html";
    return;
  }

  const plan = readStorage("dealett_plan");
  const reward = readStorage("dealett_reward");

  setupUser(user);
  setupPlan(plan);
  setupReward(reward);
  setupActions();
}

function readStorage(key) {
  try {
    return JSON.parse(localStorage.getItem(key));
  } catch {
    return null;
  }
}

function setupUser(user) {
  document.getElementById("userName").textContent =
    user.name || "Kund";
}

function setupPlan(plan) {
  const activePlan = document.getElementById("activePlan");
  const activeOperator = document.getElementById("activeOperator");
  const monthlyCost = document.getElementById("monthlyCost");
  const planBadge = document.getElementById("planBadge");

  const emptyState = document.getElementById("emptyPlanState");
  const planContent = document.getElementById("planContent");

  if (!plan) {
    activePlan.textContent = "Inget aktivt";
    activeOperator.textContent = "Ingen operatör vald";
    monthlyCost.textContent = "0 kr";
    planBadge.textContent = "Ingen koppling";

    emptyState.classList.remove("is-hidden");
    planContent.classList.add("is-hidden");
    return;
  }

  activePlan.textContent = plan.name || "Aktivt abonnemang";
  activeOperator.textContent = plan.operator || "Operatör saknas";
  monthlyCost.textContent = plan.price ? plan.price + " kr" : "0 kr";
  planBadge.textContent = "Aktivt";

  document.getElementById("planNameHeading").textContent =
    plan.name || "-";

  document.getElementById("planOperatorLine").textContent =
    plan.operator || "-";

  document.getElementById("planPriceBig").textContent =
    plan.price ? plan.price + " kr" : "-";

  document.getElementById("planData").textContent =
    plan.data || "-";

  document.getElementById("planStartDate").textContent =
    plan.startDate || "-";

  document.getElementById("subscriptionDetails").innerHTML = `
    <div class="detail-row">
      <span>Operatör</span>
      <strong>${plan.operator || "-"}</strong>
    </div>
    <div class="detail-row">
      <span>Abonnemang</span>
      <strong>${plan.name || "-"}</strong>
    </div>
    <div class="detail-row">
      <span>Surf</span>
      <strong>${plan.data || "-"}</strong>
    </div>
    <div class="detail-row">
      <span>Månadspris</span>
      <strong>${plan.price ? plan.price + " kr" : "-"}</strong>
    </div>
    <div class="detail-row">
      <span>Startdatum</span>
      <strong>${plan.startDate || "-"}</strong>
    </div>
  `;

  emptyState.classList.add("is-hidden");
  planContent.classList.remove("is-hidden");
}

function setupReward(reward) {
  const rewardStatus = document.getElementById("rewardStatus");
  const rewardMeta = document.getElementById("rewardMeta");
  const rewardNameLarge = document.getElementById("rewardNameLarge");
  const rewardDescription = document.getElementById("rewardDescription");

  if (!reward) {
    rewardStatus.textContent = "Ingen vald";
    rewardMeta.textContent = "Ingen aktiv belöning registrerad";
    rewardNameLarge.textContent = "Ingen vald belöning";
    rewardDescription.textContent =
      "Välj en belöning när du tecknar eller förlänger abonnemang.";
    return;
  }

  rewardStatus.textContent = reward.name || "Vald belöning";
  rewardMeta.textContent = "Registrerad på ditt konto";
  rewardNameLarge.textContent = reward.name || "Vald belöning";

  rewardDescription.textContent =
    reward.description ||
    "Din valda belöning är kopplad till kontot.";
}

function setupActions() {
  const logoutBtn = document.getElementById("logoutBtn");
  const cancelPlanBtn = document.getElementById("cancelPlan");
  const deleteAccountBtn = document.getElementById("deleteAccount");

  logoutBtn?.addEventListener("click", () => {
    localStorage.removeItem("dealett_user");
    window.location.href = "index.html";
  });

  cancelPlanBtn?.addEventListener("click", () => {
    const confirmed = confirm(
      "Vill du avsluta ditt nuvarande abonnemang?"
    );

    if (!confirmed) return;

    localStorage.removeItem("dealett_plan");
    location.reload();
  });

  deleteAccountBtn?.addEventListener("click", () => {
    const confirmed = confirm(
      "Vill du radera all lokal kontodata från webbläsaren?"
    );

    if (!confirmed) return;

    localStorage.clear();
    window.location.href = "index.html";
  });
}