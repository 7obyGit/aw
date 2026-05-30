import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { IIntegration } from "../../types/IIntegration";
import { IScript } from "../../../scripts/types/IScript";

export class UvIntegration implements IIntegration {
    public readonly id: string = "uv";
    public readonly name: string = "Python UV";
    public readonly description: string = "Python projects managed by uv";

    public async getScripts(workingDirectory: string): Promise<IScript[]> {
        try {
            // 1. Verify this is a uv project
            const hasUvLock = await this.fileExists(join(workingDirectory, "uv.lock"));
            const hasPyproject = await this.fileExists(join(workingDirectory, "pyproject.toml"));

            if (!hasUvLock && !hasPyproject) {
                return [];
            }

            const scripts: IScript[] = [];

            // 2. Discover custom scripts defined in pyproject.toml [tool.uv.scripts]
            let projectScripts: string[] = [];
            if (hasPyproject) {
                projectScripts = await this.parseUvScripts(
                    join(workingDirectory, "pyproject.toml")
                );
            }

            // 3. Define standard fallback actions and check if custom ones override them
            const standardActions = [
                {
                    name: "build",
                    cmd: "uv build",
                    imp: "high",
                    desc: "Builds the project distribution packages",
                },
                {
                    name: "test",
                    cmd: "uv run pytest",
                    imp: "high",
                    desc: "Runs project tests using pytest",
                },
                {
                    name: "lint",
                    cmd: "uv run ruff check",
                    imp: "medium",
                    desc: "Checks code style and lint rules using Ruff",
                },
                {
                    name: "format",
                    cmd: "uv run ruff format",
                    imp: "medium",
                    desc: "Formats source code using Ruff",
                },
                {
                    name: "sync",
                    cmd: "uv sync",
                    imp: "medium",
                    desc: "Syncs the project dependencies",
                },
                { name: "lock", cmd: "uv lock", imp: "low", desc: "Locks project dependencies" },
            ];

            for (const action of standardActions) {
                const isOverridden = projectScripts.includes(action.name);

                scripts.push({
                    name: action.name,
                    path: workingDirectory,
                    type: "uv",
                    source: isOverridden ? "pyproject.toml (custom)" : "uv default",
                    // Custom scripts get 1.0 confidence, standard fallbacks get 0.7
                    confidence: isOverridden ? 1.0 : 0.7,
                    description: isOverridden
                        ? `(uv script) Run custom ${action.name} command`
                        : `(uv default) ${action.desc}`,
                    command: isOverridden ? `uv run ${action.name}` : action.cmd,
                });
            }

            // 4. Add any remaining custom pyproject scripts not covered by standard actions
            for (const customName of projectScripts) {
                if (!standardActions.some((a) => a.name === customName)) {
                    scripts.push({
                        name: customName,
                        path: workingDirectory,
                        type: "uv",
                        source: "pyproject.toml (custom)",
                        confidence: 1.0,
                        description: `(uv script) Run custom ${customName} command`,
                        command: `uv run ${customName}`,
                    });
                }
            }

            return scripts;
        } catch {
            return [];
        }
    }

    private async fileExists(filePath: string): Promise<boolean> {
        try {
            await readFile(filePath, { encoding: "utf-8" });
            return true;
        } catch {
            return false;
        }
    }

    private async parseUvScripts(pyprojectPath: string): Promise<string[]> {
        try {
            const content = await readFile(pyprojectPath, "utf-8");
            const scriptNames: string[] = [];

            // Basic regex parsing to avoid bringing in a heavy TOML parser dependency
            // Looks for keys inside the [tool.uv.scripts] section block
            const sectionRegex = /\[tool\.uv\.scripts\]([\s\S]*?)(?:\[|$)/;
            const match = content.match(sectionRegex);

            if (match && match[1]) {
                const lines = match[1].split("\n");
                for (const line of lines) {
                    const keyMatch = line.match(/^\s*([a-zA-Z0-9_-]+)\s*=/);
                    if (keyMatch) {
                        scriptNames.push(keyMatch[1]);
                    }
                }
            }
            return scriptNames;
        } catch {
            return [];
        }
    }
}
