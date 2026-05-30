/**
 * Calculates the Levenshtein distance between two strings.
 *
 * @param a - The first string.
 * @param b - The second string.
 * @returns The Levenshtein distance.
 */
export function getLevenshteinDistance(a: string, b: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= b.length; i++) {
        matrix[i] = [i];
    }

    for (let j = 0; j <= a.length; j++) {
        matrix[0][j] = j;
    }

    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1, // substitution
                    matrix[i][j - 1] + 1, // insertion
                    matrix[i - 1][j] + 1 // deletion
                );
            }
        }
    }

    return matrix[b.length][a.length];
}

/**
 * Finds the closest match for a string from a list of possibilities.
 *
 * @param target - The target string.
 * @param possibilities - The list of possible strings.
 * @param threshold - The maximum distance to consider a match (default: 2).
 * @returns The closest match or undefined if none are within the threshold.
 */
export function findClosestMatch(
    target: string,
    possibilities: string[],
    threshold: number = 2
): string | undefined {
    let closest: string | undefined;
    let minDistance = Infinity;

    for (const possibility of possibilities) {
        const distance = getLevenshteinDistance(target, possibility);
        if (distance < minDistance && distance <= threshold) {
            minDistance = distance;
            closest = possibility;
        }
    }

    return closest;
}
