const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const ROOT_DIR = path.resolve(__dirname, "..");
const BACKUP_DIR = path.join(ROOT_DIR, "backups");
const RETENTION_DAYS = 7;
const DEFAULT_DB_NAME = "tradingdiary";

function ensureBackupDir() {
	if (!fs.existsSync(BACKUP_DIR)) {
		fs.mkdirSync(BACKUP_DIR, { recursive: true });
	}
}

function readEnvFile(filePath) {
	if (!fs.existsSync(filePath)) {
		return {};
	}

	const env = {};
	const content = fs.readFileSync(filePath, "utf8");

	for (const rawLine of content.split(/\r?\n/)) {
		const line = rawLine.trim();
		if (!line || line.startsWith("#")) {
			continue;
		}

		const equalsIndex = line.indexOf("=");
		if (equalsIndex < 1) {
			continue;
		}

		const key = line.slice(0, equalsIndex).trim();
		const value = line.slice(equalsIndex + 1).trim();
		env[key] = value.replace(/^["']|["']$/g, "");
	}

	return env;
}

function resolveMongoUri() {
	if (process.env.MONGO_URI) {
		return process.env.MONGO_URI;
	}

	const backendEnv = readEnvFile(path.join(ROOT_DIR, "backend", ".env"));
	if (backendEnv.MONGO_URI) {
		return backendEnv.MONGO_URI;
	}

	const rootEnv = readEnvFile(path.join(ROOT_DIR, ".env"));
	if (rootEnv.MONGO_URI) {
		return rootEnv.MONGO_URI;
	}

	return "mongodb://localhost:27017/tradingdiary";
}

function resolveDbName(mongoUri) {
	try {
		const parsed = new URL(mongoUri);
		const fromPath = parsed.pathname.replace(/^\//, "").trim();
		if (fromPath) {
			return fromPath;
		}
	} catch {
		// Ignore parse errors and use fallback.
	}
	return DEFAULT_DB_NAME;
}

function toDateStamp(date) {
	return date.toISOString().slice(0, 10);
}

function getBackupFileName(dateStamp) {
	return `backup-${dateStamp}.gz`;
}

function pruneOldBackups() {
	const cutoffMs = Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000;
	const files = fs.readdirSync(BACKUP_DIR, { withFileTypes: true });

	for (const entry of files) {
		if (!entry.isFile()) {
			continue;
		}
		if (!/^backup-.*\.gz$/i.test(entry.name)) {
			continue;
		}

		const filePath = path.join(BACKUP_DIR, entry.name);
		const stats = fs.statSync(filePath);
		if (stats.mtimeMs < cutoffMs) {
			fs.unlinkSync(filePath);
			console.log(`Deleted old backup: ${entry.name}`);
		}
	}
}

function createBackupIfNeeded() {
	const mongoUri = resolveMongoUri();
	const dbName = resolveDbName(mongoUri);
	const dateStamp = toDateStamp(new Date());
	const backupFileName = getBackupFileName(dateStamp);
	const backupFilePath = path.join(BACKUP_DIR, backupFileName);

	if (fs.existsSync(backupFilePath)) {
		console.log(`Backup already exists for today: ${backupFileName}`);
		return;
	}

	console.log(`Creating backup: ${backupFileName}`);
	const localResult = runLocalMongodump(mongoUri, dbName, backupFilePath);
	if (localResult.ok) {
		console.log(`Backup created at: ${backupFilePath}`);
		return;
	}

	if (localResult.notInstalled) {
		console.log(
			"`mongodump` not found locally. Trying Docker-based backup fallback...",
		);
		const dockerResult = runDockerMongodump(mongoUri, dbName, backupFilePath);
		if (dockerResult.ok) {
			console.log(`Backup created at: ${backupFilePath}`);
			return;
		}
		console.error(dockerResult.message);
		process.exitCode = 1;
		return;
	}

	console.error(localResult.message);
	process.exitCode = 1;
}

function main() {
	ensureBackupDir();
	pruneOldBackups();
	createBackupIfNeeded();
}

main();

function runLocalMongodump(mongoUri, dbName, backupFilePath) {
	const args = [
		"--uri",
		mongoUri,
		"--db",
		dbName,
		`--archive=${backupFilePath}`,
		"--gzip",
	];
	const result = spawnSync("mongodump", args, { stdio: "inherit" });

	if (result.error) {
		if (result.error.code === "ENOENT") {
			return { ok: false, notInstalled: true };
		}
		return {
			ok: false,
			notInstalled: false,
			message: `Failed to run mongodump: ${result.error.message}`,
		};
	}

	if (result.status !== 0) {
		return {
			ok: false,
			notInstalled: false,
			message: `mongodump exited with code ${result.status}`,
		};
	}

	return { ok: true };
}

function runDockerMongodump(mongoUri, dbName, backupFilePath) {
	const dockerAvailable = spawnSync("docker", ["--version"], {
		stdio: "ignore",
	});
	if (dockerAvailable.error || dockerAvailable.status !== 0) {
		return {
			ok: false,
			message:
				"Docker is not available. Install MongoDB Database Tools (mongodump) or start Docker.",
		};
	}

	const mongoContainerName = findMongoContainerName();
	if (!mongoContainerName) {
		return {
			ok: false,
			message:
				"No running MongoDB container found for Docker fallback. Start your mongo container or install mongodump.",
		};
	}

	const backupFileName = path.basename(backupFilePath);
	const containerBackupPath = `/tmp/${backupFileName}`;

	const shouldUseUri = shouldUseUriInsideContainer(mongoUri);
	const dumpArgs = shouldUseUri
		? [
				"exec",
				mongoContainerName,
				"mongodump",
				"--uri",
				mongoUri,
				"--db",
				dbName,
				`--archive=${containerBackupPath}`,
				"--gzip",
			]
		: [
				"exec",
				mongoContainerName,
				"mongodump",
				"--db",
				dbName,
				`--archive=${containerBackupPath}`,
				"--gzip",
			];

	const dumpResult = spawnSync("docker", dumpArgs, { stdio: "inherit" });
	if (dumpResult.error) {
		return {
			ok: false,
			message: `Docker fallback failed while dumping DB: ${dumpResult.error.message}`,
		};
	}
	if (dumpResult.status !== 0) {
		return {
			ok: false,
			message: `Docker fallback mongodump exited with code ${dumpResult.status}`,
		};
	}

	const copyResult = spawnSync(
		"docker",
		["cp", `${mongoContainerName}:${containerBackupPath}`, backupFilePath],
		{ stdio: "inherit" },
	);
	if (copyResult.error) {
		return {
			ok: false,
			message: `Docker fallback failed while copying backup: ${copyResult.error.message}`,
		};
	}
	if (copyResult.status !== 0) {
		return {
			ok: false,
			message: `Docker fallback copy exited with code ${copyResult.status}`,
		};
	}

	// Best-effort cleanup in container.
	spawnSync("docker", ["exec", mongoContainerName, "rm", "-f", containerBackupPath], {
		stdio: "ignore",
	});

	return { ok: true };
}

function findMongoContainerName() {
	const result = spawnSync("docker", ["ps", "--format", "{{.Names}}"], {
		encoding: "utf8",
	});

	if (result.error || result.status !== 0) {
		return "";
	}

	const names = String(result.stdout || "")
		.split(/\r?\n/)
		.map((name) => name.trim())
		.filter(Boolean);

	if (names.includes("mongo")) {
		return "mongo";
	}

	const composeMongo = names.find((name) => /(^|[-_])mongo([_-]|$)/i.test(name));
	return composeMongo || "";
}

function shouldUseUriInsideContainer(mongoUri) {
	try {
		const parsed = new URL(mongoUri);
		const host = parsed.hostname.toLowerCase();
		return host !== "localhost" && host !== "127.0.0.1" && host !== "mongo";
	} catch {
		return true;
	}
}
