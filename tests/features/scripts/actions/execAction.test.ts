import { describe, it, expect, vi, beforeEach } from "vitest";
import { execAction } from "../../../../src/features/scripts/actions/execAction";
import { executeCommand } from "../../../../src/features/core/utils/terminalExecutor";
import * as prompts from "@clack/prompts";

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
    },
}));

vi.mock("../../../../src/features/core/utils/terminalExecutor", () => ({
    executeCommand: vi.fn().mockResolvedValue(undefined),
}));

describe("execAction", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should execute a command with custom environment variables", async () => {
        await execAction("echo hello", { CUSTOM_VAR: "value" });

        expect(executeCommand).toHaveBeenCalledWith(
            expect.objectContaining({
                command: "echo hello",
                env: expect.objectContaining({
                    AW_EXEC: "true",
                    CUSTOM_VAR: "value",
                }),
            })
        );
    });

    it("should show error if no command is provided", async () => {
        await execAction("");

        expect(prompts.log.error).toHaveBeenCalledWith("No command provided to exec.");
        expect(executeCommand).not.toHaveBeenCalled();
    });
});
