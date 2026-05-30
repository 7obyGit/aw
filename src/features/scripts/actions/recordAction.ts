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
    const currentEnv: Record<string, string> = {};

    while (true) {
        const command = await prompts.text({
            message: "Enter command to record (or leave empty to finish)",
            placeholder: "e.g. npm run build",
        });

        if (prompts.isCancel(command) || !command) {
            break;
        }

        // Check for environment variable assignment
        const envVarMatch = command.match(/^\s*(?:export\s+)?([a-zA-Z_][a-zA-Z0-9_]*)=/);
        if (envVarMatch) {
            const varName = envVarMatch[1];
            const isDynamic = await prompts.confirm({
                message: `Detected environment variable ${colors.cyan(varName)}. Should its value be retrieved manually each time the script runs?`,
                initialValue: false,
            });

            if (prompts.isCancel(isDynamic)) {
                prompts.outro(colors.yellow("Recording cancelled."));
                return;
            }

            if (isDynamic) {
                scriptLines.push(`# Prompt for ${varName}`);
                scriptLines.push(`read -p "Enter value for ${varName}: " ${varName}`);
                scriptLines.push(`export ${varName}`);

                const remainingCommand = extractCommandAfterAssignment(command, varName);
                if (remainingCommand) {
                    scriptLines.push(remainingCommand);
                }
            } else {
                scriptLines.push(command);
            }
        } else {
            scriptLines.push(command);
        }

        // Execute the command
        await executeCommand({
            cwd: currentCwd,
            displayName: command,
            command: command,
            env: currentEnv,
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

        const envMatch = trimmedCommand.match(/^(?:export\s+)?([a-zA-Z_][a-zA-Z0-9_]*)=(.*)$/);
        if (envMatch) {
            const varName = envMatch[1];
            let value = envMatch[2].trim();
            if (
                (value.startsWith('"') && value.endsWith('"')) ||
                (value.startsWith("'") && value.endsWith("'"))
            ) {
                value = value.slice(1, -1);
            }
            currentEnv[varName] = value;
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

/**
 * Extracts the part of the command after an environment variable assignment.
 * e.g., "VAR=VAL ./cmd" -> "./cmd", "export VAR=VAL" -> ""
 */
function extractCommandAfterAssignment(command: string, varName: string): string {
    const regex = new RegExp(
        `^\\s*(?:export\\s+)?${varName}=(?:("[^"]*")|('[^']*')|([^\\s]*))\\s*(.*)$`
    );
    const match = command.match(regex);
    if (match) {
        return (match[4] || "").trim();
    }
    return "";
}
