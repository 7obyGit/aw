import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { existsSync } from "node:fs";
import { IIntegration } from "../../types/IIntegration";
import { IScript } from "../../../scripts/types/IScript";

export class JustfileIntegration implements IIntegration {
    public readonly id: string = "justfile";
    public readonly name: string = "Justfile";
    public readonly description: string = "Recipes defined in Justfile";

    public async getScripts(workingDirectory: string): Promise<IScript[]> {
        const filenames = ["Justfile", "justfile", ".Justfile", ".justfile"];
        let filePath = "";
        for (const name of filenames) {
            const path = join(workingDirectory, name);
            if (existsSync(path)) {
                filePath = path;
                break;
            }
        }

        if (!filePath) return [];

        try {
            const content = await readFile(filePath, "utf8");
            const lines = content.split("\n");
            const scripts: IScript[] = [];

            for (const line of lines) {
                // Match recipes: name: ...
                const match = line.match(/^([a-zA-Z0-9_-]+):/);
                if (match) {
                    const recipe = match[1];
                    scripts.push({
                        name: recipe,
                        path: filePath,
                        type: "justfile",
                        source: filePath.split("/").pop()!,
                        confidence: 1.0,
                        description: `(justfile recipe)`,
                        command: `just ${recipe}`,
                    });
                }
            }

            return scripts;
        } catch {
            return [];
        }
    }
}
