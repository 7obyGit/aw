import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { IIntegration } from "../../types/IIntegration";
import { IScript } from "../../../scripts/types/IScript";

export class PoetryIntegration implements IIntegration {
    public readonly id: string = "poetry";
    public readonly name: string = "Python Poetry";
    public readonly description: string = "Python projects managed by Poetry";

    public async getScripts(workingDirectory: string): Promise<IScript[]> {
        try {
            // 1. Verify this is a poetry project
            const hasPoetryLock = await this.fileExists(join(workingDirectory, "poetry.lock"));
            const hasPyproject = await this.fileExists(join(workingDirectory, "pyproject.toml"));

            if (!hasPoetryLock && !hasPyproject) {
                return [];
            }

            // If only pyproject.toml exists, verify it actually contains a poetry configuration
            if (hasPyproject && !hasPoetryLock) {
                const content = await readFile(join(workingDirectory, "pyproject.toml"), "utf-8");
                if (!content.includes("[tool.poetry]")) {
                    return [];
                }
            }

            const scripts: IScript[] = [];

            // 2. Discover custom scripts defined in pyproject.toml [tool.poetry.scripts]
            let projectScripts: string[] = [];
            if (hasPyproject) {
                projectScripts = await this.parsePoetryScripts(
                    join(workingDirectory, "pyproject.toml")
                );
            }

            // 3. Define standard fallback actions using poetry execution patterns
            const standardActions = [
                {
                    name: "build",
                    cmd: "poetry build",
                    imp: "high",
                    desc: "Builds the source and wheel packages",
                },
                {
                    name: "test",
                    cmd: "poetry run pytest",
                    imp: "high",
                    desc: "Runs project tests using pytest",
                },
                {
                    name: "lint",
                    cmd: "poetry run ruff check",
                    imp: "medium",
                    desc: "Checks code style using Ruff",
                },
                {
                    name: "format",
                    cmd: "poetry run ruff format",
                    imp: "medium",
                    desc: "Formats source code using Ruff",
                },
                {
                    name: "install",
                    cmd: "poetry install",
                    imp: "medium",
                    desc: "Installs project dependencies",
                },
                {
                    name: "lock",
                    cmd: "poetry lock",
                    imp: "low",
                    desc: "Locks project dependencies without installing",
                },
            ];

            for (const action of standardActions) {
                const isOverridden = projectScripts.includes(action.name);

                scripts.push({
                    name: action.name,
                    path: workingDirectory,
                    type: "poetry",
                    source: isOverridden ? "pyproject.toml (custom)" : "poetry default",
                    // Custom registered scripts get higher confidence
                    confidence: isOverridden ? 1.0 : 0.7,
                    description: isOverridden
                        ? `(poetry script) Run custom ${action.name} script`
                        : `(poetry default) ${action.desc}`,
                    command: isOverridden ? `poetry run ${action.name}` : action.cmd,
                });
            }

            // 4. Add any remaining custom poetry scripts not covered by standard actions
            for (const customName of projectScripts) {
                if (!standardActions.some((a) => a.name === customName)) {
                    scripts.push({
                        name: customName,
                        path: workingDirectory,
                        type: "poetry",
                        source: "pyproject.toml (custom)",
                        confidence: 1.0,
                        description: `(poetry script) Run custom ${customName} script`,
                        command: `poetry run ${customName}`,
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

    private async parsePoetryScripts(pyprojectPath: string): Promise<string[]> {
        try {
            const content = await readFile(pyprojectPath, "utf-8");
            const scriptNames: string[] = [];

            // Regex to isolate the [tool.poetry.scripts] block
            const sectionRegex = /\[tool\.poetry\.scripts\]([\s\S]*?)(?:\[|$)/;
            const match = content.match(sectionRegex);

            if (match && match[1]) {
                const lines = match[1].split("\n");
                for (const line of lines) {
                    const keyMatch = line.match(/^\s*([a-zA-Z0-9_-]+)\s*=/);
                    if (keyMatch && keyMatch[1]) {
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
