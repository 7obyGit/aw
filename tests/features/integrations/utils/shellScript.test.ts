import { beforeEach, describe, expect, it, vi } from "vitest";
import {
    getShellInterpreter,
    MAX_SHEBANG_FILE_SIZE,
} from "../../../../src/features/integrations/utils/shellScript";
import { readFile, stat } from "node:fs/promises";

vi.mock("node:fs/promises", () => ({
    readFile: vi.fn(),
    stat: vi.fn(),
}));

describe("getShellInterpreter", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("detects supported shell interpreters from shebangs", async () => {
        vi.mocked(stat).mockResolvedValue({ isFile: () => true, size: 20 } as any);
        vi.mocked(readFile).mockResolvedValue("#!/usr/bin/env bash\necho hello\n" as any);

        await expect(getShellInterpreter("/test/build")).resolves.toBe("bash");
    });

    it("ignores non-shell shebangs", async () => {
        vi.mocked(stat).mockResolvedValue({ isFile: () => true, size: 20 } as any);
        vi.mocked(readFile).mockResolvedValue("#!/usr/bin/env python\n" as any);

        await expect(getShellInterpreter("/test/script")).resolves.toBeUndefined();
    });

    it("does not read files larger than the shebang inspection limit", async () => {
        vi.mocked(stat).mockResolvedValue({
            isFile: () => true,
            size: MAX_SHEBANG_FILE_SIZE + 1,
        } as any);

        await expect(getShellInterpreter("/test/large-file")).resolves.toBeUndefined();
        expect(readFile).not.toHaveBeenCalled();
    });
});
