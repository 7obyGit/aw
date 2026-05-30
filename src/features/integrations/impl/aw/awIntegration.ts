import { IIntegration } from "../../types/IIntegration";
import { IScript } from "../../../scripts/types/IScript";
import * as fs from "node:fs";
import * as path from "node:path";

export class AwIntegration implements IIntegration {
    readonly id: string = "aw";
    readonly name: string = "Automated Workflow";
    readonly description: string = "Scripts defined in the .aw directory";

    public async getScripts(workingDirectory: string): Promise<IScript[]> {
        const scripts: IScript[] = [];
        let currentDir: string = path.resolve(workingDirectory);
        const rootDir: string = path.parse(currentDir).root;

        while (currentDir !== rootDir) {
            const awDir: string = path.join(currentDir, ".aw");
            const dirScripts: IScript[] = await this.loadScriptsFromAwDirectory(awDir);
            scripts.push(...dirScripts);

            currentDir = path.dirname(currentDir);
        }

        return scripts;
    }

    private async loadScriptsFromAwDirectory(awDirectoryPath: string): Promise<IScript[]> {
        try {
            const stats = await fs.promises.stat(awDirectoryPath);
            if (!stats.isDirectory()) {
                return [];
            }
        } catch {
            return [];
        }

        const scripts: IScript[] = [];
        const files: string[] = await fs.promises.readdir(awDirectoryPath);

        for (const file of files) {
            const filePath: string = path.join(awDirectoryPath, file);
            const stat = await fs.promises.stat(filePath);

            if (stat.isFile()) {
                const script: IScript = {
                    name: path.parse(file).name,
                    source: ".aw",
                    path: filePath,
                    type: this.id,
                    confidence: 1.0,
                    command: `bash "${filePath}"`,
                    description: `${path.relative(process.cwd(), filePath)}`,
                };
                scripts.push(script);
            }
        }

        return scripts;
    }
}
