import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { dirname, join, parse, relative, resolve } from "node:path";
import { IIntegration } from "../../types/IIntegration";
import { IScript } from "../../../scripts/types/IScript";

interface CargoAlias {
    command: string;
    configPath: string;
}

export class CargoIntegration implements IIntegration {
    public readonly id: string = "cargo";
    public readonly name: string = "Cargo";
    public readonly description: string = "Rust Cargo commands and aliases";

    public async getScripts(workingDirectory: string): Promise<IScript[]> {
        const resolvedWorkingDirectory: string = resolve(workingDirectory);
        const manifestPath: string | undefined = this.findClosestManifest(resolvedWorkingDirectory);

        if (!manifestPath) return [];

        const commands = [
            { name: "build", cmd: "build", desc: "Compile the current package" },
            { name: "run", cmd: "run", desc: "Run a binary or example of the local package" },
            { name: "test", cmd: "test", desc: "Execute all unit and integration tests" },
            {
                name: "check",
                cmd: "check",
                desc: "Analyze the current package and report errors, but don't build object files",
            },
            { name: "clean", cmd: "clean", desc: "Remove the target directory" },
            { name: "update", cmd: "update", desc: "Update dependencies listed in Cargo.lock" },
        ];
        const scripts: IScript[] = commands.map((command) => ({
            name: `cargo-${command.name}`,
            path: manifestPath,
            type: "cargo",
            source: relative(resolvedWorkingDirectory, manifestPath) || "Cargo.toml",
            confidence: 1.0,
            description: `(cargo) ${command.desc}`,
            command: `cargo ${command.cmd}`,
        }));
        const aliases: Map<string, CargoAlias> = await this.loadAliases(resolvedWorkingDirectory);

        for (const [name, alias] of aliases) {
            scripts.push({
                name: `cargo-${name}`,
                path: alias.configPath,
                type: "cargo",
                source: relative(resolvedWorkingDirectory, alias.configPath),
                confidence: 1.0,
                description: `(cargo alias) ${alias.command}`,
                command: `cargo ${name}`,
            });
        }

        return scripts;
    }

    private findClosestManifest(workingDirectory: string): string | undefined {
        let currentDirectory: string = workingDirectory;
        const rootDirectory: string = parse(currentDirectory).root;

        while (true) {
            const manifestPath: string = join(currentDirectory, "Cargo.toml");
            if (existsSync(manifestPath)) return manifestPath;
            if (currentDirectory === rootDirectory) return undefined;
            currentDirectory = dirname(currentDirectory);
        }
    }

    private async loadAliases(workingDirectory: string): Promise<Map<string, CargoAlias>> {
        const aliases = new Map<string, CargoAlias>();
        let currentDirectory: string = workingDirectory;
        const rootDirectory: string = parse(currentDirectory).root;

        while (true) {
            const config = await this.readCargoConfig(currentDirectory);

            if (config) {
                for (const [name, command] of this.parseAliases(config.content)) {
                    if (!aliases.has(name)) {
                        aliases.set(name, { command, configPath: config.path });
                    }
                }
            }

            if (currentDirectory === rootDirectory) break;
            currentDirectory = dirname(currentDirectory);
        }

        return aliases;
    }

    private async readCargoConfig(
        directory: string
    ): Promise<{ content: string; path: string } | undefined> {
        const cargoDirectory: string = join(directory, ".cargo");

        for (const fileName of ["config", "config.toml"]) {
            const configPath: string = join(cargoDirectory, fileName);

            try {
                return { content: await readFile(configPath, "utf8"), path: configPath };
            } catch {
                // Cargo supports both names, preferring the extensionless file.
            }
        }

        return undefined;
    }

    private parseAliases(content: string): Map<string, string> {
        const aliases = new Map<string, string>();
        let inAliasTable = false;

        for (const line of content.split(/\r?\n/)) {
            const trimmedLine: string = line.trim();

            if (/^\[.*\](?:\s*#.*)?$/.test(trimmedLine)) {
                inAliasTable = /^\[alias\](?:\s*#.*)?$/.test(trimmedLine);
                continue;
            }

            if (!inAliasTable || trimmedLine.startsWith("#")) continue;

            const aliasMatch: RegExpMatchArray | null = line.match(
                /^\s*(?:"((?:\\.|[^"])*)"|'([^']*)'|([a-zA-Z0-9_-]+))\s*=\s*(.+?)\s*$/
            );

            if (aliasMatch) {
                const name: string = aliasMatch[1] ?? aliasMatch[2] ?? aliasMatch[3];
                if (/^[a-zA-Z0-9_-]+$/.test(name)) {
                    aliases.set(name, aliasMatch[4]);
                }
            }
        }

        return aliases;
    }
}
