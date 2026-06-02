import { describe, it, expect, vi, beforeEach } from "vitest";
import { listSourcesAction } from "../../../../src/features/sources/actions/listSourcesAction";
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
        getIntegrations: vi.fn(),
    },
}));

describe("listSourcesAction", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should list sources sorted by script count and filter out zeros by default", async () => {
        const mockIntegrations = [
            {
                id: "empty",
                name: "Empty Source",
                description: "No scripts",
                getScripts: vi.fn().mockResolvedValue([]),
            },
            {
                id: "few",
                name: "Few Source",
                description: "Few scripts",
                getScripts: vi.fn().mockResolvedValue([{}, {}]),
            },
            {
                id: "many",
                name: "Many Source",
                description: "Many scripts",
                getScripts: vi.fn().mockResolvedValue([{}, {}, {}, {}]),
            },
        ];
        vi.mocked(integrationManager.getIntegrations).mockReturnValue(mockIntegrations as any);

        await listSourcesAction({});

        expect(prompts.log.message).toHaveBeenCalled();
        const message = vi.mocked(prompts.log.message).mock.calls[0][0] as string;

        // Should only contain 'many' and 'few', in that order
        expect(message).toContain("many");
        expect(message).toContain("few");
        expect(message).not.toContain("empty");

        const lines = message.split("\n");
        // Row 1 (header), Row 2 (divider), Row 3 (many), Row 4 (few)
        expect(lines[2]).toContain("many");
        expect(lines[3]).toContain("few");

        expect(prompts.outro).toHaveBeenCalledWith(
            expect.stringContaining(
                "Total: 2 sources available. (1 more empty source hidden, use --all to show)"
            )
        );
    });

    it("should show indication when all sources are hidden", async () => {
        const mockIntegrations = [
            {
                id: "empty",
                name: "Empty Source",
                description: "No scripts",
                getScripts: vi.fn().mockResolvedValue([]),
            },
        ];
        vi.mocked(integrationManager.getIntegrations).mockReturnValue(mockIntegrations as any);

        await listSourcesAction({});

        expect(prompts.outro).toHaveBeenCalledWith(
            expect.stringContaining(
                "No sources with scripts found. (1 empty source hidden, use --all to show)"
            )
        );
    });

    it("should show all sources including zeros when --all is provided", async () => {
        const mockIntegrations = [
            {
                id: "empty",
                name: "Empty Source",
                description: "No scripts",
                getScripts: vi.fn().mockResolvedValue([]),
            },
            {
                id: "few",
                name: "Few Source",
                description: "Few scripts",
                getScripts: vi.fn().mockResolvedValue([{}, {}]),
            },
        ];
        vi.mocked(integrationManager.getIntegrations).mockReturnValue(mockIntegrations as any);

        await listSourcesAction({ all: true });

        const message = vi.mocked(prompts.log.message).mock.calls[0][0] as string;
        expect(message).toContain("few");
        expect(message).toContain("empty");

        const lines = message.split("\n");
        expect(lines[2]).toContain("few");
        expect(lines[3]).toContain("empty");
    });

    it("should output JSON if requested", async () => {
        const mockIntegrations = [
            {
                id: "test",
                name: "Test Source",
                description: "Test",
                getScripts: vi.fn().mockResolvedValue([{}]),
            },
        ];
        vi.mocked(integrationManager.getIntegrations).mockReturnValue(mockIntegrations as any);
        const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

        await listSourcesAction({ json: true });

        expect(consoleSpy).toHaveBeenCalled();
        const output = JSON.parse(consoleSpy.mock.calls[0][0]);
        expect(output[0].id).toBe("test");
        expect(output[0].count).toBe(1);
    });
});
