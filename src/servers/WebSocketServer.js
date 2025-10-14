const WebSocket = require("ws");
const { verifyToken } = require("../services/AuthService");
const ChatController = require("../controllers/ChatController");
const logger = require("../utils/logger");
const chatLogger = require("../utils/chatLogger");

class WebSocketServer {
  constructor(port = 8080) {
    this.port = port;
    this.clients = new Map();
    this.userConnections = new Map(); // Mapa de userId -> ws
    this.wss = null;
    this.chatController = new ChatController(this);
  }

  start() {
    this.wss = new WebSocket.Server({ port: this.port });
    this.wss.on("connection", (ws, req) => {
      this.handleConnection(ws, req);
    });
    logger.info("WebSocket Server iniciado", { port: this.port });
    this.setupProcessHandlers();
  }

  kickUser(userId, reason = "Logged in from another location") {
    const ws = this.userConnections.get(userId);
    if (ws) {
      logger.info(`Expulsando usuario ${userId}: ${reason}`);
      ws.close(4000, reason);
      this.userConnections.delete(userId);
    }
  }

  setupProcessHandlers() {
    process.on("SIGINT", () => {
      logger.info("Cerrando servidor...");
      this.handleServerShutdown();
      process.exit(0);
    });

    process.on("SIGTERM", () => {
      logger.info("Servidor terminado...");
      this.handleServerShutdown();
      process.exit(0);
    });
  }

  handleServerShutdown() {
    this.clients.forEach((clientInfo, ws) => {
      if (clientInfo) {
        chatLogger.logUserEvent(
          clientInfo.username,
          "fue desconectado (servidor cerrado)",
          ws.clientIP
        );
      }
    });

    this.clients.forEach((clientInfo, ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    });

    logger.info("Todos los usuarios han sido deslogueados");
  }

  handleConnection(ws, req) {
    const clientIP = req.socket.remoteAddress;
    ws.clientIP = clientIP;

    logger.info("Nueva conexión WebSocket", { ip: clientIP });

    ws.on("message", async (data) => {
      await this.handleMessage(ws, data);
    });

    ws.on("close", () => {
      this.handleDisconnection(ws);
    });

    ws.on("error", (error) => {
      logger.error("WebSocket error", { error: error.message });
    });
  }

  async handleMessage(ws, data) {
    try {
      const message = JSON.parse(data);
      const clientInfo = this.clients.get(ws);

      if (!clientInfo) {
        await this.handleAuthentication(ws, message);
      } else {
        await this.handleClientMessage(ws, message, clientInfo);
      }
    } catch (error) {
      logger.error("Error processing message", { error: error.message });
    }
  }

  async handleAuthentication(ws, message) {
    if (message.type === "authenticate" && message.token) {
      const decodedToken = await verifyToken(message.token);
      if (decodedToken) {
        if (this.userConnections.has(decodedToken.userId)) {
          this.kickUser(
            decodedToken.userId,
            "Se ha iniciado sesión desde otra ubicación."
          );
        }

        const clientInfo = {
          userId: decodedToken.userId,
          username: decodedToken.username,
          connectedAt: new Date(),
        };

        this.clients.set(ws, clientInfo);
        this.userConnections.set(clientInfo.userId, ws);

        this.sendToClient(ws, "auth_success", {
          username: decodedToken.username,
          message: `Bienvenido al chat, ${decodedToken.username}!`,
        });

        this.broadcast(
          "user_joined",
          {
            username: decodedToken.username,
            message: `${decodedToken.username} se unió al chat`,
          },
          ws
        );

        logger.info("Usuario autenticado", { username: decodedToken.username });
        chatLogger.logUserEvent(
          decodedToken.username,
          "se conectó al chat",
          ws.clientIP
        );
      } else {
        logger.warn("Token inválido en autenticación");
        this.sendToClient(ws, "auth_error", { message: "Token inválido" });
      }
    } else {
      this.sendToClient(ws, "auth_error", {
        message: "Se requiere autenticación",
      });
    }
  }

  async handleClientMessage(ws, message, clientInfo) {
    switch (message.type) {
      case "chat_message":
        await this.chatController.handleChatMessage(
          ws,
          message,
          clientInfo,
          ws.clientIP
        );
        break;
      case "logout":
        this.handleLogout(ws, clientInfo);
        break;
    }
  }

  handleLogout(ws, clientInfo) {
    if (clientInfo) {
      chatLogger.logUserEvent(
        clientInfo.username,
        "se desconectó del chat",
        ws.clientIP
      );
      this.clients.delete(ws);
      this.userConnections.delete(clientInfo.userId);

      this.broadcast(
        "user_left",
        {
          username: clientInfo.username,
          message: `${clientInfo.username} salió del chat`,
        },
        ws
      );

      ws.close();
    }
  }

  handleDisconnection(ws) {
    const clientInfo = this.clients.get(ws);
    if (clientInfo) {
      // Solo eliminar de userConnections si el websocket coincide
      if (this.userConnections.get(clientInfo.userId) === ws) {
        this.userConnections.delete(clientInfo.userId);
      }
      this.clients.delete(ws);

      this.broadcast(
        "user_left",
        {
          username: clientInfo.username,
          message: `${clientInfo.username} salió del chat`,
        },
        ws
      );
      logger.info("Usuario desconectado", { username: clientInfo.username });
      chatLogger.logUserEvent(
        clientInfo.username,
        "se desconectó del chat",
        ws.clientIP
      );
    }
  }

  sendToClient(ws, type, data) {
    if (ws.readyState === WebSocket.OPEN) {
      try {
        const message = JSON.stringify({
          type,
          data,
          timestamp: new Date().toISOString(),
        });
        ws.send(message);
      } catch (error) {
        console.error("Error sending message to client:", error);
      }
    }
  }

  broadcast(type, data, senderWs = null) {
    for (const [ws, clientInfo] of this.clients.entries()) {
      if (ws !== senderWs && ws.readyState === WebSocket.OPEN) {
        this.sendToClient(ws, type, data);
      }
    }
  }
}

module.exports = WebSocketServer;