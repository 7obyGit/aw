import { describe, it, expect, vi } from "vitest";
import { MavenIntegration } from "../../../../../src/features/integrations/impl/java/mavenIntegration";
import { readdir } from "node:fs/promises";

vi.mock("node:fs/promises", () => ({
    readdir: vi.fn(),
}));

describe("MavenIntegration", () => {
    it("should have correct metadata", () => {
        const integration = new MavenIntegration();
        expect(integration.id).toBe("maven");
        expect(integration.name).toBe("Maven");
    });

    it("should return maven scripts if pom.xml exists", async () => {
        const integration = new MavenIntegration();
        vi.mocked(readdir).mockResolvedValue(["pom.xml", "src"] as any);

        const scripts = await integration.getScripts("/test/dir");

        expect(scripts.length).toBeGreaterThan(0);
        expect(scripts.some((s) => s.name === "clean")).toBe(true);
        expect(scripts.find((s) => s.name === "clean")?.command).toBe("mvn clean");
        expect(scripts[0].type).toBe("maven");
    });

    it("should return empty array if pom.xml does not exist", async () => {
        const integration = new MavenIntegration();
        vi.mocked(readdir).mockResolvedValue(["README.md", "src"] as any);

        const scripts = await integration.getScripts("/test/dir");
        expect(scripts).toEqual([]);
    });

    it("should return empty array on error", async () => {
        const integration = new MavenIntegration();
        vi.mocked(readdir).mockRejectedValue(new Error("Read error"));

        const scripts = await integration.getScripts("/test/dir");
        expect(scripts).toEqual([]);
    });
});
