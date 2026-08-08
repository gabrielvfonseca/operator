const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
require("./fs-safe-BptZQDa1.cjs");
const require_home_dir = require("./home-dir-DDyi_SB-.cjs");
const require_utils = require("./utils-CXqBhRFw.cjs");
const require_exec = require("./exec-CMb2J-j8.cjs");
const require_resolve_system_bin = require("./resolve-system-bin-B1IIqmHp.cjs");
const require_fingerprint = require("./fingerprint-BsHRaMlI.cjs");
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let node_fs_promises = require("node:fs/promises");
node_fs_promises = require_rolldown_runtime.__toESM(node_fs_promises, 1);
let node_crypto = require("node:crypto");
let node_tls = require("node:tls");
node_tls = require_rolldown_runtime.__toESM(node_tls, 1);
let _openclaw_fs_safe_advanced = require("@openclaw/fs-safe/advanced");
//#region src/infra/tls/gateway.ts
var gateway_exports = /* @__PURE__ */ require_rolldown_runtime.__exportAll({ loadGatewayTlsRuntime: () => loadGatewayTlsRuntime });
async function generateSelfSignedCert(params) {
	const certDir = node_path.default.dirname(params.certPath);
	const keyDir = node_path.default.dirname(params.keyPath);
	await require_utils.ensureDir(certDir);
	if (keyDir !== certDir) await require_utils.ensureDir(keyDir);
	const opensslBin = require_resolve_system_bin.resolveSystemBin("openssl");
	if (!opensslBin) throw new Error("openssl not found in trusted system directories. Install it in an OS-managed location.");
	await require_exec.runExec(opensslBin, [
		"req",
		"-x509",
		"-newkey",
		"rsa:2048",
		"-sha256",
		"-days",
		"3650",
		"-nodes",
		"-keyout",
		params.keyPath,
		"-out",
		params.certPath,
		"-subj",
		"/CN=operator-gateway"
	], { logOutput: false });
	await node_fs_promises.default.chmod(params.keyPath, 384).catch(() => {});
	await node_fs_promises.default.chmod(params.certPath, 384).catch(() => {});
	params.log?.info?.(`gateway tls: generated self-signed cert at ${require_utils.shortenHomeInString(params.certPath)}`);
}
/** Load or generate gateway TLS material and return server-ready TLS options. */
async function loadGatewayTlsRuntime(cfg, log) {
	if (cfg?.enabled !== true) return {
		enabled: false,
		required: false
	};
	const autoGenerate = cfg.autoGenerate !== false;
	const baseDir = node_path.default.join(require_utils.CONFIG_DIR, "gateway", "tls");
	const certPath = require_home_dir.resolveUserPath(typeof cfg.certPath === "string" && cfg.certPath.trim() ? cfg.certPath : node_path.default.join(baseDir, "gateway-cert.pem"));
	const keyPath = require_home_dir.resolveUserPath(typeof cfg.keyPath === "string" && cfg.keyPath.trim() ? cfg.keyPath : node_path.default.join(baseDir, "gateway-key.pem"));
	const caPath = cfg.caPath ? require_home_dir.resolveUserPath(cfg.caPath) : void 0;
	const hasCert = await (0, _openclaw_fs_safe_advanced.pathExists)(certPath);
	const hasKey = await (0, _openclaw_fs_safe_advanced.pathExists)(keyPath);
	if (!hasCert && !hasKey && autoGenerate) try {
		await generateSelfSignedCert({
			certPath,
			keyPath,
			log
		});
	} catch (err) {
		return {
			enabled: false,
			required: true,
			certPath,
			keyPath,
			error: `gateway tls: failed to generate cert (${String(err)})`
		};
	}
	if (!await (0, _openclaw_fs_safe_advanced.pathExists)(certPath) || !await (0, _openclaw_fs_safe_advanced.pathExists)(keyPath)) return {
		enabled: false,
		required: true,
		certPath,
		keyPath,
		error: "gateway tls: cert/key missing"
	};
	try {
		const cert = await node_fs_promises.default.readFile(certPath, "utf8");
		const key = await node_fs_promises.default.readFile(keyPath, "utf8");
		const ca = caPath ? await node_fs_promises.default.readFile(caPath, "utf8") : void 0;
		const fingerprintSha256 = require_fingerprint.normalizeFingerprint(new node_crypto.X509Certificate(cert).fingerprint256 ?? "");
		if (!fingerprintSha256) return {
			enabled: false,
			required: true,
			certPath,
			keyPath,
			caPath,
			error: "gateway tls: unable to compute certificate fingerprint"
		};
		return {
			enabled: true,
			required: true,
			certPath,
			keyPath,
			caPath,
			fingerprintSha256,
			tlsOptions: {
				cert,
				key,
				ca,
				minVersion: "TLSv1.3"
			}
		};
	} catch (err) {
		return {
			enabled: false,
			required: true,
			certPath,
			keyPath,
			caPath,
			error: `gateway tls: failed to load cert (${String(err)})`
		};
	}
}
//#endregion
Object.defineProperty(exports, "gateway_exports", {
	enumerable: true,
	get: function() {
		return gateway_exports;
	}
});
Object.defineProperty(exports, "loadGatewayTlsRuntime", {
	enumerable: true,
	get: function() {
		return loadGatewayTlsRuntime;
	}
});
