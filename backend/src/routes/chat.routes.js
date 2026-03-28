import { Router } from "express";
import { chat } from "../controllers/chat.controller.js";

export const chatRouter = Router();

chatRouter.post("/chat", chat);
