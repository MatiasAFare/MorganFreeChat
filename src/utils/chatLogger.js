const fs = require("fs");
const path = require("path");
const config = require("../config");

class ChatLogger {
  constructor() {
    const logDir = config.logging.dir;
    const fileName = config.logging.fileChat;
    this.logPath = path.join(__dirname, "..", logDir, fileName);
    this.ensureLogFileExists();
  }

  ensureLogFileExists() {
    const logDir = path.dirname(this.logPath);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    if (!fs.existsSync(this.logPath)) {
      fs.writeFileSync(
        this.logPath,
        "=== MORGENFRECHAT - LOG DE MENSAJES ===\n\n"
      );
    }
  }

  formatIP(ip) {
    if (
      ip === "::1" ||
      ip === "127.0.0.1" ||
      ip === "localhost" ||
      ip === "::ffff:127.0.0.1"
    ) {
      return "localhost";
    }
    return ip;
  }

  getTimestamp() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
      2,
      "0"
    )}-${String(now.getDate()).padStart(2, "0")} ${String(
      now.getHours()
    ).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(
      now.getSeconds()
    ).padStart(2, "0")}`;
  }

  logMessage(username, message, ip = "unknown") {
    const timestamp = this.getTimestamp();
    const formattedIP = this.formatIP(ip);
    const logEntry = `[${timestamp}] [${username}] (${formattedIP}) -> "${message}"\n`;
    fs.appendFileSync(this.logPath, logEntry, "utf8");
  }

  logCommand(username, command, ip = "unknown") {
    const timestamp = this.getTimestamp();
    const formattedIP = this.formatIP(ip);
    const logEntry = `[${timestamp}] [${username}] (${formattedIP}) -> COMANDO: ${command}\n`;
    fs.appendFileSync(this.logPath, logEntry, "utf8");
  }

  logUserEvent(username, event, ip = "unknown") {
    const timestamp = this.getTimestamp();
    const formattedIP = this.formatIP(ip);
    const logEntry = `[${timestamp}] [SISTEMA] (${formattedIP}) -> ${username} ${event}\n`;
    fs.appendFileSync(this.logPath, logEntry, "utf8");
  }
}

module.exports = new ChatLogger();
