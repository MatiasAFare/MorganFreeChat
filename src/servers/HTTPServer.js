// HTTP Server - API REST y archivos estáticos
const express = require("express");
const http = require("http");
const path = require("path");
const fs = require("fs");
const cors = require("cors");
const AuthController = require("../controllers/AuthController");
const logger = require("../utils/logger");
const config = require("../config");
const { getKeyForClient } = require("../utils/crypto");

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
    // NO agregar express.static() aquí para que handleRoot tenga prioridad
  }

  setupRoutes() {
    // Ruta raíz con inyección de configuración
    this.app.get("/", this.handleRoot.bind(this));
    
    // Rutas de API
    this.app.post("/api/register", AuthController.handleRegister);
    this.app.post("/api/login", AuthController.handleLogin);
    
    // Servir archivos estáticos DESPUÉS de las rutas dinámicas
    this.app.use(express.static(path.join(__dirname, "../client")));
  }

  handleRoot(req, res) {
    const indexPath = path.join(__dirname, "../client/index.html");
    let html = fs.readFileSync(indexPath, "utf-8");
    
    // Inyectar variables de configuración en el HTML
    const encryptionKeyB64 = getKeyForClient();
    const configScript = `
    <script>
      window.__WS_PORT__ = ${config.server.wsPort};
      window.__ENCRYPTION_KEY_B64__ = "${encryptionKeyB64}";
    </script>
    `;
    
    // Insertar el script antes de cerrar </body>
    html = html.replace("</body>", `${configScript}</body>`);
    
    res.send(html);
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
