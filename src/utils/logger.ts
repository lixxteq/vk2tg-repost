import * as winston from "winston";

var logger = winston.createLogger({
  level: process.env.ENV === "development" ? "debug" : "info",
  format: winston.format.combine(
    process.env.ENV === "development"
      ? winston.format.colorize()
      : winston.format.uncolorize(),
    winston.format.splat(),
    winston.format.printf(({ level, message }) => `${level}: ${message}`)
  ),
  transports: [
    new winston.transports.Console({
      stderrLevels: ["error"],
    }),
    new winston.transports.File({
        filename: 'global.log'
    })
  ],
});

export default logger;
