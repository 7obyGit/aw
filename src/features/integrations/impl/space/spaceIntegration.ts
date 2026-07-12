import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { homedir } from "node:os";
import { IIntegration } from "../../types/IIntegration";
import { IScript } from "../../../scripts/types/IScript";
import { execSync } from "node:child_process";

export class SpaceIntegration implements IIntegration {
    public readonly id: string = "space";
    public readonly name: string = "Space";
    public readonly description: string = "Scripts defined in ~/space.code-workspace";

    public async getScripts(_workingDirectory: string): Promise<IScript[]> {
        const workspacePath = join(homedir(), "space.code-workspace");
        try {
            const content = await readFile(workspacePath, "utf8");
            const data = JSON.parse(content);
            const space = data.space;

            if (!space || !space.scripts) {
                return [];
            }

            const isSpaceInstalled = this.checkIfSpaceInstalled();

            return Object.entries(space.scripts).map(([name, script]: [string, any]) => {
                const command = isSpaceInstalled
                    ? `space run ${name}`
                    : `echo "Error: 'space' is not installed. You can install it with: npm install -g @7obygit/space" && exit 1`;

                let description = "";
                if (typeof script === "string") {
                    description = script;
                } else if (typeof script === "object" && script !== null) {
                    description =
                        script.command || script["post-command"] || script["pre-command"] || "";
                }

                return {
                    name,
                    path: workspacePath,
                    type: "space",
                    source: "~/space.code-workspace",
                    confidence: 1.0,
                    description: description || `space run ${name}`,
                    command: command,
                };
            });
        } catch (error) {
            return [];
        }
    }

    private checkIfSpaceInstalled(): boolean {
        try {
            execSync("command -v space", { stdio: "ignore" });
            return true;
        } catch {
            return false;
        }
    }
}
