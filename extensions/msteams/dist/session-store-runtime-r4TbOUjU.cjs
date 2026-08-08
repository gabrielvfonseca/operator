const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
require("./replace-file-D77oDPOz.cjs");
require("./session-key-BQFkCTNx.cjs");
require("./main-session-x7hRR6eC.cjs");
require("./session-accessor-D_W4fZCX.cjs");
const require_paths = require("./paths-DsfW3Lup.cjs");
require("./store-DCwJguwr.cjs");
require("./targets-BCEDn-da.cjs");
require("./reset-DL3L8VC3.cjs");
require("./session-key-DBTOYACI.cjs");
require("./transcript-BHT2QzlI.cjs");
require("./send-policy-4PnHfY3z.cjs");
require("./ambient-transcript-watermark-C6YdVM7y.cjs");
let node_fs = require("node:fs");
node_fs = require_rolldown_runtime.__toESM(node_fs, 1);
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
//#region src/plugin-sdk/session-store-runtime.ts
const legacyStoreAgentIds = /* @__PURE__ */ new Map();
/**
* Resolves the configured session store path.
*
* Beta.5 resolves a configured path with an agent id, then passes only the
* path to loadSessionStore/updateSessionStore. Its shipped callers either
* consume the selection synchronously or dedupe by path, so retaining the
* latest selection preserves that bounded compatibility contract.
*/
function resolveStorePath(store, options) {
	const storePath = require_paths.resolveStorePath(store, options);
	if (options?.agentId) legacyStoreAgentIds.set(node_path.default.resolve(storePath), options.agentId);
	return storePath;
}
//#endregion
Object.defineProperty(exports, "resolveStorePath", {
	enumerable: true,
	get: function() {
		return resolveStorePath;
	}
});
