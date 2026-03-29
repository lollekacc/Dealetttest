import { Router } from "express";
import { listPlans } from "../controllers/plans.controller.js";

export const plansRouter = Router();

plansRouter.get("/plans", listPlans);
