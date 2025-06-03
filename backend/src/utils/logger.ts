import pino from "pino";
import path from "path";
import fs from "fs";

// Garante que a pasta de logs exista
const logDir = path.join(__dirname, "../../../logs");
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

const logFilePath = path.join(logDir, "flowtalk.log");

const logger = pino({
  level: "info",
  transport: {
    targets: [
      {
        level: "info",
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: true,
          levelFirst: true
        }
      },
      {
        level: "info",
        target: "pino/file",
        options: { destination: logFilePath }
      }
    ]
  }
});

export { logger };