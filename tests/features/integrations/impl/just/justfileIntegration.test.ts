import { describe, it, expect, vi, beforeEach } from "vitest";
import { JustfileIntegration } from "../../../../../src/features/integrations/impl/just/justfileIntegration";
import * as fs from "node:fs";
import * as fsPromises from "node:fs/promises";

vi.mock("node:fs", () => ({
    existsSync: vi.fn(),
}));

vi.mock("node:fs/promises", () => ({
    readFile: vi.fn(),
}));

describe("JustfileIntegration", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should discover recipes from Justfile", async () => {
        const integration = new JustfileIntegration();
        vi.mocked(fs.existsSync).mockImplementation((path) => path.toString().endsWith("Justfile"));
        vi.mocked(fsPromises.readFile).mockResolvedValue(
            "build:\n    echo build\ntest:\n    echo test"
        );

        const scripts = await integration.getScripts("/test");
        expect(scripts).toHaveLength(2);
        expect(scripts[0].name).toBe("build");
        expect(scripts[1].name).toBe("test");
    });
});
