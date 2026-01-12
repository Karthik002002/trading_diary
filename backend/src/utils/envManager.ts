import fs from "fs";
import path from "path";

const ENV_PATH = path.resolve(__dirname, "../../.env");

export class EnvManager {
    static async set(key: string, value: string): Promise<void> {
        try {
            // Update process.env immediately
            process.env[key] = value;

            let envContent = "";
            if (fs.existsSync(ENV_PATH)) {
                envContent = fs.readFileSync(ENV_PATH, "utf8");
            }

            const lines = envContent.split("\n");
            const newLines: string[] = [];
            let found = false;

            for (const line of lines) {
                const trimmedLine = line.trim();
                if (trimmedLine.startsWith(`${key}=`)) {
                    newLines.push(`${key}=${value}`);
                    found = true;
                } else {
                    newLines.push(line);
                }
            }

            if (!found) {
                if (newLines.length > 0 && newLines[newLines.length - 1] !== "") {
                    newLines.push("");
                }
                newLines.push(`${key}=${value}`);
            }

            fs.writeFileSync(ENV_PATH, newLines.join("\n"));
        } catch (error) {
            console.error("Error writing to .env file:", error);
            throw new Error("Failed to update environment configuration");
        }
    }

    static get(key: string): string | undefined {
        return process.env[key];
    }
}
