import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { IIntegration } from "../../types/IIntegration";
import { IScript } from "../../../scripts/types/IScript";

export class NpmIntegration implements IIntegration {
    public readonly id: string = "npm";
    public readonly name: string = "NPM Scripts";
    public readonly description: string = "Scripts defined in package.json";

    public async getScripts(workingDirectory: string): Promise<IScript[]> {
        try {
            const content: string = await readFile(join(workingDirectory, "package.json"), "utf8");
            const packageData: any = JSON.parse(content);
            const scripts: Record<string, string> = packageData.scripts || {};

            return Object.entries(scripts).map(([name, command]: [string, string]) => ({
                name,
                path: join(workingDirectory, "package.json"),
                type: "npm",
                source: "package.json",
                confidence: 1.0,
                description: `(npm script) ${command}`,
                command: `npm run ${name}`,
            }));
        } catch {
            return [];
        }
    }
}
