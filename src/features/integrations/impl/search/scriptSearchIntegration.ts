import { basename, join } from "node:path";
import { readdir } from "node:fs/promises";
import type { Dirent } from "node:fs"; // Import the native type
import type { IScript } from "../../../scripts/types/IScript.js";
import type { IIntegration } from "../../types/IIntegration.js";
import { ShellIntegration } from "../shell/shellIntegration.js";

export class ScriptSearchIntegration implements IIntegration {
    public id: string = "script search";
    public name: string = "Script Search";
    public description: string = "Scans likely directories for scripts";

    private static likelyDirNames: string[] = ["script", "task"];

    private shellIntegration: ShellIntegration;

    public constructor(shellIntegration: ShellIntegration) {
        this.shellIntegration = shellIntegration;
    }

    public async getScripts(workingDirectory: string): Promise<IScript[]> {
        const entries = await readdir(workingDirectory, { withFileTypes: true });

        // Filter and map to full paths immediately to work with paths safely
        const targetDirectories: string[] = entries
            .filter((entry: Dirent) => entry.isDirectory())
            .map((entry: Dirent) => join(workingDirectory, entry.name));

        const results: IScript[] = [];

        for (const fullPath of targetDirectories) {
            if (!this.isScriptCandidate(fullPath)) {
                continue;
            }

            // Await and push scripts using flat modern arrays
            const scripts: IScript[] = await this.shellIntegration.getScripts(fullPath);
            results.push(...scripts);
        }

        return results;
    }

    private isScriptCandidate(directoryPath: string): boolean {
        const name: string = basename(directoryPath);
        return ScriptSearchIntegration.likelyDirNames.some((likelyName) =>
            name.toLowerCase().includes(likelyName)
        );
    }
}
