const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
let _silvia_odwyer_photon_node = require("@silvia-odwyer/photon-node");
_silvia_odwyer_photon_node = require_rolldown_runtime.__toESM(_silvia_odwyer_photon_node, 1);
//#region src/media/photon.runtime.ts
/** Decode validated BMP bytes only after Rastermill rejects the format. */
function convertBmpToPngWithPhoton(buffer) {
	let image;
	try {
		image = _silvia_odwyer_photon_node.default.PhotonImage.new_from_byteslice(buffer);
		return Buffer.from(image.get_bytes());
	} finally {
		image?.free();
	}
}
//#endregion
exports.convertBmpToPngWithPhoton = convertBmpToPngWithPhoton;
