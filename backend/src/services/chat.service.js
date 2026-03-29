import { env } from "../config/env.js";

export async function proxyChatMessage({ message, sessionId }) {
  const headers = { "Content-Type": "application/json" };
  if (sessionId) headers["X-Chat-Session"] = sessionId;

  const response = await fetch(env.chatProxyUrl, {
    method: "POST",
    headers,
    body: JSON.stringify({ message })
  });

  if (!response.ok) {
    throw new Error(`Chat provider responded with status ${response.status}`);
  }

  return response.json();
}
