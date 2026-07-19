import { describe, it, expect, vi, beforeEach } from "vitest";
import { executeCommand } from "../../../../src/features/core/utils/terminalExecutor";
import { spawn } from "node:child_process";
import { loadEnvFiles } from "../../../../src/features/core/utils/envLoader";
import PACKAGE_DATA from "../../../../package.json";

const streamHandlers = vi.hoisted(() => ({
    stdoutData: undefined as ((chunk: string) => void) | undefined,
}));

vi.mock("node:child_process", () => ({
    spawn: vi.fn(() => ({
        on: vi.fn((event, cb) => {
            if (event === "close") setTimeout(() => cb(0), 0);
        }),
        stdout: {
            on: vi.fn((event, cb) => {
                if (event === "data") streamHandlers.stdoutData = cb;
            }),
        },
        stderr: { on: vi.fn() },
    })),
}));

vi.mock("../../../../src/features/core/utils/envLoader", () => ({
    loadEnvFiles: vi.fn().mockResolvedValue({ DOTENV_VAR: "value" }),
}));

vi.mock("@clack/prompts", () => ({
    intro: vi.fn(),
    outro: vi.fn(),
    log: {
        step: vi.fn(),
        message: vi.fn(),
        error: vi.fn(),
    },
}));

describe("terminalExecutor Environment Variables", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should include AW and AW_VERSION in the environment", async () => {
        await executeCommand({
            cwd: "/test/cwd",
            displayName: "test",
            command: "echo test",
        });

        expect(spawn).toHaveBeenCalledWith(
            "echo test",
            expect.objectContaining({
                env: expect.objectContaining({
                    AW: "true",
                    AW_VERSION: PACKAGE_DATA.version,
                    AW_BIN: process.argv[1],
                    AW_CWD: "/test/cwd",
                    DOTENV_VAR: "value",
                    FORCE_COLOR: "1",
                }),
            })
        );
    });

    it("should allow overriding AW environment variables from options", async () => {
        await executeCommand({
            cwd: "/test/cwd",
            displayName: "test",
            command: "echo test",
            env: {
                AW_SCRIPT_NAME: "overridden",
            },
        });

        expect(spawn).toHaveBeenCalledWith(
            "echo test",
            expect.objectContaining({
                env: expect.objectContaining({
                    AW: "true",
                    AW_SCRIPT_NAME: "overridden",
                }),
            })
        );
    });

    it("should reset the terminal column before each forwarded output line", async () => {
        const writeSpy = vi.spyOn(process.stdout, "write").mockReturnValue(true);
        const longLine = "a".repeat(100);
        const execution = executeCommand({
            cwd: "/test/cwd",
            displayName: "test",
            command: "echo test",
        });

        streamHandlers.stdoutData?.(`${longLine}\nnext line\n`);
        await execution;

        expect(writeSpy).toHaveBeenCalledWith(`│  ${longLine}\r\n│  next line\r\n`);
        writeSpy.mockRestore();
    });
});
