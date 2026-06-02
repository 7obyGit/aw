import { describe, it, expect, vi, beforeEach } from "vitest";
import { runScriptAction } from "../../../../src/features/scripts/actions/runScriptAction";
import { integrationManager } from "../../../../src/features/integrations/index";
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
        step: vi.fn(),
        message: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
        info: vi.fn(),
    },
}));

vi.mock("../../../../src/features/integrations/index", () => ({
    integrationManager: {
        getScript: vi.fn(),
        discoverScripts: vi.fn(),
    },
}));

vi.mock("../../../../src/features/scripts/actions/runScriptAction", async (importOriginal) => {
    const original =
        await importOriginal<
            typeof import("../../../../src/features/scripts/actions/runScriptAction")
        >();
    return {
        ...original,
    };
});

vi.mock("../../../../src/features/core/utils/terminalExecutor", () => ({
    executeCommand: vi.fn().mockResolvedValue(undefined),
}));

describe("runScriptAction", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should show suggestion when script is not found but a close match exists", async () => {
        vi.mocked(integrationManager.getScript).mockResolvedValue(undefined);
        vi.mocked(integrationManager.discoverScripts).mockResolvedValue([
            { name: "install", source: "test", type: "test", path: "", confidence: 1, command: "" },
        ]);

        await runScriptAction("instal");

        expect(prompts.log.error).toHaveBeenCalledWith(
            expect.stringContaining("Script instal not found.")
        );
        expect(prompts.log.info).toHaveBeenCalledWith(
            expect.stringContaining("Did you mean install?")
        );
        expect(prompts.log.info).toHaveBeenCalledWith(expect.stringContaining("aw find instal"));
    });

    it("should suggest using find command when script is not found and no close match exists", async () => {
        vi.mocked(integrationManager.getScript).mockResolvedValue(undefined);
        vi.mocked(integrationManager.discoverScripts).mockResolvedValue([
            { name: "build", source: "test", type: "test", path: "", confidence: 1, command: "" },
        ]);

        await runScriptAction("very-different-name");

        expect(prompts.log.error).toHaveBeenCalledWith(
            expect.stringContaining("Script very-different-name not found.")
        );
        expect(prompts.log.info).not.toHaveBeenCalledWith(expect.stringContaining("Did you mean"));
        expect(prompts.log.info).toHaveBeenCalledWith(
            expect.stringContaining("aw find very-different-name")
        );
    });

    it("should pass AW_SCRIPT_* environment variables to executeCommand", async () => {
        const mockScript = {
            name: "test-script",
            path: "/path/to/script.sh",
            type: "shell",
            source: "local",
            confidence: 1,
            command: "echo hello",
            description: "A test script",
        };

        vi.mocked(integrationManager.getScript).mockResolvedValue(mockScript);

        await runScriptAction("test-script");

        expect(executeCommand).toHaveBeenCalledWith(
            expect.objectContaining({
                env: expect.objectContaining({
                    AW_SCRIPT_NAME: "test-script",
                    AW_SCRIPT_PATH: "/path/to/script.sh",
                    AW_SCRIPT_TYPE: "shell",
                    AW_SCRIPT_SOURCE: "local",
                }),
            })
        );
    });
});
