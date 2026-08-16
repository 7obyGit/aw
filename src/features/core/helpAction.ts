import * as prompts from "@clack/prompts";
import colors from "picocolors";
import { integrationManager } from "../integrations/index.js";
import { IScript } from "../scripts/types/IScript";

/**
 * Displays a beautiful global help menu for the aw CLI.
 *
 * @param cli - The CAC instance.
 */
export function displayHelp(cli: any): void {
    prompts.intro(colors.magenta("Help Menu"));

    // Usage
    prompts.log.step(colors.bold("Usage"));
    prompts.log.message(
        `  $ ${colors.cyan("aw")} ${colors.yellow("<command>")} ${colors.dim("[options]")}`
    );

    // Commands
    const commands = cli.commands.filter((c: any) => c.name !== "*");
    if (commands.length > 0) {
        prompts.log.step(colors.bold("Commands"));
        const commandRows = commands.map((c: any) => {
            const parts = c.rawName.split(" ");
            const name = colors.cyan(parts[0]);
            const args = parts.slice(1).join(" ");
            const label = `${name}${args ? ` ${colors.yellow(args)}` : ""}`;
            return {
                label,
                rawLabel: c.rawName,
                description: colors.dim(c.description),
            };
        });

        const maxLabelLen = Math.max(...commandRows.map((r: any) => r.rawLabel.length));
        const formattedCommands = commandRows.map(
            (r: any) =>
                `  ${r.label}${" ".repeat(Math.max(2, maxLabelLen - r.rawLabel.length + 4))}${r.description}`
        );
        prompts.log.message(formattedCommands.join("\n"));
    }

    // Global Options
    const globalOptions = cli.globalCommand.options;
    if (globalOptions.length > 0) {
        prompts.log.step(colors.bold("Global Options"));
        const optionRows = globalOptions.map((o: any) => ({
            label: colors.cyan(o.rawName),
            rawLabel: o.rawName,
            description: colors.dim(o.description),
        }));

        const maxLabelLen = Math.max(...optionRows.map((r: any) => r.rawLabel.length));
        const formattedOptions = optionRows.map(
            (r: any) =>
                `  ${r.label}${" ".repeat(Math.max(2, maxLabelLen - r.rawLabel.length + 4))}${r.description}`
        );
        prompts.log.message(formattedOptions.join("\n"));
    }

    prompts.outro(
        colors.dim(`For more info, run any command with the ${colors.cyan("--help")} flag.`)
    );
}

/**
 * Displays a beautiful help menu for a specific command.
 *
 * @param command - The CAC command instance.
 */
export function displayCommandHelp(command: any): void {
    prompts.intro(colors.magenta(`Help: ${command.name}`));

    if (command.description) {
        prompts.log.step(colors.bold("Description"));
        prompts.log.message(`  ${command.description}`);
    }

    // Usage
    prompts.log.step(colors.bold("Usage"));
    const parts = command.rawName.split(" ");
    const args = parts.slice(1).join(" ");
    const usage = `  $ ${colors.cyan("aw")} ${colors.cyan(command.name)}${args ? ` ${colors.yellow(args)}` : ""} ${colors.dim("[options]")}`;
    prompts.log.message(usage);

    // Options
    if (command.options.length > 0) {
        prompts.log.step(colors.bold("Command Options"));
        const optionRows = command.options.map((o: any) => ({
            label: colors.cyan(o.rawName),
            rawLabel: o.rawName,
            description: colors.dim(o.description),
        }));

        const maxLabelLen = Math.max(...optionRows.map((r: any) => r.rawLabel.length));
        const formattedOptions = optionRows.map(
            (r: any) =>
                `  ${r.label}${" ".repeat(Math.max(2, maxLabelLen - r.rawLabel.length + 4))}${r.description}`
        );
        prompts.log.message(formattedOptions.join("\n"));
    }

    prompts.outro(
        colors.dim(`Use ${colors.cyan(`aw ${command.name} --help`)} to see this menu again`)
    );
}

/**
 * Displays a landing page for the aw CLI when no command is provided.
 */
export async function displayLandingPage(): Promise<void> {
    const scripts: IScript[] = await integrationManager.discoverScripts(process.cwd());
    const names: string[] = [...new Set(scripts.map((s: IScript) => s.name))].sort();
    const count = names.length;

    prompts.intro(colors.magenta("Automated Workflow (aw)"));

    prompts.log.message(`${colors.cyan(count)} script${count === 1 ? "" : "s"} are available`);
    prompts.log.message(`  (${names.join(", ")})`);

    prompts.log.step(colors.bold("Get Started"));
    prompts.log.message(`  • See available scripts: ${colors.cyan("aw list scripts")}`);
    prompts.log.message(`  • Run a command: ${colors.cyan("aw run <name>")}`);

    prompts.outro(colors.dim(`Use ${colors.cyan("aw help")} for help with CLI subcommands.`));
}
