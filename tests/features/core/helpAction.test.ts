import { beforeEach, describe, expect, it, vi } from "vitest";
import * as prompts from "@clack/prompts";
import { displayLandingPage } from "../../../src/features/core/helpAction";
import { integrationManager } from "../../../src/features/integrations/index";

vi.mock("@clack/prompts", () => ({
    intro: vi.fn(),
    log: {
        message: vi.fn(),
        step: vi.fn(),
    },
    outro: vi.fn(),
}));

vi.mock("picocolors", () => {
    const identity = (value: string): string => value;

    return {
        default: {
            bold: identity,
            cyan: identity,
            dim: identity,
            magenta: identity,
        },
    };
});

vi.mock("../../../src/features/integrations/index", () => ({
    integrationManager: {
        discoverScripts: vi.fn(),
    },
}));

describe("helpAction", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("counts and displays each landing-page script name once", async () => {
        vi.mocked(integrationManager.discoverScripts).mockResolvedValue([
            { name: "build" },
            { name: "test" },
            { name: "build" },
        ] as any);

        await displayLandingPage();

        expect(prompts.log.message).toHaveBeenCalledWith("2 scripts are available");
        expect(prompts.log.message).toHaveBeenCalledWith("  (build, test)");
    });
});
