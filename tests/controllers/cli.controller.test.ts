import { describe, it, expect, vi, beforeEach, afterAll } from "vitest";
import { runCLI } from "../../src/controllers/cli.controller";
import { runScriptAction } from "../../src/features/scripts/actions/runScriptAction";
import { execAction } from "../../src/features/scripts/actions/execAction";

vi.mock("../../src/features/scripts/actions/runScriptAction", () => ({
    runScriptAction: vi.fn(),
}));

vi.mock("../../src/features/scripts/actions/execAction", () => ({
    execAction: vi.fn(),
}));

vi.mock("../../src/features/core/helpAction", () => ({
    displayHelp: vi.fn(),
    displayCommandHelp: vi.fn(),
    displayLandingPage: vi.fn(),
}));

// Mock other actions to avoid errors
vi.mock("../../src/features/core/initAction", () => ({ initAction: vi.fn() }));
vi.mock("../../src/features/core/envAction", () => ({ envAction: vi.fn() }));
vi.mock("../../src/features/scripts/actions/listScriptsAction", () => ({
    listScriptsAction: vi.fn(),
}));
vi.mock("../../src/features/sources/actions/listSourcesAction", () => ({
    listSourcesAction: vi.fn(),
}));

describe("cli.controller", () => {
    const originalArgv = process.argv;

    beforeEach(() => {
        vi.clearAllMocks();
        // Reset process.argv
        process.argv = [...originalArgv.slice(0, 2)];
    });

    afterAll(() => {
        process.argv = originalArgv;
    });

    it("should pass optional arguments to runScriptAction", async () => {
        process.argv = ["node", "aw", "run", "my-script", "arg1", "--opt2"];

        await runCLI();

        expect(runScriptAction).toHaveBeenCalledWith("my-script", ["arg1", "--opt2"]);
    });

    it("should pass optional arguments to execAction", async () => {
        process.argv = ["node", "aw", "exec", "ls", "-la", "--foo"];

        await runCLI();

        expect(execAction).toHaveBeenCalledWith("ls -la --foo");
    });

    it("should handle existing -- separator correctly", async () => {
        process.argv = ["node", "aw", "run", "my-script", "--", "arg1", "--opt2"];

        await runCLI();

        expect(runScriptAction).toHaveBeenCalledWith("my-script", ["arg1", "--opt2"]);
    });
});
