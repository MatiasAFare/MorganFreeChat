const net = require("net");
const fs = require("fs");
const path = require("path");

const clients = new Map(); // socket -> nick
const logDir = path.join(__dirname, "../logs");
const logFile = path.join(logDir, "chat.md");



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
            writeLog(`${dataStr} se ha unido al chat`, socket);
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
        writeLog(fullMsg, socket);
    });

    socket.on("end", () => {
        const nick = clients.get(socket);
        const endMsg = `${nick} salió del chat`;

        if (nick) {
            broadcast(endMsg, socket);
            writeLog(endMsg, socket);
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
        writeLog(`${nick} cambió su nick a ${newNick}`, socket);
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
function writeLog(message, socket) {
    let ip = "IP desconocida";
    if (socket && socket.remoteAddress) {
        ip = socket.remoteAddress === "::1" ? "127.0.0.1 (local)" : socket.remoteAddress;
    }

    // Si es la primera vez, crea el encabezado y la imagen
    if (!fs.existsSync(logFile)) {
        const header = `# MorganFreeChat - Registro de Conversaciones\n\n<img src="../server/images/welcome.jpg" alt="Bienvenida" width="300"/>\n\nBienvenido al registro oficial del chat multiusuario MorganFreeChat.\n\n---\n\n> *Este archivo es generado automáticamente por el sistema de chat. Para dudas técnicas, consulte la documentación del proyecto.*\n\n---\n\n`;
        fs.writeFileSync(logFile, header);
    }
    const formattedTime = new Date().toLocaleTimeString([], { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
    fs.appendFile(logFile, `
<div style="border: 1px solid #ccc; border-radius: 5px; padding: 10px; margin: 10px 0; background-color: #1d1d1da4;">
    <strong>📅 Fecha:</strong> <span style="color: #007acc;">${formattedTime}</span><br>
    <strong>🌐 IP:</strong> <span style="color: #ff7d4eff;">${ip}</span><br>
    <strong>💬 Mensaje de</strong> <span style="color: #27db27ff;"> ${message} </span>
</div>

`, (err) => {
        if (err) console.error("Error escribiendo log:", err.message);
    });
}

server.listen(8000, () => {
    console.log("Servidor escuchando en el puerto 8000");
});

