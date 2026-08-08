const require_session_accessor = require("./session-accessor-D_W4fZCX.cjs");
require("./service-D9VsD8u0.cjs");
//#region src/agents/worktrees/owner-protection.ts
function createManagedWorktreeOwnerProtection(cfg, now = Date.now) {
	return (ownerKind, ownerId) => {
		if (ownerKind !== "session") return false;
		try {
			const entry = require_session_accessor.resolveSessionEntryAccessTarget({
				cfg,
				sessionKey: ownerId
			}).entry;
			const activityAt = Math.max(entry?.lastInteractionAt ?? 0, entry?.updatedAt ?? 0);
			return activityAt > 0 && now() - activityAt <= 6048e5;
		} catch {
			return true;
		}
	};
}
//#endregion
Object.defineProperty(exports, "createManagedWorktreeOwnerProtection", {
	enumerable: true,
	get: function() {
		return createManagedWorktreeOwnerProtection;
	}
});
