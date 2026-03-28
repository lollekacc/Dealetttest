import { getPlans } from "../services/plans.service.js";

export async function listPlans(_req, res, next) {
  try {
    const plans = await getPlans();
    res.json(plans);
  } catch (error) {
    next(error);
  }
}
