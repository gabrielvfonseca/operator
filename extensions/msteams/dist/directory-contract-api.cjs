Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
require("./rolldown-runtime-u92d-OFm.cjs");
const require_directory_runtime = require("./directory-runtime-B2H6ilHa.cjs");
const require_graph_users = require("./graph-users-Ct1vN_FN.cjs");
const require_resolve_allowlist = require("./resolve-allowlist-GKDaqKPK.cjs");
const msteamsDirectoryContractPlugin = {
	id: "msteams",
	directory: {
		self: async ({ cfg }) => {
			const creds = require_graph_users.resolveMSTeamsCredentials(cfg.channels?.msteams);
			return creds ? {
				kind: "user",
				id: creds.appId,
				name: creds.appId
			} : null;
		},
		listPeers: async ({ cfg, query, limit }) => require_directory_runtime.listDirectoryEntriesFromSources({
			kind: "user",
			sources: [cfg.channels?.msteams?.allowFrom ?? [], Object.keys(cfg.channels?.msteams?.dms ?? {})],
			query,
			limit,
			normalizeId: (raw) => {
				const normalized = require_resolve_allowlist.normalizeMSTeamsMessagingTarget(raw) ?? raw;
				const lowered = normalized.toLowerCase();
				return lowered.startsWith("user:") || lowered.startsWith("conversation:") ? normalized : `user:${normalized}`;
			}
		}),
		listGroups: async ({ cfg, query, limit }) => require_directory_runtime.listDirectoryEntriesFromSources({
			kind: "group",
			sources: [Object.values(cfg.channels?.msteams?.teams ?? {}).flatMap((team) => Object.keys(team.channels ?? {}))],
			query,
			limit,
			normalizeId: (raw) => `conversation:${raw.replace(/^conversation:/i, "").trim()}`
		})
	}
};
//#endregion
exports.msteamsDirectoryContractPlugin = msteamsDirectoryContractPlugin;
