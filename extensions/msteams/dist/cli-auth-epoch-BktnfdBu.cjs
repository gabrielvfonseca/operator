const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_executable_path = require("./executable-path-BHxqQqcc.cjs");
const require_cli_backends = require("./cli-backends-CxeCBxgS.cjs");
const require_windows_spawn = require("./windows-spawn-CxukckE5.cjs");
const require_external_auth = require("./external-auth-CPpcflX7.cjs");
const require_store = require("./store-BgTrp0qP.cjs");
const require_execution_auth_binding = require("./execution-auth-binding-DbwshiTD.cjs");
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let node_fs_promises = require("node:fs/promises");
node_fs_promises = require_rolldown_runtime.__toESM(node_fs_promises, 1);
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
let node_crypto = require("node:crypto");
node_crypto = require_rolldown_runtime.__toESM(node_crypto, 1);
//#region src/agents/cli-executable-identity.ts
const MAX_PACKAGE_ARTIFACT_FILES = 8192;
const MAX_PACKAGE_ARTIFACT_ENTRIES = MAX_PACKAGE_ARTIFACT_FILES * 4;
const MAX_PACKAGE_ARTIFACT_BYTES = 1024n * 1024n * 1024n;
function sameOpenedFile(left, right) {
	return left.dev === right.dev && left.ino === right.ino && left.mode === right.mode && left.size === right.size && left.mtimeNs === right.mtimeNs && left.ctimeNs === right.ctimeNs;
}
function compareArtifactEntryNames(left, right) {
	return left < right ? -1 : left > right ? 1 : 0;
}
async function readExecutableFileIdentity(filePath) {
	let canonicalPath;
	try {
		canonicalPath = await node_fs_promises.default.realpath(filePath);
	} catch {
		return null;
	}
	let handle;
	try {
		handle = await node_fs_promises.default.open(canonicalPath, "r");
		const before = await handle.stat({ bigint: true });
		if (!before.isFile()) return null;
		const hash = node_crypto.default.createHash("sha256");
		const buffer = Buffer.allocUnsafe(64 * 1024);
		const prefixChunks = [];
		let prefixBytes = 0;
		let position = 0;
		for (;;) {
			const { bytesRead } = await handle.read(buffer, 0, buffer.length, position);
			if (bytesRead === 0) break;
			const chunk = buffer.subarray(0, bytesRead);
			hash.update(chunk);
			if (prefixBytes < 4096) {
				const prefixChunk = Buffer.from(chunk.subarray(0, 4096 - prefixBytes));
				prefixChunks.push(prefixChunk);
				prefixBytes += prefixChunk.length;
			}
			position += bytesRead;
		}
		const after = await handle.stat({ bigint: true });
		const current = await node_fs_promises.default.stat(canonicalPath, { bigint: true });
		if (!sameOpenedFile(before, after) || !sameOpenedFile(after, current)) return null;
		return {
			identity: {
				path: canonicalPath,
				device: String(after.dev),
				inode: String(after.ino),
				mode: String(after.mode),
				size: String(after.size),
				modifiedNs: String(after.mtimeNs),
				changedNs: String(after.ctimeNs),
				contentSha256: hash.digest("hex")
			},
			prefix: Buffer.concat(prefixChunks, prefixBytes)
		};
	} catch {
		return null;
	} finally {
		await handle?.close().catch(() => {});
	}
}
function hasPathSeparator(value) {
	return value.includes("/") || value.includes("\\");
}
function isDurableRootedCommand(value) {
	return node_path.default.isAbsolute(value) || /^~[\\/]/u.test(value);
}
function pathEntriesAreAbsolute(env) {
	const pathValue = env.PATH ?? env.Path ?? "";
	const delimiter = process.platform === "win32" ? ";" : node_path.default.delimiter;
	return pathValue.split(delimiter).filter(Boolean).every((entry) => node_path.default.isAbsolute(entry));
}
function resolveCommandPath(params) {
	if (!hasPathSeparator(params.command) && !pathEntriesAreAbsolute(params.env)) return;
	if (hasPathSeparator(params.command) && !isDurableRootedCommand(params.command)) return;
	return require_executable_path.resolveExecutablePath(params.command, {
		...params.cwd ? { cwd: params.cwd } : {},
		env: params.env
	});
}
function hasShebang(prefix) {
	return prefix.subarray(0, 2).toString("utf8") === "#!";
}
function parseShebangInterpreter(prefix) {
	const firstLine = prefix.toString("utf8").split(/\r?\n/u, 1)[0] ?? "";
	if (!firstLine.startsWith("#!")) return null;
	const tokens = firstLine.slice(2).trim().split(/\s+/u).filter(Boolean);
	const executable = tokens[0];
	if (!executable) return null;
	if (node_path.default.basename(executable) !== "env") return {
		executable,
		args: tokens.slice(1)
	};
	const envArgs = tokens.slice(1);
	const commandStart = envArgs[0] === "-S" ? 1 : 0;
	const viaEnv = envArgs[commandStart];
	if (!viaEnv || viaEnv.startsWith("-")) return null;
	return {
		executable,
		viaEnv,
		args: envArgs.slice(commandStart + 1)
	};
}
async function findOwnedPackageRoot(params) {
	let directory = node_path.default.dirname(params.entrypointPath);
	for (;;) {
		const packageJsonPath = node_path.default.join(directory, "package.json");
		try {
			if (JSON.parse(await node_fs_promises.default.readFile(packageJsonPath, "utf8")).name === params.policy.packageName) return await node_fs_promises.default.realpath(directory);
		} catch {}
		const parent = node_path.default.dirname(directory);
		if (parent === directory) return;
		directory = parent;
	}
}
async function resolvePackageTreeArtifact(params) {
	if (params.policy?.kind !== "bundled-package-tree") return;
	const rootPath = await findOwnedPackageRoot({
		entrypointPath: params.entrypointPath,
		policy: params.policy
	});
	if (!rootPath) return;
	try {
		const packageJson = JSON.parse(await node_fs_promises.default.readFile(node_path.default.join(rootPath, "package.json"), "utf8"));
		if ([packageJson.dependencies, packageJson.peerDependencies].some((dependencies) => dependencies !== void 0 && (dependencies === null || typeof dependencies !== "object" || Array.isArray(dependencies) || Object.keys(dependencies).length > 0))) return;
	} catch {
		return;
	}
	const hash = node_crypto.default.createHash("sha256");
	let entryCount = 0;
	let fileCount = 0;
	let totalBytes = 0n;
	const visit = async (directory) => {
		let entries;
		try {
			entries = await node_fs_promises.default.readdir(directory, {
				withFileTypes: true,
				encoding: "utf8"
			});
		} catch {
			return false;
		}
		for (const entry of entries.toSorted((left, right) => compareArtifactEntryNames(left.name, right.name))) {
			entryCount += 1;
			if (entryCount > MAX_PACKAGE_ARTIFACT_ENTRIES) return false;
			const entryPath = node_path.default.join(directory, entry.name);
			if (entry.isDirectory()) {
				if (!await visit(entryPath)) return false;
				continue;
			}
			if (!entry.isFile()) return false;
			let size;
			try {
				const stat = await node_fs_promises.default.stat(entryPath, { bigint: true });
				if (!stat.isFile()) return false;
				size = stat.size;
			} catch {
				return false;
			}
			if (fileCount + 1 > MAX_PACKAGE_ARTIFACT_FILES || totalBytes + size > MAX_PACKAGE_ARTIFACT_BYTES) return false;
			const file = await readExecutableFileIdentity(entryPath);
			if (!file) return false;
			fileCount += 1;
			totalBytes += BigInt(file.identity.size);
			if (fileCount > MAX_PACKAGE_ARTIFACT_FILES || totalBytes > MAX_PACKAGE_ARTIFACT_BYTES) return false;
			hash.update(JSON.stringify([
				node_path.default.relative(rootPath, file.identity.path).split(node_path.default.sep).join("/"),
				file.identity.mode,
				file.identity.size,
				file.identity.contentSha256
			]));
			hash.update("\n");
		}
		return true;
	};
	if (!await visit(rootPath) || fileCount === 0) return;
	return {
		kind: "package-tree",
		packageName: params.policy.packageName,
		rootPath,
		fileCount,
		totalBytes: String(totalBytes),
		treeSha256: hash.digest("hex")
	};
}
function allowsSelfContainedExecutable(filePath, resolvedCommandPath, policy) {
	if (!policy) return false;
	const basenames = new Set([filePath, resolvedCommandPath].map((candidate) => {
		const basename = node_path.default.basename(candidate);
		return process.platform === "win32" ? basename.toLowerCase() : basename;
	}));
	return policy.nativeExecutableNames?.some((name) => basenames.has(process.platform === "win32" ? name.toLowerCase() : name)) === true;
}
async function resolvePosixIdentity(params) {
	const commandFile = await readExecutableFileIdentity(params.resolvedPath);
	if (!commandFile) return;
	const files = [commandFile.identity];
	const commandHasShebang = hasShebang(commandFile.prefix);
	const shebang = parseShebangInterpreter(commandFile.prefix);
	if (commandHasShebang && !shebang) return;
	if (shebang && shebang.args.length > 0) return;
	const packageEntrypoint = shebang ? commandFile.identity : void 0;
	const runtimeArtifact = packageEntrypoint ? await resolvePackageTreeArtifact({
		entrypointPath: packageEntrypoint.path,
		policy: params.runtimeArtifact
	}) : allowsSelfContainedExecutable(commandFile.identity.path, params.resolvedPath, params.runtimeArtifact) ? { kind: "self-contained-executable" } : void 0;
	if (!runtimeArtifact) return;
	if (shebang) {
		const interpreterPath = resolveCommandPath({
			command: shebang.executable,
			cwd: params.cwd,
			env: params.env
		});
		if (!interpreterPath) return;
		const interpreter = await readExecutableFileIdentity(interpreterPath);
		if (!interpreter || hasShebang(interpreter.prefix)) return;
		files.push(interpreter.identity);
		let invocationInterpreter = interpreter.identity.path;
		if (shebang.viaEnv) {
			const targetPath = resolveCommandPath({
				command: shebang.viaEnv,
				cwd: params.cwd,
				env: params.env
			});
			if (!targetPath) return;
			const target = await readExecutableFileIdentity(targetPath);
			if (!target || hasShebang(target.prefix)) return;
			files.push(target.identity);
			invocationInterpreter = target.identity.path;
		}
		return {
			command: params.command,
			resolvedPath: commandFile.identity.path,
			invocation: {
				command: invocationInterpreter,
				leadingArgv: [...shebang.args, commandFile.identity.path],
				resolution: "direct"
			},
			files: dedupeFileIdentities(files),
			runtimeArtifact
		};
	}
	const resolvedPath = commandFile.identity.path;
	return {
		command: params.command,
		resolvedPath,
		invocation: {
			command: resolvedPath,
			leadingArgv: [],
			resolution: "direct"
		},
		files: dedupeFileIdentities(files),
		runtimeArtifact
	};
}
function dedupeFileIdentities(files) {
	return files.filter((file, index) => files.findIndex((candidate) => candidate.path === file.path) === index);
}
async function resolveWindowsIdentity(params) {
	const nodePath = require_windows_spawn.resolveWindowsExecutablePath("node", params.env);
	const candidate = require_windows_spawn.resolveWindowsSpawnProgramCandidate({
		command: params.resolvedPath,
		env: params.env,
		execPath: nodePath
	});
	if (candidate.resolution === "unresolved-wrapper") return;
	if (candidate.resolution === "node-entrypoint" && node_path.default.extname(candidate.command).toLowerCase() !== ".exe") return;
	const configuredFile = await readExecutableFileIdentity(params.resolvedPath);
	const invocationFile = await readExecutableFileIdentity(candidate.command);
	if (!configuredFile || !invocationFile) return;
	const files = [configuredFile.identity, invocationFile.identity];
	const leadingArgv = [];
	for (const entry of candidate.leadingArgv) {
		const entryFile = await readExecutableFileIdentity(entry);
		if (!entryFile) return;
		files.push(entryFile.identity);
		leadingArgv.push(entryFile.identity.path);
	}
	const commandEntrypoint = candidate.resolution === "node-entrypoint" ? files.find((file) => file.path === leadingArgv[0]) : void 0;
	if (candidate.resolution === "direct" && hasShebang(invocationFile.prefix)) return;
	const scriptEntrypoint = commandEntrypoint;
	const runtimeArtifact = scriptEntrypoint ? await resolvePackageTreeArtifact({
		entrypointPath: scriptEntrypoint.path,
		policy: params.runtimeArtifact
	}) : allowsSelfContainedExecutable(invocationFile.identity.path, params.resolvedPath, params.runtimeArtifact) ? { kind: "self-contained-executable" } : void 0;
	if (!runtimeArtifact) return;
	return {
		command: params.command,
		resolvedPath: configuredFile.identity.path,
		invocation: {
			command: invocationFile.identity.path,
			leadingArgv,
			resolution: candidate.resolution
		},
		files: dedupeFileIdentities(files),
		runtimeArtifact
	};
}
/**
* Resolve and fingerprint the exact program a CLI child will execute.
*
* Call only while minting or revalidating verified setup authority: content
* hashing is deliberate and must not enter the normal CLI request hot path.
*/
async function resolveCliExecutableIdentity(params) {
	const command = params.command.trim();
	if (!command) return;
	const env = params.env ?? process.env;
	const resolvedPath = resolveCommandPath({
		command,
		...params.cwd ? { cwd: params.cwd } : {},
		env
	});
	if (!resolvedPath) return;
	return process.platform === "win32" ? await resolveWindowsIdentity({
		command,
		resolvedPath,
		env,
		...params.runtimeArtifact ? { runtimeArtifact: params.runtimeArtifact } : {}
	}) : await resolvePosixIdentity({
		command,
		resolvedPath,
		...params.cwd ? { cwd: params.cwd } : {},
		env,
		...params.runtimeArtifact ? { runtimeArtifact: params.runtimeArtifact } : {}
	});
}
//#endregion
//#region src/agents/cli-auth-epoch.ts
/**
* Builds auth-state epochs for CLI-backed runtimes so reusable sessions reset
* when the owning local credential identity changes.
*/
const defaultCliAuthEpochDeps = {
	readClaudeCliCredentialsCached: require_external_auth.readClaudeCliCredentialsCached,
	readCodexCliCredentialsCached: require_external_auth.readCodexCliCredentialsCached,
	readGeminiCliCredentialsCached: require_external_auth.readGeminiCliCredentialsCached,
	ensureAuthProfileStore: require_store.ensureAuthProfileStore,
	loadAuthProfileStoreForRuntime: require_store.loadAuthProfileStoreForRuntime
};
const cliAuthEpochDeps = { ...defaultCliAuthEpochDeps };
const GEMINI_CLI_PROVIDER_ID = "google-gemini-cli";
/** Overrides credential readers for auth-epoch unit tests. */
function setCliAuthEpochTestDeps(overrides) {
	Object.assign(cliAuthEpochDeps, overrides);
}
/** Restores default credential readers after auth-epoch unit tests. */
function resetCliAuthEpochTestDeps() {
	Object.assign(cliAuthEpochDeps, defaultCliAuthEpochDeps);
}
if (process.env.VITEST || false) globalThis[Symbol.for("operator.cliAuthEpochTestApi")] = {
	setCliAuthEpochTestDeps,
	resetCliAuthEpochTestDeps
};
function hashCliAuthEpochPart(value) {
	return node_crypto.default.createHash("sha256").update(value).digest("hex");
}
function encodeUnknown(value) {
	return JSON.stringify(value ?? null);
}
function encodeOAuthIdentity(credential) {
	return JSON.stringify([
		"oauth",
		credential.provider,
		credential.clientId ?? null,
		credential.email ?? null,
		credential.enterpriseUrl ?? null,
		credential.projectId ?? null,
		credential.accountId ?? null
	]);
}
function encodeClaudeCredential(credential) {
	return encodeOAuthIdentity({
		type: "oauth",
		provider: credential.provider
	});
}
function encodeCodexCredential(credential) {
	return encodeOAuthIdentity(credential);
}
function encodeGeminiCredential(credential) {
	return encodeOAuthIdentity(credential);
}
function encodeAuthProfileCredential(credential) {
	switch (credential.type) {
		case "api_key": return JSON.stringify([
			"api_key",
			credential.provider,
			credential.key ?? null,
			encodeUnknown(credential.keyRef),
			credential.email ?? null,
			credential.displayName ?? null,
			encodeUnknown(credential.metadata)
		]);
		case "token":
			if (credential.tokenRef !== void 0) return JSON.stringify([
				"token-identity",
				credential.provider,
				encodeUnknown(credential.tokenRef),
				credential.email ?? null,
				credential.displayName ?? null
			]);
			return JSON.stringify([
				"token",
				credential.provider,
				credential.token ?? null,
				encodeUnknown(credential.tokenRef),
				credential.email ?? null,
				credential.displayName ?? null
			]);
		case "oauth": return encodeOAuthIdentity(credential);
	}
	throw new Error("Unsupported auth profile credential type");
}
function hasOAuthAccountIdentity(credential) {
	return credential.type === "oauth" && ((0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(credential.accountId) !== void 0 || (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(credential.email) !== void 0);
}
function encodeAuthProfileEpochPart(authProfileId, credential) {
	const credentialHash = hashCliAuthEpochPart(encodeAuthProfileCredential(credential));
	if (hasOAuthAccountIdentity(credential) && credential.provider !== GEMINI_CLI_PROVIDER_ID) return `profile:oauth-identity:${credentialHash}`;
	return `profile:${authProfileId}:${credentialHash}`;
}
function getLocalCliCredentialFingerprint(provider) {
	switch (provider) {
		case "claude-cli": {
			const credential = cliAuthEpochDeps.readClaudeCliCredentialsCached({
				ttlMs: 5e3,
				allowKeychainPrompt: false
			});
			return credential ? hashCliAuthEpochPart(encodeClaudeCredential(credential)) : void 0;
		}
		case "codex-cli": {
			const credential = cliAuthEpochDeps.readCodexCliCredentialsCached({
				ttlMs: 5e3,
				allowKeychainPrompt: false
			});
			return credential ? hashCliAuthEpochPart(encodeCodexCredential(credential)) : void 0;
		}
		case "google-gemini-cli": {
			const credential = cliAuthEpochDeps.readGeminiCliCredentialsCached({ ttlMs: 5e3 });
			return credential ? hashCliAuthEpochPart(encodeGeminiCredential(credential)) : void 0;
		}
		default: return;
	}
}
function getLocalCliCredential(provider) {
	switch (provider) {
		case "claude-cli": return cliAuthEpochDeps.readClaudeCliCredentialsCached({
			ttlMs: 0,
			allowKeychainPrompt: false
		}) ?? void 0;
		case "codex-cli": return cliAuthEpochDeps.readCodexCliCredentialsCached({
			ttlMs: 0,
			allowKeychainPrompt: false
		}) ?? void 0;
		case "google-gemini-cli": return cliAuthEpochDeps.readGeminiCliCredentialsCached({ ttlMs: 0 }) ?? void 0;
		default: return;
	}
}
function getAuthProfileCredential(store, authProfileId) {
	if (!authProfileId) return;
	return store.profiles[authProfileId];
}
/** Resolves the stable auth epoch hash for a CLI runtime/provider session. */
async function resolveCliAuthEpoch(params) {
	const provider = params.provider.trim();
	const authProfileId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.authProfileId);
	const parts = [];
	if (params.skipLocalCredential !== true) {
		const localFingerprint = getLocalCliCredentialFingerprint(provider);
		if (localFingerprint) parts.push(`local:${provider}:${localFingerprint}`);
	}
	if (authProfileId) {
		const credential = getAuthProfileCredential(cliAuthEpochDeps.loadAuthProfileStoreForRuntime(params.agentDir, {
			readOnly: true,
			allowKeychainPrompt: false
		}), authProfileId);
		if (credential) parts.push(encodeAuthProfileEpochPart(authProfileId, credential));
	}
	if (parts.length === 0) return;
	return hashCliAuthEpochPart(parts.join("\n"));
}
/**
* Strict credential-owner proof for a verified inference turn. Unlike the
* reusable-session epoch, identity-less OAuth tokens intentionally invalidate
* on rotation because accepting an unknown replacement could cross accounts.
*/
function resolveCliAuthBindingFingerprint(params) {
	const provider = params.provider.trim();
	const authProfileId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.authProfileId);
	const parts = [];
	const localCredential = params.skipLocalCredential ? void 0 : getLocalCliCredential(provider);
	if (localCredential) {
		const fingerprint = require_execution_auth_binding.fingerprintAuthProfileCredential({
			profileId: `local:${provider}`,
			credential: localCredential
		});
		if (!fingerprint) return;
		parts.push(`local:${fingerprint}`);
	}
	if (authProfileId) {
		const storedCredential = cliAuthEpochDeps.ensureAuthProfileStore(params.agentDir, {
			config: params.config,
			readOnly: true,
			allowKeychainPrompt: false,
			externalCliProviderIds: [provider]
		}).profiles[authProfileId];
		if (!storedCredential) return;
		const fingerprint = require_execution_auth_binding.fingerprintResolvedAuthProfileCredential({
			profileId: authProfileId,
			credential: storedCredential,
			resolvedAuth: params.resolvedAuth
		});
		if (!fingerprint) return;
		parts.push(`profile:${fingerprint}`);
	}
	return parts.length > 0 ? hashCliAuthEpochPart(JSON.stringify([
		"strict-execution-v1",
		provider,
		parts
	])) : void 0;
}
/** Hash the exact executable plus backend-owned package implementation tree. */
function fingerprintCliRuntimeArtifact(params) {
	return hashCliAuthEpochPart(JSON.stringify([
		"cli-runtime-artifact-v1",
		params.provider.trim(),
		params.backendId,
		params.executableIdentity
	]));
}
/** Re-resolve a CLI backend's complete executable/package artifact boundary. */
async function resolveCliRuntimeArtifactFingerprint(params) {
	const provider = params.provider.trim();
	const backend = require_cli_backends.resolveCliBackendConfig(provider, params.config, params.agentId ? { agentId: params.agentId } : {});
	if (!backend) return;
	if (params.runtimeArtifactId && backend.id !== params.runtimeArtifactId) return;
	if (params.executableIdentity && params.executableIdentity.command !== backend.config.command) return;
	const executableIdentity = params.executableIdentity ?? await resolveCliExecutableIdentity({
		command: backend.config.command,
		...params.cwd ? { cwd: params.cwd } : {},
		...params.env ? { env: params.env } : {},
		...backend.runtimeArtifact ? { runtimeArtifact: backend.runtimeArtifact } : {}
	});
	if (!executableIdentity) return;
	return fingerprintCliRuntimeArtifact({
		provider,
		backendId: backend.id,
		executableIdentity
	});
}
/**
* Resolve a CLI runtime's non-secret owner shape. The trusted runner emits
* this projection only after a real successful turn; callers must not treat
* this pre-run value as proof by itself.
*/
async function resolveCliRuntimeOwnerFingerprint(params) {
	const provider = params.provider.trim();
	const authProfileId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.authProfileId);
	const backend = require_cli_backends.resolveCliBackendConfig(provider, params.config, params.agentId ? { agentId: params.agentId } : {});
	if (!backend || params.runtimeOwnerId && backend.id !== params.runtimeOwnerId) return;
	const runtimeArtifactFingerprint = params.runtimeArtifactFingerprint ?? await resolveCliRuntimeArtifactFingerprint({
		provider,
		config: params.config,
		...params.agentId ? { agentId: params.agentId } : {},
		runtimeArtifactId: backend.id,
		...params.cwd ? { cwd: params.cwd } : {},
		...params.env ? { env: params.env } : {},
		...params.executableIdentity ? { executableIdentity: params.executableIdentity } : {}
	});
	if (!runtimeArtifactFingerprint) return;
	let authProfileOwnerFingerprint;
	if (authProfileId) {
		authProfileOwnerFingerprint = require_execution_auth_binding.fingerprintAuthProfileOwnerShape({
			profileId: authProfileId,
			credential: cliAuthEpochDeps.ensureAuthProfileStore(params.agentDir, {
				config: params.config,
				readOnly: true,
				allowKeychainPrompt: false,
				externalCliProviderIds: [provider]
			}).profiles[authProfileId]
		});
		if (!authProfileOwnerFingerprint) return;
	}
	return require_execution_auth_binding.fingerprintOpaqueRuntimeOwner({
		kind: "cli-runtime",
		runner: "cli",
		provider,
		backendId: backend.id,
		backendConfig: {
			config: backend.config,
			bundleMcp: backend.bundleMcp,
			bundleMcpMode: backend.bundleMcpMode,
			authEpochMode: backend.authEpochMode,
			nativeToolMode: backend.nativeToolMode,
			sideQuestionToolMode: backend.sideQuestionToolMode
		},
		...authProfileId ? { authProfileId } : {},
		...authProfileOwnerFingerprint ? { authProfileOwnerFingerprint } : {},
		...params.skipLocalCredential ? { skipLocalCredential: true } : {},
		runtimeArtifactFingerprint
	});
}
//#endregion
Object.defineProperty(exports, "fingerprintCliRuntimeArtifact", {
	enumerable: true,
	get: function() {
		return fingerprintCliRuntimeArtifact;
	}
});
Object.defineProperty(exports, "resolveCliAuthBindingFingerprint", {
	enumerable: true,
	get: function() {
		return resolveCliAuthBindingFingerprint;
	}
});
Object.defineProperty(exports, "resolveCliAuthEpoch", {
	enumerable: true,
	get: function() {
		return resolveCliAuthEpoch;
	}
});
Object.defineProperty(exports, "resolveCliExecutableIdentity", {
	enumerable: true,
	get: function() {
		return resolveCliExecutableIdentity;
	}
});
Object.defineProperty(exports, "resolveCliRuntimeArtifactFingerprint", {
	enumerable: true,
	get: function() {
		return resolveCliRuntimeArtifactFingerprint;
	}
});
Object.defineProperty(exports, "resolveCliRuntimeOwnerFingerprint", {
	enumerable: true,
	get: function() {
		return resolveCliRuntimeOwnerFingerprint;
	}
});
