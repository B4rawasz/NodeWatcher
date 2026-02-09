import winston from "winston";
import chalk from "chalk";
import util from "util";
import DailyRotateFile from "winston-daily-rotate-file";
import path from "path";
import { getUserDataPath } from "../../utils/pathResolver.js";

interface ILogEntry extends winston.Logform.TransformableInfo {
	level: string;
	message: string;
	timestamp: string;
	module: string;
	meta?: any;
}

class Logger {
	private logger: winston.Logger;

	private readonly LEVELS: Record<string, string> = {
		error: chalk.red("[ ERROR ]"),
		warn: chalk.yellow(" [ WARN ]"),
		info: chalk.green("[ INFO ]"),
		http: chalk.greenBright("[ HTTP ]"),
		verbose: chalk.cyan("[ VERBOSE ]"),
		debug: chalk.blue("[ DEBUG ]"),
		silly: chalk.magentaBright("[ SILLY ]"),
	};

	private consoleFormat = winston.format.printf((info) => {
		const { timestamp, level, message, module, meta } = info as ILogEntry;

		let metaString = "";
		if (meta && meta.length) {
			metaString = "\n" + meta.map((m: any) => util.inspect(m, { colors: true, depth: 10, compact: false })).join("\n");
		}

		return `${timestamp} ${this.LEVELS[level] || level} [ ${module} ] ${message} ${metaString}`;
	});

	private readonly fileFormat = winston.format.printf((info) => {
		const { timestamp, level, message, module, meta } = info as ILogEntry;

		let serializedMeta: any[] = [];
		if (meta && meta.length) {
			serializedMeta = meta.map((m: any) => {
				// jeśli Error → zamieniamy na obiekt
				if (m instanceof Error) {
					return { message: m.message, stack: m.stack, name: m.name };
				}
				return m;
			});
		}

		return JSON.stringify({
			timestamp,
			level,
			module,
			message,
			meta: serializedMeta, // <- cała tablica, nie string
		});
	});

	constructor() {
		this.logger = winston.createLogger({
			level: "silly",
			transports: [
				new winston.transports.Console({
					level: "debug",
					format: winston.format.combine(
						winston.format.timestamp({ format: "HH:mm:ss" }),
						winston.format.errors({ stack: true }),
						this.consoleFormat,
					),
				}),
				new DailyRotateFile({
					dirname: path.join(getUserDataPath(), "logs"),
					filename: "log-%DATE%.log",
					datePattern: "YYYY-MM-DD",
					maxSize: "10m",
					maxFiles: "5",
					format: winston.format.combine(
						winston.format.timestamp({ format: "YYYY-MM-DD-HH:mm:ss" }),
						winston.format.errors({ stack: true }),
						this.fileFormat,
					),
					level: "info",
				}),
			],
		});
	}

	registerModule(module: string): LoggerInstance {
		return new LoggerInstance(this.logger, module);
	}
}

class LoggerInstance {
	private logger: winston.Logger;
	private module: string;

	constructor(logger: winston.Logger, module: string) {
		this.logger = logger;
		this.module = module;
	}

	private composeMessage(...meta: any[]): object {
		return { module: this.module, meta: meta };
	}

	error(message: string, ...meta: any[]) {
		this.logger.error(message, this.composeMessage(...meta));
	}

	warn(message: string, ...meta: any[]) {
		this.logger.warn(message, this.composeMessage(...meta));
	}

	info(message: string, ...meta: any[]) {
		this.logger.info(message, this.composeMessage(...meta));
	}

	http(message: string, ...meta: any[]) {
		this.logger.http(message, this.composeMessage(...meta));
	}

	verbose(message: string, ...meta: any[]) {
		this.logger.verbose(message, this.composeMessage(...meta));
	}

	debug(message: string, ...meta: any[]) {
		this.logger.debug(message, this.composeMessage(...meta));
	}

	silly(message: string, ...meta: any[]) {
		this.logger.silly(message, this.composeMessage(...meta));
	}
}

export const logger = new Logger();
