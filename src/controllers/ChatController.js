const { encrypt } = require('../utils/crypto');
const logger = require('../utils/logger');
const chatLogger = require('../utils/chatLogger');

class ChatController {
    constructor(wsServer) {
        this.wsServer = wsServer;
    }

    async handleChatMessage(ws, message, clientInfo, clientIP) {
        if (!message.content || !message.content.trim()) {
            return;
        }

        if (message.content.startsWith('/')) {
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
            encrypted: true
        };

        // Enviar a remitente y broadcast a otros
        this.wsServer.sendToClient(ws, 'chat_message', chatMessage);
        this.wsServer.broadcast('chat_message', chatMessage, ws);

        chatLogger.logMessage(clientInfo.username, content.trim(), clientIP);
    }

    handleCommand(ws, command, clientInfo, clientIP) {
        const parts = command.trim().split(' ');
        const cmd = parts[0].toLowerCase();

        chatLogger.logCommand(clientInfo.username, command.trim(), clientIP);

        switch (cmd) {
            case '/nick':
                this.handleNickCommand(ws, parts, clientInfo, clientIP);
                break;
            case '/lista':
                this.handleListCommand(ws, clientInfo, clientIP);
                break;
            case '/salir':
                this.handleExitCommand(ws, clientInfo, clientIP);
                break;
            case '/help':
                this.handleHelpCommand(ws, clientInfo, clientIP);
                break;
            default:
                this.wsServer.sendToClient(ws, 'system', {
                    message: `Comando desconocido: ${cmd}`
                });
        }
    }

    handleNickCommand(ws, parts, clientInfo, clientIP) {
        const newNick = parts.slice(1).join(' ').trim();
        if (!newNick) {
            this.wsServer.sendToClient(ws, 'system', {
                message: 'Uso: /nick <nuevo_nombre>'
            });
            return;
        }

        const oldNick = clientInfo.username;
        clientInfo.username = newNick;
        this.wsServer.sendToClient(ws, 'system', {
            message: `Tu nick cambió a ${newNick}`
        });
        this.wsServer.broadcast('system', {
            message: `${oldNick} ahora se llama ${newNick}`
        }, ws);
    }

    handleListCommand(ws, clientInfo, clientIP) {
        const userList = Array.from(this.wsServer.clients.values()).map(c => c.username);
        this.wsServer.sendToClient(ws, 'system', {
            message: `Usuarios conectados (${userList.length}): ${userList.join(', ')}`
        });
    }

    handleExitCommand(ws, clientInfo, clientIP) {
        this.wsServer.sendToClient(ws, 'system', { message: 'Desconectando...' });
        ws.close(1000, 'User requested disconnect');
    }

    handleHelpCommand(ws, clientInfo, clientIP) {
        const helpMessage = `Comandos: /nick <nombre>, /lista, /salir, /help`;
        this.wsServer.sendToClient(ws, 'system', { message: helpMessage });
    }
}

module.exports = ChatController;