import * as prompts from "@clack/prompts";
import colors from "picocolors";

export async function addScriptAction(name: string, sourcePath: string): Promise<void> {
    prompts.intro(colors.magenta(`Adding script: ${name}`));
    prompts.outro(colors.green(`Added script ${colors.cyan(name)} from ${colors.dim(sourcePath)}`));
}
