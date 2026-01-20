import { createLogger, format, transports } from "winston";

const { combine, timestamp, json, printf, colorize, errors } = format;

// Define a custom format for console logs
const consoleFormat = printf(({ level, message, timestamp, stack }) => {
	return `${timestamp} ${level}: ${stack || message}`;
});

const logger = createLogger({
	level: "debug", // Log messages at 'debug' level and above (info, warn, error)
	format: combine(
		timestamp({ format: "YYYY-MM-DD HH:mm:ss" }), // Add timestamps
		errors({ stack: true }), // Include stack traces for errors
		json(), // Output logs in JSON format (good for production/tools)
	),
	transports: [
		// Console Transport (Development)
		new transports.Console({
			format: combine(
				colorize(), // Add colors to console output
				consoleFormat, // Use our custom format
			),
		}),
		// File Transport (For production/persistent logs)
		new transports.File({
			filename: "logs/app.log", // Logs will go to ./logs/app.log
			level: "info", // Only log 'info' and above to this file
			maxsize: 1024 * 1024 * 5, // Max 5MB per file
		}),
		// Add other transports like MongoDB, HTTP, etc. as needed
	],
	exceptionHandlers: [
		// Handle uncaught exceptions
		new transports.File({ filename: "logs/exceptions.log" }),
	],
	rejectionHandlers: [
		// Handle unhandled promise rejections
		new transports.File({ filename: "logs/rejections.log" }),
	],
});

export default logger;
