import { describe, it, expect, vi, beforeEach } from "vitest";
import { describeScriptAction } from "../../../../src/features/scripts/actions/describeScriptAction";
import { integrationManager } from "../../../../src/features/integrations/index";
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

describe("describeScriptAction", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should display script details when script is found", async () => {
        const mockScript = {
            name: "test-script",
            path: "/path/to/script.sh",
            type: "shell",
            source: "local",
            confidence: 1,
            command: "echo hello",
            description: "A test script",
        };

        vi.mocked(integrationManager.discoverScripts).mockResolvedValue([mockScript]);

        await describeScriptAction("test-script");

        expect(prompts.intro).toHaveBeenCalledWith(
            expect.stringContaining("Script details: test-script")
        );
        const message = vi.mocked(prompts.log.message).mock.calls[0][0] as string;
        expect(message).toContain("Source");
        expect(message).toContain("local");
        expect(message).toContain("Command");
        expect(message).toContain("echo hello");
        expect(message).toContain("│");
        expect(prompts.outro).not.toHaveBeenCalled();
    });

    it("should show suggestion when script is not found but a close match exists", async () => {
        vi.mocked(integrationManager.discoverScripts).mockResolvedValue([
            { name: "install", source: "test", type: "test", path: "", confidence: 1, command: "" },
        ]);

        await describeScriptAction("instal");

        expect(prompts.log.error).toHaveBeenCalledWith(
            expect.stringContaining("Script instal not found.")
        );
        expect(prompts.log.info).toHaveBeenCalledWith(
            expect.stringContaining("Did you mean install?")
        );
        expect(prompts.outro).toHaveBeenCalledWith(expect.stringContaining("Aborted"));
    });

    it("should handle multiple scripts with the same name", async () => {
        const mockScripts = [
            {
                name: "test-script",
                path: "/path/to/script1.sh",
                type: "shell",
                source: "local1",
                confidence: 1,
                command: "echo hello 1",
            },
            {
                name: "test-script",
                path: "/path/to/script2.sh",
                type: "shell",
                source: "local2",
                confidence: 0.8,
                command: "echo hello 2",
            },
        ];

        vi.mocked(integrationManager.discoverScripts).mockResolvedValue(mockScripts);

        await describeScriptAction("test-script");

        expect(prompts.log.step).toHaveBeenCalledWith(
            expect.stringContaining("Occurrence 1 (active)")
        );
        expect(prompts.log.step).toHaveBeenCalledWith(
            expect.stringContaining("Occurrence 2 (shadowed)")
        );
        expect(prompts.log.message).toHaveBeenCalledTimes(2);
    });

    it("should output JSON as a single object when requested", async () => {
        const mockScript = {
            name: "test-script",
            path: "/path/to/script.sh",
            type: "shell",
            source: "local",
            confidence: 1,
            command: "echo hello",
        };

        vi.mocked(integrationManager.discoverScripts).mockResolvedValue([mockScript]);
        const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

        await describeScriptAction("test-script", { json: true });

        expect(consoleSpy).toHaveBeenCalled();
        const output = JSON.parse(consoleSpy.mock.calls[0][0]);
        expect(Array.isArray(output)).toBe(false);
        expect(output.name).toBe("test-script");
        consoleSpy.mockRestore();
    });
});
