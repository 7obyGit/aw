import { describe, it, expect, vi } from "vitest";
import { ShellIntegration } from "../../../../../src/features/integrations/impl/shell/shellIntegration";
import { readdir } from "node:fs/promises";
import { join } from "node:path";

vi.mock("node:fs/promises", () => ({
    readdir: vi.fn(),
}));

describe("ShellIntegration", () => {
    it("should have correct metadata", () => {
        const integration = new ShellIntegration();
        expect(integration.id).toBe("shell");
        expect(integration.name).toBe("Shell Scripts");
    });

    it("should return shell scripts from directory", async () => {
        const integration = new ShellIntegration();
        const mockFiles = ["script1.sh", "script2.sh", "readme.md", "other.txt"];
        vi.mocked(readdir).mockResolvedValue(mockFiles as any);

        const workingDir = "/test/dir";
        const scripts = await integration.getScripts(workingDir);

        expect(scripts).toHaveLength(2);
        expect(scripts[0]).toEqual({
            name: "script1",
            path: join(workingDir, "script1.sh"),
            type: "shell",
            source: "local directory",
            confidence: 0.8,
            description: "(shell script) script1.sh",
            command: `bash "${join(workingDir, "script1.sh")}"`,
        });
        expect(scripts[1].name).toBe("script2");
    });

    it("should return empty array on error", async () => {
        const integration = new ShellIntegration();
        vi.mocked(readdir).mockRejectedValue(new Error("Read error"));

        const scripts = await integration.getScripts("/test/dir");
        expect(scripts).toEqual([]);
    });
});
