import { proxyChatMessage } from "../services/chat.service.js";

export async function chat(req, res, next) {
  try {
    const { message } = req.body;

    if (!message || typeof message !== "string") {
      res.status(400).json({ error: "A text 'message' field is required." });
      return;
    }

    const sessionId = req.get("X-Chat-Session");
    const result = await proxyChatMessage({ message, sessionId });
    res.json(result);
  } catch (error) {
    next(error);
  }
}
