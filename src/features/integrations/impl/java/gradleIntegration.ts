import { readdir } from "node:fs/promises";
import { IIntegration } from "../../types/IIntegration";
import { IScript } from "../../../scripts/types/IScript";

export class GradleIntegration implements IIntegration {
    public readonly id: string = "gradle";
    public readonly name: string = "Gradle";
    public readonly description: string = "Java projects managed by Gradle";

    public async getScripts(workingDirectory: string): Promise<IScript[]> {
        try {
            const files: string[] = await readdir(workingDirectory);

            const isGradleProject: boolean = files.some(
                (file) => file === "build.gradle" || file === "build.gradle.kts"
            );

            if (!isGradleProject) {
                return [];
            }

            const hasWrapper = files.includes("gradlew");
            const baseCmd = hasWrapper ? "./gradlew" : "gradle";

            const gradleCommands = [
                { name: "clean", cmd: `${baseCmd} clean`, desc: "Cleans the project", conf: 1.0 },
                { name: "build", cmd: `${baseCmd} build`, desc: "Builds the project", conf: 1.0 },
                { name: "test", cmd: `${baseCmd} test`, desc: "Runs unit tests", conf: 1.0 },
                { name: "run", cmd: `${baseCmd} run`, desc: "Runs the project", conf: 0.9 },
                {
                    name: "classes",
                    cmd: `${baseCmd} classes`,
                    desc: "Compiles the project classes",
                    conf: 0.8,
                },
            ];

            return gradleCommands.map((item) => ({
                name: item.name,
                path: workingDirectory,
                type: "gradle",
                source: "gradle",
                confidence: item.conf,
                description: `(Gradle) ${item.desc}`,
                command: item.cmd,
            }));
        } catch {
            return [];
        }
    }
}
