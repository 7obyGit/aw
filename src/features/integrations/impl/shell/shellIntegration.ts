import { readdir } from "node:fs/promises";
import { join, extname, basename } from "node:path";
import { IIntegration } from "../../types/IIntegration";
import { IScript } from "../../../scripts/types/IScript";
import { getShellInterpreter } from "../../utils/shellScript";

export class ShellIntegration implements IIntegration {
    public readonly id: string = "shell";
    public readonly name: string = "Shell Scripts";
    public readonly description: string = "Standalone shell scripts in the current directory";

    public async getScripts(workingDirectory: string): Promise<IScript[]> {
        try {
            const entries = await readdir(workingDirectory, { withFileTypes: true });
            const shellFiles: Array<{ name: string; interpreter: string }> = [];

            for (const entry of entries) {
                if (!entry.isFile()) {
                    continue;
                }

                const filePath: string = join(workingDirectory, entry.name);
                const interpreter: string | undefined = await getShellInterpreter(filePath);

                if (extname(entry.name) === ".sh" || interpreter) {
                    shellFiles.push({ name: entry.name, interpreter: interpreter || "bash" });
                }
            }

            return shellFiles.map(({ name: file, interpreter }) => ({
                name: basename(file, ".sh"),
                path: join(workingDirectory, file),
                type: "shell",
                source: "local directory",
                confidence: 0.8,
                description: `(shell script) ${file}`,
                command: `${interpreter} "${join(workingDirectory, file)}"`,
            }));
        } catch {
            return [];
        }
    }
}
