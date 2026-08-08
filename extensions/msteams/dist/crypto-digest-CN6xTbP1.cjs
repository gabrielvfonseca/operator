let node_fs = require("node:fs");
let node_crypto = require("node:crypto");
//#region src/infra/crypto-digest.ts
function sha256Hex(input) {
	return (0, node_crypto.createHash)("sha256").update(input).digest("hex");
}
function sha256Base64(input) {
	return (0, node_crypto.createHash)("sha256").update(input).digest("base64");
}
function sha256Base64Url(input) {
	return (0, node_crypto.createHash)("sha256").update(input).digest("base64url");
}
function sha256Base64UrlPrefix(input, length) {
	return sha256Base64Url(input).slice(0, length);
}
function sha256HexPrefix(input, length) {
	return sha256Hex(input).slice(0, length);
}
async function sha256File(filePath) {
	const digest = (0, node_crypto.createHash)("sha256");
	try {
		for await (const chunk of (0, node_fs.createReadStream)(filePath)) digest.update(chunk);
	} catch (err) {
		throw new Error(`Failed to hash file ${filePath}: ${err instanceof Error ? err.message : String(err)}`, { cause: err });
	}
	return digest.digest("hex");
}
//#endregion
Object.defineProperty(exports, "sha256Base64", {
	enumerable: true,
	get: function() {
		return sha256Base64;
	}
});
Object.defineProperty(exports, "sha256Base64Url", {
	enumerable: true,
	get: function() {
		return sha256Base64Url;
	}
});
Object.defineProperty(exports, "sha256Base64UrlPrefix", {
	enumerable: true,
	get: function() {
		return sha256Base64UrlPrefix;
	}
});
Object.defineProperty(exports, "sha256File", {
	enumerable: true,
	get: function() {
		return sha256File;
	}
});
Object.defineProperty(exports, "sha256Hex", {
	enumerable: true,
	get: function() {
		return sha256Hex;
	}
});
Object.defineProperty(exports, "sha256HexPrefix", {
	enumerable: true,
	get: function() {
		return sha256HexPrefix;
	}
});
