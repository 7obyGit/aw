import * as prompts from "@clack/prompts";
import colors from "picocolors";

export async function removeScriptAction(name: string): Promise<void> {
    prompts.intro(colors.magenta(`Removing script: ${name}`));
    prompts.outro(colors.green(`Removed script ${colors.cyan(name)}`));
}
