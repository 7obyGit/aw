import * as prompts from "@clack/prompts";
import colors from "picocolors";
import { spawn, ChildProcess } from "node:child_process";
import { loadEnvFiles } from "./envLoader.js";

/**
 * Options for command execution.
 */
export interface ExecutionOptions {
    cwd: string;
    displayName: string;
    command: string;
    details?: { label: string; value: string }[];
    env?: Record<string, string>;
}

/**
 * Executes a shell command with formatted output and .env file support.
 *
 * @param options - The execution options.
 */
export async function executeCommand(options: ExecutionOptions): Promise<void> {
    const { cwd, displayName, command, details } = options;
    const startTime: number = Date.now();

    if (details && details.length > 0) {
        prompts.log.step("Resolved Details");
        prompts.log.message(
            details
                .map(
                    (detail) =>
                        `${colors.dim(detail.label.padEnd(13))} ${colors.cyan(detail.value)}`
                )
                .join("\n")
        );
    }

    prompts.log.step(`Executing ${displayName}...\n`);
    const envVars = await loadEnvFiles(cwd);

    await new Promise<void>((resolve: () => void) => {
        const childProcess: ChildProcess = spawn(command, {
            stdio: ["inherit", "pipe", "pipe"],
            shell: true,
            cwd: cwd,
            env: { ...process.env, ...envVars, ...options.env, FORCE_COLOR: "1" },
        });

        const prefix = colors.dim("│  ");
        let stdoutAtStartOfLine = true;
        let stderrAtStartOfLine = true;

        const processChunk = (
            chunk: Buffer | string,
            atStartOfLine: boolean,
            color?: (s: string) => string
        ): { result: string; atStartOfLine: boolean } => {
            const str = chunk.toString();
            let result = "";
            let startIndex = 0;

            for (let i = 0; i < str.length; i++) {
                if (str[i] === "\n") {
                    const line = str.substring(startIndex, i + 1);
                    if (atStartOfLine) {
                        result += prefix;
                    }
                    result += color ? color(line) : line;
                    atStartOfLine = true;
                    startIndex = i + 1;
                }
            }

            if (startIndex < str.length) {
                const remaining = str.substring(startIndex);
                if (atStartOfLine) {
                    result += prefix;
                    atStartOfLine = false;
                }
                result += color ? color(remaining) : remaining;
            }

            return { result, atStartOfLine };
        };

        if (childProcess.stdout) {
            childProcess.stdout.on("data", (chunk) => {
                const { result, atStartOfLine } = processChunk(chunk, stdoutAtStartOfLine);
                stdoutAtStartOfLine = atStartOfLine;
                process.stdout.write(result);
            });
        }

        if (childProcess.stderr) {
            childProcess.stderr.on("data", (chunk) => {
                const { result, atStartOfLine } = processChunk(
                    chunk,
                    stderrAtStartOfLine,
                    colors.red
                );
                stderrAtStartOfLine = atStartOfLine;
                process.stdout.write(result);
            });
        }

        childProcess.on("close", (exitCode: number | null) => {
            const endTime: number = Date.now();
            const durationInSeconds: string = ((endTime - startTime) / 1000).toFixed(2);
            const durationMessage: string = colors.dim(`(duration: ${durationInSeconds}s)`);

            if (exitCode === 0) {
                prompts.outro(
                    `${colors.green("Execution finished successfully.")} ${durationMessage}`
                );
            } else if (exitCode !== null) {
                prompts.outro(
                    `${colors.yellow(`Execution finished with exit code ${exitCode}.`)} ${durationMessage}`
                );
            } else {
                prompts.outro(
                    `${colors.red("Execution terminated unexpectedly.")} ${durationMessage}`
                );
            }
            resolve();
        });

        childProcess.on("error", (error: Error) => {
            prompts.log.error(`Failed to start process: ${error.message}`);
            prompts.outro(colors.red("Execution failed."));
            resolve();
        });
    });
}
