import { readFile, stat } from "node:fs/promises";
import { basename } from "node:path";

export const MAX_SHEBANG_FILE_SIZE = 4096;

const SHELL_INTERPRETERS = new Set(["bash", "dash", "fish", "ksh", "sh", "zsh"]);

/**
 * Returns the shell interpreter from a shebang, when the file is a small,
 * regular file with a supported shell shebang.
 *
 * The size check prevents reading arbitrary large files merely to inspect
 * their first line. Files larger than the limit are left to the caller's
 * normal extension-based handling.
 */
export async function getShellInterpreter(filePath: string): Promise<string | undefined> {
    try {
        const fileStats = await stat(filePath);
        if (!fileStats.isFile() || fileStats.size > MAX_SHEBANG_FILE_SIZE) {
            return undefined;
        }

        const contents = await readFile(filePath, { encoding: "utf8" });
        const firstLine: string = contents.split(/\r?\n/, 1)[0];
        const shebangMatch: RegExpExecArray | null = /^#!\s*(.*)$/.exec(firstLine);

        if (!shebangMatch) {
            return undefined;
        }

        const shebangParts: string[] = shebangMatch[1].trim().split(/\s+/);
        const interpreterIndex: number = shebangParts[0] === "/usr/bin/env" ? 1 : 0;
        const interpreter: string | undefined = shebangParts[interpreterIndex];

        if (!interpreter || !SHELL_INTERPRETERS.has(basename(interpreter).toLowerCase())) {
            return undefined;
        }

        return interpreter;
    } catch {
        return undefined;
    }
}
