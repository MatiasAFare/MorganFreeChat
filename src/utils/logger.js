const winston = require("winston");
const path = require("path");
const config = require("../config");

const logDir = config.logging.dir;
const logLevel = config.logging.level;

const logger = winston.createLogger({
  level: logLevel,
  format: winston.format.combine(
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: "morganchat" },
  transports: [
    // Console transport
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
    // File transport with rotation
    new winston.transports.File({
      filename: path.join(logDir, config.logging.fileSystem),
      maxsize: 5242880, // 5MB
      maxFiles: config.logging.maxFiles,
    }),
  ],
});

module.exports = logger;
