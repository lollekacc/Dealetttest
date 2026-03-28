import { env } from "../config/env.js";

export function health(_req, res) {
  res.json({
    ok: true,
    environment: env.nodeEnv,
    timestamp: new Date().toISOString()
  });
}
