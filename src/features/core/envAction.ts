import * as prompts from "@clack/prompts";
import colors from "picocolors";
import { loadDetailedEnv } from "./utils/envLoader.js";
import PACKAGE_DATA from "../../../package.json" assert { type: "json" };

export interface IEnvActionOptions {
    json?: boolean;
}

/**
 * Action for the 'aw env' command.
 * Displays information about the environment variables available to scripts.
 *
 * @param options - CLI options (e.g., --json).
 */
export async function envAction(options: IEnvActionOptions): Promise<void> {
    const detailedEnv = await loadDetailedEnv(process.cwd());
    const version: string = PACKAGE_DATA.version;

    const builtInVariables: Record<string, string> = {
        AW: "true",
        AW_VERSION: version,
        AW_BIN: process.argv[1],
        AW_CWD: process.cwd(),
    };

    if (options.json) {
        console.log(
            JSON.stringify(
                {
                    version,
                    builtIn: builtInVariables,
                    variables: detailedEnv.variables,
                    count: Object.keys(detailedEnv.variables).length + Object.keys(builtInVariables).length,
                    sources: detailedEnv.sources,
                },
                null,
                2
            )
        );
        return;
    }

    prompts.intro(colors.magenta(`Environment Variables (aw v${version})`));

    // Built-in Variables
    prompts.log.step(colors.bold("Built-in Variables:"));
    const builtInLines = Object.entries(builtInVariables).map(
        ([key, value]) => `${colors.cyan(key)}${colors.dim("=")}${value}`
    );
    prompts.log.message(builtInLines.join("\n"));

    // Parent Environment Summary
    const parentCount = detailedEnv.sources["Parent Environment"] || 0;
    prompts.log.step(
        `${colors.bold("Parent Environment:")} ${colors.cyan(parentCount)} variables passed from parent shell.`
    );
    prompts.log.message(colors.dim(" (variable names hidden for brevity)"));

    // Loaded Sources Details
    const loadedSources = Object.keys(detailedEnv.sources).filter(
        (s) => s !== "Parent Environment"
    );

    if (loadedSources.length === 0) {
        prompts.log.info(colors.yellow("No .env files discovered in the directory tree."));
    } else {
        for (const source of loadedSources) {
            const varsFromSource = Object.entries(detailedEnv.variableSources)
                .filter(([_, s]) => s === source)
                .map(([key, _]) => key);

            prompts.log.step(`${colors.bold("Source:")} ${colors.green(source)}`);
            const lines = varsFromSource.map(
                (key) => `${colors.cyan(key)}${colors.dim("=")}${detailedEnv.variables[key]}`
            );
            prompts.log.message(lines.join("\n"));
        }
    }

    const totalCount =
        Object.keys(detailedEnv.variables).length + Object.keys(builtInVariables).length;

    prompts.outro(colors.green(`Total active environment variables: ${colors.bold(totalCount)}`));
}
