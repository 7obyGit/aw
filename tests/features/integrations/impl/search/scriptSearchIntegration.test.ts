import { describe, expect, it, vi } from "vitest";
import { readdir } from "node:fs/promises";
import { join } from "node:path";
import { ScriptSearchIntegration } from "../../../../../src/features/integrations/impl/search/scriptSearchIntegration";
import { IIntegration } from "../../../../../src/features/integrations/types/IIntegration";
import { IScript } from "../../../../../src/features/scripts/types/IScript";

vi.mock("node:fs/promises", () => ({
    readdir: vi.fn(),
}));

describe("ScriptSearchIntegration", () => {
    it("discovers scripts using every registered file integration", async () => {
        vi.mocked(readdir).mockResolvedValue([
            { name: "scripts", isDirectory: () => true },
            { name: "src", isDirectory: () => true },
        ] as any);
        const shellScript: IScript = {
            name: "build",
            path: "/workspace/scripts/build.sh",
            type: "shell",
            source: "local directory",
            confidence: 0.8,
            command: "bash build.sh",
        };
        const rustScript: IScript = {
            name: "release",
            path: "/workspace/scripts/release.rs",
            type: "rust",
            source: "local directory",
            confidence: 0.8,
            command: "cargo release.rs",
        };
        const shellIntegration = {
            getScripts: vi.fn().mockResolvedValue([shellScript]),
        } as unknown as IIntegration;
        const rustIntegration = {
            getScripts: vi.fn().mockResolvedValue([rustScript]),
        } as unknown as IIntegration;

        const scripts = await new ScriptSearchIntegration(
            shellIntegration,
            rustIntegration
        ).getScripts("/workspace");

        expect(scripts).toEqual([shellScript, rustScript]);
        expect(shellIntegration.getScripts).toHaveBeenCalledWith(join("/workspace", "scripts"));
        expect(rustIntegration.getScripts).toHaveBeenCalledWith(join("/workspace", "scripts"));
    });
});
