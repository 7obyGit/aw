import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { existsSync } from "node:fs";
import { IIntegration } from "../../types/IIntegration";
import { IScript } from "../../../scripts/types/IScript";

export class TaskfileIntegration implements IIntegration {
    public readonly id: string = "taskfile";
    public readonly name: string = "Taskfile";
    public readonly description: string = "Tasks defined in Taskfile.yml";

    public async getScripts(workingDirectory: string): Promise<IScript[]> {
        const filenames = ["Taskfile.yml", "Taskfile.yaml", "Task.yml", "Task.yaml"];
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
            let inTasks = false;

            for (let i = 0; i < lines.length; i++) {
                const line = lines[i];
                if (line.match(/^tasks:/)) {
                    inTasks = true;
                    continue;
                }
                if (inTasks) {
                    // Match task names: "  taskname:"
                    const match = line.match(/^  ([a-zA-Z0-9_-]+):/);
                    if (match) {
                        const task = match[1];
                        scripts.push({
                            name: task,
                            path: filePath,
                            type: "taskfile",
                            source: filePath.split("/").pop()!,
                            confidence: 1.0,
                            description: `(taskfile task)`,
                            command: `task ${task}`,
                        });
                    } else if (line.match(/^[^\s]/)) {
                        // Left indentation back to 0, tasks block ended
                        inTasks = false;
                    }
                }
            }

            return scripts;
        } catch {
            return [];
        }
    }
}
