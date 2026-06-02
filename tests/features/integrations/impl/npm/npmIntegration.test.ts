import { describe, it, expect } from "vitest";
import { NpmIntegration } from "../../../../../src/features/integrations/impl/npm/npmIntegration";
import { join } from "node:path";
import { mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";

describe("NpmIntegration", () => {
    const testDir = join(tmpdir(), "temp-npm-test-" + Date.now());

    it("should discover npm scripts in the current directory", async () => {
        await mkdir(testDir, { recursive: true });
        const packageJson = {
            scripts: {
                test: "vitest",
            },
        };
        await writeFile(join(testDir, "package.json"), JSON.stringify(packageJson));

        const integration = new NpmIntegration();
        const scripts = await integration.getScripts(testDir);

        expect(scripts.length).toBe(1);
        expect(scripts[0].name).toBe("test");
        expect(scripts[0].command).toBe("npm run test");

        await rm(testDir, { recursive: true, force: true });
    });

    it("should discover npm scripts in parent directories", async () => {
        await mkdir(testDir, { recursive: true });
        const packageJson = {
            scripts: {
                build: "tsc",
            },
        };
        await writeFile(join(testDir, "package.json"), JSON.stringify(packageJson));

        const subDir = join(testDir, "packages", "app");
        await mkdir(subDir, { recursive: true });

        const integration = new NpmIntegration();
        const scripts = await integration.getScripts(subDir);

        expect(scripts.length).toBe(1);
        expect(scripts[0].name).toBe("build");

        await rm(testDir, { recursive: true, force: true });
    });
});
