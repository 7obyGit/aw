import * as prompts from "@clack/prompts";
import colors from "picocolors";

export async function removeSourceAction(sourcePath: string): Promise<void> {
    prompts.intro(colors.magenta(`Removing source: ${sourcePath}`));
    prompts.outro(colors.green(`Removed source ${colors.cyan(sourcePath)}`));
}
