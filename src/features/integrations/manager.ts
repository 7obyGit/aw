import { IIntegration } from "./types/IIntegration";
import { IScript } from "../scripts/types/IScript";

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

        return results.flat();
    }

    public async getScript(name: string, workingDirectory: string): Promise<IScript | undefined> {
        const scripts: IScript[] = await this.discoverScripts(workingDirectory);
        return scripts.find((script: IScript) => script.name === name);
    }
}

export const integrationManager: IntegrationManager = new IntegrationManager();
