import dotenv from 'dotenv';
dotenv.config();root@ubuntu:/home/administrator/hll-rcon-discord# cat logger.mjs
import { createLogger, format, transports } from 'winston';

const logger = createLogger({
    level: 'debug',
    format: format.combine(
        format.timestamp(),
        format.printf(({ timestamp, level, message }) => {
            return `${timestamp} [${level}]: ${message}`;
        })
    ),
    transports: [
        new transports.Console(),
        new transports.File({ filename: 'combined.log' })
    ],
});

export default logger;
