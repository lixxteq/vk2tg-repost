import * as winston from "winston";

var logger = winston.createLogger({
  level: process.env.ENV === "development" ? "debug" : "info",
  format: winston.format.combine(
    process.env.ENV === "development"
        ? winston.format.colorize()
        : winston.format.uncolorize(),
    winston.format.timestamp(),
    winston.format.errors(),
    winston.format.splat(),
    winston.format.printf(({ level, message }) => `${level}: ${message}`)
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({
        filename: 'global.log',
        format: winston.format.uncolorize()
    })
  ],
});

export default logger;
