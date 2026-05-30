import { readFile } from "node:fs/promises";
import { join, dirname, relative } from "node:path";
import { existsSync } from "node:fs";

export type TEnvDetailedResult = {
    variables: Record<string, string | undefined>;
    variableSources: Record<string, string>;
    sources: Record<string, number>;
};

/**
 * Loads .env files from the root directory up to the current working directory.
 * Root-level variables are loaded first, and then overridden by those found
 * in subdirectories closer to the CWD.
 *
 * @param cwd - The starting directory (typically process.cwd()).
 * @returns A record of environment variables found in .env files.
 */
export async function loadEnvFiles(cwd: string): Promise<Record<string, string>> {
    const variables: Record<string, string> = {};
    const paths: string[] = [];

    let currentDir = cwd;
    while (true) {
        paths.push(currentDir);
        const parentDir = dirname(currentDir);
        if (parentDir === currentDir) {
            break;
        }
        currentDir = parentDir;
    }

    const rootToCwdPaths = paths.reverse();

    for (const dir of rootToCwdPaths) {
        const envPath = join(dir, ".env");
        if (existsSync(envPath)) {
            try {
                const content = await readFile(envPath, "utf-8");
                const parsed = parseEnv(content);
                Object.assign(variables, parsed);
            } catch (error) {
                // Silently ignore
            }
        }
    }

    return variables;
}

/**
 * Loads .env files and tracks their sources, including the parent environment.
 *
 * @param cwd - The starting directory.
 */
export async function loadDetailedEnv(cwd: string): Promise<TEnvDetailedResult> {
    const variables: Record<string, string | undefined> = { ...process.env };
    const variableSources: Record<string, string> = {};
    const sources: Record<string, number> = {
        "Parent Environment": Object.keys(process.env).length,
    };

    for (const key of Object.keys(process.env)) {
        variableSources[key] = "Parent Environment";
    }

    const paths: string[] = [];
    let currentDir = cwd;

    while (true) {
        paths.push(currentDir);
        const parentDir = dirname(currentDir);
        if (parentDir === currentDir) {
            break;
        }
        currentDir = parentDir;
    }

    const rootToCwdPaths = paths.reverse();

    for (const dir of rootToCwdPaths) {
        const envPath = join(dir, ".env");
        if (existsSync(envPath)) {
            try {
                const content = await readFile(envPath, "utf-8");
                const parsed = parseEnv(content);
                const sourceName = relative(process.cwd(), envPath) || envPath;

                let count = 0;
                for (const [key, value] of Object.entries(parsed)) {
                    variables[key] = value;
                    variableSources[key] = sourceName;
                    count++;
                }

                if (count > 0) {
                    sources[sourceName] = count;
                }
            } catch (error) {
                // Silently ignore
            }
        }
    }

    return {
        variables,
        variableSources,
        sources,
    };
}

/**
 * A simple .env file parser.
 * Supports:
 * - KEY=VALUE
 * - Comments starting with #
 * - Basic quote stripping
 *
 * @param content - The raw content of a .env file.
 */
export function parseEnv(content: string): Record<string, string> {
    const result: Record<string, string> = {};
    const lines = content.split(/\r?\n/);

    for (const line of lines) {
        const trimmedLine = line.trim();
        if (!trimmedLine || trimmedLine.startsWith("#")) {
            continue;
        }

        const equalSignIndex = trimmedLine.indexOf("=");
        if (equalSignIndex === -1) {
            continue;
        }

        const key = trimmedLine.slice(0, equalSignIndex).trim();
        let value = trimmedLine.slice(equalSignIndex + 1).trim();

        if (key) {
            // Basic quote stripping
            if (
                (value.startsWith('"') && value.endsWith('"')) ||
                (value.startsWith("'") && value.endsWith("'"))
            ) {
                value = value.slice(1, -1);
            }
            result[key] = value;
        }
    }

    return result;
}
