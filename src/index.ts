#!/usr/bin/env node
import { fileURLToPath } from "url";
import { runCLI } from "./controllers/cli.controller.js";
import { aw } from "./controllers/api.controller.js";

export { aw };

/**
 * Detects if the current module is being run directly as a script.
 */
async function isMain(): Promise<boolean> {
    if (!process.argv[1]) {
        return false;
    }

    try {
        const { realpathSync } = await import("fs");
        const scriptPath = realpathSync(process.argv[1]);
        const modulePath = realpathSync(fileURLToPath(import.meta.url));
        return scriptPath === modulePath;
    } catch {
        // Fallback for environments where fs or realpathSync might fail
        return false;
    }
}

// If run directly, start the CLI controller
isMain().then((main) => {
    if (main) {
        runCLI().catch((error: Error) => {
            console.error(error.message);
            process.exit(1);
        });
    }
});
