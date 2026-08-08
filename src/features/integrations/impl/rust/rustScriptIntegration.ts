import { readdir } from "node:fs/promises";
import { basename, extname, join } from "node:path";
import { IIntegration } from "../../types/IIntegration";
import { IScript } from "../../../scripts/types/IScript";

export class RustScriptIntegration implements IIntegration {
    public readonly id: string = "rust";
    public readonly name: string = "Rust Scripts";
    public readonly description: string = "Standalone .rs files in the current directory";

    public async getScripts(workingDirectory: string): Promise<IScript[]> {
        try {
            const entries = await readdir(workingDirectory, { withFileTypes: true });
            const rustFiles: string[] = entries
                .filter((entry) => entry.isFile() && extname(entry.name) === ".rs")
                .map((entry) => entry.name);

            return rustFiles.map((file: string) => {
                const filePath: string = join(workingDirectory, file);

                return {
                    name: basename(file, ".rs"),
                    path: filePath,
                    type: "rust",
                    source: "local directory",
                    confidence: 0.8,
                    description: `(rust script) ${file}`,
                    command: `cargo +nightly -Zscript "${filePath}"`,
                };
            });
        } catch {
            return [];
        }
    }
}
