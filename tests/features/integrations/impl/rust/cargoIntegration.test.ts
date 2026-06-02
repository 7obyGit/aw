import { describe, it, expect, vi, beforeEach } from "vitest";
import { CargoIntegration } from "../../../../../src/features/integrations/impl/rust/cargoIntegration";
import * as fs from "node:fs";

vi.mock("node:fs", () => ({
    existsSync: vi.fn(),
}));

describe("CargoIntegration", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should discover commands when Cargo.toml exists", async () => {
        const integration = new CargoIntegration();
        vi.mocked(fs.existsSync).mockImplementation((path) =>
            path.toString().endsWith("Cargo.toml")
        );

        const scripts = await integration.getScripts("/test");
        expect(scripts.find((s) => s.name === "cargo-build")).toBeDefined();
    });
});
