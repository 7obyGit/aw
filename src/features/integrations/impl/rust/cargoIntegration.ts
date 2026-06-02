import { join } from "node:path";
import { existsSync } from "node:fs";
import { IIntegration } from "../../types/IIntegration";
import { IScript } from "../../../scripts/types/IScript";

export class CargoIntegration implements IIntegration {
    public readonly id: string = "cargo";
    public readonly name: string = "Cargo";
    public readonly description: string = "Rust Cargo commands";

    public async getScripts(workingDirectory: string): Promise<IScript[]> {
        const filePath = join(workingDirectory, "Cargo.toml");
        if (!existsSync(filePath)) return [];

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

        return commands.map((c) => ({
            name: `cargo-${c.name}`,
            path: filePath,
            type: "cargo",
            source: "Cargo.toml",
            confidence: 1.0,
            description: `(cargo) ${c.desc}`,
            command: `cargo ${c.cmd}`,
        }));
    }
}
