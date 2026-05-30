import { describe, it, expect } from "vitest";
import { parseEnv } from "../../../../src/features/core/utils/envLoader";

describe("envLoader", () => {
    describe("parseEnv", () => {
        it("should parse simple KEY=VALUE pairs", () => {
            const content = "KEY1=VALUE1\nKEY2=VALUE2";
            const result = parseEnv(content);
            expect(result).toEqual({
                KEY1: "VALUE1",
                KEY2: "VALUE2",
            });
        });

        it("should ignore comments and empty lines", () => {
            const content = "# This is a comment\n\nKEY1=VALUE1\n  # Another comment\nKEY2=VALUE2";
            const result = parseEnv(content);
            expect(result).toEqual({
                KEY1: "VALUE1",
                KEY2: "VALUE2",
            });
        });

        it("should trim keys and values", () => {
            const content = "  KEY1  =  VALUE1  ";
            const result = parseEnv(content);
            expect(result).toEqual({
                KEY1: "VALUE1",
            });
        });

        it("should strip double quotes from values", () => {
            const content = 'KEY1="VALUE1"';
            const result = parseEnv(content);
            expect(result).toEqual({
                KEY1: "VALUE1",
            });
        });

        it("should strip single quotes from values", () => {
            const content = "KEY1='VALUE1'";
            const result = parseEnv(content);
            expect(result).toEqual({
                KEY1: "VALUE1",
            });
        });

        it("should handle values with equal signs", () => {
            const content = "KEY1=VALUE1=VALUE2";
            const result = parseEnv(content);
            expect(result).toEqual({
                KEY1: "VALUE1=VALUE2",
            });
        });

        it("should ignore lines without equal sign", () => {
            const content = "INVALID_LINE";
            const result = parseEnv(content);
            expect(result).toEqual({});
        });
    });
});
