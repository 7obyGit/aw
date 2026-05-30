import { describe, it, expect } from "vitest";
import {
    getLevenshteinDistance,
    findClosestMatch,
} from "../../../../src/features/core/utils/stringUtils";

describe("stringUtils", () => {
    describe("getLevenshteinDistance", () => {
        it("should return 0 for identical strings", () => {
            expect(getLevenshteinDistance("test", "test")).toBe(0);
        });

        it("should return the length of the other string when one is empty", () => {
            expect(getLevenshteinDistance("", "test")).toBe(4);
            expect(getLevenshteinDistance("test", "")).toBe(4);
        });

        it("should calculate distance for substitutions", () => {
            expect(getLevenshteinDistance("kitten", "sitten")).toBe(1);
            expect(getLevenshteinDistance("abc", "adc")).toBe(1);
        });

        it("should calculate distance for insertions", () => {
            expect(getLevenshteinDistance("cat", "cats")).toBe(1);
            expect(getLevenshteinDistance("abc", "abdc")).toBe(1);
        });

        it("should calculate distance for deletions", () => {
            expect(getLevenshteinDistance("cats", "cat")).toBe(1);
            expect(getLevenshteinDistance("abdc", "abc")).toBe(1);
        });

        it("should calculate distance for complex changes", () => {
            expect(getLevenshteinDistance("kitten", "sitting")).toBe(3);
            expect(getLevenshteinDistance("sunday", "saturday")).toBe(3);
        });
    });

    describe("findClosestMatch", () => {
        const possibilities = ["build", "test", "lint", "format", "deploy"];

        it("should find an exact match", () => {
            expect(findClosestMatch("build", possibilities)).toBe("build");
        });

        it("should find a close match within the threshold", () => {
            expect(findClosestMatch("buld", possibilities)).toBe("build");
            expect(findClosestMatch("tst", possibilities)).toBe("test");
        });

        it("should return undefined if no match is within the threshold", () => {
            expect(findClosestMatch("deploying", possibilities, 2)).toBeUndefined();
        });

        it("should respect a custom threshold", () => {
            expect(findClosestMatch("deploying", possibilities, 4)).toBe("deploy");
        });

        it("should return undefined for empty possibilities", () => {
            expect(findClosestMatch("test", [])).toBeUndefined();
        });
    });
});
