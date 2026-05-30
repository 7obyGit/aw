import { readdir } from "node:fs/promises";
import { join, extname, basename } from "node:path";
import { IIntegration } from "../../types/IIntegration";
import { IScript } from "../../../scripts/types/IScript";

export class ShellIntegration implements IIntegration {
    public readonly id: string = "shell";
    public readonly name: string = "Shell Scripts";
    public readonly description: string = "Standalone .sh files in the current directory";

    public async getScripts(workingDirectory: string): Promise<IScript[]> {
        try {
            const files: string[] = await readdir(workingDirectory);
            const shellFiles: string[] = files.filter((file: string) => extname(file) === ".sh");

            return shellFiles.map((file: string) => ({
                name: basename(file, ".sh"),
                path: join(workingDirectory, file),
                type: "shell",
                source: "local directory",
                confidence: 0.8,
                description: `(shell script) ${file}`,
                command: `bash "${join(workingDirectory, file)}"`,
            }));
        } catch {
            return [];
        }
    }
}
