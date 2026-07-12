import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { SpaceIntegration } from "../../../../../src/features/integrations/impl/space/spaceIntegration";
import { join } from "node:path";
import { mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import * as os from "node:os";
import * as child_process from "node:child_process";

vi.mock("node:os", async () => {
    const actual = await vi.importActual<typeof import("node:os")>("node:os");
    return {
        ...actual,
        homedir: vi.fn(),
    };
});

vi.mock("node:child_process", async () => {
    const actual = await vi.importActual<typeof import("node:child_process")>("node:child_process");
    return {
        ...actual,
        execSync: vi.fn(),
    };
});

describe("SpaceIntegration", () => {
    const testHome = join(tmpdir(), "temp-space-test-" + Date.now());

    beforeEach(async () => {
        await mkdir(testHome, { recursive: true });
        vi.mocked(os.homedir).mockReturnValue(testHome);
    });

    afterEach(async () => {
        await rm(testHome, { recursive: true, force: true });
        vi.clearAllMocks();
    });

    it("should discover space scripts from ~/space.code-workspace", async () => {
        const workspace = {
            space: {
                scripts: {
                    example: {
                        command: "echo 'Hello'",
                    },
                    open: {
                        "post-command": "echo 'opening'",
                    },
                },
            },
        };
        await writeFile(join(testHome, "space.code-workspace"), JSON.stringify(workspace));
        vi.mocked(child_process.execSync).mockReturnValue(Buffer.from("/usr/local/bin/space"));

        const integration = new SpaceIntegration();
        const scripts = await integration.getScripts(process.cwd());

        expect(scripts.length).toBe(2);

        const example = scripts.find((s) => s.name === "example");
        expect(example).toBeDefined();
        expect(example?.command).toBe("space run example");
        expect(example?.description).toBe("echo 'Hello'");

        const open = scripts.find((s) => s.name === "open");
        expect(open).toBeDefined();
        expect(open?.description).toBe("echo 'opening'");
    });

    it("should return error command if space is not installed", async () => {
        const workspace = {
            space: {
                scripts: {
                    example: "echo 'Hello'",
                },
            },
        };
        await writeFile(join(testHome, "space.code-workspace"), JSON.stringify(workspace));
        vi.mocked(child_process.execSync).mockImplementation(() => {
            throw new Error("not found");
        });

        const integration = new SpaceIntegration();
        const scripts = await integration.getScripts(process.cwd());

        expect(scripts.length).toBe(1);
        expect(scripts[0].command).toContain("npm install -g @7obygit/space");
    });

    it("should return empty array if file does not exist", async () => {
        const integration = new SpaceIntegration();
        const scripts = await integration.getScripts(process.cwd());
        expect(scripts).toEqual([]);
    });

    it("should return empty array if space section is missing", async () => {
        const workspace = { folders: [] };
        await writeFile(join(testHome, "space.code-workspace"), JSON.stringify(workspace));

        const integration = new SpaceIntegration();
        const scripts = await integration.getScripts(process.cwd());
        expect(scripts).toEqual([]);
    });
});
