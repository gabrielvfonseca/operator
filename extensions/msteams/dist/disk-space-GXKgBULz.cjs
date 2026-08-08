const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
let node_fs = require("node:fs");
node_fs = require_rolldown_runtime.__toESM(node_fs, 1);
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
//#region src/infra/disk-space.ts
function finiteNonNegativeNumber(value) {
	const numberValue = Number(value);
	return Number.isFinite(numberValue) && numberValue >= 0 ? numberValue : null;
}
function findExistingDiskSpacePath(targetPath) {
	let current = node_path.default.resolve(targetPath);
	while (true) try {
		return node_fs.default.statSync(current).isDirectory() ? current : node_path.default.dirname(current);
	} catch {
		const parent = node_path.default.dirname(current);
		if (parent === current) return null;
		current = parent;
	}
}
/** Reads available bytes for the volume containing a target path when statfs is available. */
function tryReadDiskSpace(targetPath) {
	if (typeof node_fs.default.statfsSync !== "function") return null;
	const checkedPath = findExistingDiskSpacePath(targetPath);
	if (!checkedPath) return null;
	try {
		const stats = node_fs.default.statfsSync(checkedPath);
		const blockSize = finiteNonNegativeNumber(stats.bsize);
		const availableBlocks = finiteNonNegativeNumber(stats.bavail);
		if (blockSize === null || availableBlocks === null) return null;
		const totalBlocks = finiteNonNegativeNumber(stats.blocks);
		return {
			targetPath,
			checkedPath,
			availableBytes: blockSize * availableBlocks,
			totalBytes: totalBlocks === null ? null : blockSize * totalBlocks
		};
	} catch {
		return null;
	}
}
/** Formats byte counts for compact operator-facing disk-space warnings. */
function formatDiskSpaceBytes(bytes) {
	const mib = bytes / (1024 * 1024);
	const roundedMib = Math.max(0, Math.round(mib));
	if (roundedMib < 1024) return `${roundedMib} MiB`;
	const gib = mib / 1024;
	return `${gib.toFixed(gib < 10 ? 1 : 0)} GiB`;
}
//#endregion
Object.defineProperty(exports, "formatDiskSpaceBytes", {
	enumerable: true,
	get: function() {
		return formatDiskSpaceBytes;
	}
});
Object.defineProperty(exports, "tryReadDiskSpace", {
	enumerable: true,
	get: function() {
		return tryReadDiskSpace;
	}
});
