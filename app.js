const WebSocketServer = require('./src/services/WebSocketServer');
const HTTPServer = require('./src/services/HTTPServer');
const logger = require('./src/utils/logger');

const HTTP_PORT = 3000;
const WS_PORT = 8080;

const httpServer = new HTTPServer(HTTP_PORT);
const wsServer = new WebSocketServer(WS_PORT);

async function start() {
    try {
        httpServer.start();
        wsServer.start();

        logger.info('MorganFreeChat iniciado correctamente', {
            httpPort: HTTP_PORT,
            wsPort: WS_PORT
        });

    } catch (error) {
        logger.error('Error iniciando servidores', { error: error.message });
        process.exit(1);
    }
}

start();