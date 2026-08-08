const require_binding_registry = require("./binding-registry-CtJxOm6I.cjs");
//#region src/acp/persistent-bindings.resolve.ts
/** Resolves configured channel conversation bindings into ACP session binding specs. */
/** Resolves the configured ACP binding spec that owns a generated session key. */
function resolveConfiguredAcpBindingSpecBySessionKey(params) {
	const resolved = require_binding_registry.resolveConfiguredBindingRecordBySessionKey(params);
	return resolved ? require_binding_registry.resolveConfiguredAcpBindingSpecFromRecord(resolved.record) : null;
}
//#endregion
Object.defineProperty(exports, "resolveConfiguredAcpBindingSpecBySessionKey", {
	enumerable: true,
	get: function() {
		return resolveConfiguredAcpBindingSpecBySessionKey;
	}
});
