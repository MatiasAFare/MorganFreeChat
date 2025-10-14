const { encrypt } = require("../utils/crypto");
const chatLogger = require("../utils/chatLogger");
const quotes = require("../utils/quotes.json");

class ChatController {
  constructor(wsServer) {
    this.wsServer = wsServer;
  }

  async handleChatMessage(ws, message, clientInfo, clientIP) {
    if (!message.content || !message.content.trim()) {
      return;
    }

    if (message.content.startsWith("/")) {
      this.handleCommand(ws, message.content, clientInfo, clientIP);
    } else {
      await this.handleTextMessage(ws, message.content, clientInfo, clientIP);
    }
  }

  async handleTextMessage(ws, content, clientInfo, clientIP) {
    const encryptedContent = encrypt(content.trim());
    const chatMessage = {
      username: clientInfo.username,
      content: encryptedContent,
      timestamp: new Date().toISOString(),
      encrypted: true,
    };

    // Enviar a remitente y broadcast a otros
    this.wsServer.sendToClient(ws, "chat_message", chatMessage);
    this.wsServer.broadcast("chat_message", chatMessage, ws);

    chatLogger.logMessage(clientInfo.username, content.trim(), clientIP);
  }

  handleCommand(ws, command, clientInfo, clientIP) {
    const parts = command.trim().split(" ");
    const cmd = parts[0].toLowerCase();

    chatLogger.logCommand(clientInfo.username, command.trim(), clientIP);

    switch (cmd) {
      case "/nick":
        this.handleNickCommand(ws, parts, clientInfo, clientIP);
        break;
      case "/lista":
        this.handleListCommand(ws, clientInfo, clientIP);
        break;
      case "/salir":
        this.handleExitCommand(ws, clientInfo, clientIP);
        break;
      case "/help":
        this.handleHelpCommand(ws, clientInfo, clientIP);
        break;
      case "/morgan":
        this.handleMorganCommand(ws, clientInfo, clientIP);
        break;
      default:
        this.wsServer.sendToClient(ws, "system", {
          message: `Comando desconocido: ${cmd}`,
        });
    }
  }

  handleNickCommand(ws, parts, clientInfo, clientIP) {
    const newNick = parts.slice(1).join(" ").trim();
    if (!newNick) {
      this.wsServer.sendToClient(ws, "system", {
        message: "Uso: /nick <nuevo_nombre>",
      });
      return;
    }

    const oldNick = clientInfo.username;
    clientInfo.username = newNick;
    this.wsServer.sendToClient(ws, "system", {
      message: `Tu nick cambió a ${newNick}`,
    });
    this.wsServer.broadcast(
      "system",
      {
        message: `${oldNick} ahora se llama ${newNick}`,
      },
      ws
    );
  }

  handleListCommand(ws, clientInfo, clientIP) {
    const userList = Array.from(this.wsServer.clients.values()).map(
      (c) => c.username
    );
    this.wsServer.sendToClient(ws, "system", {
      message: `Usuarios conectados (${userList.length}): ${userList.join(
        ", "
      )}`,
    });
  }

  handleExitCommand(ws, clientInfo, clientIP) {
    this.wsServer.sendToClient(ws, "system", { message: "Desconectando..." });
    ws.close(1000, "User requested disconnect");
  }

  handleHelpCommand(ws, clientInfo, clientIP) {
    const helpMessage = `Comandos: /nick <nombre>, /lista, /salir, /morgan, /help`;
    this.wsServer.sendToClient(ws, "system", { message: helpMessage });
  }

  handleMorganCommand(ws, clientInfo, clientIP) {
    const invokingMessage = "Invocando a Morgan...";
    const encryptedInvoking = encrypt(invokingMessage);
    const invokingChatMessage = {
      username: clientInfo.username,
      content: encryptedInvoking,
      timestamp: new Date().toISOString(),
      encrypted: true,
    };

    // Enviar mensaje de invocación
    this.wsServer.sendToClient(ws, "chat_message", invokingChatMessage);
    this.wsServer.broadcast("chat_message", invokingChatMessage, ws);
    chatLogger.logMessage(clientInfo.username, invokingMessage, clientIP);

    // Obtener una frase aleatoria de Morgan Freeman
    const morganQuotes = quotes.morganFreemanQuotes;
    const randomIndex = Math.floor(Math.random() * morganQuotes.length);
    const randomQuote = morganQuotes[randomIndex];
    
    // Enviar la frase como mensaje del sistema a todos
    this.wsServer.sendToClient(ws, "system", {
      message: `"${randomQuote}"`,
    });
    this.wsServer.broadcast("system", {
      message: `"${randomQuote}"`,
    }, ws);

    chatLogger.logMessage("Morgan Freeman", randomQuote, clientIP);
  }
}

module.exports = ChatController;
