const require_diagnostic_events = require("./diagnostic-events-BfVh8qZb.cjs");
const require_crypto_digest = require("./crypto-digest-CN6xTbP1.cjs");
//#region src/gateway/server-methods/device-management-authz.ts
function resolveDeviceSessionAuthz(client) {
	const callerScopes = Array.isArray(client?.connect?.scopes) ? client.connect.scopes : [];
	const rawCallerDeviceId = client?.connect?.device?.id;
	return {
		callerDeviceId: client?.isDeviceTokenAuth && typeof rawCallerDeviceId === "string" && rawCallerDeviceId.trim() ? rawCallerDeviceId.trim() : null,
		callerScopes,
		isAdminCaller: callerScopes.includes("operator.admin")
	};
}
function resolveDeviceManagementAuthz(client, targetDeviceId) {
	return {
		...resolveDeviceSessionAuthz(client),
		normalizedTargetDeviceId: targetDeviceId.trim()
	};
}
function deniesCrossDeviceManagement(authz) {
	return Boolean(authz.callerDeviceId && authz.callerDeviceId !== authz.normalizedTargetDeviceId && !authz.isAdminCaller);
}
function deniesDeviceTokenRoleManagement(authz, targetRole) {
	const normalizedTargetRole = targetRole.trim();
	if (!normalizedTargetRole || authz.isAdminCaller) return false;
	return normalizedTargetRole !== "operator";
}
function hasNonOperatorDeviceRole(input) {
	const roles = /* @__PURE__ */ new Set();
	const role = input.role?.trim();
	if (role) roles.add(role);
	for (const entry of input.roles ?? []) {
		const normalized = entry.trim();
		if (normalized) roles.add(normalized);
	}
	return [...roles].some((entry) => entry !== "operator");
}
function hasNonOperatorDeviceTokenRole(tokens) {
	for (const token of Object.values(tokens ?? {})) {
		const normalized = token.role.trim();
		if (normalized && normalized !== "operator") return true;
	}
	return false;
}
function requestsNonOperatorDeviceRole(pending) {
	return hasNonOperatorDeviceRole(pending);
}
function pairedDeviceHasNonOperatorRole(device) {
	return hasNonOperatorDeviceRole(device) || hasNonOperatorDeviceTokenRole(device.tokens);
}
//#endregion
//#region src/gateway/server-methods/device-management-security.ts
function hashDeviceSecurityId(value) {
	const normalized = value?.trim();
	if (!normalized) return;
	return `sha256:${require_crypto_digest.sha256HexPrefix(normalized, 12)}`;
}
function emitDeviceManagementSecurityEvent(params) {
	require_diagnostic_events.emitTrustedSecurityEvent({
		category: "auth",
		action: params.action,
		outcome: params.outcome,
		severity: params.severity,
		actor: {
			kind: "operator",
			...params.authz.callerDeviceId ? { deviceIdHash: hashDeviceSecurityId(params.authz.callerDeviceId) } : {},
			role: params.authz.isAdminCaller ? "admin" : "operator"
		},
		target: {
			kind: "device",
			...params.targetDeviceId ? { idHash: hashDeviceSecurityId(params.targetDeviceId) } : {}
		},
		policy: {
			id: params.policyId,
			decision: params.decision,
			...params.reason ? { reason: params.reason } : {}
		},
		control: {
			id: params.controlId,
			family: "auth"
		},
		...params.reason ? { reason: params.reason } : {},
		...params.attributes ? { attributes: params.attributes } : {}
	});
}
//#endregion
Object.defineProperty(exports, "deniesCrossDeviceManagement", {
	enumerable: true,
	get: function() {
		return deniesCrossDeviceManagement;
	}
});
Object.defineProperty(exports, "deniesDeviceTokenRoleManagement", {
	enumerable: true,
	get: function() {
		return deniesDeviceTokenRoleManagement;
	}
});
Object.defineProperty(exports, "emitDeviceManagementSecurityEvent", {
	enumerable: true,
	get: function() {
		return emitDeviceManagementSecurityEvent;
	}
});
Object.defineProperty(exports, "pairedDeviceHasNonOperatorRole", {
	enumerable: true,
	get: function() {
		return pairedDeviceHasNonOperatorRole;
	}
});
Object.defineProperty(exports, "requestsNonOperatorDeviceRole", {
	enumerable: true,
	get: function() {
		return requestsNonOperatorDeviceRole;
	}
});
Object.defineProperty(exports, "resolveDeviceManagementAuthz", {
	enumerable: true,
	get: function() {
		return resolveDeviceManagementAuthz;
	}
});
Object.defineProperty(exports, "resolveDeviceSessionAuthz", {
	enumerable: true,
	get: function() {
		return resolveDeviceSessionAuthz;
	}
});
