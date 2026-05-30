import * as prompts from "@clack/prompts";
import colors from "picocolors";

export async function addSourceAction(sourcePath: string): Promise<void> {
    prompts.intro(colors.magenta(`Adding source: ${sourcePath}`));

    // Implementation goes here
    prompts.outro(colors.green(`Added source ${colors.cyan(sourcePath)}`));
}
