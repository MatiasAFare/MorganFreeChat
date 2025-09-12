const fs = require('fs');
const path = require('path');

// Definimos carpeta logs en la raiz del proyecto
const LOG_DIR = path.join(__dirname, '../../logs');
const LOG_FILE = path.join(LOG_DIR, 'server.log');

if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
}


function logToFile(message) {
    const line = `[${new Date().toISOString()}] ${message}
`;
    fs.appendFile(LOG_FILE, line, (err) => {
        if (err) console.error('Error escribiendo log:', err);
    });
}

module.exports = { logToFile };