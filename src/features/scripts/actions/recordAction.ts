import * as prompts from "@clack/prompts";
import colors from "picocolors";
import * as fs from "node:fs";
import * as path from "node:path";
import { executeCommand } from "../../core/utils/terminalExecutor.js";

export async function recordAction(): Promise<void> {
    const awDir = findClosestAwDir(process.cwd());

    if (!awDir) {
        prompts.log.error(
            `No ${colors.cyan(".aw")} directory found. Please run ${colors.cyan("aw init")} first.`
        );
        return;
    }

    prompts.intro(colors.magenta("Recording new script"));

    const scriptName = await prompts.text({
        message: "What should the script be named?",
        placeholder: "my-awesome-script",
        validate: (value) => {
            if (!value) return "Script name is required";
            if (value.includes(" ")) return "Script name cannot contain spaces";
            return;
        },
    });

    if (prompts.isCancel(scriptName)) {
        prompts.outro(colors.yellow("Recording cancelled."));
        return;
    }

    const recordedCommands: string[] = [];
    const scriptLines: string[] = ["#!/bin/bash", ""];
    let currentCwd = process.cwd();

    while (true) {
        const command = await prompts.text({
            message: "Enter command to record (or leave empty to finish)",
            placeholder: "e.g. npm run build",
        });

        if (prompts.isCancel(command) || !command) {
            break;
        }

        scriptLines.push(command);

        // Execute the command
        await executeCommand({
            cwd: currentCwd,
            displayName: command,
            command: command,
        });

        // Track state changes for the recording session
        const trimmedCommand = command.trim();
        if (trimmedCommand.startsWith("cd ")) {
            const target = trimmedCommand
                .substring(3)
                .trim()
                .replace(/^["']|["']$/g, "");
            currentCwd = path.resolve(currentCwd, target);
        }

        recordedCommands.push(command);
    }

    const scriptFileName = scriptName.endsWith(".sh") ? scriptName : `${scriptName}.sh`;
    const scriptPath = path.join(awDir, scriptFileName);

    try {
        await fs.promises.writeFile(scriptPath, scriptLines.join("\n") + "\n", { mode: 0o755 });
        prompts.outro(colors.green(`Script recorded successfully at ${colors.cyan(scriptPath)}`));
    } catch (error) {
        prompts.log.error(`Failed to save script: ${(error as Error).message}`);
        prompts.outro(colors.red("Recording failed."));
    }
}

function findClosestAwDir(startDir: string): string | null {
    let currentDir = path.resolve(startDir);
    const rootDir = path.parse(currentDir).root;

    while (true) {
        const awDir = path.join(currentDir, ".aw");
        if (fs.existsSync(awDir) && fs.statSync(awDir).isDirectory()) {
            return awDir;
        }
        if (currentDir === rootDir) {
            break;
        }
        currentDir = path.dirname(currentDir);
    }

    return null;
}
