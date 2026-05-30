import * as prompts from "@clack/prompts";
import colors from "picocolors";
import { integrationManager } from "../../integrations";
import { IScript } from "../types/IScript";
import { getLevenshteinDistance } from "../../core/utils/stringUtils.js";

interface IMatchResult {
    script: IScript;
    score: number;
}

export async function findScriptsAction(query: string, options: { json?: boolean }): Promise<void> {
    const workingDirectory: string = process.cwd();
    const scripts: IScript[] = await integrationManager.discoverScripts(workingDirectory);

    if (scripts.length === 0) {
        if (options.json) {
            console.log(JSON.stringify([], null, 2));
        } else {
            prompts.log.warn(colors.yellow("No scripts found to search in."));
        }
        return;
    }

    const results: IMatchResult[] = scripts
        .map((script: IScript): IMatchResult => {
            const score: number = calculateScore(query, script);
            return { script, score };
        })
        .filter((result: IMatchResult) => result.score > 0)
        .sort((a: IMatchResult, b: IMatchResult) => b.score - a.score);

    if (options.json) {
        console.log(
            JSON.stringify(
                results.map((r: IMatchResult) => r.script),
                null,
                2
            )
        );
        return;
    }

    prompts.intro(colors.magenta(`Searching for "${query}"...`));

    if (results.length === 0) {
        prompts.outro(colors.yellow("No matching scripts found."));
    } else {
        const tableData = results.map((result: IMatchResult) => ({
            name: result.script.name,
            source: result.script.source,
            description: result.script.description || "-",
        }));

        const maxWidths = {
            name: Math.max(...tableData.map((d) => d.name.length), 4),
            source: Math.max(...tableData.map((d) => d.source.length), 6),
            description: Math.max(...tableData.map((d) => d.description.length), 11),
        };

        const header: string = `${colors.bold("NAME".padEnd(maxWidths.name))}  ${colors.bold(
            "SOURCE".padEnd(maxWidths.source)
        )}  ${colors.bold("DESCRIPTION")}`;

        const divider: string = colors.dim(
            `${"-".repeat(maxWidths.name)}  ${"-".repeat(maxWidths.source)}  ${"-".repeat(
                maxWidths.description
            )}`
        );

        const rows: string[] = tableData.map((d) => {
            return `${colors.cyan(d.name.padEnd(maxWidths.name))}  ${d.source.padEnd(
                maxWidths.source
            )}  ${colors.dim(d.description)}`;
        });

        prompts.log.message([header, divider, ...rows].join("\n"));
        prompts.outro(
            colors.green(`Found ${results.length} match${results.length === 1 ? "" : "es"}`)
        );
    }
}

function calculateScore(query: string, script: IScript): number {
    const q: string = query.toLowerCase();
    const name: string = script.name.toLowerCase();
    const description: string = (script.description || "").toLowerCase();
    // 'type' is used as 'id' here as per integration implementation
    const type: string = script.type.toLowerCase();

    let score: number = 0;

    // Exact matches
    if (name === q) score += 100;
    else if (name.includes(q)) score += 50;

    if (description.includes(q)) score += 20;
    if (type.includes(q)) score += 10;

    // Levenshtein fuzzy matching for name
    const nameDistance: number = getLevenshteinDistance(q, name);
    const maxLen: number = Math.max(q.length, name.length);
    const nameFuzzyRatio: number = maxLen > 0 ? 1 - nameDistance / maxLen : 0;

    if (nameFuzzyRatio >= 0.5) {
        score += nameFuzzyRatio * 30;
    }

    // Levenshtein fuzzy matching for description
    const descWords: string[] = description.split(/\s+/);
    let bestDescFuzzyRatio: number = 0;
    for (const word of descWords) {
        if (word.length < 3) continue;
        const dist: number = getLevenshteinDistance(q, word);
        const maxWLen: number = Math.max(q.length, word.length);
        const fuzzyRatio: number = 1 - dist / maxWLen;
        if (fuzzyRatio > bestDescFuzzyRatio) bestDescFuzzyRatio = fuzzyRatio;
    }

    if (bestDescFuzzyRatio >= 0.5) {
        score += bestDescFuzzyRatio * 10;
    }

    return score;
}
