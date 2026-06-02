import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { existsSync } from "node:fs";
import { IIntegration } from "../../types/IIntegration";
import { IScript } from "../../../scripts/types/IScript";

export class MakefileIntegration implements IIntegration {
    public readonly id: string = "makefile";
    public readonly name: string = "Makefile";
    public readonly description: string = "Targets defined in Makefile";

    public async getScripts(workingDirectory: string): Promise<IScript[]> {
        const makefileNames = ["Makefile", "makefile"];
        let makefilePath = "";

        for (const name of makefileNames) {
            const path = join(workingDirectory, name);
            if (existsSync(path)) {
                makefilePath = path;
                break;
            }
        }

        if (!makefilePath) return [];

        try {
            const content = await readFile(makefilePath, "utf8");
            const lines = content.split("\n");
            const scripts: IScript[] = [];

            for (const line of lines) {
                // Match targets: name: ...
                // Ignore special targets starting with . or targets with = (variables)
                const match = line.match(/^([a-zA-Z0-9_-]+):/);
                if (match) {
                    const target = match[1];
                    if (target === ".PHONY") continue;

                    scripts.push({
                        name: target,
                        path: makefilePath,
                        type: "makefile",
                        source: makefilePath.split("/").pop()!,
                        confidence: 1.0,
                        description: `(makefile target)`,
                        command: `make ${target}`,
                    });
                }
            }

            return scripts;
        } catch {
            return [];
        }
    }
}
