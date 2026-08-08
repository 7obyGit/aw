import { describe, expect, it, vi } from "vitest";
import { readdir } from "node:fs/promises";
import { join } from "node:path";
import { RustScriptIntegration } from "../../../../../src/features/integrations/impl/rust/rustScriptIntegration";

vi.mock("node:fs/promises", () => ({
    readdir: vi.fn(),
}));

describe("RustScriptIntegration", () => {
    it("discovers standalone Rust scripts", async () => {
        vi.mocked(readdir).mockResolvedValue([
            { name: "release.rs", isFile: () => true },
            { name: "notes.md", isFile: () => true },
            { name: "ignored.rs", isFile: () => false },
        ] as any);

        const scripts = await new RustScriptIntegration().getScripts("/workspace/scripts");
        const scriptPath = join("/workspace/scripts", "release.rs");

        expect(scripts).toEqual([
            {
                name: "release",
                path: scriptPath,
                type: "rust",
                source: "local directory",
                confidence: 0.8,
                description: "(rust script) release.rs",
                command: `cargo +nightly -Zscript "${scriptPath}"`,
            },
        ]);
    });

    it("returns no scripts when the directory cannot be read", async () => {
        vi.mocked(readdir).mockRejectedValue(new Error("Read error"));

        const scripts = await new RustScriptIntegration().getScripts("/missing");

        expect(scripts).toEqual([]);
    });
});
