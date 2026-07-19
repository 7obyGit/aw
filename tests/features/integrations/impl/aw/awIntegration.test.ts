import { describe, expect, it, vi } from "vitest";
import { AwIntegration } from "../../../../../src/features/integrations/impl/aw/awIntegration";
import * as fs from "node:fs";
import { getShellInterpreter } from "../../../../../src/features/integrations/utils/shellScript";

vi.mock("node:fs", () => ({
    promises: {
        readdir: vi.fn(),
        stat: vi.fn(),
    },
}));

vi.mock("../../../../../src/features/integrations/utils/shellScript", () => ({
    getShellInterpreter: vi.fn(),
}));

describe("AwIntegration", () => {
    it("uses a detected shell interpreter for scripts in .aw", async () => {
        vi.mocked(fs.promises.stat).mockImplementation(async (target) => {
            const filePath: string = String(target);

            if (filePath === "/workspace/.aw") {
                return { isDirectory: () => true } as any;
            }

            if (filePath === "/workspace/.aw/deploy") {
                return { isFile: () => true } as any;
            }

            return { isDirectory: () => false } as any;
        });
        vi.mocked(fs.promises.readdir).mockResolvedValue(["deploy"] as any);
        vi.mocked(getShellInterpreter).mockResolvedValue("/bin/zsh");

        const scripts = await new AwIntegration().getScripts("/workspace/project");

        expect(scripts).toEqual([
            expect.objectContaining({
                name: "deploy",
                path: "/workspace/.aw/deploy",
                command: '/bin/zsh "/workspace/.aw/deploy"',
            }),
        ]);
    });
});
