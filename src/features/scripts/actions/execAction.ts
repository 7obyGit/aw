import * as prompts from "@clack/prompts";
import colors from "picocolors";
import { executeCommand } from "../../core/utils/terminalExecutor.js";

/**
 * Executes an arbitrary shell command.
 *
 * @param command - The command to execute.
 * @param env - Additional environment variables to pass to the command.
 */
export async function execAction(command: string, env: Record<string, string> = {}): Promise<void> {
    if (!command) {
        prompts.log.error("No command provided to exec.");
        return;
    }

    prompts.intro(colors.magenta("Executing arbitrary command"));

    await executeCommand({
        cwd: process.cwd(),
        displayName: "arbitrary command",
        command,
        details: [{ label: "Command:", value: command }],
        env: {
            AW_EXEC: "true",
            ...env,
        },
    });
}
