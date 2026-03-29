import { initChat } from "./chat.js";
import { initOffers } from "./offers.controller.js";
import { loadPlans } from "./offers.service.js";

async function initApp() {
  const plans = await loadPlans();

  window.APP = {
    plans
  };

  initChat({ plans });
  initOffers();
}

initApp();