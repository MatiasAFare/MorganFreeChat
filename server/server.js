const net = require("net");
const fs = require("fs");
const path = require("path");

const clients = new Map(); // socket -> nick
const logDir = path.join(__dirname, "../logs");
const logFile = path.join(logDir, "chat.log");



const server = net.createServer((socket) => {
    let nickSet = false;

    socket.on("data", (data) => {
        const dataStr = data.toString().trim();

        // Primer mensaje -> nick
        if (!nickSet) {
            for (let n of clients.values()) {
                if (n === dataStr) {
                    socket.write("Ese nick ya está en uso. Intenta con otro.\n");
                    return; // no desconectamos, cliente puede reintentar
                }
            }
            clients.set(socket, dataStr);

            nickSet = true;
            socket.write(`Bienvenido, ${dataStr}!\n`);
            broadcast(`${dataStr} se ha unido al chat`, socket);
            writeLog(`${dataStr} se ha unido al chat`);
            return;
        }

        // Comandos
        if (dataStr.startsWith("/")) {
            handleCommand(dataStr, socket);
            return;
        }

        // Mensaje normal
        const nick = clients.get(socket);
        const fullMsg = `${nick}: ${dataStr}`;
        broadcast(fullMsg, socket);
        writeLog(fullMsg);
    });

    socket.on("end", () => {
        const nick = clients.get(socket);
        const endMsg = `${nick} salió del chat`;

        if (nick) {
            broadcast(endMsg, socket);
            writeLog(endMsg);
            clients.delete(socket);
        }
    });

    socket.on("error", (err) => {
        console.error("Error con cliente: ", err.message);
    });
});

// Función para comandos
function handleCommand(msg, socket) {
    const nick = clients.get(socket);
    if (msg === "/salir") {
        socket.write("Has salido del chat.\n");
        socket.end();
    } else if (msg === "/lista") {
        const list = Array.from(clients.values()).join(", ");
        socket.write(`Usuarios conectados: ${list}\n`);
    } else if (msg.startsWith("/nick ")) {
        const newNick = msg.split(" ")[1];
        if (!newNick) {
            socket.write("Uso: /nick <nuevoNick>\n");
            return;
        }
        for (let n of clients.values()) {
            if (n === newNick) {
                socket.write("Ese nick ya está en uso.\n");
                return;
            }
        }
        clients.set(socket, newNick);
        socket.write(`Tu nick cambió a ${newNick}\n`);
        broadcast(`${nick} ahora es ${newNick}`, socket);
        writeLog(`${nick} cambió su nick a ${newNick}`);
    } else {
        socket.write("Comando desconocido.\n");
    }
}

// Broadcast a todos menos al emisor
function broadcast(message, senderSocket) {
    for (let [client] of clients) {
        if (client !== senderSocket) {
            client.write(message + "\n");
        }
    }
}

// Guardar en log
function writeLog(message) {
    fs.appendFile(logFile, `[${new Date().toISOString()}] ${message}\n`, (err) => {
        if (err) console.error("Error escribiendo log:", err.message);
    });
}

server.listen(8000, () => {
    console.log("Servidor escuchando en el puerto 8000");
});

