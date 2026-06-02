import { join } from "node:path";
import { existsSync } from "node:fs";
import { IIntegration } from "../../types/IIntegration";
import { IScript } from "../../../scripts/types/IScript";

export class DockerComposeIntegration implements IIntegration {
    public readonly id: string = "docker-compose";
    public readonly name: string = "Docker Compose";
    public readonly description: string = "Common Docker Compose commands";

    public async getScripts(workingDirectory: string): Promise<IScript[]> {
        const filenames = [
            "docker-compose.yml",
            "docker-compose.yaml",
            "compose.yml",
            "compose.yaml",
        ];
        let filePath = "";
        for (const name of filenames) {
            const path = join(workingDirectory, name);
            if (existsSync(path)) {
                filePath = path;
                break;
            }
        }

        if (!filePath) return [];

        const fileName = filePath.split("/").pop()!;
        const commands = [
            { name: "up", cmd: "up", desc: "Create and start containers" },
            { name: "up-d", cmd: "up -d", desc: "Create and start containers in detached mode" },
            {
                name: "down",
                cmd: "down",
                desc: "Stop and remove containers, networks, images, and volumes",
            },
            { name: "ps", cmd: "ps", desc: "List containers" },
            { name: "logs", cmd: "logs", desc: "View output from containers" },
            { name: "build", cmd: "build", desc: "Build or rebuild services" },
            { name: "pull", cmd: "pull", desc: "Pull service images" },
            { name: "restart", cmd: "restart", desc: "Restart services" },
            { name: "stop", cmd: "stop", desc: "Stop services" },
            { name: "start", cmd: "start", desc: "Start services" },
        ];

        return commands.map((c) => ({
            name: `dc-${c.name}`,
            path: filePath,
            type: "docker-compose",
            source: fileName,
            confidence: 1.0,
            description: `(docker-compose) ${c.desc}`,
            command: `docker compose -f ${fileName} ${c.cmd}`,
        }));
    }
}
