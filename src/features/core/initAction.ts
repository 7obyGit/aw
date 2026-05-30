import * as prompts from "@clack/prompts";
import colors from "picocolors";
import * as fs from "node:fs";

export async function initAction(): Promise<void> {
    prompts.intro(colors.magenta("Initializing aw..."));

    const spinner = prompts.spinner();
    spinner.start("Creating .aw directory");

    if (fs.existsSync(".aw")) {
        spinner.stop(".aw directory already exists");
        prompts.outro(colors.yellow("Skipping initialization."));
        return;
    }

    try {
        await fs.promises.mkdir(".aw", { recursive: true });
        spinner.stop("Created .aw directory");
    } catch (err) {
        spinner.stop("Failed to create .aw directory");
        prompts.log.error(`Failed to create .aw directory: ${(err as Error).message}`);
        return;
    }

    prompts.outro(
        colors.green("aw initialized! You can now add script sources using `aw add source`.")
    );
}
