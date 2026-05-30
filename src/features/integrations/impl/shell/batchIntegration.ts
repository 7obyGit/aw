import { readdir } from "node:fs/promises";
import { join, extname, basename } from "node:path";
import { IIntegration } from "../../types/IIntegration";
import { IScript } from "../../../scripts/types/IScript";

export class BatchIntegration implements IIntegration {
    public readonly id: string = "bat";
    public readonly name: string = "Batch Scripts";
    public readonly description: string = "Standalone .bat files in the current directory";

    public async getScripts(workingDirectory: string): Promise<IScript[]> {
        try {
            const files: string[] = await readdir(workingDirectory);
            const batchFiles: string[] = files.filter((file: string) => extname(file) === ".bat");

            return batchFiles.map((file: string) => ({
                name: basename(file, ".bat"),
                path: join(workingDirectory, file),
                type: "bat",
                source: "local directory",
                confidence: 0.8,
                description: `(batch script) ${file}`,
                command: `"${join(workingDirectory, file)}"`,
            }));
        } catch {
            return [];
        }
    }
}
