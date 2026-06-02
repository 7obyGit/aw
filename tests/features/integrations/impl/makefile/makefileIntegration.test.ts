import { describe, it, expect, vi, beforeEach } from "vitest";
import { MakefileIntegration } from "../../../../../src/features/integrations/impl/makefile/makefileIntegration";
import * as fs from "node:fs";
import * as fsPromises from "node:fs/promises";

vi.mock("node:fs", () => ({
    existsSync: vi.fn(),
}));

vi.mock("node:fs/promises", () => ({
    readFile: vi.fn(),
}));

describe("MakefileIntegration", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should discover targets from Makefile", async () => {
        const integration = new MakefileIntegration();
        vi.mocked(fs.existsSync).mockImplementation((path) => path.toString().endsWith("Makefile"));
        vi.mocked(fsPromises.readFile).mockResolvedValue(
            "all: build\nbuild: \n\techo build\n.PHONY: all"
        );

        const scripts = await integration.getScripts("/test");
        expect(scripts).toHaveLength(2);
        expect(scripts[0].name).toBe("all");
        expect(scripts[1].name).toBe("build");
        expect(scripts[1].command).toBe("make build");
    });
});
