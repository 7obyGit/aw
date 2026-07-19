import { beforeEach, describe, expect, it, vi } from "vitest";
import { ShellScriptDetector } from "../../../../src/features/integrations/utils/shellScriptDetector";
import { readFile, stat } from "node:fs/promises";

vi.mock("node:fs/promises", () => ({
    readFile: vi.fn(),
    stat: vi.fn(),
}));

describe("ShellScriptDetector", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("detects supported shell interpreters from shebangs", async () => {
        vi.mocked(stat).mockResolvedValue({ isFile: () => true, size: 20 } as any);
        vi.mocked(readFile).mockResolvedValue("#!/usr/bin/env bash\necho hello\n" as any);

        await expect(ShellScriptDetector.getInterpreter("/test/build")).resolves.toBe("bash");
    });

    it("ignores non-shell shebangs", async () => {
        vi.mocked(stat).mockResolvedValue({ isFile: () => true, size: 20 } as any);
        vi.mocked(readFile).mockResolvedValue("#!/usr/bin/env python\n" as any);

        await expect(ShellScriptDetector.getInterpreter("/test/script")).resolves.toBeUndefined();
    });

    it("does not read files larger than the shebang inspection limit", async () => {
        vi.mocked(stat).mockResolvedValue({
            isFile: () => true,
            size: ShellScriptDetector.MAX_SHEBANG_FILE_SIZE + 1,
        } as any);

        await expect(
            ShellScriptDetector.getInterpreter("/test/large-file")
        ).resolves.toBeUndefined();
        expect(readFile).not.toHaveBeenCalled();
    });
});
