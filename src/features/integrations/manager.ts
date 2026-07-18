import { IIntegration } from "./types/IIntegration";
import { IScript } from "../scripts/types/IScript";
import { dirname, relative, resolve } from "node:path";

export class IntegrationManager {
    private integrations: IIntegration[] = [];

    public register(integration: IIntegration): void {
        this.integrations.push(integration);
    }

    public getIntegrations(): IIntegration[] {
        return this.integrations;
    }

    public async discoverScripts(workingDirectory: string): Promise<IScript[]> {
        const results: IScript[][] = await Promise.all(
            this.integrations.map((integration: IIntegration) =>
                integration.getScripts(workingDirectory)
            )
        );

        return results.flat().sort((a: IScript, b: IScript) => {
            return (
                getConfigDistance(a.path, workingDirectory) -
                getConfigDistance(b.path, workingDirectory)
            );
        });
    }

    public async getScript(name: string, workingDirectory: string): Promise<IScript | undefined> {
        const scripts: IScript[] = await this.discoverScripts(workingDirectory);
        return scripts.find((script: IScript) => script.name === name);
    }
}

/**
 * Returns how far a script's config file is from the working directory.
 * Scripts configured in the current directory have distance 0; each parent
 * directory adds one level. This lets local configuration override inherited
 * configuration regardless of integration registration order.
 */
function getConfigDistance(scriptPath: string, workingDirectory: string): number {
    const relativeDirectory: string = relative(
        resolve(workingDirectory),
        dirname(resolve(scriptPath))
    );
    const parentSegments: string[] = relativeDirectory
        .split(/[\\/]+/)
        .filter((segment) => segment === "..");

    return parentSegments.length;
}

export const integrationManager: IntegrationManager = new IntegrationManager();
