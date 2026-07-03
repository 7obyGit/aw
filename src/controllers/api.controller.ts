import { initAction } from "../features/core/initAction.js";
import { envAction } from "../features/core/envAction.js";
import { listScriptsAction } from "../features/scripts/actions/listScriptsAction.js";
import { addScriptAction } from "../features/scripts/actions/addScriptAction.js";
import { removeScriptAction } from "../features/scripts/actions/removeScriptAction.js";
import { runScriptAction } from "../features/scripts/actions/runScriptAction.js";
import { listSourcesAction } from "../features/sources/actions/listSourcesAction.js";
import { addSourceAction } from "../features/sources/actions/addSourceAction.js";
import { removeSourceAction } from "../features/sources/actions/removeSourceAction.js";
import { execAction } from "../features/scripts/actions/execAction.js";
import { findScriptsAction } from "../features/scripts/actions/findScriptsAction.js";
import { recordAction } from "../features/scripts/actions/recordAction.js";
import { describeScriptAction } from "../features/scripts/actions/describeScriptAction.js";
import { completionAction } from "../features/core/completionAction.js";
import "../features/integrations/index.js";

export const aw = {
    /**
     * Initialize a new .aw directory.
     */
    init: initAction,

    /**
     * Show environment variables available to scripts.
     */
    env: envAction,

    /**
     * List scripts or sources.
     */
    list: async (type: "scripts" | "sources", options: { json?: boolean; all?: boolean } = {}) => {
        if (type === "scripts") await listScriptsAction(options);
        else if (type === "sources") await listSourcesAction(options);
    },

    /**
     * Add a source.
     */
    addSource: addSourceAction,

    /**
     * Add a script.
     */
    addScript: addScriptAction,

    /**
     * Remove a source.
     */
    removeSource: removeSourceAction,

    /**
     * Remove a script.
     */
    removeScript: removeScriptAction,

    /**
     * Run the specified script.
     */
    run: runScriptAction,

    /**
     * Show details of a script.
     */
    describe: describeScriptAction,

    /**
     * Find scripts by name, id or description.
     */
    find: findScriptsAction,

    /**
     * Run an arbitrary shell command.
     */
    exec: (command: string) => execAction(command),

    /**
     * Record a sequence of commands to a script.
     */
    record: recordAction,

    /**
     * Generate shell completion script.
     */
    completion: completionAction,
};
