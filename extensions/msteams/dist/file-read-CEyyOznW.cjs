const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
let node_fs = require("node:fs");
node_fs = require_rolldown_runtime.__toESM(node_fs, 1);
//#region src/infra/file-read.ts
/** Fills a bounded positional-read buffer unless the file reaches EOF. */
async function readFileWindowFully(handle, buffer, position) {
	let bytesRead = 0;
	while (bytesRead < buffer.length) {
		const result = await handle.read(buffer, bytesRead, buffer.length - bytesRead, position + bytesRead);
		if (result.bytesRead === 0) break;
		bytesRead += result.bytesRead;
	}
	return bytesRead;
}
//#endregion
Object.defineProperty(exports, "readFileWindowFully", {
	enumerable: true,
	get: function() {
		return readFileWindowFully;
	}
});
