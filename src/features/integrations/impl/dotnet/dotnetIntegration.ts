import { readdir } from "node:fs/promises";
import { join } from "node:path";
import { IIntegration } from "../../types/IIntegration";
import { IScript } from "../../../scripts/types/IScript";

export class DotnetIntegration implements IIntegration {
    public readonly id: string = "dotnet";
    public readonly name: string = ".NET CLI";
    public readonly description: string = "Automated scripts for .NET Core / C# projects";

    public async getScripts(workingDirectory: string): Promise<IScript[]> {
        try {
            const files: string[] = await readdir(workingDirectory);

            // Check if the directory contains a .NET project or solution file
            const isDotnetProject: boolean = files.some(
                (file: string) => file.endsWith(".csproj") || file.endsWith(".sln")
            );

            if (!isDotnetProject) {
                return [];
            }

            // Define the core map of available .NET commands
            const dotnetCommands = [
                { name: "build", cmd: "dotnet build", desc: "Builds the .NET project", conf: 1.0 },
                { name: "test", cmd: "dotnet test", desc: "Runs unit tests", conf: 1.0 },
                {
                    name: "start",
                    cmd: "dotnet run",
                    desc: "Runs the project (alias for run)",
                    conf: 1.0,
                },
                { name: "run", cmd: "dotnet run", desc: "Runs the project", conf: 0.9 },
                {
                    name: "dev",
                    cmd: "dotnet watch run",
                    desc: "Starts the project in development mode with hot reload",
                    conf: 0.9,
                },
                {
                    name: "watch",
                    cmd: "dotnet watch",
                    desc: "Watches code and runs specified command on change",
                    conf: 0.8,
                },
                {
                    name: "format",
                    cmd: "dotnet format",
                    desc: "Formats code to match style guidelines",
                    conf: 0.8,
                },
                {
                    name: "lint",
                    cmd: "dotnet format --verify-no-changes",
                    desc: "Verifies code formatting without applying fixes",
                    conf: 0.7,
                },
                { name: "clean", cmd: "dotnet clean", desc: "Cleans build outputs", conf: 0.8 },
                {
                    name: "restore",
                    cmd: "dotnet restore",
                    desc: "Restores NuGet packages",
                    conf: 0.8,
                },
                {
                    name: "publish",
                    cmd: "dotnet publish -c Release",
                    desc: "Publishes the application for deployment",
                    conf: 0.7,
                },
                {
                    name: "deploy",
                    cmd: "dotnet publish",
                    desc: "Alias for publishing/deploying the project",
                    conf: 0.6,
                },
            ];

            return dotnetCommands.map((item) => ({
                name: item.name,
                path: workingDirectory,
                type: "dotnet",
                source: "dotnet",
                confidence: item.conf,
                description: `(.NET CLI) ${item.desc}`,
                command: item.cmd,
            }));
        } catch {
            return [];
        }
    }
}
