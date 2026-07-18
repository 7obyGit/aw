import { cac } from "cac";
import * as prompts from "@clack/prompts";
import colors from "picocolors";
import PACKAGE_DATA from "../../package.json" with { type: "json" };

import { initAction } from "../features/core/initAction.js";
import {
    displayHelp,
    displayCommandHelp,
    displayLandingPage,
} from "../features/core/helpAction.js";
import { envAction } from "../features/core/envAction.js";
import { listScriptsAction } from "../features/scripts/actions/listScriptsAction.js";
import { addScriptAction } from "../features/scripts/actions/addScriptAction.js";
import { removeScriptAction } from "../features/scripts/actions/removeScriptAction.js";
import { runScriptAction } from "../features/scripts/actions/runScriptAction.js";
import { listSourcesAction } from "../features/sources/actions/listSourcesAction.js";
import { addSourceAction } from "../features/sources/actions/addSourceAction.js";
import { removeSourceAction } from "../features/sources/actions/removeSourceAction.js";
import { execAction } from "../features/scripts/actions/execAction.js";
import { findScriptsAction } from "../features/scripts/actions/findScriptsAction.js";
import { recordAction } from "../features/scripts/actions/recordAction.js";
import { describeScriptAction } from "../features/scripts/actions/describeScriptAction.js";
import { completionAction } from "../features/core/completionAction.js";
import { findClosestMatch } from "../features/core/utils/stringUtils.js";

const VERSION: string = PACKAGE_DATA.version;

export async function runCLI(): Promise<void> {
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
        .option("--all", "Show all sources, even those with no scripts")
        .action(async (type: string, options: { json?: boolean; all?: boolean }) => {
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
        .command("run <scriptName> [...extraArgs]", "Run the specified script")
        .allowUnknownOptions()
        .action(async (scriptName: string, extraArgs: string[], options: any) => {
            const allExtraArgs = [...extraArgs, ...(options["--"] || [])];
            await runScriptAction(scriptName, allExtraArgs);
        });

    cliInstance
        .command("describe <scriptName>", "Show details of a script")
        .option("--json", "Output results in JSON format")
        .action(async (scriptName: string, options: { json?: boolean }) => {
            await describeScriptAction(scriptName, options);
        });

    cliInstance
        .command("find <query>", "Find scripts by name, id or description")
        .option("--json", "Output results in JSON format")
        .action(async (query: string, options: { json?: boolean }) => {
            await findScriptsAction(query, options);
        });

    cliInstance
        .command("exec [...command]", "Run an arbitrary shell command")
        .allowUnknownOptions()
        .action(async (commandParts: string[], options: any) => {
            const allParts = [...commandParts, ...(options["--"] || [])];
            if (allParts.length === 0) {
                prompts.log.error("Missing command for exec. Usage: aw exec <command>");
                process.exit(1);
            }
            await execAction(allParts.join(" "));
        });

    cliInstance.command("record", "Record a sequence of commands to a script").action(async () => {
        await recordAction();
    });

    cliInstance
        .command("completion <shell>", "Generate shell completion script (bash, zsh, fish)")
        .action(async (shell: string) => {
            await completionAction(shell);
        });

    cliInstance.help();
    cliInstance.version(VERSION);

    let argv = process.argv;
    const firstArg: string | undefined = argv.slice(2).find((arg: string) => !arg.startsWith("-"));

    // Handle 'run' and 'exec' by inserting '--' after the script name or command
    // to ensure trailing optional arguments are passed through to the script/command.
    if (firstArg === "run" || firstArg === "exec") {
        const cmdIndex = argv.indexOf(firstArg);
        if (firstArg === "run") {
            // Find script name: first non-option after 'run'
            let scriptNameIndex = -1;
            for (let i = cmdIndex + 1; i < argv.length; i++) {
                if (!argv[i].startsWith("-")) {
                    scriptNameIndex = i;
                    break;
                }
            }
            if (scriptNameIndex !== -1 && !argv.includes("--")) {
                argv = [
                    ...argv.slice(0, scriptNameIndex + 1),
                    "--",
                    ...argv.slice(scriptNameIndex + 1),
                ];
            }
        } else if (firstArg === "exec") {
            if (!argv.includes("--")) {
                argv = [...argv.slice(0, cmdIndex + 1), "--", ...argv.slice(cmdIndex + 1)];
            }
        }
    }

    // If no args or 'help' command, show help
    if (argv.length <= 2 || firstArg === "help") {
        if (firstArg === "help") {
            const commandArg: string | undefined = argv
                .slice(argv.indexOf("help") + 1)
                .find((arg: string) => !arg.startsWith("-"));

            if (commandArg) {
                cliInstance.parse([...argv.slice(0, 2), commandArg, "--help"]);
                return;
            }
        }

        if (argv.length <= 2) {
            await displayLandingPage();
        } else {
            cliInstance.outputHelp();
        }
        return;
    }

    try {
        cliInstance.parse(argv);

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
