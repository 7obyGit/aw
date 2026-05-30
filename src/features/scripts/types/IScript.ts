export interface IScript {
    name: string;
    path: string;
    type: string;
    source: string;
    confidence: number;
    description?: string;
    command: string;
}
