import { describe, it, expect, vi, beforeEach } from "vitest";
import { recordAction } from "../../../../src/features/scripts/actions/recordAction";
import * as prompts from "@clack/prompts";
import * as fs from "node:fs";
import * as path from "node:path";
import { executeCommand } from "../../../../src/features/core/utils/terminalExecutor";

vi.mock("picocolors", () => ({
    default: {
        cyan: (s: string) => s,
        magenta: (s: string) => s,
        red: (s: string) => s,
        yellow: (s: string) => s,
        bold: (s: string) => s,
        dim: (s: string) => s,
        green: (s: string) => s,
    },
}));

vi.mock("@clack/prompts", () => ({
    intro: vi.fn(),
    outro: vi.fn(),
    log: {
        error: vi.fn(),
        info: vi.fn(),
        step: vi.fn(),
        message: vi.fn(),
    },
    text: vi.fn(),
    confirm: vi.fn(),
    isCancel: vi.fn((val) => val === Symbol.for("clack:cancel")),
    spinner: vi.fn(() => ({
        start: vi.fn(),
        stop: vi.fn(),
    })),
}));

vi.mock("node:fs", () => ({
    existsSync: vi.fn(),
    statSync: vi.fn(),
    promises: {
        writeFile: vi.fn(),
    },
}));

vi.mock("../../../../src/features/core/utils/terminalExecutor", () => ({
    executeCommand: vi.fn(),
}));

describe("recordAction", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Default to finding a .aw directory
        vi.mocked(fs.existsSync).mockReturnValue(true);
        vi.mocked(fs.statSync).mockReturnValue({ isDirectory: () => true } as any);
    });

    it("should fail if no .aw directory is found", async () => {
        vi.mocked(fs.existsSync).mockReturnValue(false);

        await recordAction();

        expect(prompts.log.error).toHaveBeenCalledWith(
            expect.stringContaining("No .aw directory found")
        );
    });

    it("should record commands and save them to a file", async () => {
        vi.mocked(prompts.text)
            .mockResolvedValueOnce("my-script") // script name
            .mockResolvedValueOnce("echo hello") // command 1
            .mockResolvedValueOnce(""); // finish

        await recordAction();

        expect(fs.promises.writeFile).toHaveBeenCalledWith(
            expect.stringContaining("my-script.sh"),
            expect.stringContaining("echo hello"),
            expect.any(Object)
        );
        expect(prompts.outro).toHaveBeenCalledWith(
            expect.stringContaining("Script recorded successfully")
        );
    });

    it("should handle dynamic environment variables and strip them from the command", async () => {
        vi.mocked(prompts.text)
            .mockResolvedValueOnce("env-script") // script name
            .mockResolvedValueOnce("MY_VAR=secret ./run-app") // command 1
            .mockResolvedValueOnce(""); // finish

        vi.mocked(prompts.confirm).mockResolvedValueOnce(true); // Yes, dynamic

        await recordAction();

        const writeFileCall = vi.mocked(fs.promises.writeFile).mock.calls[0];
        const content = writeFileCall[1] as string;

        expect(content).toContain('read -p "Enter value for MY_VAR: " MY_VAR');
        expect(content).toContain("export MY_VAR");
        expect(content).toContain("./run-app");
        expect(content).not.toContain("MY_VAR=secret ./run-app");
    });

    it("should execute commands during recording", async () => {
        vi.mocked(prompts.text)
            .mockResolvedValueOnce("test-exec")
            .mockResolvedValueOnce("ls -la")
            .mockResolvedValueOnce("");

        await recordAction();

        expect(executeCommand).toHaveBeenCalledWith(
            expect.objectContaining({
                command: "ls -la",
            })
        );
    });
});
