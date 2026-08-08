//#region src/gateway/operator-scopes.ts
const ADMIN_SCOPE = "operator.admin";
const READ_SCOPE = "operator.read";
const WRITE_SCOPE = "operator.write";
const APPROVALS_SCOPE = "operator.approvals";
const PAIRING_SCOPE = "operator.pairing";
const TALK_SECRETS_SCOPE = "operator.talk.secrets";
const KNOWN_OPERATOR_SCOPES = /* @__PURE__ */ new Set([
	ADMIN_SCOPE,
	READ_SCOPE,
	WRITE_SCOPE,
	APPROVALS_SCOPE,
	PAIRING_SCOPE,
	TALK_SECRETS_SCOPE
]);
/** Narrows untrusted auth-token scope entries to the gateway's closed scope set. */
function isOperatorScope(value) {
	return typeof value === "string" && KNOWN_OPERATOR_SCOPES.has(value);
}
/** Filters unknown strings down to unique operator scopes; undefined stays undefined. */
function normalizeOperatorScopeList(scopes) {
	if (!Array.isArray(scopes)) return;
	const normalized = [];
	for (const scope of scopes) if (isOperatorScope(scope) && !normalized.includes(scope)) normalized.push(scope);
	return normalized;
}
//#endregion
Object.defineProperty(exports, "ADMIN_SCOPE", {
	enumerable: true,
	get: function() {
		return ADMIN_SCOPE;
	}
});
Object.defineProperty(exports, "APPROVALS_SCOPE", {
	enumerable: true,
	get: function() {
		return APPROVALS_SCOPE;
	}
});
Object.defineProperty(exports, "PAIRING_SCOPE", {
	enumerable: true,
	get: function() {
		return PAIRING_SCOPE;
	}
});
Object.defineProperty(exports, "READ_SCOPE", {
	enumerable: true,
	get: function() {
		return READ_SCOPE;
	}
});
Object.defineProperty(exports, "TALK_SECRETS_SCOPE", {
	enumerable: true,
	get: function() {
		return TALK_SECRETS_SCOPE;
	}
});
Object.defineProperty(exports, "WRITE_SCOPE", {
	enumerable: true,
	get: function() {
		return WRITE_SCOPE;
	}
});
Object.defineProperty(exports, "isOperatorScope", {
	enumerable: true,
	get: function() {
		return isOperatorScope;
	}
});
Object.defineProperty(exports, "normalizeOperatorScopeList", {
	enumerable: true,
	get: function() {
		return normalizeOperatorScopeList;
	}
});
