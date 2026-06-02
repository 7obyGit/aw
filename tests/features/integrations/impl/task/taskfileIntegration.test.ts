import { describe, it, expect, vi, beforeEach } from "vitest";
import { TaskfileIntegration } from "../../../../../src/features/integrations/impl/task/taskfileIntegration";
import * as fs from "node:fs";
import * as fsPromises from "node:fs/promises";

vi.mock("node:fs", () => ({
    existsSync: vi.fn(),
}));

vi.mock("node:fs/promises", () => ({
    readFile: vi.fn(),
}));

describe("TaskfileIntegration", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should discover tasks from Taskfile.yml", async () => {
        const integration = new TaskfileIntegration();
        vi.mocked(fs.existsSync).mockImplementation((path) =>
            path.toString().endsWith("Taskfile.yml")
        );
        vi.mocked(fsPromises.readFile).mockResolvedValue(
            "version: '3'\ntasks:\n  build:\n    cmds:\n      - echo build\n  test:\n    cmds:\n      - echo test"
        );

        const scripts = await integration.getScripts("/test");
        expect(scripts).toHaveLength(2);
        expect(scripts[0].name).toBe("build");
        expect(scripts[1].name).toBe("test");
    });
});
