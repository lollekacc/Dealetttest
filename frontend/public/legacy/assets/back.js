let ALL_PLANS = [];
function getFamilyAddonForOperator(plans, operator) {
  return plans.find(p =>
    p.operator === operator &&
    p.isFamilyPlan === true &&
    p.familyPriceType === "addon"
  );
}
const offers = ALL_PLANS
  .filter(p => !p.isFamilyPlan) 
  .map(p => ({
    ...p,
    finalPrice: p.price,
    pricePerPerson: p.price
  }))
  .sort((a, b) => a.finalPrice - b.finalPrice); 

function getInitialOffers(plans) {
  return plans
    .filter(p => !p.isFamilyPlan)
    .map(p => ({
      ...p,
      finalPrice: p.price,
      pricePerPerson: p.price
    }))
    .sort((a, b) => a.finalPrice - b.finalPrice);
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
const abonState = {
  persons: null,
  data: null,
  operator: null,
  binding: null,
  bindingEndDate: null
};
  function isValidPhone(num) {
    num = num.replace(/\s+/g, "");
    return /^07\d{8}$/.test(num) || /^\+467\d{8}$/.test(num);
  }
    function calculateReward(price) {
    if (price < 299) return 2000;
    if (price < 399) return 3000;
    if (price < 499) return 4000;
    if (price < 699) return 5000;
    return 1000;
  }