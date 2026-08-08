const require_redact = require("./redact-Bg-yc44I.cjs");
const require_model_auth_markers = require("./model-auth-markers-CW9eHIop.cjs");
const require_provider_request_config = require("./provider-request-config-BmGl8zwP.cjs");
let node_crypto = require("node:crypto");
//#region src/secrets/sentinel.ts
const SECRET_SENTINEL_PREFIX = "oc-sent-v2.";
const SECRET_SENTINEL_SUFFIX = ".end";
const SECRET_SENTINEL_SOURCE = "oc-sent-v2\\.[A-Za-z0-9_-]+\\.end";
const SECRET_SENTINEL_CIPHER = "aes-256-gcm";
const SECRET_SENTINEL_NONCE_BYTES = 12;
const SECRET_SENTINEL_SCOPE_BYTES = 8;
const SECRET_SENTINEL_HEADER_BYTES = 36;
const SECRET_SENTINEL_PATTERN = new RegExp(SECRET_SENTINEL_SOURCE, "g");
const secretSentinelKeys = (0, node_crypto.randomBytes)(64);
const secretSentinelCipherKey = secretSentinelKeys.subarray(0, 32);
const secretSentinelNonceKey = secretSentinelKeys.subarray(32);
function secretSentinelsEnabled(env = process.env) {
	const configured = env.OPERATOR_SECRET_SENTINELS?.trim().toLowerCase();
	return configured !== "off" && configured !== "0" && configured !== "false";
}
function looksLikeSecretSentinel(value) {
	return new RegExp(`^${SECRET_SENTINEL_SOURCE}$`).test(value);
}
function containsSecretSentinel(value) {
	return value.includes(SECRET_SENTINEL_PREFIX);
}
function secretSentinelScope(label) {
	return (0, node_crypto.createHash)("sha256").update(label).digest().subarray(0, SECRET_SENTINEL_SCOPE_BYTES);
}
/** Seals a secret into authenticated ciphertext that only this process can resolve. */
function mintSecretSentinel(value, meta) {
	require_redact.registerSecretValueForRedaction(value);
	if (!secretSentinelsEnabled()) return value;
	const scope = secretSentinelScope(meta.label);
	const nonce = (0, node_crypto.createHmac)("sha256", secretSentinelNonceKey).update(scope).update(value).digest().subarray(0, SECRET_SENTINEL_NONCE_BYTES);
	const cipher = (0, node_crypto.createCipheriv)(SECRET_SENTINEL_CIPHER, secretSentinelCipherKey, nonce);
	cipher.setAAD(scope);
	const ciphertext = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
	const sealed = Buffer.concat([
		scope,
		nonce,
		cipher.getAuthTag(),
		ciphertext
	]);
	return `${SECRET_SENTINEL_PREFIX}${sealed.toString("base64url")}${SECRET_SENTINEL_SUFFIX}`;
}
/** Opens a process-local sentinel and rejects malformed or tampered values. */
function resolveSecretSentinel(sentinel) {
	if (!looksLikeSecretSentinel(sentinel)) return;
	try {
		const encoded = sentinel.slice(11, -4);
		const sealed = Buffer.from(encoded, "base64url");
		if (sealed.length < SECRET_SENTINEL_HEADER_BYTES) return;
		const scope = sealed.subarray(0, SECRET_SENTINEL_SCOPE_BYTES);
		const nonce = sealed.subarray(SECRET_SENTINEL_SCOPE_BYTES, 20);
		const tag = sealed.subarray(20, 36);
		const ciphertext = sealed.subarray(SECRET_SENTINEL_HEADER_BYTES);
		const decipher = (0, node_crypto.createDecipheriv)(SECRET_SENTINEL_CIPHER, secretSentinelCipherKey, nonce);
		decipher.setAAD(scope);
		decipher.setAuthTag(tag);
		const value = Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
		require_redact.registerSecretValueForRedaction(value);
		return value;
	} catch {
		return;
	}
}
/** Swaps every known sentinel substring and reports unknown sentinel-shaped values. */
function swapSecretSentinelsInText(text) {
	if (!containsSecretSentinel(text)) return {
		text,
		unknown: []
	};
	const unknown = /* @__PURE__ */ new Set();
	return {
		text: text.replace(new RegExp(SECRET_SENTINEL_SOURCE, "g"), (sentinel) => {
			const value = resolveSecretSentinel(sentinel);
			if (value === void 0) {
				unknown.add(sentinel);
				return sentinel;
			}
			return value;
		}),
		unknown: [...unknown]
	};
}
//#endregion
//#region src/agents/provider-secret-egress.ts
function protectRuntimeAuthValue(params) {
	if (!params.value) return params.value;
	return looksLikeSecretSentinel(params.value) ? params.value : mintSecretSentinel(params.value, { label: `model-auth:${params.provider}:${params.label}` });
}
/** Re-sentinels credentials returned by a provider auth exchange. */
function protectPreparedProviderRuntimeAuth(params) {
	const { preparedAuth } = params;
	if (!preparedAuth) return;
	const protect = (value, label) => !value || require_model_auth_markers.isNonSecretApiKeyMarker(value) ? value : protectRuntimeAuthValue({
		value,
		provider: params.provider,
		label
	});
	const request = preparedAuth.request;
	const headers = request?.headers ? Object.fromEntries(Object.entries(request.headers).map(([name, value]) => [name, protect(value, `runtime-header:${name.toLowerCase()}`)])) : void 0;
	const auth = request?.auth;
	const protectedAuth = auth?.mode === "authorization-bearer" ? {
		...auth,
		token: protect(auth.token, "runtime-bearer")
	} : auth?.mode === "header" ? {
		...auth,
		value: protect(auth.value, `runtime-auth-header:${auth.headerName.toLowerCase()}`)
	} : auth;
	return {
		...preparedAuth,
		apiKey: protect(preparedAuth.apiKey, "runtime-api-key"),
		...request ? { request: {
			...request,
			...headers ? { headers } : {},
			...protectedAuth ? { auth: protectedAuth } : {}
		} } : {}
	};
}
function unwrapSecretSentinelsForProviderEgress(value, boundary) {
	const swapped = swapSecretSentinelsInText(value);
	const unknown = swapped.unknown[0];
	if (unknown) throw new Error(`Secret sentinel ${unknown} is not registered in this process; refusing ${boundary}`);
	return swapped.text;
}
function unwrapHeaderSentinelsForProviderEgress(input, boundary) {
	let headers;
	for (const [name, value] of Object.entries(input)) {
		if (typeof value !== "string") continue;
		const resolved = unwrapSecretSentinelsForProviderEgress(value, boundary);
		if (resolved !== value) {
			headers ??= { ...input };
			headers[name] = resolved;
		}
	}
	return headers ? headers : input;
}
function unwrapHeadersInitSentinelsForProviderEgress(input, boundary) {
	if (!input) return input;
	const headers = new Headers(input);
	let changed = false;
	for (const [name, value] of headers) {
		const resolved = unwrapSecretSentinelsForProviderEgress(value, boundary);
		if (resolved !== value) {
			headers.set(name, resolved);
			changed = true;
		}
	}
	return changed ? headers : input;
}
function unwrapRequestTransportSentinelsForProviderEgress(request, boundary) {
	if (!request) return request;
	const headers = request.headers ? unwrapHeaderSentinelsForProviderEgress(request.headers, boundary) : request.headers;
	let auth = request.auth;
	if (auth?.mode === "authorization-bearer") {
		const token = unwrapSecretSentinelsForProviderEgress(auth.token, boundary);
		if (token !== auth.token) auth = {
			...auth,
			token
		};
	} else if (auth?.mode === "header") {
		const value = unwrapSecretSentinelsForProviderEgress(auth.value, boundary);
		if (value !== auth.value) auth = {
			...auth,
			value
		};
	}
	if (headers === request.headers && auth === request.auth) return request;
	return {
		...request,
		...headers ? { headers } : {},
		...auth ? { auth } : {}
	};
}
function unwrapModelHeaderSentinelsForProviderEgress(model, boundary) {
	const headers = model.headers ? unwrapHeaderSentinelsForProviderEgress(model.headers, boundary) : model.headers;
	const request = require_provider_request_config.getModelProviderRequestTransport(model);
	const unwrappedRequest = unwrapRequestTransportSentinelsForProviderEgress(request, boundary);
	if (headers === model.headers && unwrappedRequest === request) return model;
	const next = headers === model.headers ? { ...model } : {
		...model,
		headers
	};
	return unwrappedRequest === request ? next : require_provider_request_config.attachModelProviderRequestTransport(next, unwrappedRequest);
}
//#endregion
Object.defineProperty(exports, "SECRET_SENTINEL_PATTERN", {
	enumerable: true,
	get: function() {
		return SECRET_SENTINEL_PATTERN;
	}
});
Object.defineProperty(exports, "containsSecretSentinel", {
	enumerable: true,
	get: function() {
		return containsSecretSentinel;
	}
});
Object.defineProperty(exports, "looksLikeSecretSentinel", {
	enumerable: true,
	get: function() {
		return looksLikeSecretSentinel;
	}
});
Object.defineProperty(exports, "mintSecretSentinel", {
	enumerable: true,
	get: function() {
		return mintSecretSentinel;
	}
});
Object.defineProperty(exports, "protectPreparedProviderRuntimeAuth", {
	enumerable: true,
	get: function() {
		return protectPreparedProviderRuntimeAuth;
	}
});
Object.defineProperty(exports, "resolveSecretSentinel", {
	enumerable: true,
	get: function() {
		return resolveSecretSentinel;
	}
});
Object.defineProperty(exports, "swapSecretSentinelsInText", {
	enumerable: true,
	get: function() {
		return swapSecretSentinelsInText;
	}
});
Object.defineProperty(exports, "unwrapHeaderSentinelsForProviderEgress", {
	enumerable: true,
	get: function() {
		return unwrapHeaderSentinelsForProviderEgress;
	}
});
Object.defineProperty(exports, "unwrapHeadersInitSentinelsForProviderEgress", {
	enumerable: true,
	get: function() {
		return unwrapHeadersInitSentinelsForProviderEgress;
	}
});
Object.defineProperty(exports, "unwrapModelHeaderSentinelsForProviderEgress", {
	enumerable: true,
	get: function() {
		return unwrapModelHeaderSentinelsForProviderEgress;
	}
});
Object.defineProperty(exports, "unwrapSecretSentinelsForProviderEgress", {
	enumerable: true,
	get: function() {
		return unwrapSecretSentinelsForProviderEgress;
	}
});
