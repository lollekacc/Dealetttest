export const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT || 8080),
  frontendOrigin: process.env.FRONTEND_ORIGIN || "http://localhost:5173",
  chatProxyUrl: process.env.CHAT_PROXY_URL || "https://dealett-backend.onrender.com/api/chat"
};
