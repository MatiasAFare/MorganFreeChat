// Configuración centralizada de la aplicación
require("dotenv").config();

// Validar variables críticas
const requiredEnvVars = ["JWT_SECRET", "ENCRYPTION_KEY"];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(
      `Variable de entorno obligatoria faltante: ${envVar}. ` +
      `Por favor, configura el archivo .env correctamente.`
    );
  }
}

const config = {
  // Configuración del servidor
  server: {
    httpPort: parseInt(process.env.PORT) || 3000,
    wsPort: parseInt(process.env.WS_PORT) || 8080,
    env: process.env.NODE_ENV || "development",
  },

  // Configuración de JWT
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || "24h",
  },

  // Configuración de cifrado
  encryption: {
    key: process.env.ENCRYPTION_KEY,
  },

  // Configuración de logging
  logging: {
    level: process.env.LOG_LEVEL || "info",
    dir: process.env.LOG_DIR || "src/logs",
    fileChat: process.env.LOG_FILE_CHAT || "chat-messages.log",
    fileSystem: process.env.LOG_FILE_SYSTEM || "system.log",
    maxSize: process.env.LOG_MAX_SIZE || "10m",
    maxFiles: parseInt(process.env.LOG_MAX_FILES) || 14,
  },

  // Configuración de base de datos
  database: {
    path: process.env.DATABASE_PATH || "src/data/users.db",
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS) || 12,
  },

  // Configuración del cliente
  client: {
    reconnectInterval: parseInt(process.env.CLIENT_RECONNECT_INTERVAL) || 5000,
    maxMessageLength: parseInt(process.env.MAX_MESSAGE_LENGTH) || 1000,
  },

  // Configuración de WebSocket
  websocket: {
    heartbeatInterval: parseInt(process.env.WS_HEARTBEAT_INTERVAL) || 30000,
    timeout: parseInt(process.env.WS_TIMEOUT) || 5000,
    messageQueueLimit: parseInt(process.env.WS_MESSAGE_QUEUE_LIMIT) || 100,
  },
};

module.exports = config;
