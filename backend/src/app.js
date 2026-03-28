import cors from "cors";
import express from "express";
import { env } from "./config/env.js";
import { requestLogger } from "./middleware/request-logger.middleware.js";
import { healthRouter } from "./routes/health.routes.js";
import { plansRouter } from "./routes/plans.routes.js";
import { chatRouter } from "./routes/chat.routes.js";
import { notFoundHandler } from "./middleware/not-found.middleware.js";
import { errorHandler } from "./middleware/error-handler.middleware.js";

export function createApp() {
  const app = express();

  app.use(cors({ origin: env.frontendOrigin }));
  app.use(express.json());
  app.use(requestLogger);

  app.use("/api", healthRouter);
  app.use("/api", plansRouter);
  app.use("/api", chatRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
