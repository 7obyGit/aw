import { describe, it, expect, vi, beforeEach } from "vitest";
import { GoIntegration } from "../../../../../src/features/integrations/impl/go/goIntegration";
import * as fs from "node:fs";

vi.mock("node:fs", () => ({
    existsSync: vi.fn(),
}));

describe("GoIntegration", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should discover commands when go.mod exists", async () => {
        const integration = new GoIntegration();
        vi.mocked(fs.existsSync).mockImplementation((path) => path.toString().endsWith("go.mod"));

        const scripts = await integration.getScripts("/test");
        expect(scripts.find((s) => s.name === "go-run")).toBeDefined();
    });
});
