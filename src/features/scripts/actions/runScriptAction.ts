import * as prompts from "@clack/prompts";
import colors from "picocolors";
import { integrationManager } from "../../integrations/index.js";
import { IScript } from "../types/IScript";
import { executeCommand } from "../../core/utils/terminalExecutor.js";
import { findClosestMatch } from "../../core/utils/stringUtils.js";

/**
 * Runs a script by its name.
 * Finds the script using the integration manager and executes it in the terminal
 * with inherited I/O for transparency and interactivity.
 *
 * @param scriptName - The name of the script to run.
 * @param extraArgs - Additional arguments to pass to the script.
 * @param env - Additional environment variables to pass to the script.
 */
export async function runScriptAction(
    scriptName: string,
    extraArgs: string[] = [],
    env: Record<string, string> = {}
): Promise<void> {
    prompts.intro(colors.magenta(`Running script: ${scriptName}`));

    const workingDirectory: string = process.cwd();
    const script: IScript | undefined = await integrationManager.getScript(
        scriptName,
        workingDirectory
    );

    if (script === undefined) {
        prompts.log.error(`Script ${colors.cyan(scriptName)} not found.`);

        const allScripts: IScript[] = await integrationManager.discoverScripts(workingDirectory);
        const scriptNames: string[] = allScripts.map((s: IScript) => s.name);
        const suggestion: string | undefined = findClosestMatch(scriptName, scriptNames);

        if (suggestion) {
            prompts.log.info(`Did you mean ${colors.cyan(suggestion)}?`);
        }

        prompts.log.info(`Run ${colors.cyan(`aw find ${scriptName}`)} to search for scripts.`);
        prompts.outro(colors.red("Aborted."));
        return;
    }

    const details = [
        { label: "Command:", value: script.command },
        { label: "Source:", value: script.source },
        { label: "Type:", value: script.type },
    ];

    if (script.description) {
        details.push({ label: "Description:", value: script.description });
    }

    const fullCommand =
        extraArgs.length > 0 ? `${script.command} ${extraArgs.join(" ")}` : script.command;

    await executeCommand({
        cwd: workingDirectory,
        displayName: scriptName,
        command: fullCommand,
        details,
        env: {
            AW_SCRIPT_NAME: script.name,
            AW_SCRIPT_PATH: script.path,
            AW_SCRIPT_TYPE: script.type,
            AW_SCRIPT_SOURCE: script.source,
            ...env,
        },
    });
}
