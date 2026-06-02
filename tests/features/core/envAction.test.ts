import { describe, it, expect, vi, beforeEach } from "vitest";
import { envAction } from "../../../src/features/core/envAction";
import { loadDetailedEnv } from "../../../src/features/core/utils/envLoader";
import * as prompts from "@clack/prompts";

vi.mock("@clack/prompts", () => ({
    intro: vi.fn(),
    outro: vi.fn(),
    log: {
        step: vi.fn(),
        message: vi.fn(),
        info: vi.fn(),
        error: vi.fn(),
    },
}));

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

vi.mock("../../../src/features/core/utils/envLoader", () => ({
    loadDetailedEnv: vi.fn(),
}));

describe("envAction", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should display built-in variables", async () => {
        vi.mocked(loadDetailedEnv).mockResolvedValue({
            variables: { PARENT_VAR: "value" },
            variableSources: { PARENT_VAR: "Parent Environment" },
            sources: { "Parent Environment": 1 },
        });

        await envAction({});

        expect(prompts.log.step).toHaveBeenCalledWith(
            expect.stringContaining("Built-in Variables:")
        );
        expect(prompts.log.message).toHaveBeenCalledWith(expect.stringContaining("AW=true"));
        expect(prompts.log.message).toHaveBeenCalledWith(expect.stringContaining("AW_VERSION="));
        expect(prompts.log.message).toHaveBeenCalledWith(expect.stringContaining("AW_BIN="));
        expect(prompts.log.message).toHaveBeenCalledWith(expect.stringContaining("AW_CWD="));
    });

    it("should include built-in variables in JSON output", async () => {
        vi.mocked(loadDetailedEnv).mockResolvedValue({
            variables: { PARENT_VAR: "value" },
            variableSources: { PARENT_VAR: "Parent Environment" },
            sources: { "Parent Environment": 1 },
        });

        const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

        await envAction({ json: true });

        expect(consoleSpy).toHaveBeenCalled();
        const output = JSON.parse(consoleSpy.mock.calls[0][0]);
        expect(output.builtIn).toBeDefined();
        expect(output.builtIn.AW).toBe("true");
        expect(output.count).toBe(5); // 1 parent + 4 built-in

        consoleSpy.mockRestore();
    });
});
