import { readdir } from "node:fs/promises";
import { join, extname, basename } from "node:path";
import { IIntegration } from "../../types/IIntegration";
import { IScript } from "../../../scripts/types/IScript";

export class PowershellIntegration implements IIntegration {
    public readonly id: string = "ps1";
    public readonly name: string = "Powershell Scripts";
    public readonly description: string = "Standalone .ps1 files in the current directory";

    public async getScripts(workingDirectory: string): Promise<IScript[]> {
        try {
            const files: string[] = await readdir(workingDirectory);
            const powershellFiles: string[] = files.filter(
                (file: string) => extname(file) === ".ps1"
            );

            return powershellFiles.map((file: string) => ({
                name: basename(file, ".ps1"),
                path: join(workingDirectory, file),
                type: "ps1",
                source: "local directory",
                confidence: 0.8,
                description: `(powershell script) ${file}`,
                command: `"${join(workingDirectory, file)}"`,
            }));
        } catch {
            return [];
        }
    }
}
