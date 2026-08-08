const require_task_retention = require("./task-retention-CpOj8YGB.cjs");
const require_task_registry_audit_shared = require("./task-registry.audit.shared-BUJPXBLE.cjs");
//#region src/tasks/task-registry.audit.ts
const DEFAULT_STALE_QUEUED_MS = 10 * 6e4;
const DEFAULT_STALE_RUNNING_MS = 30 * 6e4;
let taskAuditTaskProvider = () => [];
/** Installs the task source used by inspectable task audits. */
function configureTaskAuditTaskProvider(provider) {
	taskAuditTaskProvider = provider;
}
function createFinding(params) {
	return {
		severity: params.severity,
		code: params.code,
		task: params.task,
		detail: params.detail,
		...typeof params.ageMs === "number" ? { ageMs: params.ageMs } : {}
	};
}
function taskReferenceAt(task) {
	return task.lastEventAt ?? task.startedAt ?? task.createdAt;
}
function findTimestampInconsistency(task) {
	if (task.startedAt && task.startedAt < task.createdAt) return createFinding({
		severity: "warn",
		code: "inconsistent_timestamps",
		task,
		detail: "startedAt is earlier than createdAt"
	});
	if (task.endedAt && task.startedAt && task.endedAt < task.startedAt) return createFinding({
		severity: "warn",
		code: "inconsistent_timestamps",
		task,
		detail: "endedAt is earlier than startedAt"
	});
	if ((task.status === "queued" || task.status === "running") && task.endedAt) return createFinding({
		severity: "warn",
		code: "inconsistent_timestamps",
		task,
		detail: `${task.status} task should not already have endedAt`
	});
	return null;
}
function compareFindings(left, right) {
	return require_task_registry_audit_shared.compareTaskAuditFindingSortKeys({
		severity: left.severity,
		ageMs: left.ageMs,
		createdAt: left.task.createdAt
	}, {
		severity: right.severity,
		ageMs: right.ageMs,
		createdAt: right.task.createdAt
	});
}
function listTaskAuditFindings(options = {}) {
	const tasks = options.tasks ?? taskAuditTaskProvider();
	const now = options.now ?? Date.now();
	const staleQueuedMs = options.staleQueuedMs ?? DEFAULT_STALE_QUEUED_MS;
	const staleRunningMs = options.staleRunningMs ?? DEFAULT_STALE_RUNNING_MS;
	const findings = [];
	for (const task of tasks) {
		const referenceAt = taskReferenceAt(task);
		const ageMs = Math.max(0, now - referenceAt);
		if (task.status === "queued" && ageMs >= staleQueuedMs) findings.push(createFinding({
			severity: "warn",
			code: "stale_queued",
			task,
			ageMs,
			detail: "queued task has not advanced recently"
		}));
		if (task.status === "running" && ageMs >= staleRunningMs) findings.push(createFinding({
			severity: "error",
			code: "stale_running",
			task,
			ageMs,
			detail: "running task appears stuck"
		}));
		if (task.status === "lost") {
			const effectiveCleanupAfter = require_task_retention.resolveEffectiveTaskCleanupAfter(task);
			const retainedUntilCleanup = typeof task.cleanupAfter === "number" && effectiveCleanupAfter !== void 0 && effectiveCleanupAfter > now;
			findings.push(createFinding({
				severity: retainedUntilCleanup ? "warn" : "error",
				code: "lost",
				task,
				ageMs,
				detail: retainedUntilCleanup ? task.error?.trim() || "task lost its backing session and is retained until cleanupAfter" : task.error?.trim() || "task lost its backing session"
			}));
		}
		if (task.deliveryStatus === "failed" && task.notifyPolicy !== "silent") findings.push(createFinding({
			severity: "warn",
			code: "delivery_failed",
			task,
			ageMs,
			detail: "terminal update delivery failed"
		}));
		if (task.status !== "lost" && task.status !== "queued" && task.status !== "running" && typeof task.cleanupAfter !== "number" && require_task_retention.resolveTaskCleanupAfter(task) !== void 0) findings.push(createFinding({
			severity: "warn",
			code: "missing_cleanup",
			task,
			ageMs,
			detail: "terminal task is missing cleanupAfter"
		}));
		const inconsistency = findTimestampInconsistency(task);
		if (inconsistency) findings.push(inconsistency);
	}
	return findings.toSorted(compareFindings);
}
function isRetainedLostTaskAuditFinding(finding, now = Date.now()) {
	const cleanupAfter = require_task_retention.resolveEffectiveTaskCleanupAfter(finding.task);
	return finding.code === "lost" && finding.task.status === "lost" && typeof finding.task.cleanupAfter === "number" && typeof cleanupAfter === "number" && cleanupAfter > now;
}
function summarizeTaskAuditFindings(findings) {
	const summary = require_task_registry_audit_shared.createEmptyTaskAuditSummary();
	for (const finding of findings) {
		summary.total += 1;
		summary.byCode[finding.code] += 1;
		if (finding.severity === "error") summary.errors += 1;
		else summary.warnings += 1;
	}
	return summary;
}
function summarizeActionableTaskAuditFindings(findings, options = {}) {
	const now = options.now ?? Date.now();
	return summarizeTaskAuditFindings(Array.from(findings).filter((finding) => !isRetainedLostTaskAuditFinding(finding, now)));
}
function summarizeRetainedLostTaskAuditFindings(findings, options = {}) {
	const now = options.now ?? Date.now();
	let count = 0;
	let nextCleanupAfter;
	for (const finding of findings) {
		if (!isRetainedLostTaskAuditFinding(finding, now)) continue;
		count += 1;
		const cleanupAfter = require_task_retention.resolveEffectiveTaskCleanupAfter(finding.task);
		if (typeof cleanupAfter === "number" && (nextCleanupAfter === void 0 || cleanupAfter < nextCleanupAfter)) nextCleanupAfter = cleanupAfter;
	}
	return {
		count,
		...nextCleanupAfter !== void 0 ? { nextCleanupAfter } : {}
	};
}
//#endregion
Object.defineProperty(exports, "configureTaskAuditTaskProvider", {
	enumerable: true,
	get: function() {
		return configureTaskAuditTaskProvider;
	}
});
Object.defineProperty(exports, "listTaskAuditFindings", {
	enumerable: true,
	get: function() {
		return listTaskAuditFindings;
	}
});
Object.defineProperty(exports, "summarizeActionableTaskAuditFindings", {
	enumerable: true,
	get: function() {
		return summarizeActionableTaskAuditFindings;
	}
});
Object.defineProperty(exports, "summarizeRetainedLostTaskAuditFindings", {
	enumerable: true,
	get: function() {
		return summarizeRetainedLostTaskAuditFindings;
	}
});
Object.defineProperty(exports, "summarizeTaskAuditFindings", {
	enumerable: true,
	get: function() {
		return summarizeTaskAuditFindings;
	}
});
