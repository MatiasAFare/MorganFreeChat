// Configuración centralizada de la aplicación
require("dotenv").config();

const config = {
  // Configuración del servidor
  server: {
    httpPort: process.env.PORT || 3000,
    wsPort: process.env.WS_PORT || 8080,
    env: process.env.NODE_ENV || "development",
  },

  // Configuración de JWT
  jwt: {
    secret: process.env.JWT_SECRET || "morgan_free_chat_super_secret_key_2025",
    expiresIn: process.env.JWT_EXPIRES_IN || "24h",
  },

  // Configuración de cifrado
  encryption: {
    key: process.env.ENCRYPTION_KEY || "MorganFreeChatAESKey2025Secret!",
  },

  // Configuración de logging
  logging: {
    level: process.env.LOG_LEVEL || "info",
    dir: process.env.LOG_DIR || "src/logs",
  },

  // Configuración de base de datos
  database: {
    path: "src/server/data/users.db",
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS) || 12,
  },

  // Configuración del cliente
  client: {
    reconnectInterval: parseInt(process.env.CLIENT_RECONNECT_INTERVAL) || 5000,
    maxMessageLength: parseInt(process.env.MAX_MESSAGE_LENGTH) || 1000,
  },
};

module.exports = config;
