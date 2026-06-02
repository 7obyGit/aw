import { join } from "node:path";
import { existsSync } from "node:fs";
import { IIntegration } from "../../types/IIntegration";
import { IScript } from "../../../scripts/types/IScript";

export class GoIntegration implements IIntegration {
    public readonly id: string = "go";
    public readonly name: string = "Go";
    public readonly description: string = "Go commands";

    public async getScripts(workingDirectory: string): Promise<IScript[]> {
        const filePath = join(workingDirectory, "go.mod");
        if (!existsSync(filePath)) return [];

        const commands = [
            { name: "build", cmd: "build", desc: "Compile packages and dependencies" },
            { name: "run", cmd: "run .", desc: "Compile and run Go program" },
            { name: "test", cmd: "test ./...", desc: "Test packages" },
            { name: "fmt", cmd: "fmt ./...", desc: "Gofmt (reformat) package sources" },
            { name: "vet", cmd: "vet ./...", desc: "Report likely mistakes in packages" },
            { name: "mod-tidy", cmd: "mod tidy", desc: "Add missing and remove unused modules" },
        ];

        return commands.map((c) => ({
            name: `go-${c.name}`,
            path: filePath,
            type: "go",
            source: "go.mod",
            confidence: 1.0,
            description: `(go) ${c.desc}`,
            command: `go ${c.cmd}`,
        }));
    }
}
