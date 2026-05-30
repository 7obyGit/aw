import * as prompts from "@clack/prompts";
import colors from "picocolors";
import { integrationManager } from "../../integrations/index.js";
import { IScript } from "../types/IScript";

export async function listScriptsAction(options: { json?: boolean }): Promise<void> {
    const workingDirectory: string = process.cwd();
    const scripts: IScript[] = await integrationManager.discoverScripts(workingDirectory);

    if (options.json) {
        console.log(JSON.stringify(scripts, null, 2));
        return;
    }

    prompts.intro(colors.magenta("Listing scripts..."));

    if (scripts.length === 0) {
        prompts.outro(colors.yellow("No scripts found."));
    } else {
        const scriptCounts = new Map<string, number>();
        for (const script of scripts) {
            scriptCounts.set(script.name, (scriptCounts.get(script.name) || 0) + 1);
        }

        const hasConflicts = Array.from(scriptCounts.values()).some((count) => count > 1);
        if (hasConflicts) {
            prompts.log.warn(colors.yellow("Warning: Multiple scripts found with the same name."));
        }

        const seenNames = new Set<string>();
        const tableData = scripts.map((script) => {
            const isConflict = (scriptCounts.get(script.name) || 0) > 1;
            let status = "";
            let rawStatus = "";
            if (isConflict) {
                if (!seenNames.has(script.name)) {
                    status = colors.green(" (active)");
                    rawStatus = " (active)";
                    seenNames.add(script.name);
                } else {
                    status = colors.red(" (conflict)");
                    rawStatus = " (conflict)";
                }
            }
            return {
                name: script.name,
                nameWithStatus: colors.cyan(script.name) + status,
                nameLength: script.name.length + rawStatus.length,
                source: script.source,
                description: script.description || "-",
            };
        });

        const maxWidths = {
            name: Math.max(...tableData.map((d) => d.nameLength), 4),
            source: Math.max(...tableData.map((d) => d.source.length), 6),
            description: Math.max(...tableData.map((d) => d.description.length), 11),
        };

        prompts.log.step("Available scripts:");

        const header = `${colors.bold("NAME".padEnd(maxWidths.name))}  ${colors.bold(
            "SOURCE".padEnd(maxWidths.source)
        )}  ${colors.bold("DESCRIPTION")}`;

        const divider = colors.dim(
            `${"-".repeat(maxWidths.name)}  ${"-".repeat(maxWidths.source)}  ${"-".repeat(maxWidths.description)}`
        );

        const rows = tableData.map((d) => {
            const padding = maxWidths.name + (d.nameWithStatus.length - d.nameLength);
            return `${d.nameWithStatus.padEnd(padding)}  ${d.source.padEnd(
                maxWidths.source
            )}  ${colors.dim(d.description)}`;
        });

        prompts.log.message([header, divider, ...rows].join("\n"));

        prompts.outro(
            colors.green(
                `Found ${scripts.length} script${scripts.length === 1 ? "" : "s"} across ${integrationManager.getIntegrations().length} sources.`
            )
        );
    }
}
