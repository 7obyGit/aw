import { readdir } from "node:fs/promises";
import { IIntegration } from "../../types/IIntegration";
import { IScript } from "../../../scripts/types/IScript";

export class MavenIntegration implements IIntegration {
    public readonly id: string = "maven";
    public readonly name: string = "Maven";
    public readonly description: string = "Java projects managed by Maven";

    public async getScripts(workingDirectory: string): Promise<IScript[]> {
        try {
            const files: string[] = await readdir(workingDirectory);

            const isMavenProject: boolean = files.includes("pom.xml");

            if (!isMavenProject) {
                return [];
            }

            const mavenCommands = [
                { name: "clean", cmd: "mvn clean", desc: "Cleans the project", conf: 1.0 },
                { name: "compile", cmd: "mvn compile", desc: "Compiles the project", conf: 1.0 },
                { name: "test", cmd: "mvn test", desc: "Runs unit tests", conf: 1.0 },
                { name: "package", cmd: "mvn package", desc: "Packages the project", conf: 1.0 },
                {
                    name: "install",
                    cmd: "mvn install",
                    desc: "Installs the project to local repository",
                    conf: 0.9,
                },
                { name: "verify", cmd: "mvn verify", desc: "Verifies the project", conf: 0.9 },
            ];

            return mavenCommands.map((item) => ({
                name: item.name,
                path: workingDirectory,
                type: "maven",
                source: "maven",
                confidence: item.conf,
                description: `(Maven) ${item.desc}`,
                command: item.cmd,
            }));
        } catch {
            return [];
        }
    }
}
