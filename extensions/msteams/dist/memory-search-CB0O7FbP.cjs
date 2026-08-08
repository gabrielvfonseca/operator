const require_utils = require("./utils-CXqBhRFw.cjs");
//#region src/agents/memory-search.ts
function resolveMemorySearchConfig(cfg, _agentId) {
	const memorySearch = cfg.agents?.defaults?.memorySearch;
	const provider = memorySearch?.provider ?? "openai";
	const model = memorySearch?.model ?? "text-embedding-3-small";
	const chunking = memorySearch?.chunking ?? {
		tokens: 400,
		overlap: 80
	};
	const rawStore = memorySearch?.store ?? {
		driver: "qdrant",
		fts: { tokenizer: "unicode61" },
		vector: { enabled: true }
	};
	const driver = rawStore.driver === "sqlite" ? "qdrant" : rawStore.driver ?? "qdrant";
	const resolvedStore = {
		driver,
		qdrantUrl: driver === "qdrant" ? "http://localhost:6333" : void 0,
		postgresUrl: driver === "postgres" ? "postgres://localhost:5432/operator" : void 0,
		databasePath: rawStore.databasePath,
		fts: { tokenizer: rawStore.fts?.tokenizer ?? "unicode61" },
		vector: { enabled: rawStore.vector?.enabled ?? true }
	};
	return {
		enabled: true,
		sources: ["memory", "sessions"],
		extraPaths: Array.isArray(memorySearch?.extraPaths) ? memorySearch.extraPaths.map(String) : [],
		provider,
		remote: memorySearch?.remote,
		experimental: { sessionMemory: memorySearch?.experimental?.sessionMemory ?? false },
		fallback: memorySearch?.fallback ?? "none",
		model,
		inputType: memorySearch?.inputType,
		queryInputType: memorySearch?.queryInputType,
		documentInputType: memorySearch?.documentInputType,
		outputDimensionality: memorySearch?.outputDimensionality,
		local: {
			modelPath: memorySearch?.local?.modelPath,
			modelCacheDir: memorySearch?.local?.modelCacheDir,
			contextSize: memorySearch?.local?.contextSize
		},
		store: resolvedStore,
		chunking: {
			tokens: require_utils.clampInt(chunking.tokens ?? 400, 50, 4e3),
			overlap: require_utils.clampInt(chunking.overlap ?? 80, 0, 500)
		},
		sync: {
			onSessionStart: memorySearch?.sync?.onSessionStart ?? true,
			onSearch: memorySearch?.sync?.onSearch ?? true,
			watch: memorySearch?.sync?.watch ?? true,
			sessions: memorySearch?.sync?.sessions ?? {}
		},
		citationsMode: memorySearch?.citationsMode ?? "off"
	};
}
//#endregion
Object.defineProperty(exports, "resolveMemorySearchConfig", {
	enumerable: true,
	get: function() {
		return resolveMemorySearchConfig;
	}
});
