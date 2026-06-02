import { readFile } from "node:fs/promises";
import { join, resolve, parse, dirname, relative } from "node:path";
import { IIntegration } from "../../types/IIntegration";
import { IScript } from "../../../scripts/types/IScript";

export class NpmIntegration implements IIntegration {
    public readonly id: string = "npm";
    public readonly name: string = "NPM Scripts";
    public readonly description: string = "Scripts defined in package.json";

    public async getScripts(workingDirectory: string): Promise<IScript[]> {
        const allScripts: IScript[] = [];
        let currentDir = resolve(workingDirectory);
        const rootDir = parse(currentDir).root;

        while (true) {
            const scripts = await this.loadScriptsFromDirectory(currentDir);
            allScripts.push(...scripts);

            if (currentDir === rootDir) break;
            currentDir = dirname(currentDir);
        }

        return allScripts;
    }

    private async loadScriptsFromDirectory(directory: string): Promise<IScript[]> {
        try {
            const packageJsonPath = join(directory, "package.json");
            const content: string = await readFile(packageJsonPath, "utf8");
            const packageData: any = JSON.parse(content);
            const scripts: Record<string, string> = packageData.scripts || {};

            return Object.entries(scripts).map(([name, command]: [string, string]) => ({
                name,
                path: packageJsonPath,
                type: "npm",
                source: relative(process.cwd(), packageJsonPath),
                confidence: 1.0,
                description: `(npm script) ${command}`,
                command: `npm run ${name}`,
            }));
        } catch {
            return [];
        }
    }
}
