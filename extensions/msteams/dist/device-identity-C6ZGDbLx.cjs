const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_paths = require("./paths-C5Qy0ueD.cjs");
const require_private_file_store = require("./private-file-store-C0DdQCy-.cjs");
const require_ed25519_signature = require("./ed25519-signature-B-nQxx1_.cjs");
let node_fs = require("node:fs");
node_fs = require_rolldown_runtime.__toESM(node_fs, 1);
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let node_crypto = require("node:crypto");
node_crypto = require_rolldown_runtime.__toESM(node_crypto, 1);
//#region src/infra/device-identity.ts
var device_identity_exports = /* @__PURE__ */ require_rolldown_runtime.__exportAll({
	deriveDeviceIdFromPublicKey: () => deriveDeviceIdFromPublicKey,
	loadDeviceIdentityIfPresent: () => loadDeviceIdentityIfPresent,
	loadOrCreateDeviceIdentity: () => loadOrCreateDeviceIdentity,
	loadOrCreateProcessDeviceIdentity: () => loadOrCreateProcessDeviceIdentity,
	normalizeDevicePublicKeyBase64Url: () => normalizeDevicePublicKeyBase64Url,
	publicKeyRawBase64UrlFromPem: () => publicKeyRawBase64UrlFromPem,
	signDevicePayload: () => signDevicePayload,
	verifyDeviceSignature: () => verifyDeviceSignature
});
function resolveDefaultIdentityPath() {
	return node_path.default.join(require_paths.resolveStateDir(), "identity", "device.json");
}
const publicKeyPemFromRaw = require_ed25519_signature.ed25519PublicKeyPemFromRaw;
const privateKeyPemFromRaw = require_ed25519_signature.ed25519PrivateKeyPemFromRaw;
function fingerprintPublicKey(publicKeyPem) {
	const raw = require_ed25519_signature.deriveEd25519PublicKeyRaw(publicKeyPem);
	return node_crypto.default.createHash("sha256").update(raw).digest("hex");
}
function tryFingerprintPublicKey(publicKeyPem) {
	try {
		return fingerprintPublicKey(publicKeyPem);
	} catch {
		return null;
	}
}
function keyPairMatches(publicKeyPem, privateKeyPem) {
	try {
		const payload = Buffer.from("operator-device-identity-self-check", "utf8");
		const signature = node_crypto.default.sign(null, payload, node_crypto.default.createPrivateKey(privateKeyPem));
		return node_crypto.default.verify(null, payload, node_crypto.default.createPublicKey(publicKeyPem), signature);
	} catch {
		return false;
	}
}
function generateIdentity() {
	const { publicKey, privateKey } = node_crypto.default.generateKeyPairSync("ed25519");
	const publicKeyPem = publicKey.export({
		type: "spki",
		format: "pem"
	});
	const privateKeyPem = privateKey.export({
		type: "pkcs8",
		format: "pem"
	});
	return {
		deviceId: fingerprintPublicKey(publicKeyPem),
		publicKeyPem,
		privateKeyPem
	};
}
function isRecord(value) {
	return Boolean(value) && typeof value === "object";
}
function hasRecognizedIdentityShape(parsed) {
	return isRecord(parsed) && ("publicKeyPem" in parsed || "privateKeyPem" in parsed || "publicKey" in parsed || "privateKey" in parsed);
}
function normalizeStoredIdentity(parsed) {
	if (isRecord(parsed) && "version" in parsed && parsed.version === 1 && "deviceId" in parsed && typeof parsed.deviceId === "string" && "publicKeyPem" in parsed && typeof parsed.publicKeyPem === "string" && "privateKeyPem" in parsed && typeof parsed.privateKeyPem === "string") {
		const stored = parsed;
		const derivedId = tryFingerprintPublicKey(stored.publicKeyPem);
		if (!derivedId || !keyPairMatches(stored.publicKeyPem, stored.privateKeyPem)) return { kind: "recognized-invalid" };
		const identity = {
			deviceId: derivedId,
			publicKeyPem: stored.publicKeyPem,
			privateKeyPem: stored.privateKeyPem
		};
		return derivedId === stored.deviceId ? {
			kind: "identity",
			identity,
			validForReadOnly: true
		} : {
			kind: "identity",
			identity,
			validForReadOnly: false,
			stored: {
				...stored,
				deviceId: derivedId
			}
		};
	}
	if (isRecord(parsed) && !("version" in parsed) && "deviceId" in parsed && typeof parsed.deviceId === "string" && "publicKey" in parsed && typeof parsed.publicKey === "string" && "privateKey" in parsed && typeof parsed.privateKey === "string") {
		const stored = parsed;
		const publicKeyRaw = require_ed25519_signature.base64UrlDecode(stored.publicKey);
		const privateKeyRaw = require_ed25519_signature.base64UrlDecode(stored.privateKey);
		if (publicKeyRaw.length !== 32 || privateKeyRaw.length !== 32) return { kind: "recognized-invalid" };
		const publicKeyPem = publicKeyPemFromRaw(publicKeyRaw);
		const privateKeyPem = privateKeyPemFromRaw(privateKeyRaw);
		if (!keyPairMatches(publicKeyPem, privateKeyPem)) return { kind: "recognized-invalid" };
		const derivedId = fingerprintPublicKey(publicKeyPem);
		const validForReadOnly = derivedId === stored.deviceId;
		const migrated = {
			version: 1,
			deviceId: derivedId,
			publicKeyPem,
			privateKeyPem,
			createdAtMs: typeof stored.createdAtMs === "number" && Number.isFinite(stored.createdAtMs) ? stored.createdAtMs : Date.now()
		};
		return {
			kind: "identity",
			identity: {
				deviceId: derivedId,
				publicKeyPem,
				privateKeyPem
			},
			validForReadOnly,
			stored: migrated
		};
	}
	return hasRecognizedIdentityShape(parsed) ? { kind: "recognized-invalid" } : null;
}
function identityFileExists(filePath) {
	try {
		return node_fs.default.statSync(filePath).isFile();
	} catch {
		return false;
	}
}
/** Load a valid persisted identity, repair/migrate when safe, or create a new one. */
function loadOrCreateDeviceIdentity(filePath = resolveDefaultIdentityPath()) {
	try {
		const store = require_private_file_store.privateFileStoreSync(node_path.default.dirname(filePath));
		const normalized = normalizeStoredIdentity(store.readJsonIfExists(node_path.default.basename(filePath)));
		if (normalized?.kind === "identity") {
			if (normalized.stored) try {
				store.writeJson(node_path.default.basename(filePath), normalized.stored, { trailingNewline: true });
			} catch {}
			return normalized.identity;
		}
		if (normalized?.kind === "recognized-invalid") return generateIdentity();
		if (identityFileExists(filePath)) return generateIdentity();
	} catch {
		if (identityFileExists(filePath)) return generateIdentity();
	}
	const identity = generateIdentity();
	const stored = {
		version: 1,
		deviceId: identity.deviceId,
		publicKeyPem: identity.publicKeyPem,
		privateKeyPem: identity.privateKeyPem,
		createdAtMs: Date.now()
	};
	require_private_file_store.privateFileStoreSync(node_path.default.dirname(filePath)).writeJson(node_path.default.basename(filePath), stored, { trailingNewline: true });
	return identity;
}
let processDeviceIdentity;
/**
* Keep one identity stable for the lifetime of the active state-dir process.
* Recognizable invalid stores yield transient keys, so independent reloads would split gateway ownership.
*/
function loadOrCreateProcessDeviceIdentity(filePath = resolveDefaultIdentityPath()) {
	if (processDeviceIdentity?.filePath === filePath) return processDeviceIdentity.identity;
	const identity = loadOrCreateDeviceIdentity(filePath);
	processDeviceIdentity = {
		filePath,
		identity
	};
	return identity;
}
/** Load a valid persisted device identity without creating, repairing, or migrating files. */
function loadDeviceIdentityIfPresent(filePath = resolveDefaultIdentityPath()) {
	try {
		const normalized = normalizeStoredIdentity(require_private_file_store.privateFileStoreSync(node_path.default.dirname(filePath)).readJsonIfExists(node_path.default.basename(filePath)));
		if (normalized?.kind !== "identity" || !normalized.validForReadOnly) return null;
		return normalized.identity;
	} catch {
		return null;
	}
}
/** Sign a UTF-8 payload with a PEM Ed25519 private key and return base64url bytes. */
function signDevicePayload(privateKeyPem, payload) {
	return require_ed25519_signature.signEd25519Payload(privateKeyPem, payload);
}
/** Normalize PEM or raw base64/base64url public keys to canonical raw base64url bytes. */
function normalizeDevicePublicKeyBase64Url(publicKey) {
	return require_ed25519_signature.normalizeEd25519PublicKeyBase64Url(publicKey);
}
/** Derive the stable device id from PEM or raw base64/base64url public key material. */
function deriveDeviceIdFromPublicKey(publicKey) {
	try {
		const raw = publicKey.includes("BEGIN") ? require_ed25519_signature.deriveEd25519PublicKeyRaw(publicKey) : require_ed25519_signature.base64UrlDecode(publicKey);
		if (raw.length === 0) return null;
		return node_crypto.default.createHash("sha256").update(raw).digest("hex");
	} catch {
		return null;
	}
}
/** Export a PEM Ed25519 public key as canonical raw base64url bytes. */
function publicKeyRawBase64UrlFromPem(publicKeyPem) {
	return require_ed25519_signature.publicKeyRawBase64UrlFromEd25519Pem(publicKeyPem);
}
/** Verify a UTF-8 payload signature against PEM or raw base64/base64url public key material. */
function verifyDeviceSignature(publicKey, payload, signatureBase64Url) {
	return require_ed25519_signature.verifyEd25519Signature({
		publicKey,
		payload,
		signatureBase64Url
	});
}
//#endregion
Object.defineProperty(exports, "deriveDeviceIdFromPublicKey", {
	enumerable: true,
	get: function() {
		return deriveDeviceIdFromPublicKey;
	}
});
Object.defineProperty(exports, "device_identity_exports", {
	enumerable: true,
	get: function() {
		return device_identity_exports;
	}
});
Object.defineProperty(exports, "loadDeviceIdentityIfPresent", {
	enumerable: true,
	get: function() {
		return loadDeviceIdentityIfPresent;
	}
});
Object.defineProperty(exports, "loadOrCreateDeviceIdentity", {
	enumerable: true,
	get: function() {
		return loadOrCreateDeviceIdentity;
	}
});
Object.defineProperty(exports, "loadOrCreateProcessDeviceIdentity", {
	enumerable: true,
	get: function() {
		return loadOrCreateProcessDeviceIdentity;
	}
});
Object.defineProperty(exports, "normalizeDevicePublicKeyBase64Url", {
	enumerable: true,
	get: function() {
		return normalizeDevicePublicKeyBase64Url;
	}
});
Object.defineProperty(exports, "publicKeyRawBase64UrlFromPem", {
	enumerable: true,
	get: function() {
		return publicKeyRawBase64UrlFromPem;
	}
});
Object.defineProperty(exports, "signDevicePayload", {
	enumerable: true,
	get: function() {
		return signDevicePayload;
	}
});
Object.defineProperty(exports, "verifyDeviceSignature", {
	enumerable: true,
	get: function() {
		return verifyDeviceSignature;
	}
});
