import { describe, it, expect, vi, beforeEach } from "vitest";
import { findScriptsAction } from "../../../../src/features/scripts/actions/findScriptsAction";
import { integrationManager } from "../../../../src/features/integrations";
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
        discoverScripts: vi.fn(),
        getIntegrations: vi.fn(() => [{ id: "test" }]),
    },
}));

describe("findScriptsAction", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should find scripts by name", async () => {
        const mockScripts = [
            {
                name: "build",
                description: "Build the project",
                source: "test",
                type: "test",
                path: "",
                confidence: 1,
                command: "",
            },
            {
                name: "test",
                description: "Run tests",
                source: "test",
                type: "test",
                path: "",
                confidence: 1,
                command: "",
            },
        ];
        vi.mocked(integrationManager.discoverScripts).mockResolvedValue(mockScripts);

        await findScriptsAction("build", {});

        expect(prompts.intro).toHaveBeenCalledWith(
            expect.stringContaining('Searching for "build"')
        );
        expect(prompts.outro).toHaveBeenCalledWith(expect.stringContaining("Found 1 match"));
        expect(prompts.log.message).toHaveBeenCalledWith(expect.stringContaining("build"));
    });

    it("should find scripts by description", async () => {
        const mockScripts = [
            {
                name: "build",
                description: "Build the project",
                source: "test",
                type: "test",
                path: "",
                confidence: 1,
                command: "",
            },
            {
                name: "test",
                description: "Run tests",
                source: "test",
                type: "test",
                path: "",
                confidence: 1,
                command: "",
            },
        ];
        vi.mocked(integrationManager.discoverScripts).mockResolvedValue(mockScripts);

        await findScriptsAction("project", {});

        expect(prompts.outro).toHaveBeenCalledWith(expect.stringContaining("Found 1 match"));
        expect(prompts.log.message).toHaveBeenCalledWith(expect.stringContaining("build"));
    });

    it("should support fuzzy matching with Levenshtein distance", async () => {
        const mockScripts = [
            {
                name: "build",
                description: "Build the project",
                source: "test",
                type: "test",
                path: "",
                confidence: 1,
                command: "",
            },
        ];
        vi.mocked(integrationManager.discoverScripts).mockResolvedValue(mockScripts);

        // "build" vs "biuld" (one transposition/substitution)
        await findScriptsAction("biuld", {});

        expect(prompts.outro).toHaveBeenCalledWith(expect.stringContaining("Found 1 match"));
        expect(prompts.log.message).toHaveBeenCalledWith(expect.stringContaining("build"));
    });

    it("should sort matches by score", async () => {
        const mockScripts = [
            {
                name: "test",
                description: "just testing",
                source: "test",
                type: "test",
                path: "",
                confidence: 1,
                command: "",
            },
            {
                name: "testing",
                description: "full test",
                source: "test",
                type: "test",
                path: "",
                confidence: 1,
                command: "",
            },
            {
                name: "other",
                description: "not related",
                source: "test",
                type: "test",
                path: "",
                confidence: 1,
                command: "",
            },
        ];
        vi.mocked(integrationManager.discoverScripts).mockResolvedValue(mockScripts);

        await findScriptsAction("test", {});

        // "test" (exact match) should be first, "testing" (substring match) second
        const message = vi.mocked(prompts.log.message).mock.calls[0][0];
        if (!message) throw new Error("No message logged");
        const lines = typeof message !== "string" ? message : message.split("\n");
        // Header is line 0, divider is line 1, first result is line 2
        expect(lines[2]).toContain("test");
        expect(lines[3]).toContain("testing");
    });

    it("should output JSON if requested", async () => {
        const mockScripts = [
            {
                name: "build",
                description: "Build the project",
                source: "test",
                type: "test",
                path: "",
                confidence: 1,
                command: "",
            },
        ];
        vi.mocked(integrationManager.discoverScripts).mockResolvedValue(mockScripts);
        const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

        await findScriptsAction("build", { json: true });

        expect(consoleSpy).toHaveBeenCalled();
        const output = JSON.parse(consoleSpy.mock.calls[0][0]);
        expect(output[0].name).toBe("build");
    });
});
