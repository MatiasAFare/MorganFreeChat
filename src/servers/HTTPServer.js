// HTTP Server - API REST y archivos estáticos
const express = require("express");
const http = require("http");
const path = require("path");
const cors = require("cors");
const AuthController = require("../controllers/AuthController");
const logger = require("../utils/logger");

class HTTPServer {
  constructor(port = 3000) {
    this.port = port;
    this.app = express();
    this.server = null;
    this.setupMiddleware();
    this.setupRoutes();
  }

  setupMiddleware() {
    this.app.use(cors());
    this.app.use(express.json());
    this.app.use(express.static(path.join(__dirname, "../client")));
  }

  setupRoutes() {
    this.app.post("/api/register", AuthController.handleRegister);
    this.app.post("/api/login", AuthController.handleLogin);
    this.app.get("/", this.handleRoot.bind(this));
  }

  handleRoot(req, res) {
    res.sendFile(path.join(__dirname, "../client/index.html"));
  }

  start() {
    this.server = http.createServer(this.app);
    this.server.listen(this.port, () => {
      logger.info("HTTP Server iniciado", {
        port: this.port,
        url: `http://localhost:${this.port}`,
      });
    });
  }
}

module.exports = HTTPServer;
