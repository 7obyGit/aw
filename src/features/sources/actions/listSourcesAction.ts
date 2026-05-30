import * as prompts from "@clack/prompts";
import colors from "picocolors";
import { IIntegration, integrationManager } from "../../integrations";

export async function listSourcesAction(options: { json?: boolean }): Promise<void> {
    const integrations: IIntegration[] = integrationManager.getIntegrations();
    const workingDirectory: string = process.cwd();

    const sourcesData = await Promise.all(
        integrations.map(async (integration) => {
            const scripts = await integration.getScripts(workingDirectory);
            return {
                id: integration.id,
                name: integration.name,
                description: integration.description,
                count: scripts.length,
            };
        })
    );

    if (options.json) {
        console.log(JSON.stringify(sourcesData, null, 2));
        return;
    }

    prompts.intro(colors.magenta("Listing sources..."));

    if (sourcesData.length === 0) {
        prompts.outro(colors.yellow("No sources configured."));
    } else {
        const maxWidths = {
            id: Math.max(...sourcesData.map((s) => s.id.length), 2),
            name: Math.max(...sourcesData.map((s) => s.name.length), 4),
            count: Math.max(...sourcesData.map((s) => String(s.count).length), 7),
            description: Math.max(...sourcesData.map((s) => s.description.length), 11),
        };

        prompts.log.step("Configured sources:");

        const header = `${colors.bold("ID".padEnd(maxWidths.id))}  ${colors.bold(
            "NAME".padEnd(maxWidths.name)
        )}  ${colors.bold("SCRIPTS".padStart(maxWidths.count))}  ${colors.bold("DESCRIPTION")}`;

        const divider = colors.dim(
            `${"-".repeat(maxWidths.id)}  ${"-".repeat(maxWidths.name)}  ${"-".repeat(maxWidths.count)}  ${"-".repeat(maxWidths.description)}`
        );

        const rows = sourcesData.map((source) => {
            return `${colors.cyan(source.id.padEnd(maxWidths.id))}  ${source.name.padEnd(
                maxWidths.name
            )}  ${colors.yellow(String(source.count).padStart(maxWidths.count))}  ${colors.dim(
                source.description
            )}`;
        });

        prompts.log.message([header, divider, ...rows].join("\n"));

        prompts.outro(
            colors.green(
                `Total: ${sourcesData.length} source${sourcesData.length === 1 ? "" : "s"} available.`
            )
        );
    }
}
