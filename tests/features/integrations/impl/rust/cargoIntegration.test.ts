import { beforeEach, describe, expect, it, vi } from "vitest";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { CargoIntegration } from "../../../../../src/features/integrations/impl/rust/cargoIntegration";
import * as fs from "node:fs";

vi.mock("node:fs", () => ({
    existsSync: vi.fn(),
}));

vi.mock("node:fs/promises", () => ({
    readFile: vi.fn(),
}));

describe("CargoIntegration", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(readFile).mockRejectedValue(new Error("File not found"));
    });

    it("discovers build and run commands from a parent Cargo project", async () => {
        vi.mocked(fs.existsSync).mockImplementation(
            (path) => String(path) === join("/workspace", "Cargo.toml")
        );

        const scripts = await new CargoIntegration().getScripts("/workspace/crates/app");

        expect(scripts).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    name: "cargo-build",
                    path: join("/workspace", "Cargo.toml"),
                    command: "cargo build",
                }),
                expect.objectContaining({
                    name: "cargo-run",
                    path: join("/workspace", "Cargo.toml"),
                    command: "cargo run",
                }),
            ])
        );
    });

    it("discovers string and array aliases from Cargo config", async () => {
        vi.mocked(fs.existsSync).mockImplementation(
            (path) => String(path) === join("/workspace", "Cargo.toml")
        );
        vi.mocked(readFile).mockImplementation(async (path) => {
            if (String(path) === join("/workspace", ".cargo", "config.toml")) {
                return `
[alias]
dev = "run --features dev"
ci = ["test", "--workspace"]
"docs-all" = "doc --workspace"
"unsafe;command" = "build"

[build]
jobs = 2
`;
            }
            throw new Error("File not found");
        });

        const scripts = await new CargoIntegration().getScripts("/workspace");

        expect(scripts).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    name: "cargo-dev",
                    source: join(".cargo", "config.toml"),
                    description: '(cargo alias) "run --features dev"',
                    command: "cargo dev",
                }),
                expect.objectContaining({
                    name: "cargo-ci",
                    description: '(cargo alias) ["test", "--workspace"]',
                    command: "cargo ci",
                }),
                expect.objectContaining({
                    name: "cargo-docs-all",
                    command: "cargo docs-all",
                }),
            ])
        );
        expect(scripts.find((script) => script.name === "cargo-unsafe;command")).toBeUndefined();
    });

    it("uses the closest alias and prefers legacy config when both names exist", async () => {
        vi.mocked(fs.existsSync).mockImplementation(
            (path) => String(path) === join("/workspace", "Cargo.toml")
        );
        vi.mocked(readFile).mockImplementation(async (path) => {
            const filePath: string = String(path);
            if (filePath === join("/workspace", "app", ".cargo", "config")) {
                return '[alias]\nverify = "test --package app"\n';
            }
            if (filePath === join("/workspace", "app", ".cargo", "config.toml")) {
                return '[alias]\nignored = "check"\n';
            }
            if (filePath === join("/workspace", ".cargo", "config.toml")) {
                return '[alias]\nverify = "test --workspace"\nrelease = "build --release"\n';
            }
            throw new Error("File not found");
        });

        const scripts = await new CargoIntegration().getScripts("/workspace/app");

        expect(scripts.filter((script) => script.name === "cargo-verify")).toEqual([
            expect.objectContaining({
                path: join("/workspace", "app", ".cargo", "config"),
                description: '(cargo alias) "test --package app"',
            }),
        ]);
        expect(scripts.find((script) => script.name === "cargo-release")).toBeDefined();
        expect(scripts.find((script) => script.name === "cargo-ignored")).toBeUndefined();
    });

    it("returns no commands outside a Cargo project", async () => {
        vi.mocked(fs.existsSync).mockReturnValue(false);

        const scripts = await new CargoIntegration().getScripts("/workspace");

        expect(scripts).toEqual([]);
        expect(readFile).not.toHaveBeenCalled();
    });
});
