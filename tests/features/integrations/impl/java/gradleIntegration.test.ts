import { describe, it, expect, vi } from "vitest";
import { GradleIntegration } from "../../../../../src/features/integrations/impl/java/gradleIntegration";
import { readdir } from "node:fs/promises";

vi.mock("node:fs/promises", () => ({
    readdir: vi.fn(),
}));

describe("GradleIntegration", () => {
    it("should have correct metadata", () => {
        const integration = new GradleIntegration();
        expect(integration.id).toBe("gradle");
        expect(integration.name).toBe("Gradle");
    });

    it("should return gradle scripts if build.gradle exists", async () => {
        const integration = new GradleIntegration();
        vi.mocked(readdir).mockResolvedValue(["build.gradle", "src"] as any);

        const scripts = await integration.getScripts("/test/dir");

        expect(scripts.length).toBeGreaterThan(0);
        expect(scripts.some((s) => s.name === "build")).toBe(true);
        expect(scripts.find((s) => s.name === "build")?.command).toBe("gradle build");
        expect(scripts[0].type).toBe("gradle");
    });

    it("should use gradlew if present", async () => {
        const integration = new GradleIntegration();
        vi.mocked(readdir).mockResolvedValue(["build.gradle", "gradlew"] as any);

        const scripts = await integration.getScripts("/test/dir");

        expect(scripts.find((s) => s.name === "build")?.command).toBe("./gradlew build");
    });

    it("should return empty array if no gradle files exist", async () => {
        const integration = new GradleIntegration();
        vi.mocked(readdir).mockResolvedValue(["pom.xml"] as any);

        const scripts = await integration.getScripts("/test/dir");
        expect(scripts).toEqual([]);
    });

    it("should return empty array on error", async () => {
        const integration = new GradleIntegration();
        vi.mocked(readdir).mockRejectedValue(new Error("Read error"));

        const scripts = await integration.getScripts("/test/dir");
        expect(scripts).toEqual([]);
    });
});
