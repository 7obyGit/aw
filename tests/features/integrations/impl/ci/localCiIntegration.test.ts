import { describe, it, expect } from "vitest";
import { LocalCiIntegration } from "../../../../../src/features/integrations/impl/ci/localCiIntegration";
import { join } from "node:path";
import { mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";

describe("LocalCiIntegration", () => {
    const testDir = join(tmpdir(), "temp-ci-test-" + Date.now());

    it("should discover GitHub jobs when jobs: is at the end of file", async () => {
        const workflowDir = join(testDir, ".github", "workflows");
        await mkdir(workflowDir, { recursive: true });

        const workflowContent = `
name: CI
on: [push]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - run: echo build
  test:
    runs-on: ubuntu-latest
    steps:
      - run: echo test
`;
        await writeFile(join(workflowDir, "ci.yml"), workflowContent);

        const integration = new LocalCiIntegration();
        const scripts = await integration.getScripts(testDir);

        expect(scripts.length).toBe(2);
        expect(scripts.find((s) => s.name === "ci:build")).toBeDefined();
        expect(scripts.find((s) => s.name === "ci:test")).toBeDefined();

        await rm(testDir, { recursive: true, force: true });
    });

    it("should discover GitHub jobs when jobs: is NOT at the end of file", async () => {
        const workflowDir = join(testDir, ".github", "workflows");
        await mkdir(workflowDir, { recursive: true });

        const workflowContent = `
name: CI
on: [push]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - run: echo build
other:
  key: value
`;
        await writeFile(join(workflowDir, "ci.yml"), workflowContent);

        const integration = new LocalCiIntegration();
        const scripts = await integration.getScripts(testDir);

        expect(scripts.length).toBe(1);
        expect(scripts[0].name).toBe("ci:build");

        await rm(testDir, { recursive: true, force: true });
    });

    it("should discover GitHub jobs when there are empty lines between them", async () => {
        const workflowDir = join(testDir, ".github", "workflows");
        await mkdir(workflowDir, { recursive: true });

        const workflowContent = `
name: CI
on: [push]
jobs:
  build:
    runs-on: ubuntu-latest

  test:
    runs-on: ubuntu-latest
`;
        await writeFile(join(workflowDir, "ci.yml"), workflowContent);

        const integration = new LocalCiIntegration();
        const scripts = await integration.getScripts(testDir);

        expect(scripts.length).toBe(2);
        expect(scripts.find((s) => s.name === "ci:build")).toBeDefined();
        expect(scripts.find((s) => s.name === "ci:test")).toBeDefined();

        await rm(testDir, { recursive: true, force: true });
    });

    it("should discover GitHub jobs in parent directories", async () => {
        const rootWorkflowDir = join(testDir, ".github", "workflows");
        await mkdir(rootWorkflowDir, { recursive: true });
        const subDir = join(testDir, "src", "sub");
        await mkdir(subDir, { recursive: true });

        const workflowContent = `
name: CI
on: [push]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - run: echo build
`;
        await writeFile(join(rootWorkflowDir, "ci.yml"), workflowContent);

        const integration = new LocalCiIntegration();
        const scripts = await integration.getScripts(subDir);

        expect(scripts.length).toBe(1);
        expect(scripts[0].name).toBe("ci:build");

        await rm(testDir, { recursive: true, force: true });
    });
});
