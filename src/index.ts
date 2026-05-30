#!/usr/bin/env node
import { cac } from "cac";
import * as prompts from "@clack/prompts";
import colors from "picocolors";
import PACKAGE_DATA from "../package.json" assert { type: "json" };

import { initAction } from "./features/core/initAction.js";
import { displayHelp, displayCommandHelp, displayLandingPage } from "./features/core/helpAction.js";
import { envAction } from "./features/core/envAction.js";
import { listScriptsAction } from "./features/scripts/actions/listScriptsAction.js";
import { addScriptAction } from "./features/scripts/actions/addScriptAction.js";
import { removeScriptAction } from "./features/scripts/actions/removeScriptAction.js";
import { runScriptAction } from "./features/scripts/actions/runScriptAction.js";
import { listSourcesAction } from "./features/sources/actions/listSourcesAction.js";
import { addSourceAction } from "./features/sources/actions/addSourceAction.js";
import { removeSourceAction } from "./features/sources/actions/removeSourceAction.js";
import { execAction } from "./features/scripts/actions/execAction.js";
import { findScriptsAction } from "./features/scripts/actions/findScriptsAction.js";
import { recordAction } from "./features/scripts/actions/recordAction.js";
import { findClosestMatch } from "./features/core/utils/stringUtils.js";
import "./features/integrations/index.js";

const VERSION: string = PACKAGE_DATA.version;

async function main(): Promise<void> {
    const cliInstance: ReturnType<typeof cac> = cac("aw");

    cliInstance.outputHelp = () => {
        const anyCli = cliInstance as any;
        if (anyCli.matchedCommand) {
            displayCommandHelp(anyCli.matchedCommand);
        } else {
            displayHelp(cliInstance);
        }
    };

    cliInstance.command("init", "Initialize a new .aw directory").action(async () => {
        await initAction();
    });

    cliInstance
        .command("env", "Show environment variables available to scripts")
        .option("--json", "Output results in JSON format")
        .action(async (options: { json?: boolean }) => {
            await envAction(options);
        });

    // Handle 'list scripts' and 'list sources'
    cliInstance
        .command("list <type>", "List scripts or sources")
        .option("--json", "Output results in JSON format")
        .action(async (type: string, options: { json?: boolean }) => {
            if (type === "scripts") await listScriptsAction(options);
            else if (type === "sources") await listSourcesAction(options);
            else {
                prompts.log.error(
                    `Unknown list type: ${colors.red(type)}. Use "scripts" or "sources".`
                );
                process.exit(1);
            }
        });

    // Handle 'add source <path>' and 'add script <name> <path>'
    cliInstance
        .command("add <type> <argument1> [argument2]", "Add a source or script")
        .action(async (type: string, argument1: string, argument2?: string) => {
            if (type === "source") await addSourceAction(argument1);
            else if (type === "script") {
                if (!argument2) {
                    prompts.log.error(
                        "Missing source path for script. Usage: aw add script <name> <path>"
                    );
                    process.exit(1);
                }
                await addScriptAction(argument1, argument2);
            } else {
                prompts.log.error(
                    `Unknown add type: ${colors.red(type)}. Use "source" or "script".`
                );
                process.exit(1);
            }
        });

    // Handle 'remove source <path>' and 'remove script <name>'
    cliInstance
        .command("remove <type> <nameOrPath>", "Remove a source or script")
        .action(async (type: string, nameOrPath: string) => {
            if (type === "source") await removeSourceAction(nameOrPath);
            else if (type === "script") await removeScriptAction(nameOrPath);
            else {
                prompts.log.error(
                    `Unknown remove type: ${colors.red(type)}. Use "source" or "script".`
                );
                process.exit(1);
            }
        });

    cliInstance
        .command("run <scriptName>", "Run the specified script")
        .action(async (scriptName: string) => {
            await runScriptAction(scriptName);
        });

    cliInstance
        .command("find <query>", "Find scripts by name, id or description")
        .option("--json", "Output results in JSON format")
        .action(async (query: string, options: { json?: boolean }) => {
            await findScriptsAction(query, options);
        });

    cliInstance
        .command("exec <...command>", "Run an arbitrary shell command")
        .action(async (commandParts: string[]) => {
            await execAction(commandParts.join(" "));
        });

    cliInstance.command("record", "Record a sequence of commands to a script").action(async () => {
        await recordAction();
    });

    cliInstance.help();
    cliInstance.version(VERSION);

    // If no args or 'help' command, show help
    const firstArg: string | undefined = process.argv
        .slice(2)
        .find((arg: string) => !arg.startsWith("-"));
    if (process.argv.length <= 2 || firstArg === "help") {
        if (firstArg === "help") {
            const commandArg: string | undefined = process.argv
                .slice(process.argv.indexOf("help") + 1)
                .find((arg: string) => !arg.startsWith("-"));

            if (commandArg) {
                cliInstance.parse([...process.argv.slice(0, 2), commandArg, "--help"]);
                return;
            }
        }

        if (process.argv.length <= 2) {
            await displayLandingPage();
        } else {
            cliInstance.outputHelp();
        }
        return;
    }

    try {
        cliInstance.parse();

        if (!cliInstance.matchedCommand && firstArg) {
            const availableCommands = [
                ...(cliInstance as any).commands.map((c: any) => c.name),
                "help",
                "version",
            ].filter((name) => name && name !== "*");

            const suggestion = findClosestMatch(firstArg, availableCommands);

            prompts.log.error(`Command ${colors.cyan(firstArg)} not found.`);
            if (suggestion) {
                prompts.log.info(`Did you mean ${colors.cyan(suggestion)}?`);
            }
            prompts.log.info(`Run ${colors.cyan("aw --help")} to see all available commands.`);
            process.exit(1);
        }
    } catch (error: any) {
        if (error.name === "CACError") {
            prompts.log.error(error.message);
            const anyCli = cliInstance as any;
            if (anyCli.matchedCommand) {
                prompts.log.info(`Usage: ${colors.cyan(`aw ${anyCli.matchedCommand.rawName}`)}`);
            } else {
                prompts.log.info(`Run ${colors.cyan("aw --help")} to see all available commands.`);
            }
            process.exit(1);
        }
        throw error;
    }
}

main().catch((error: Error) => {
    prompts.log.error(colors.red(error.message));
    process.exit(1);
});
