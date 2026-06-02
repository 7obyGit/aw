import { describe, it, expect, vi, beforeEach } from "vitest";
import { DockerComposeIntegration } from "../../../../../src/features/integrations/impl/docker/dockerComposeIntegration";
import * as fs from "node:fs";

vi.mock("node:fs", () => ({
    existsSync: vi.fn(),
}));

describe("DockerComposeIntegration", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should discover commands when docker-compose.yml exists", async () => {
        const integration = new DockerComposeIntegration();
        vi.mocked(fs.existsSync).mockImplementation((path) =>
            path.toString().endsWith("docker-compose.yml")
        );

        const scripts = await integration.getScripts("/test");
        expect(scripts.length).toBeGreaterThan(0);
        expect(scripts.find((s) => s.name === "dc-up")).toBeDefined();
        expect(scripts.find((s) => s.name === "dc-up")?.command).toBe(
            "docker compose -f docker-compose.yml up"
        );
    });
});
