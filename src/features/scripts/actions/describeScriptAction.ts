import * as prompts from "@clack/prompts";
import colors from "picocolors";
import { integrationManager } from "../../integrations/index.js";
import { IScript } from "../types/IScript";
import { findClosestMatch } from "../../core/utils/stringUtils.js";

/**
 * Describes a script by its name.
 * Shows details such as source, type, path, and command.
 *
 * @param scriptName - The name of the script to describe.
 * @param options - Additional options.
 */
export async function describeScriptAction(
    scriptName: string,
    options: { json?: boolean } = {}
): Promise<void> {
    const workingDirectory: string = process.cwd();
    const allScripts: IScript[] = await integrationManager.discoverScripts(workingDirectory);
    const scriptsWithName: IScript[] = allScripts.filter((s: IScript) => s.name === scriptName);

    if (scriptsWithName.length === 0) {
        if (options.json) {
            console.log(JSON.stringify({ error: "Script not found" }, null, 2));
        } else {
            prompts.log.error(`Script ${colors.cyan(scriptName)} not found.`);

            const scriptNames: string[] = allScripts.map((s: IScript) => s.name);
            const suggestion: string | undefined = findClosestMatch(scriptName, scriptNames);

            if (suggestion) {
                prompts.log.info(`Did you mean ${colors.cyan(suggestion)}?`);
            }
            prompts.outro(colors.red("Aborted."));
        }
        return;
    }

    if (options.json) {
        // Return only the first (active) script object as requested
        console.log(JSON.stringify(scriptsWithName[0], null, 2));
        return;
    }

    prompts.intro(colors.magenta(`Script details: ${colors.bold(scriptName)}`));

    scriptsWithName.forEach((script, index) => {
        if (scriptsWithName.length > 1) {
            prompts.log.step(
                colors.yellow(`Occurrence ${index + 1}${index === 0 ? " (active)" : " (shadowed)"}`)
            );
        }

        const details: [string, string][] = [
            ["Source", script.source],
            ["Type", script.type],
            ["Command", colors.green(script.command)],
            ["Path", script.path],
        ];

        if (script.description) {
            details.push(["Description", script.description]);
        }

        if (script.confidence < 1) {
            details.push(["Confidence", `${(script.confidence * 100).toFixed(0)}%`]);
        }

        const maxLength = Math.max(...details.map((d) => d[0].length));

        const output = details
            .map((d) => `${colors.bold(d[0].padEnd(maxLength))} ${colors.dim("│")} ${d[1]}`)
            .join("\n");

        prompts.log.message(output);
    });
}
