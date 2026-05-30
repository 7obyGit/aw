import { IScript } from "../../scripts/types/IScript";

export interface IIntegration {
    readonly id: string;
    readonly name: string;
    readonly description: string;
    getScripts(workingDirectory: string): Promise<IScript[]>;
}
