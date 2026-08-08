require("./utils-CXqBhRFw.cjs");
const require_path_array_index = require("./path-array-index-C9RRFl-Q.cjs");
let _gabrielvfonseca_normalization_core_string_normalization = require("@gabrielvfonseca/normalization-core/string-normalization");
let _gabrielvfonseca_normalization_core_record_coerce = require("@gabrielvfonseca/normalization-core/record-coerce");
//#region src/plugins/config-contract-matches.ts
function normalizePathPattern(pathPattern) {
	return (0, _gabrielvfonseca_normalization_core_string_normalization.normalizeStringEntries)(pathPattern.split("."));
}
function appendPathSegment(path, segment) {
	if (!path) return segment;
	return /^\d+$/.test(segment) ? `${path}[${segment}]` : `${path}.${segment}`;
}
function parseCanonicalArrayIndex(segment, length) {
	const index = require_path_array_index.parseConfigPathArrayIndex(segment);
	return index !== void 0 && index < length ? index : null;
}
/** Collect concrete config values that match a plugin contract path pattern. */
function collectPluginConfigContractMatches(params) {
	const pattern = normalizePathPattern(params.pathPattern);
	if (pattern.length === 0) return [];
	let states = [{
		segments: [],
		value: params.root
	}];
	for (const segment of pattern) {
		const nextStates = [];
		for (const state of states) {
			if (segment === "*") {
				if (Array.isArray(state.value)) {
					for (const [index, value] of state.value.entries()) nextStates.push({
						segments: [...state.segments, String(index)],
						value
					});
					continue;
				}
				if ((0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(state.value)) for (const [key, value] of Object.entries(state.value)) nextStates.push({
					segments: [...state.segments, key],
					value
				});
				continue;
			}
			if (Array.isArray(state.value)) {
				const index = parseCanonicalArrayIndex(segment, state.value.length);
				if (index !== null) nextStates.push({
					segments: [...state.segments, segment],
					value: state.value[index]
				});
				continue;
			}
			if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(state.value) || !Object.hasOwn(state.value, segment)) continue;
			nextStates.push({
				segments: [...state.segments, segment],
				value: state.value[segment]
			});
		}
		states = nextStates;
		if (states.length === 0) break;
	}
	return states.map((state) => ({
		path: state.segments.reduce(appendPathSegment, ""),
		value: state.value
	}));
}
//#endregion
Object.defineProperty(exports, "collectPluginConfigContractMatches", {
	enumerable: true,
	get: function() {
		return collectPluginConfigContractMatches;
	}
});
