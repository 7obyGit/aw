import { execSync } from "node:child_process";
import { readdir, readFile } from "node:fs/promises";
import { homedir } from "node:os";
import { basename, dirname, join, parse, relative, resolve } from "node:path";
import { parse as parseJson, type ParseError } from "jsonc-parser";
import { IIntegration } from "../../types/IIntegration";
import { IScript } from "../../../scripts/types/IScript";

interface SpaceScript {
    "pre-command"?: string;
    command?: string;
    "post-command"?: string;
}

interface WorkspaceData {
    space?: {
        name?: string;
        path?: string;
        scripts?: Record<string, string | SpaceScript>;
    };
}

interface LoadedWorkspace {
    data: WorkspaceData;
}

export class SpaceIntegration implements IIntegration {
    public readonly id: string = "space";
    public readonly name: string = "Space";
    public readonly description: string = "Scripts defined in Space .code-workspace files";

    public async getScripts(workingDirectory: string): Promise<IScript[]> {
        const resolvedWorkingDirectory: string = resolve(workingDirectory);
        const activePath: string = await this.findActiveWorkspacePath(resolvedWorkingDirectory);
        const activeWorkspace: LoadedWorkspace | undefined = await this.loadWorkspace(activePath);
        const activeSourcePath: string | undefined = activeWorkspace?.data.space?.path
            ? this.toAbsolute(activeWorkspace.data.space.path, resolvedWorkingDirectory)
            : undefined;
        const workspacePaths: string[] = await this.findWorkspacePaths(
            resolvedWorkingDirectory,
            activePath
        );
        const isSpaceInstalled: boolean = this.checkIfSpaceInstalled();
        const scripts: IScript[] = [];

        for (const workspacePath of workspacePaths) {
            if (workspacePath === activeSourcePath) continue;

            const workspace: LoadedWorkspace | undefined =
                workspacePath === activePath
                    ? activeWorkspace
                    : await this.loadWorkspace(workspacePath);
            if (!workspace?.data.space?.scripts) continue;

            const isActive: boolean = workspacePath === activePath;
            for (const [name, script] of Object.entries(workspace.data.space.scripts)) {
                const directCommand: string = this.getScriptCommand(script);
                if (!directCommand) continue;

                scripts.push({
                    name,
                    path: workspacePath,
                    type: "space",
                    source: this.formatSource(workspacePath, resolvedWorkingDirectory),
                    confidence: 1.0,
                    description: this.getScriptDescription(script),
                    command: isActive
                        ? this.getActiveScriptCommand(name, isSpaceInstalled)
                        : directCommand,
                });
            }
        }

        return scripts;
    }

    private async findActiveWorkspacePath(workingDirectory: string): Promise<string> {
        const directories: string[] = this.getParentDirectories(workingDirectory);

        for (const directory of directories) {
            const scratchPath: string = join(directory, "scratch.code-workspace");
            const scratch: LoadedWorkspace | undefined = await this.loadWorkspace(scratchPath);
            if (scratch?.data.space?.name?.startsWith("scratch-")) return scratchPath;
        }

        const configPaths: string[] = directories.map((directory) =>
            join(directory, ".space", "config.json")
        );
        const userConfigPath: string = join(homedir(), ".space", "config.json");
        if (!configPaths.includes(userConfigPath)) configPaths.push(userConfigPath);

        for (const configPath of configPaths) {
            try {
                const config = this.parseJson(await readFile(configPath, "utf8"));
                if (typeof config.active?.path === "string") {
                    return this.toAbsolute(config.active.path, workingDirectory);
                }
            } catch {
                // Continue to less-local Space configuration.
            }
        }

        return join(homedir(), "space.code-workspace");
    }

    private async findWorkspacePaths(
        workingDirectory: string,
        activePath: string
    ): Promise<string[]> {
        const paths = new Set<string>([activePath]);
        const workspaceDirectories = new Set<string>();

        for (const directory of this.getParentDirectories(workingDirectory)) {
            workspaceDirectories.add(join(directory, "spaces"));
            workspaceDirectories.add(join(directory, ".space", "spaces"));
        }

        workspaceDirectories.add(join(homedir(), "spaces"));
        workspaceDirectories.add(join(homedir(), ".space", "spaces"));

        for (const directory of workspaceDirectories) {
            try {
                const entries = await readdir(directory, { withFileTypes: true });
                for (const entry of entries) {
                    if (entry.isFile() && entry.name.endsWith(".code-workspace")) {
                        paths.add(join(directory, entry.name));
                    }
                }
            } catch {
                // Missing Space directories are expected.
            }
        }

        return [...paths];
    }

    private getParentDirectories(workingDirectory: string): string[] {
        const directories: string[] = [];
        let currentDirectory: string = workingDirectory;
        const rootDirectory: string = parse(currentDirectory).root;

        while (true) {
            directories.push(currentDirectory);
            if (currentDirectory === rootDirectory) return directories;
            currentDirectory = dirname(currentDirectory);
        }
    }

    private async loadWorkspace(workspacePath: string): Promise<LoadedWorkspace | undefined> {
        try {
            return {
                data: this.parseJson(await readFile(workspacePath, "utf8")),
            };
        } catch {
            return undefined;
        }
    }

    private parseJson(content: string): any {
        const errors: ParseError[] = [];
        const data: any = parseJson(content, errors, { allowTrailingComma: true });
        if (errors.length > 0) throw new Error("Invalid JSONC");
        return data;
    }

    private getScriptCommand(script: string | SpaceScript): string {
        if (typeof script === "string") return script;
        return [script["pre-command"], script.command, script["post-command"]]
            .filter((command): command is string => Boolean(command))
            .join(" ; ");
    }

    private getScriptDescription(script: string | SpaceScript): string {
        const command: string = this.getScriptCommand(script);
        return command || "Space workspace script";
    }

    private getActiveScriptCommand(name: string, isSpaceInstalled: boolean): string {
        return isSpaceInstalled
            ? `space run ${name}`
            : `echo "Error: 'space' is not installed. You can install it with: npm install -g @7obygit/space" && exit 1`;
    }

    private toAbsolute(targetPath: string, workingDirectory: string): string {
        const expandedPath: string = targetPath.startsWith("~/")
            ? join(homedir(), targetPath.slice(2))
            : targetPath === "~"
              ? homedir()
              : targetPath;
        return resolve(workingDirectory, expandedPath);
    }

    private formatSource(workspacePath: string, workingDirectory: string): string {
        const homeDirectory: string = homedir();
        if (workspacePath === homeDirectory) return "~";
        if (workspacePath.startsWith(`${homeDirectory}/`)) {
            return join("~", relative(homeDirectory, workspacePath));
        }
        return relative(workingDirectory, workspacePath) || basename(workspacePath);
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
