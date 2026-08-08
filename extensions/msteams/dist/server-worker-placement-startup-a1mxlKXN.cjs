const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_redact = require("./redact-Bg-yc44I.cjs");
const require_subsystem = require("./subsystem-DVRgVNGQ.cjs");
const require_service = require("./service-CKbfxdYW.cjs");
const require_lazy_runtime = require("./lazy-runtime-DALacTZz.cjs");
const require_errors = require("./errors-BqS4bzom.cjs");
const require_client_info = require("./client-info-C2lg7w_c.cjs");
const require_io = require("./io-DU1xmwPS.cjs");
require("./config-DT0qiglW.cjs");
const require_codex_plugin_diagnostics = require("./codex-plugin-diagnostics-DuedamAL.cjs");
const require_session_accessor = require("./session-accessor-D_W4fZCX.cjs");
const require_openai_routing = require("./openai-routing-B2l3ny9C.cjs");
const require_store = require("./store-DCwJguwr.cjs");
const require_session_manager = require("./session-manager-Bhv4hvYF.cjs");
const require_cleanup = require("./cleanup-Do0eFW35.cjs");
const require_worker_admission = require("./worker-admission-DNxVcwiA.cjs");
const require_worker_inference = require("./worker-inference-Dfl4hXJC.cjs");
const require_thinking_runtime = require("./thinking-runtime-CrpgBgYy.cjs");
const require_helpers = require("./helpers-Dc0ZP0I1.cjs");
const require_utils = require("./utils-CngUx0zS.cjs");
const require_session_placement_admission = require("./session-placement-admission-DVqcuHQn.cjs");
const require_workspace_reconcile = require("./workspace-reconcile-6o8I3TBU.cjs");
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let _gabrielvfonseca_normalization_core_utf16_slice = require("@gabrielvfonseca/normalization-core/utf16-slice");
let node_crypto = require("node:crypto");
let typebox_value = require("typebox/value");
//#region src/gateway/worker-environments/placement-dispatch-failure.ts
const RECOVERY_ERROR_LIMIT = 1024;
function boundedError(error) {
	return (0, _gabrielvfonseca_normalization_core_utf16_slice.truncateUtf16Safe)(require_redact.redactSensitiveText(require_errors.formatErrorMessage(error), { mode: "tools" }).replace(/\s+/gu, " ").trim() || "unknown dispatch failure", RECOVERY_ERROR_LIMIT);
}
function isUnavailableEnvironment(environment) {
	return environment.state === "draining" || environment.state === "destroying" || environment.state === "destroyed" || environment.state === "failed" || environment.state === "orphaned";
}
function createPlacementFailureActions(deps) {
	const { environments, placements } = deps;
	const updateFailure = (placement, error) => placements.fail({
		sessionId: placement.sessionId,
		expectedGeneration: placement.generation,
		recoveryError: boundedError(error)
	});
	const cleanupEnvironment = async (params) => {
		const teardownErrors = [];
		try {
			await environments.stopTunnel(params.environmentId, params.ownerEpoch ?? void 0);
		} catch (error) {
			teardownErrors.push(`tunnel stop: ${boundedError(error)}`);
		}
		try {
			await environments.destroy(params.environmentId);
		} catch (error) {
			teardownErrors.push(`environment destroy: ${boundedError(error)}`);
		}
		return teardownErrors;
	};
	const teardownEnvironment = async (params) => {
		const environmentId = params.environmentId;
		const teardownErrors = environmentId ? await cleanupEnvironment({
			environmentId,
			ownerEpoch: params.ownerEpoch
		}) : [];
		const recoveryError = [boundedError(params.primaryError), ...teardownErrors].join("; ");
		updateFailure(params.placement, new Error((0, _gabrielvfonseca_normalization_core_utf16_slice.truncateUtf16Safe)(recoveryError, RECOVERY_ERROR_LIMIT)));
	};
	const retryFailedTeardown = async (placement) => {
		if (!placement.environmentId) return;
		const environment = environments.get(placement.environmentId);
		if (!environment || environment.state === "destroyed" || environment.state === "failed" || environment.state === "orphaned") return;
		const teardownErrors = await cleanupEnvironment({
			environmentId: placement.environmentId,
			ownerEpoch: placement.activeOwnerEpoch
		});
		if (teardownErrors.length > 0) {
			const recoveryError = [placement.recoveryError, ...teardownErrors].filter(Boolean).join("; ");
			placements.fail({
				sessionId: placement.sessionId,
				expectedGeneration: placement.generation,
				recoveryError: (0, _gabrielvfonseca_normalization_core_utf16_slice.truncateUtf16Safe)(recoveryError, RECOVERY_ERROR_LIMIT)
			});
		}
	};
	const startDrain = (placement) => {
		const draining = placements.startDrain({
			sessionId: placement.sessionId,
			environmentId: placement.environmentId,
			ownerEpoch: placement.activeOwnerEpoch,
			expectedGeneration: placement.generation
		});
		if (draining.state !== "draining") throw new Error("Worker placement drain did not produce a draining placement");
		return draining;
	};
	const startReconcile = (placement) => {
		const reconciling = placements.startReconcile({
			sessionId: placement.sessionId,
			environmentId: placement.environmentId,
			ownerEpoch: placement.activeOwnerEpoch,
			expectedGeneration: placement.generation
		});
		if (reconciling.state !== "reconciling") throw new Error("Worker placement reconcile did not produce a reconciling placement");
		return reconciling;
	};
	const finishReconcilingFailure = (placement, error, teardownErrors) => {
		const recoveryError = [boundedError(error), ...teardownErrors].join("; ");
		updateFailure(placement, new Error((0, _gabrielvfonseca_normalization_core_utf16_slice.truncateUtf16Safe)(recoveryError, RECOVERY_ERROR_LIMIT)));
	};
	const failDraining = async (placement, error, options = {}) => {
		if (placement.turnClaim && !options.forceClaimFence) return;
		const current = placements.get(placement.sessionId);
		if (current?.state !== "draining") return;
		const reconciling = startReconcile(current);
		const teardownErrors = await cleanupEnvironment({
			environmentId: current.environmentId,
			ownerEpoch: current.activeOwnerEpoch
		});
		finishReconcilingFailure(reconciling, error, teardownErrors);
	};
	const reclaimActive = async (placement, environment, claimedTurnError) => {
		if (placement.turnClaim) {
			const draining = startDrain(placement);
			await failDraining(draining, claimedTurnError, { forceClaimFence: true });
			return;
		}
		const draining = startDrain(placement);
		if (draining.turnClaim) {
			await failDraining(draining, claimedTurnError, { forceClaimFence: true });
			return;
		}
		const reconciling = startReconcile(draining);
		if (environment && !isUnavailableEnvironment(environment)) {
			const teardownErrors = await cleanupEnvironment({
				environmentId: placement.environmentId,
				ownerEpoch: placement.activeOwnerEpoch
			});
			if (teardownErrors.length > 0) {
				finishReconcilingFailure(reconciling, /* @__PURE__ */ new Error(`Worker reclaim teardown failed: ${teardownErrors.join("; ")}`), []);
				return;
			}
		}
		placements.transition({
			sessionId: reconciling.sessionId,
			from: "reconciling",
			to: "reclaimed",
			expectedGeneration: reconciling.generation
		});
	};
	const failActive = async (placement, error, options = {}) => {
		const draining = startDrain(placement);
		await failDraining(draining, error, options);
	};
	return {
		failActive,
		failDraining,
		reclaimActive,
		retryFailedTeardown,
		teardownEnvironment
	};
}
//#endregion
//#region src/gateway/worker-environments/workspace-finalize.ts
/** Rechecks both owners after renewing the remote quiescence lease. */
async function verifyReconciledWorkspaceFinal(reconciliation, quiescence) {
	await reconciliation.verifyStable();
	await reconciliation.verifyLocalStable();
	await quiescence.assertActive();
	await reconciliation.verifyStable();
	await reconciliation.verifyLocalStable();
}
//#endregion
//#region src/gateway/worker-environments/placement-dispatch-recovery.ts
function sameActiveEnvironment(placement, environment) {
	return Boolean(environment && environment.state === "attached" && placement.environmentId && environment.environmentId === placement.environmentId && placement.activeOwnerEpoch !== null && environment.ownerEpoch === placement.activeOwnerEpoch && placement.workerBundleHash && environment.bootstrapReceipt?.bundleHash === placement.workerBundleHash && environment.attachedSessionIds.length === 1 && environment.attachedSessionIds[0] === placement.sessionId);
}
function isStartingPlacement(placement) {
	return placement.state === "starting";
}
function isFailedPlacement(placement) {
	return placement.state === "failed";
}
function createPlacementRecoveryActions(deps) {
	const { environments, failure, placements } = deps;
	const recoverPendingWorkspaceResults = async () => {
		for (const pending of placements.listPendingWorkspaceResults()) {
			const sameGatewayInstance = pending.gatewayInstanceId === placements.workspaceResultInstanceId();
			if (sameGatewayInstance && pending.recoveryRequestedAtMs === null) continue;
			const placement = placements.get(pending.sessionId);
			try {
				const claim = placement?.turnClaim;
				if (placement?.state !== "active" && placement?.state !== "draining" || placement.environmentId !== pending.environmentId || placement.activeOwnerEpoch !== pending.ownerEpoch || claim?.owner !== "worker" || claim.claimId !== pending.claimId || claim.runId !== pending.runId || claim.generation !== pending.placementGeneration || claim.ownerEpoch !== pending.ownerEpoch) {
					placements.abandonWorkspaceResult(pending);
					if (placement?.state === "active") await failure.failActive(placement, /* @__PURE__ */ new Error(`Pending cloud workspace result has no active claim: ${pending.sessionId}`), { forceClaimFence: true });
					else if (placement?.state === "draining") await failure.failDraining(placement, /* @__PURE__ */ new Error(`Pending cloud workspace result has no draining claim: ${pending.sessionId}`), { forceClaimFence: true });
					continue;
				}
				const turnClaim = {
					sessionId: placement.sessionId,
					claimId: claim.claimId,
					runId: claim.runId,
					placementGeneration: claim.generation,
					owner: {
						kind: "worker",
						environmentId: placement.environmentId,
						ownerEpoch: placement.activeOwnerEpoch
					}
				};
				const environment = environments.get(placement.environmentId);
				if (environment?.state === "attached" && environment.attachedSessionIds.includes(placement.sessionId) && environment.attachedSessionIds.length !== 1) continue;
				if (!sameActiveEnvironment(placement, environment)) {
					if (pending.workspaceAcceptedAtMs !== null && environment?.state === "destroyed") {
						placements.completeWorkspaceResultAndReleaseTurn(turnClaim, { reclaim: true });
						continue;
					}
					placements.abandonWorkspaceResult(pending);
					if (placement.state === "active") await failure.failActive(placement, /* @__PURE__ */ new Error(`Pending cloud workspace result lost its worker: ${pending.sessionId}`), { forceClaimFence: true });
					else await failure.failDraining(placement, /* @__PURE__ */ new Error(`Pending cloud workspace result lost its worker: ${pending.sessionId}`), { forceClaimFence: true });
					continue;
				}
				const localPath = await deps.resolveWorkspacePath({
					sessionId: placement.sessionId,
					sessionKey: placement.sessionKey,
					agentId: placement.agentId
				});
				const owner = {
					sessionId: placement.sessionId,
					environmentId: placement.environmentId,
					ownerEpoch: placement.activeOwnerEpoch,
					placementGeneration: placement.generation
				};
				const tunnel = await environments.startTunnel({
					environmentId: placement.environmentId,
					ownerEpoch: placement.activeOwnerEpoch
				});
				await deps.workspaceOperations.run(placement.environmentId, async () => {
					const owned = placements.get(placement.sessionId);
					const ownedClaim = owned?.turnClaim;
					if (owned?.state !== "active" && owned?.state !== "draining" || owned.generation !== placement.generation || owned.environmentId !== placement.environmentId || owned.activeOwnerEpoch !== placement.activeOwnerEpoch || ownedClaim?.owner !== "worker" || ownedClaim.claimId !== claim.claimId || ownedClaim.runId !== claim.runId) throw new Error("Recovered workspace result lost its placement owner");
					const quiescence = await tunnel.quiesceWorkspace(placement.remoteWorkspaceDir);
					let quiescenceHandled = false;
					try {
						await verifyReconciledWorkspaceFinal(await tunnel.reconcileWorkspace({
							localPath,
							remoteWorkspaceDir: placement.remoteWorkspaceDir,
							baseManifestRef: placement.workspaceBaseManifestRef,
							journal: {
								load: () => placements.loadWorkspaceReconciliation(owner),
								begin: (journal) => placements.beginWorkspaceReconciliation(owner, journal),
								commit: (manifestRef) => placements.updateWorkspaceBaseManifest({
									claim: turnClaim,
									manifestRef
								}),
								abort: () => placements.abortWorkspaceReconciliation(owner)
							}
						}), quiescence);
						placements.acceptWorkspaceResult(turnClaim);
						if (sameGatewayInstance) {
							await quiescence.resume();
							quiescenceHandled = true;
							placements.completeWorkspaceResultAndReleaseTurn(turnClaim);
						} else {
							await environments.destroy(placement.environmentId);
							quiescenceHandled = true;
							if (placements.completeWorkspaceResultAndReleaseTurn(turnClaim, { reclaim: true }).state !== "reclaimed") throw new Error("Recovered worker result did not reclaim its stale environment");
							await environments.stopTunnel(placement.environmentId, placement.activeOwnerEpoch).catch(() => void 0);
						}
					} finally {
						if (!quiescenceHandled) await quiescence.resume();
					}
				});
			} catch {}
		}
		return new Set(placements.listPendingWorkspaceResults().map((pending) => pending.sessionId));
	};
	const adoptActive = async (placement) => {
		if (placement.turnClaim) {
			const error = /* @__PURE__ */ new Error("Active worker turn claim cannot be proven live after gateway restart");
			await failure.failActive(placement, error, { forceClaimFence: true });
			return;
		}
		const environment = placement.environmentId ? environments.get(placement.environmentId) : void 0;
		if (!environment || isUnavailableEnvironment(environment)) {
			await failure.reclaimActive(placement, environment, /* @__PURE__ */ new Error("Active worker disappeared during restart reconciliation"));
			return;
		}
		if (!sameActiveEnvironment(placement, environment)) {
			await failure.reclaimActive(placement, environment, /* @__PURE__ */ new Error("Active worker placement does not match its environment owner"));
			return;
		}
		try {
			await environments.startTunnel({
				environmentId: environment.environmentId,
				ownerEpoch: environment.ownerEpoch
			});
			placements.adoptActive({
				sessionId: placement.sessionId,
				expectedGeneration: placement.generation,
				environmentId: environment.environmentId,
				ownerEpoch: environment.ownerEpoch
			});
		} catch (error) {
			await failure.failActive(placement, error);
		}
	};
	const resumeStarting = async (placement) => {
		const environment = placement.environmentId ? environments.get(placement.environmentId) : void 0;
		const expectedBundle = placement.workerBundleHash;
		const hasSyncedWorkspace = Boolean(placement.workspaceBaseManifestRef && placement.remoteWorkspaceDir);
		if (!(environment && expectedBundle && environment.bootstrapReceipt?.bundleHash === expectedBundle && hasSyncedWorkspace)) {
			const error = /* @__PURE__ */ new Error("Interrupted worker dispatch cannot safely resume");
			await failure.teardownEnvironment({
				placement,
				environmentId: placement.environmentId,
				ownerEpoch: environment?.ownerEpoch ?? null,
				primaryError: error
			});
			return;
		}
		try {
			const ownerEpoch = environment.state === "attached" && environment.attachedSessionIds.length === 1 && environment.attachedSessionIds[0] === placement.sessionId ? environment.ownerEpoch : environment.state === "ready" || environment.state === "idle" ? (await environments.attachSession({
				environmentId: environment.environmentId,
				ownerEpoch: environment.ownerEpoch,
				sessionId: placement.sessionId
			})).ownerEpoch : void 0;
			if (ownerEpoch === void 0) throw new Error(`Worker environment cannot resume dispatch from ${environment.state}`);
			await environments.startTunnel({
				environmentId: environment.environmentId,
				ownerEpoch
			});
			await deps.runActivationBarrier({
				sessionId: placement.sessionId,
				sessionKey: placement.sessionKey,
				agentId: placement.agentId,
				activate: () => {
					const activated = placements.transition({
						sessionId: placement.sessionId,
						from: "starting",
						to: "active",
						expectedGeneration: placement.generation,
						patch: { activeOwnerEpoch: ownerEpoch }
					});
					if (activated.state !== "active") throw new Error("Worker dispatch activation did not produce an active placement");
					return activated;
				}
			});
		} catch (error) {
			await failure.teardownEnvironment({
				placement,
				environmentId: environment.environmentId,
				ownerEpoch: environment.ownerEpoch,
				primaryError: error
			});
		}
	};
	const reconcile = async () => {
		await environments.reconcileOnce();
		const pendingResultOwners = await recoverPendingWorkspaceResults();
		const journalOwners = new Set(placements.listWorkspaceReconciliationOwners().map((owner) => owner.sessionId));
		for (const placement of placements.listForReconcile()) {
			if (journalOwners.has(placement.sessionId) || pendingResultOwners.has(placement.sessionId)) continue;
			if (placement.state === "local" || placement.state === "reclaimed") continue;
			if (placement.state === "active") {
				await adoptActive(placement);
				continue;
			}
			if (isFailedPlacement(placement)) {
				await failure.retryFailedTeardown(placement);
				continue;
			}
			if (isStartingPlacement(placement)) {
				await resumeStarting(placement);
				continue;
			}
			const error = /* @__PURE__ */ new Error(`Worker dispatch interrupted in ${placement.state}`);
			if (placement.state === "draining") {
				await failure.failDraining(placement, error, { forceClaimFence: true });
				continue;
			}
			await failure.teardownEnvironment({
				placement,
				environmentId: placement.environmentId,
				ownerEpoch: placement.activeOwnerEpoch,
				primaryError: error
			});
		}
	};
	const reconcileActive = async (environmentId) => {
		await environments.reconcileOnce();
		const pendingResultOwners = await recoverPendingWorkspaceResults();
		const journalOwners = new Set(placements.listWorkspaceReconciliationOwners().map((owner) => owner.sessionId));
		for (const placement of placements.listForReconcile()) {
			if (journalOwners.has(placement.sessionId) || pendingResultOwners.has(placement.sessionId)) continue;
			if (environmentId !== void 0 && placement.environmentId !== environmentId) continue;
			if (isFailedPlacement(placement)) {
				await failure.retryFailedTeardown(placement);
				continue;
			}
			if (placement.state !== "active") continue;
			const environment = environments.get(placement.environmentId);
			if (!environment || isUnavailableEnvironment(environment)) {
				await failure.reclaimActive(placement, environment, /* @__PURE__ */ new Error("Active worker disappeared during an admitted turn"));
				continue;
			}
			if (!sameActiveEnvironment(placement, environment)) await failure.reclaimActive(placement, environment, /* @__PURE__ */ new Error("Active worker placement does not match its environment owner"));
		}
	};
	return {
		reconcile,
		reconcileActive
	};
}
//#endregion
//#region src/gateway/worker-environments/placement-force-abandon.ts
async function forceAbandonWorkerEnvironment(params) {
	const { environmentId, placements } = params;
	const recoveryError = "Cloud worker result abandoned by forced operator teardown";
	for (const owner of placements.listWorkspaceReconciliationOwners()) {
		if (owner.environmentId !== environmentId) continue;
		const placement = placements.get(owner.sessionId);
		if (placement?.state !== "active" && placement?.state !== "draining" || placement.environmentId !== owner.environmentId || placement.activeOwnerEpoch !== owner.ownerEpoch || placement.generation !== owner.placementGeneration) throw new Error(`Forced teardown found a stale workspace journal: ${owner.sessionId}`);
		const journal = placements.loadWorkspaceReconciliation(owner);
		if (journal) {
			await require_workspace_reconcile.recoverWorkerWorkspaceReconciliation({
				root: await params.resolveWorkspacePath(placement),
				journal
			});
			placements.abortWorkspaceReconciliation(owner);
		}
	}
	for (const pending of placements.listPendingWorkspaceResults()) if (pending.environmentId === environmentId) placements.abandonWorkspaceResult(pending);
	for (const placement of placements.listForReconcile()) {
		if (placement.environmentId !== environmentId) continue;
		let current = placements.get(placement.sessionId);
		if (current?.state === "active") current = placements.startDrain({
			sessionId: current.sessionId,
			environmentId: current.environmentId,
			ownerEpoch: current.activeOwnerEpoch,
			expectedGeneration: current.generation
		});
		if (current?.state === "draining") current = placements.startReconcile({
			sessionId: current.sessionId,
			environmentId: current.environmentId,
			ownerEpoch: current.activeOwnerEpoch,
			expectedGeneration: current.generation
		});
		if (current && current.state !== "failed") placements.fail({
			sessionId: current.sessionId,
			expectedGeneration: current.generation,
			recoveryError
		});
	}
}
//#endregion
//#region src/gateway/worker-environments/placement-dispatch.ts
function requireProvisionedEnvironment(environment, expectedEnvironmentId) {
	if (environment.state !== "ready" && environment.state !== "idle" || !environment.bootstrapReceipt || environment.environmentId !== expectedEnvironmentId) throw new Error(`Worker environment is not dispatchable: ${environment.state}`);
	return {
		environmentId: environment.environmentId,
		ownerEpoch: environment.ownerEpoch,
		bundleHash: environment.bootstrapReceipt.bundleHash
	};
}
function createWorkerPlacementDispatchService(options) {
	const { environments, placements } = options;
	const failure = createPlacementFailureActions({
		environments,
		placements
	});
	const recovery = createPlacementRecoveryActions({
		environments,
		failure,
		placements,
		runActivationBarrier: options.runActivationBarrier,
		resolveWorkspacePath: options.resolveWorkspacePath,
		workspaceOperations: options.workspaceOperations
	});
	const dispatch = async (request) => {
		let placement;
		let environmentId = null;
		let ownerEpoch = null;
		try {
			placement = await options.runLocalBarrier({
				sessionId: request.sessionId,
				sessionKey: request.sessionKey,
				agentId: request.agentId,
				startDispatch: () => {
					placement = placements.startDispatch({
						sessionId: request.sessionId,
						sessionKey: request.sessionKey,
						agentId: request.agentId
					});
					return placement;
				}
			});
			const localPath = await options.resolveWorkspacePath(request);
			const idempotencyKey = `session-dispatch:${request.sessionId}:${placement.generation}`;
			const expectedEnvironmentId = require_service.workerEnvironmentIdForIdempotencyKey(idempotencyKey);
			placement = placements.transition({
				sessionId: request.sessionId,
				from: "requested",
				to: "provisioning",
				expectedGeneration: placement.generation,
				patch: { environmentId: expectedEnvironmentId }
			});
			const provisioned = requireProvisionedEnvironment(await environments.create(request.profileId, idempotencyKey), expectedEnvironmentId);
			environmentId = provisioned.environmentId;
			ownerEpoch = provisioned.ownerEpoch;
			placement = placements.transition({
				sessionId: request.sessionId,
				from: "provisioning",
				to: "syncing",
				expectedGeneration: placement.generation,
				patch: {
					environmentId,
					workerBundleHash: provisioned.bundleHash
				}
			});
			const synced = await (await environments.startTunnel({
				environmentId,
				ownerEpoch
			})).syncWorkspace({
				localPath,
				sessionId: request.sessionId,
				generation: placement.generation
			});
			placement = placements.transition({
				sessionId: request.sessionId,
				from: "syncing",
				to: "starting",
				expectedGeneration: placement.generation,
				patch: {
					workspaceBaseManifestRef: synced.manifestRef,
					remoteWorkspaceDir: synced.remoteWorkspaceDir
				}
			});
			ownerEpoch = (await environments.attachSession({
				environmentId,
				ownerEpoch,
				sessionId: request.sessionId
			})).ownerEpoch;
			await environments.startTunnel({
				environmentId,
				ownerEpoch
			});
			const startingPlacement = placement;
			return await options.runActivationBarrier({
				sessionId: request.sessionId,
				sessionKey: request.sessionKey,
				agentId: request.agentId,
				activate: () => {
					const activated = placements.transition({
						sessionId: request.sessionId,
						from: "starting",
						to: "active",
						expectedGeneration: startingPlacement.generation,
						patch: { activeOwnerEpoch: ownerEpoch }
					});
					if (activated.state !== "active") throw new Error("Worker dispatch activation did not produce an active placement");
					return activated;
				}
			});
		} catch (error) {
			const current = placement ? placements.get(request.sessionId) : void 0;
			if (current && current.state !== "local" && current.state !== "reclaimed") if (current.state === "active") await failure.failActive(current, error);
			else {
				const currentEnvironmentId = environmentId ?? current.environmentId;
				const currentEnvironment = currentEnvironmentId ? environments.get(currentEnvironmentId) : void 0;
				await failure.teardownEnvironment({
					placement: current,
					environmentId: currentEnvironment?.environmentId ?? null,
					ownerEpoch: ownerEpoch ?? currentEnvironment?.ownerEpoch ?? null,
					primaryError: error
				});
			}
			throw error;
		}
	};
	const reclaimOnce = async (request) => await options.runReclaimBarrier({
		...request,
		reclaim: async (localPath) => {
			const current = placements.get(request.sessionId);
			if (current?.state !== "active" || current.turnClaim) throw new Error(`Session ${request.sessionKey} cannot stop cloud worker from placement ${current?.state ?? "missing"}`);
			const environment = environments.get(current.environmentId);
			if (environment?.state !== "attached" || environment.ownerEpoch !== current.activeOwnerEpoch || environment.attachedSessionIds.length !== 1 || environment.attachedSessionIds[0] !== current.sessionId) throw new Error("Active cloud worker does not match its session placement");
			const journalOwner = {
				sessionId: current.sessionId,
				environmentId: current.environmentId,
				ownerEpoch: current.activeOwnerEpoch,
				placementGeneration: current.generation
			};
			let accepted;
			const journal = {
				load: () => placements.loadWorkspaceReconciliation(journalOwner),
				begin: (next) => placements.beginWorkspaceReconciliation(journalOwner, next),
				commit: (manifestRef) => {
					const next = placements.acceptIdleWorkspaceReconciliation({
						sessionId: current.sessionId,
						environmentId: current.environmentId,
						ownerEpoch: current.activeOwnerEpoch,
						expectedGeneration: current.generation,
						manifestRef
					});
					if (next.state !== "active") throw new Error("Cloud worker stop did not accept its reconciled workspace");
					accepted = next;
				},
				abort: () => placements.abortWorkspaceReconciliation(journalOwner)
			};
			const pending = journal.load();
			if (pending) {
				await require_workspace_reconcile.recoverWorkerWorkspaceReconciliation({
					root: localPath,
					journal: pending
				});
				journal.abort();
			}
			const tunnel = await environments.startTunnel({
				environmentId: current.environmentId,
				ownerEpoch: current.activeOwnerEpoch
			});
			const acceptedPlacement = await options.workspaceOperations.run(current.environmentId, async () => {
				const owned = placements.get(current.sessionId);
				if (owned?.state !== "active" || owned.generation !== current.generation || owned.environmentId !== current.environmentId || owned.activeOwnerEpoch !== current.activeOwnerEpoch || owned.turnClaim) throw new Error("Cloud worker stop lost its placement owner before reconciliation");
				const quiescence = await tunnel.quiesceWorkspace(current.remoteWorkspaceDir);
				let destroyed = false;
				try {
					const reconciliation = await tunnel.reconcileWorkspace({
						localPath,
						remoteWorkspaceDir: current.remoteWorkspaceDir,
						baseManifestRef: current.workspaceBaseManifestRef,
						journal
					});
					if (!accepted) throw new Error("Cloud worker stop did not commit its reconciled workspace");
					await verifyReconciledWorkspaceFinal(reconciliation, quiescence);
					await environments.destroy(current.environmentId);
					destroyed = true;
					return accepted;
				} finally {
					if (!destroyed) await quiescence.resume();
				}
			});
			try {
				await environments.stopTunnel(current.environmentId, current.activeOwnerEpoch);
			} catch {}
			const reclaimed = placements.finishReclaim({
				sessionId: acceptedPlacement.sessionId,
				environmentId: acceptedPlacement.environmentId,
				ownerEpoch: acceptedPlacement.activeOwnerEpoch,
				expectedGeneration: acceptedPlacement.generation
			});
			if (reclaimed.state !== "reclaimed") throw new Error("Cloud worker stop did not produce a reclaimed placement");
			return reclaimed;
		}
	});
	const reclaimInFlight = /* @__PURE__ */ new Map();
	const reclaim = async (request) => {
		const current = placements.get(request.sessionId);
		if (current?.state === "reclaimed") return current;
		const inFlight = reclaimInFlight.get(request.sessionId);
		if (inFlight) return await inFlight;
		const operation = reclaimOnce(request);
		reclaimInFlight.set(request.sessionId, operation);
		try {
			return await operation;
		} finally {
			if (reclaimInFlight.get(request.sessionId) === operation) reclaimInFlight.delete(request.sessionId);
		}
	};
	return {
		dispatch,
		forceDestroyEnvironment: (environmentId) => options.workspaceOperations.run(environmentId, async () => {
			await forceAbandonWorkerEnvironment({
				placements,
				environmentId,
				resolveWorkspacePath: options.resolveWorkspacePath
			});
			return await environments.destroy(environmentId);
		}),
		reclaim,
		reconcile: recovery.reconcile,
		reconcileActive: recovery.reconcileActive
	};
}
//#endregion
//#region src/gateway/worker-environments/reclaimed-placement-redispatch.ts
function createReclaimedPlacementRedispatch(params) {
	return async (placement) => {
		const previousEnvironment = params.environments.get(placement.environmentId);
		if (!previousEnvironment) throw new Error(`Reclaimed worker placement has no environment record: ${placement.environmentId}`);
		return await params.dispatch({
			sessionId: placement.sessionId,
			sessionKey: placement.sessionKey,
			agentId: placement.agentId,
			profileId: previousEnvironment.profileId
		});
	};
}
//#endregion
//#region src/worker/transcript-message.ts
const SIZE_FRAME_ID = "00000000-0000-4000-8000-000000000000";
function cloneTextContent(part) {
	return {
		type: "text",
		text: part.text,
		...part.textSignature ? { textSignature: part.textSignature } : {}
	};
}
function cloneImageContent(part) {
	return {
		type: "image",
		data: part.data,
		mimeType: part.mimeType
	};
}
function cloneUsage(message) {
	return {
		role: "assistant",
		content: message.content.map((part) => {
			if (part.type === "text") return cloneTextContent(part);
			if (part.type === "thinking") return {
				type: "thinking",
				thinking: part.thinking,
				...part.thinkingSignature ? { thinkingSignature: part.thinkingSignature } : {},
				...part.redacted === void 0 ? {} : { redacted: part.redacted }
			};
			return {
				type: "toolCall",
				id: part.id,
				name: part.name,
				arguments: structuredClone(part.arguments),
				...part.thoughtSignature ? { thoughtSignature: part.thoughtSignature } : {},
				...part.executionMode ? { executionMode: part.executionMode } : {}
			};
		}),
		api: message.api,
		provider: message.provider,
		model: message.model,
		...message.responseModel ? { responseModel: message.responseModel } : {},
		...message.responseId ? { responseId: message.responseId } : {},
		...message.diagnostics ? { diagnostics: message.diagnostics.map((diagnostic) => ({
			type: diagnostic.type,
			timestamp: diagnostic.timestamp,
			...diagnostic.error ? { error: {
				...diagnostic.error.name ? { name: diagnostic.error.name } : {},
				message: diagnostic.error.message,
				...diagnostic.error.stack ? { stack: diagnostic.error.stack } : {},
				...diagnostic.error.code === void 0 ? {} : { code: diagnostic.error.code }
			} } : {},
			...diagnostic.details ? { details: structuredClone(diagnostic.details) } : {}
		})) } : {},
		usage: {
			input: message.usage.input,
			output: message.usage.output,
			cacheRead: message.usage.cacheRead,
			cacheWrite: message.usage.cacheWrite,
			...message.usage.contextUsage ? { contextUsage: structuredClone(message.usage.contextUsage) } : {},
			totalTokens: message.usage.totalTokens,
			cost: {
				input: message.usage.cost.input,
				output: message.usage.cost.output,
				cacheRead: message.usage.cost.cacheRead,
				cacheWrite: message.usage.cost.cacheWrite,
				total: message.usage.cost.total,
				...message.usage.cost.totalOrigin ? { totalOrigin: message.usage.cost.totalOrigin } : {}
			}
		},
		stopReason: message.stopReason,
		...message.errorMessage ? { errorMessage: message.errorMessage } : {},
		...message.errorCode ? { errorCode: message.errorCode } : {},
		...message.errorType ? { errorType: message.errorType } : {},
		...message.errorBody ? { errorBody: message.errorBody } : {},
		timestamp: message.timestamp
	};
}
function toWorkerTranscriptMessage(message) {
	if (message.role === "user") return {
		role: "user",
		content: typeof message.content === "string" ? [{
			type: "text",
			text: message.content
		}] : message.content.map((part) => part.type === "text" ? cloneTextContent(part) : cloneImageContent(part)),
		timestamp: message.timestamp
	};
	if (message.role === "assistant") return cloneUsage(message);
	if (message.role === "toolResult") return {
		role: "toolResult",
		toolCallId: message.toolCallId,
		toolName: message.toolName,
		content: message.content.map((part) => part.type === "text" ? cloneTextContent(part) : cloneImageContent(part)),
		...message.details === void 0 ? {} : { details: structuredClone(message.details) },
		isError: message.isError,
		timestamp: message.timestamp
	};
}
function isWorkerTranscriptMessageFrameSafe(message) {
	const frame = {
		type: "req",
		id: SIZE_FRAME_ID,
		method: "worker.transcript.commit",
		params: {
			runEpoch: Number.MAX_SAFE_INTEGER,
			seq: Number.MAX_SAFE_INTEGER,
			baseLeafId: "x".repeat(256),
			messages: [message]
		}
	};
	try {
		return Buffer.byteLength(JSON.stringify(frame), "utf8") <= require_worker_admission.WORKER_PROTOCOL_MAX_PAYLOAD_BYTES;
	} catch {
		return false;
	}
}
//#endregion
//#region src/worker/launch-descriptor.ts
const LAUNCH_VERSION = 1;
function isRecord(value) {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}
function hasExactKeys(value, required, optional = []) {
	const allowed = /* @__PURE__ */ new Set([...required, ...optional]);
	return required.every((key) => key in value) && Object.keys(value).every((key) => allowed.has(key));
}
function isIdentifier(value) {
	return typeof value === "string" && value.trim() === value && value.length > 0 && value.length <= 256;
}
function isSafeSequence(value, minimum) {
	return Number.isSafeInteger(value) && typeof value === "number" && value >= minimum;
}
function isInferenceOptions(value) {
	return typebox_value.Value.Check(require_worker_inference.WorkerInferenceOptionsSchema, value);
}
function parseAssignment(value) {
	if (!isRecord(value) || !hasExactKeys(value, [
		"runId",
		"turnId",
		"prompt",
		"suppressPromptTranscript",
		"workspaceDir",
		"modelRef",
		"inferenceOptions",
		"initialMessages",
		"transcript",
		"liveEvents"
	], ["systemPrompt"])) return;
	if (!isIdentifier(value.runId) || !isIdentifier(value.turnId) || typeof value.prompt !== "string" || typeof value.suppressPromptTranscript !== "boolean" || !isIdentifier(value.workspaceDir) || !node_path.default.isAbsolute(value.workspaceDir) || value.systemPrompt !== void 0 && typeof value.systemPrompt !== "string" || !Array.isArray(value.initialMessages) || value.initialMessages.length > 1024 || !value.initialMessages.every((message) => typebox_value.Value.Check(require_worker_admission.WorkerTranscriptMessageSchema, message))) return;
	if (!typebox_value.Value.Check(require_worker_inference.WorkerInferenceModelRefSchema, value.modelRef) || !isInferenceOptions(value.inferenceOptions)) return;
	if (!isRecord(value.transcript) || !hasExactKeys(value.transcript, ["baseLeafId", "nextSeq"]) || value.transcript.baseLeafId !== null && !isIdentifier(value.transcript.baseLeafId) || !isSafeSequence(value.transcript.nextSeq, 1)) return;
	if (!isRecord(value.liveEvents) || !hasExactKeys(value.liveEvents, ["ackedSeq", "nextSeq"]) || !isSafeSequence(value.liveEvents.ackedSeq, 0) || !isSafeSequence(value.liveEvents.nextSeq, 1) || value.liveEvents.nextSeq !== value.liveEvents.ackedSeq + 1) return;
	return value;
}
function buildWorkerConnectParams(descriptor) {
	return {
		minProtocol: 4,
		maxProtocol: 4,
		client: {
			id: require_client_info.GATEWAY_CLIENT_IDS.WORKER,
			version: descriptor.admission.handshake.operatorVersion,
			platform: process.platform,
			mode: require_client_info.GATEWAY_CLIENT_MODES.WORKER
		},
		role: "worker",
		admission: {
			...descriptor.admission,
			runId: descriptor.assignment.runId
		}
	};
}
function parseWorkerLaunchDescriptor(value) {
	if (!isRecord(value) || !hasExactKeys(value, [
		"version",
		"socketPath",
		"admission",
		"assignment"
	]) || value.version !== LAUNCH_VERSION || !isIdentifier(value.socketPath) || !node_path.default.isAbsolute(value.socketPath)) throw new Error("invalid worker launch descriptor");
	const assignment = parseAssignment(value.assignment);
	if (!assignment || !isRecord(value.admission)) throw new Error("invalid worker launch descriptor");
	const candidate = {
		version: LAUNCH_VERSION,
		socketPath: value.socketPath,
		admission: value.admission,
		assignment
	};
	const frame = {
		type: "req",
		id: "launch-validation",
		method: "connect",
		params: buildWorkerConnectParams(candidate)
	};
	if (!typebox_value.Value.Check(require_worker_admission.WorkerConnectRequestFrameSchema, frame) || candidate.admission.sessionId === null || candidate.admission.ownerEpoch < 1 || !isWorkerTranscriptMessageFrameSafe({
		role: "user",
		content: [{
			type: "text",
			text: candidate.assignment.prompt
		}],
		timestamp: Number.MAX_SAFE_INTEGER
	})) throw new Error("invalid worker launch descriptor");
	return candidate;
}
//#endregion
//#region src/gateway/worker-environments/worker-turn-payload.ts
function windowInitialMessages(messages) {
	const projected = messages.flatMap((message) => {
		const value = toWorkerTranscriptMessage(message);
		return value ? [value] : [];
	});
	if (projected.length <= 1024) return projected;
	const minimumStart = projected.length - require_worker_inference.WORKER_INFERENCE_MAX_CONTEXT_MESSAGES;
	const completeTurnStart = projected.findIndex((message, index) => index >= minimumStart && message.role === "user");
	if (completeTurnStart < 0) throw new Error("Worker turn transcript has no complete context window");
	return projected.slice(completeTurnStart);
}
function fitLaunchDescriptor(build, messages) {
	let initialMessages = messages;
	while (true) {
		const descriptor = build(initialMessages);
		if (Buffer.byteLength(JSON.stringify(descriptor), "utf8") <= 26214400) return descriptor;
		const nextTurn = initialMessages.findIndex((message, index) => index > 0 && message.role === "user");
		if (nextTurn < 0) throw new Error("Worker turn context exceeds the launch descriptor payload limit");
		initialMessages = initialMessages.slice(nextTurn);
	}
}
function parseRuntimeResult(stdout) {
	let value;
	try {
		value = JSON.parse(stdout.trim());
	} catch (error) {
		throw new Error("Worker process returned invalid output", { cause: error });
	}
	if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Worker process returned invalid output");
	const result = value;
	if (result.status === "failed" && result.reason === "turn-failed" && Object.keys(result).every((key) => ["status", "reason"].includes(key))) return result;
	if (result.status === "completed" && (result.transcriptLeafId === null || typeof result.transcriptLeafId === "string") && typeof result.transcriptNextSeq === "number" && Number.isSafeInteger(result.transcriptNextSeq) && result.transcriptNextSeq >= 1 && Object.keys(result).every((key) => [
		"status",
		"transcriptLeafId",
		"transcriptNextSeq"
	].includes(key))) return result;
	if (result.status === "fenced" && (result.reason === "credential-replaced" || result.reason === "owner-epoch-mismatch") && Object.keys(result).every((key) => ["status", "reason"].includes(key))) return result;
	throw new Error("Worker process returned invalid output");
}
function assistantText(message) {
	if (message.role !== "assistant") return "";
	return message.content.flatMap((part) => part.type === "text" ? [part.text] : []).join("");
}
function buildWorkerAgentMeta(params) {
	const usageAccumulator = require_helpers.createUsageAccumulator();
	const assistants = params.messages.filter((message) => message.role === "assistant");
	let lastRunPromptUsage;
	for (const assistant of assistants) {
		const usage = require_session_accessor.normalizeUsage(assistant.usage);
		require_helpers.mergeUsageIntoAccumulator(usageAccumulator, usage);
		if (require_session_accessor.hasNonzeroUsage(usage)) lastRunPromptUsage = usage;
	}
	const lastAssistant = assistants.at(-1);
	const usageMeta = require_helpers.buildUsageAgentMetaFields({
		usageAccumulator,
		lastAssistantUsage: lastAssistant?.usage,
		lastRunPromptUsage,
		lastTurnTotal: lastRunPromptUsage?.total
	});
	const reportedModelRef = require_helpers.resolveReportedModelRef({
		...params.modelRef,
		assistant: lastAssistant
	});
	return {
		provider: reportedModelRef.provider,
		model: reportedModelRef.model,
		usage: usageMeta.usage,
		lastCallUsage: usageMeta.lastCallUsage,
		promptTokens: usageMeta.promptTokens
	};
}
function resolveTurnModelRef(params) {
	const explicitProvider = params.provider?.trim();
	const explicitModel = params.model?.trim();
	const defaults = explicitProvider && explicitModel ? void 0 : require_codex_plugin_diagnostics.resolveDefaultModelForAgent({
		cfg: params.config ?? {},
		agentId: params.agentId
	});
	return {
		provider: explicitProvider ?? defaults?.provider ?? "",
		model: explicitModel ?? defaults?.model ?? ""
	};
}
function assertSupportedTurn(params) {
	if (params.images?.length || params.imageOrder?.length) throw new Error("Cloud worker turns do not yet support current-turn image input");
	if (params.clientTools?.length) throw new Error("Cloud worker turns do not support client-provided tools");
	const modelRef = resolveTurnModelRef(params);
	const explicitRuntime = require_openai_routing.normalizeOptionalAgentRuntimeId(params.agentHarnessId) ?? require_openai_routing.normalizeOptionalAgentRuntimeId(params.agentHarnessRuntimeOverride);
	const runtime = explicitRuntime && !require_openai_routing.isDefaultAgentRuntimeId(explicitRuntime) ? explicitRuntime : require_thinking_runtime.resolveEffectiveAgentRuntime({
		cfg: params.config ?? {},
		provider: modelRef.provider,
		modelId: modelRef.model,
		agentId: params.agentId,
		sessionKey: params.sessionKey
	});
	if (runtime !== "@gabrielvfonseca/operator") throw new Error(`Cloud worker turns require the Operator runtime, not ${runtime}`);
	return modelRef;
}
//#endregion
//#region src/gateway/worker-environments/workspace-operation-coordinator.ts
/** Serializes local workspace mutation and forced teardown per environment. */
function createWorkerWorkspaceOperationCoordinator() {
	const tails = /* @__PURE__ */ new Map();
	return { async run(environmentId, operation) {
		const result = (tails.get(environmentId) ?? Promise.resolve()).catch(() => void 0).then(operation);
		const tail = result.then(() => void 0, () => void 0);
		tails.set(environmentId, tail);
		tail.finally(() => {
			if (tails.get(environmentId) === tail) tails.delete(environmentId);
		});
		return await result;
	} };
}
//#endregion
//#region src/gateway/worker-environments/worker-turn-launcher.ts
const WORKER_LAUNCH_SCRIPT = "exec node \"$HOME/.operator-worker/$1/operator.mjs\" worker";
var WorkerTurnExecutionError = class extends Error {};
var WorkerWorkspaceReconciliationError = class extends Error {};
function required(value, field) {
	const normalized = value?.trim();
	if (!normalized) throw new Error(`Worker turn ${field} is required`);
	return normalized;
}
async function waitForTurnOperation(params) {
	const timeout = AbortSignal.timeout(params.timeoutMs);
	const signal = params.signal ? AbortSignal.any([params.signal, timeout]) : timeout;
	const abortError = () => signal.reason instanceof Error ? signal.reason : new Error("Cloud worker operation aborted", { cause: signal.reason });
	if (signal.aborted) throw abortError();
	return await new Promise((resolve, reject) => {
		const onAbort = () => reject(abortError());
		signal.addEventListener("abort", onAbort, { once: true });
		params.operation.then(resolve, reject).finally(() => {
			signal.removeEventListener("abort", onAbort);
		});
	});
}
function resolvePlacementIdentity(claim, placement) {
	return {
		sessionId: claim.sessionId,
		agentId: placement?.agentId ?? required(claim.agentId, "agent id"),
		sessionKey: placement?.sessionKey ?? required(claim.sessionKey, "session key")
	};
}
function requireActivePlacement(placement) {
	if (placement.state !== "active" || !placement.remoteWorkspaceDir || !placement.workerBundleHash) throw new Error(`Worker turn rejected in placement ${placement.state}`);
	return placement;
}
function releaseClaimIfOwned(placements, turnClaim) {
	if (placements.validateTurnClaim(turnClaim)) placements.releaseTurn(turnClaim);
}
async function executeLocalTurn(params) {
	const current = params.placements.get(params.claim.sessionId);
	const turnClaim = params.placements.claimTurn({
		...resolvePlacementIdentity(params.claim, current),
		claimId: (0, node_crypto.randomUUID)(),
		runId: params.claim.runId,
		owner: { kind: "local" }
	});
	try {
		return await params.runLocal();
	} finally {
		releaseClaimIfOwned(params.placements, turnClaim);
	}
}
function recoveryError(error) {
	return (0, _gabrielvfonseca_normalization_core_utf16_slice.truncateUtf16Safe)(require_redact.redactSensitiveText(require_errors.formatErrorMessage(error), { mode: "tools" }).replace(/\s+/gu, " ").trim() || "cloud worker turn failed", 1024);
}
async function failHandedOffTurn(params) {
	const failures = [recoveryError(params.error)];
	let draining;
	try {
		draining = params.placements.startDrain({
			sessionId: params.placement.sessionId,
			environmentId: params.placement.environmentId,
			ownerEpoch: params.placement.activeOwnerEpoch,
			expectedGeneration: params.placement.generation
		});
	} catch {
		return;
	}
	if (draining.state !== "draining") return;
	releaseClaimIfOwned(params.placements, params.turnClaim);
	try {
		await params.environments.stopTunnel(params.placement.environmentId, params.placement.activeOwnerEpoch);
	} catch (error) {
		failures.push(`tunnel stop: ${recoveryError(error)}`);
	}
	try {
		await params.environments.destroy(params.placement.environmentId);
	} catch (error) {
		failures.push(`environment destroy: ${recoveryError(error)}`);
	}
	try {
		const reconciling = params.placements.startReconcile({
			sessionId: draining.sessionId,
			environmentId: draining.environmentId,
			ownerEpoch: draining.activeOwnerEpoch,
			expectedGeneration: draining.generation
		});
		if (reconciling.state !== "reconciling") return;
		params.placements.fail({
			sessionId: reconciling.sessionId,
			expectedGeneration: reconciling.generation,
			recoveryError: (0, _gabrielvfonseca_normalization_core_utf16_slice.truncateUtf16Safe)(failures.join("; "), 1024)
		});
	} catch {}
}
async function executeWorkerTurn(params) {
	const { placement, turn } = params;
	const modelRef = assertSupportedTurn(turn);
	const environment = params.environments.get(placement.environmentId);
	if (environment?.state !== "attached" || environment.ownerEpoch !== placement.activeOwnerEpoch || environment.bootstrapReceipt?.bundleHash !== placement.workerBundleHash || environment.attachedSessionIds.length !== 1 || environment.attachedSessionIds[0] !== placement.sessionId) throw new Error("Active worker placement does not match its attached environment");
	let manifestAccepted = false;
	let journalOwner = {
		sessionId: placement.sessionId,
		environmentId: placement.environmentId,
		ownerEpoch: placement.activeOwnerEpoch,
		placementGeneration: placement.generation
	};
	const journal = {
		load: () => params.placements.loadWorkspaceReconciliation(journalOwner),
		begin: (next) => params.placements.beginWorkspaceReconciliation(journalOwner, next),
		commit: (manifestRef) => {
			params.placements.updateWorkspaceBaseManifest({
				claim: params.turnClaim,
				manifestRef
			});
			manifestAccepted = true;
		},
		abort: () => params.placements.abortWorkspaceReconciliation(journalOwner)
	};
	try {
		await params.workspaceOperations.run(placement.environmentId, async () => {
			if (!params.placements.validateTurnClaim(params.turnClaim)) throw new Error("Cloud worker workspace recovery lost its turn claim");
			const pending = journal.load();
			if (pending) {
				await require_workspace_reconcile.recoverWorkerWorkspaceReconciliation({
					root: turn.workspaceDir,
					journal: pending
				});
				journal.abort();
			}
		});
	} catch (error) {
		throw new WorkerWorkspaceReconciliationError(`Cloud worker workspace recovery could not complete: ${recoveryError(error)}`, { cause: error });
	}
	const startedAt = Date.now();
	turn.onExecutionStarted?.({ lifecycleGeneration: turn.lifecycleGeneration });
	turn.onExecutionPhase?.({
		phase: "runner_entered",
		backend: "cloud-worker"
	});
	const manager = require_session_manager.SessionManager.open(turn.sessionFile);
	const userMessageAlreadyPersisted = turn.suppressNextUserMessagePersistence === true || turn.userTurnTranscriptRecorder?.hasPersisted() === true;
	const contextMessages = require_session_manager.convertToLlm(manager.buildSessionContext().messages);
	const leaf = manager.getLeafEntry();
	const initialMessages = windowInitialMessages(userMessageAlreadyPersisted && leaf?.type === "message" && leaf.message.role === "user" ? contextMessages.slice(0, -1) : contextMessages);
	let baseLeafId = manager.getLeafId();
	if (!userMessageAlreadyPersisted) {
		const persisted = turn.userTurnTranscriptRecorder ? await turn.userTurnTranscriptRecorder.persistApproved({ cwd: turn.workspaceDir }) : void 0;
		if (persisted) {
			baseLeafId = persisted.messageId;
			turn.userTurnTranscriptRecorder?.markRuntimePersisted(persisted.message);
			turn.onUserMessagePersisted?.(persisted.message);
		} else if (turn.userTurnTranscriptRecorder?.hasPersisted()) baseLeafId = require_session_manager.SessionManager.open(turn.sessionFile).getLeafId();
		else if (!turn.userTurnTranscriptRecorder) {
			const message = {
				role: "user",
				content: [{
					type: "text",
					text: turn.transcriptPrompt ?? turn.prompt
				}],
				timestamp: Date.now()
			};
			baseLeafId = manager.appendMessage(message);
			turn.onUserMessagePersisted?.(message);
		} else throw new Error("Cloud worker turn could not persist its canonical user message");
	}
	turn.onExecutionPhase?.({
		phase: "model_resolution",
		backend: "cloud-worker",
		provider: modelRef.provider,
		model: modelRef.model
	});
	const credential = await params.environments.acquireTurnCredential({
		environmentId: placement.environmentId,
		ownerEpoch: placement.activeOwnerEpoch,
		sessionId: placement.sessionId
	});
	const tunnel = await waitForTurnOperation({
		operation: params.environments.startTunnel({
			environmentId: placement.environmentId,
			ownerEpoch: placement.activeOwnerEpoch
		}),
		...turn.abortSignal ? { signal: turn.abortSignal } : {},
		timeoutMs: turn.timeoutMs
	});
	const reasoning = require_utils.mapThinkingLevelForProvider(turn.thinkLevel);
	const descriptor = fitLaunchDescriptor((windowedMessages) => parseWorkerLaunchDescriptor({
		version: 1,
		socketPath: tunnel.remoteSocketPath,
		admission: {
			environmentId: placement.environmentId,
			credential: credential.credential,
			sessionId: placement.sessionId,
			ownerEpoch: placement.activeOwnerEpoch,
			rpcSetVersion: credential.rpcSetVersion,
			handshake: environment.bootstrapReceipt
		},
		assignment: {
			runId: turn.runId,
			turnId: (0, node_crypto.randomUUID)(),
			prompt: turn.prompt,
			suppressPromptTranscript: true,
			workspaceDir: placement.remoteWorkspaceDir,
			modelRef,
			inferenceOptions: reasoning ? { reasoning } : {},
			...turn.extraSystemPrompt === void 0 ? {} : { systemPrompt: turn.extraSystemPrompt },
			initialMessages: windowedMessages,
			transcript: {
				baseLeafId,
				nextSeq: (placement.lastTranscriptAckCursor ?? 0) + 1
			},
			liveEvents: {
				ackedSeq: placement.lastLiveEventAckCursor ?? 0,
				nextSeq: (placement.lastLiveEventAckCursor ?? 0) + 1
			}
		}
	}), initialMessages);
	turn.userTurnTranscriptRecorder?.markSentToProvider?.();
	turn.onExecutionPhase?.({
		phase: "attempt_dispatch",
		backend: "cloud-worker"
	});
	const handoffAbort = new AbortController();
	params.onHandoff();
	const processPromise = tunnel.runWorkspaceCommand({
		argv: [
			"sh",
			"-c",
			WORKER_LAUNCH_SCRIPT,
			"operator-worker",
			placement.workerBundleHash
		],
		input: JSON.stringify(descriptor),
		timeoutMs: turn.timeoutMs,
		signal: turn.abortSignal ? AbortSignal.any([turn.abortSignal, handoffAbort.signal]) : handoffAbort.signal
	});
	turn.onExecutionPhase?.({
		phase: "process_spawned",
		backend: "cloud-worker"
	});
	let credentialDelivered;
	try {
		credentialDelivered = params.environments.acknowledgeCredentialDelivery(credential);
	} catch (error) {
		handoffAbort.abort();
		await processPromise.catch(() => void 0);
		throw new Error("Cloud worker credential handoff failed", { cause: error });
	}
	if (!credentialDelivered) {
		handoffAbort.abort();
		await processPromise.catch(() => void 0);
		throw new Error("Cloud worker credential owner changed during process handoff");
	}
	const processResult = await processPromise;
	if (processResult.code !== 0 || processResult.signal !== null || processResult.killed) {
		const detail = (0, _gabrielvfonseca_normalization_core_utf16_slice.truncateUtf16Safe)(require_redact.redactSensitiveText(processResult.stderr, { mode: "tools" }).replace(/\s+/gu, " ").trim(), 400);
		throw new Error(detail ? `Cloud worker process failed before completing the turn: ${detail}` : "Cloud worker process failed before completing the turn");
	}
	const runtimeResult = parseRuntimeResult(processResult.stdout);
	if (runtimeResult.status === "fenced") throw new Error(`Cloud worker turn was fenced: ${runtimeResult.reason}`);
	if (runtimeResult.status === "failed") throw new WorkerTurnExecutionError("Cloud worker turn failed");
	const completed = require_session_manager.SessionManager.open(turn.sessionFile);
	const currentPlacement = params.placements.get(placement.sessionId);
	if (runtimeResult.transcriptLeafId !== completed.getLeafId() || runtimeResult.transcriptNextSeq !== (currentPlacement?.lastTranscriptAckCursor ?? 0) + 1) throw new Error("Cloud worker result does not match its committed transcript acknowledgement");
	if (currentPlacement?.state !== "active" && currentPlacement?.state !== "draining" || currentPlacement.environmentId !== placement.environmentId || currentPlacement.activeOwnerEpoch !== placement.activeOwnerEpoch) throw new Error("Cloud worker placement changed before workspace reconciliation");
	const terminal = runtimeResult.transcriptLeafId ? completed.getEntry(runtimeResult.transcriptLeafId) : void 0;
	if (terminal?.type !== "message" || terminal.message.role !== "assistant") throw new Error("Cloud worker completed without a terminal assistant transcript message");
	if (!params.placements.listPendingWorkspaceResults().some((pending) => pending.sessionId === params.turnClaim.sessionId && pending.claimId === params.turnClaim.claimId && pending.runId === params.turnClaim.runId)) throw new Error("Cloud worker completed without a durable workspace-result fence");
	const text = assistantText(terminal.message);
	const baseIndex = completed.getBranch().findIndex((entry) => entry.id === baseLeafId);
	const workerMessages = completed.getBranch().slice(baseIndex + 1).flatMap((entry) => entry.type === "message" ? [entry.message] : []);
	journalOwner = {
		sessionId: currentPlacement.sessionId,
		environmentId: currentPlacement.environmentId,
		ownerEpoch: currentPlacement.activeOwnerEpoch,
		placementGeneration: currentPlacement.generation
	};
	try {
		await params.workspaceOperations.run(currentPlacement.environmentId, async () => {
			if (!params.placements.validateTurnClaim(params.turnClaim)) throw new Error("Cloud worker workspace result lost its turn claim");
			const quiescence = await tunnel.quiesceWorkspace(currentPlacement.remoteWorkspaceDir);
			let resumed = false;
			try {
				const reconciliation = await tunnel.reconcileWorkspace({
					localPath: turn.workspaceDir,
					remoteWorkspaceDir: currentPlacement.remoteWorkspaceDir,
					baseManifestRef: currentPlacement.workspaceBaseManifestRef,
					journal
				});
				if (!manifestAccepted) throw new Error("Cloud worker workspace reconciliation was not durably accepted");
				await verifyReconciledWorkspaceFinal(reconciliation, quiescence);
				params.placements.acceptWorkspaceResult(params.turnClaim);
				await quiescence.resume();
				resumed = true;
				params.placements.completeWorkspaceResultAndReleaseTurn(params.turnClaim);
			} finally {
				if (!resumed) await quiescence.resume();
			}
		});
	} catch (error) {
		throw new WorkerWorkspaceReconciliationError(`Cloud worker finished, but its workspace result could not be reconciled: ${recoveryError(error)}`, { cause: error });
	}
	return {
		...text ? { payloads: [{ text }] } : {},
		meta: {
			durationMs: Date.now() - startedAt,
			agentMeta: {
				sessionId: placement.sessionId,
				sessionFile: turn.sessionFile,
				...buildWorkerAgentMeta({
					messages: workerMessages,
					modelRef
				})
			},
			stopReason: terminal.message.stopReason
		}
	};
}
function createWorkerSessionTurnPlacementProvider(options) {
	const workspaceOperations = options.workspaceOperations ?? createWorkerWorkspaceOperationCoordinator();
	return {
		async executeLocalTurn(claim, runLocal) {
			if (!options.placements.get(claim.sessionId) && options.admitNewPlacements === false) return await runLocal();
			return await executeLocalTurn({
				claim,
				placements: options.placements,
				runLocal
			});
		},
		async executeTurn(claim, turn, runLocal) {
			const current = options.placements.get(claim.sessionId);
			if (!current && (options.admitNewPlacements === false || turn.modelRun === true && !claim.sessionKey?.trim())) return await runLocal();
			if (!current || current.state === "local") return await executeLocalTurn({
				claim,
				placements: options.placements,
				runLocal
			});
			let routablePlacement = current;
			if (routablePlacement.state === "reclaimed") {
				if (!options.redispatchReclaimed) throw new Error("Reclaimed worker placement requires redispatch");
				routablePlacement = await options.redispatchReclaimed(routablePlacement);
			}
			const identity = resolvePlacementIdentity(claim, routablePlacement);
			const placement = requireActivePlacement(routablePlacement);
			const turnClaim = options.placements.claimTurn({
				...identity,
				claimId: (0, node_crypto.randomUUID)(),
				runId: claim.runId,
				owner: {
					kind: "worker",
					environmentId: placement.environmentId,
					ownerEpoch: placement.activeOwnerEpoch
				}
			});
			let handedOff = false;
			try {
				return await executeWorkerTurn({
					environments: options.environments,
					onHandoff: () => {
						handedOff = true;
					},
					placement,
					placements: options.placements,
					workspaceOperations,
					turn,
					turnClaim
				});
			} catch (error) {
				if (options.placements.listPendingWorkspaceResults().some((pending) => pending.sessionId === turnClaim.sessionId && pending.claimId === turnClaim.claimId && pending.runId === turnClaim.runId)) {
					options.placements.handoffWorkspaceResultRecovery(turnClaim);
					throw error;
				}
				if (error instanceof WorkerWorkspaceReconciliationError && !handedOff) {
					releaseClaimIfOwned(options.placements, turnClaim);
					throw error;
				}
				if (error instanceof WorkerTurnExecutionError) {
					if (options.placements.validateTurnClaim(turnClaim)) {
						options.placements.releaseTurn(turnClaim);
						throw error;
					}
				}
				if (handedOff) await failHandedOffTurn({
					environments: options.environments,
					placements: options.placements,
					placement,
					turnClaim,
					error
				});
				else releaseClaimIfOwned(options.placements, turnClaim);
				throw error;
			}
		}
	};
}
//#endregion
//#region src/gateway/server-worker-placement-startup.ts
const WORKER_PLACEMENT_RECONCILE_INTERVAL_MS = 6e4;
const workerPlacementLog = require_subsystem.createSubsystemLogger("gateway/worker-placement");
const loadWorkerPlacementSessionRuntimeModule = require_lazy_runtime.createLazyRuntimeModule(async () => {
	const [placementSessionRuntime, { managedWorktrees }, sessionUtils] = await Promise.all([
		Promise.resolve().then(() => require("./placement-session-runtime-BmyJAw2h.cjs")).then((n) => n.placement_session_runtime_exports),
		Promise.resolve().then(() => require("./service-D9VsD8u0.cjs")).then((n) => n.service_exports),
		Promise.resolve().then(() => require("./session-utils-eOXJCZME.cjs")).then((n) => n.session_utils_exports)
	]);
	return {
		isWorkerPlacementSessionRuntimeSupported: placementSessionRuntime.isWorkerPlacementSessionRuntimeSupported,
		managedWorktrees,
		resolveWorkerPlacementSessionRuntime: placementSessionRuntime.resolveWorkerPlacementSessionRuntime,
		resolveFreshestSessionEntryFromStoreKeys: sessionUtils.resolveFreshestSessionEntryFromStoreKeys,
		resolveGatewaySessionStoreTargetWithStore: sessionUtils.resolveGatewaySessionStoreTargetWithStore
	};
});
var WorkerDispatchTargetChangedError = class extends Error {
	constructor(..._args) {
		super(..._args);
		this.code = "invalid_state";
	}
};
/** Serializes reconciliation sweeps against in-flight dispatches so a sweep never
* observes a placement mid-transition. Dispatches wait out any pending sweep. */
function coordinateWorkerPlacementDispatch(service) {
	let activeDispatchCount = 0;
	let reconciliation;
	const dispatchIdleWaiters = /* @__PURE__ */ new Set();
	const waitForDispatchIdle = () => {
		if (activeDispatchCount === 0) return Promise.resolve();
		return new Promise((resolve) => {
			dispatchIdleWaiters.add(resolve);
		});
	};
	const runReconciliation = (operation) => {
		if (reconciliation) return reconciliation;
		const current = (async () => {
			await waitForDispatchIdle();
			await operation();
		})();
		reconciliation = current;
		const clearCurrent = () => {
			if (reconciliation === current) reconciliation = void 0;
		};
		current.then(clearCurrent, clearCurrent);
		return current;
	};
	const runExclusivePlacementOperation = (operation) => {
		const current = (async () => {
			const pendingReconciliation = reconciliation;
			if (pendingReconciliation) await pendingReconciliation.catch(() => void 0);
			await waitForDispatchIdle();
			return await operation();
		})();
		const barrier = current.then(() => void 0, () => void 0);
		reconciliation = barrier;
		return current.finally(() => {
			if (reconciliation === barrier) reconciliation = void 0;
		});
	};
	const runPlacementOperation = async (operation) => {
		for (;;) {
			const pendingReconciliation = reconciliation;
			if (!pendingReconciliation) break;
			await pendingReconciliation.catch(() => void 0);
		}
		activeDispatchCount += 1;
		try {
			return await operation();
		} finally {
			activeDispatchCount -= 1;
			if (activeDispatchCount === 0) {
				const waiters = [...dispatchIdleWaiters];
				dispatchIdleWaiters.clear();
				for (const resolve of waiters) resolve();
			}
		}
	};
	return {
		dispatch: async (request) => await runPlacementOperation(() => service.dispatch(request)),
		forceDestroyEnvironment: (environmentId) => runExclusivePlacementOperation(() => service.forceDestroyEnvironment(environmentId)),
		reclaim: async (request) => await runPlacementOperation(() => service.reclaim(request)),
		reconcile: () => runReconciliation(service.reconcile),
		reconcileActive: () => runReconciliation(service.reconcileActive)
	};
}
function createGatewayWorkerPlacementRuntime(params) {
	const workspaceOperations = createWorkerWorkspaceOperationCoordinator();
	const resolveWorkspacePath = async ({ sessionId, sessionKey, agentId }) => {
		const { managedWorktrees, resolveFreshestSessionEntryFromStoreKeys, resolveGatewaySessionStoreTargetWithStore } = await loadWorkerPlacementSessionRuntimeModule();
		const target = resolveGatewaySessionStoreTargetWithStore({
			cfg: require_io.getRuntimeConfig(),
			key: sessionKey,
			agentId,
			clone: false
		});
		const sessionEntry = resolveFreshestSessionEntryFromStoreKeys(target.store, target.storeKeys);
		const worktree = managedWorktrees.findLiveByOwner("session", target.canonicalKey);
		if (sessionEntry?.sessionId !== sessionId || !sessionEntry.worktree?.id || !worktree || worktree.id !== sessionEntry.worktree.id || worktree.ownerId !== target.canonicalKey) throw new Error(`Session ${sessionKey} dispatch requires a session-owned managed worktree`);
		return worktree.path;
	};
	const dispatchService = coordinateWorkerPlacementDispatch(createWorkerPlacementDispatchService({
		placements: params.placements,
		environments: params.environments,
		runLocalBarrier: async ({ sessionId, sessionKey, agentId, startDispatch }) => {
			const { isWorkerPlacementSessionRuntimeSupported, managedWorktrees, resolveFreshestSessionEntryFromStoreKeys, resolveGatewaySessionStoreTargetWithStore, resolveWorkerPlacementSessionRuntime } = await loadWorkerPlacementSessionRuntimeModule();
			const target = resolveGatewaySessionStoreTargetWithStore({
				cfg: require_io.getRuntimeConfig(),
				key: sessionKey,
				agentId,
				clone: false
			});
			const lifecycleIdentities = [
				sessionKey,
				target.canonicalKey,
				...target.storeKeys,
				sessionId
			];
			let placement;
			await require_store.runExclusiveSessionLifecycleMutation({
				scope: target.storePath,
				identities: lifecycleIdentities,
				prepare: async () => {
					const currentConfig = require_io.getRuntimeConfig();
					const currentTarget = resolveGatewaySessionStoreTargetWithStore({
						cfg: currentConfig,
						key: sessionKey,
						agentId,
						clone: false
					});
					const currentEntry = resolveFreshestSessionEntryFromStoreKeys(currentTarget.store, currentTarget.storeKeys);
					const worktree = managedWorktrees.findLiveByOwner("session", currentTarget.canonicalKey);
					if (currentTarget.storePath !== target.storePath || currentTarget.canonicalKey !== target.canonicalKey || currentTarget.agentId !== target.agentId || currentEntry?.sessionId !== sessionId || !currentEntry.worktree?.id || !worktree || worktree.id !== currentEntry.worktree.id || worktree.ownerId !== currentTarget.canonicalKey) throw new WorkerDispatchTargetChangedError(`Session ${sessionKey} changed before cloud worker dispatch. Retry.`);
					if (currentEntry.archivedAt !== void 0) throw new WorkerDispatchTargetChangedError(`Session ${sessionKey} was archived before cloud worker dispatch. Retry.`);
					const currentRuntime = resolveWorkerPlacementSessionRuntime({
						cfg: currentConfig,
						entry: currentEntry,
						agentId: currentTarget.agentId,
						sessionKey: currentTarget.canonicalKey
					});
					if (!isWorkerPlacementSessionRuntimeSupported(currentRuntime)) throw new WorkerDispatchTargetChangedError(`Session ${sessionKey} runtime changed to ${currentRuntime} before cloud worker dispatch. Retry.`);
					placement = startDispatch();
					require_cleanup.clearSessionQueues(lifecycleIdentities);
					params.revokeSessionAuthority({
						sessionId,
						sessionKeys: lifecycleIdentities
					});
					if (!await require_store.interruptSessionWorkAdmissions({
						scope: target.storePath,
						identities: lifecycleIdentities,
						timeoutMs: 15e3
					})) throw new Error(`Session ${sessionKey} is still active; dispatch stopped`);
					await params.placements.waitForTurnClaimRelease(sessionId, { timeoutMs: require_store.SESSION_WORK_ADMISSION_DRAIN_TIMEOUT_MS });
					await require_store.runExclusiveSessionStoreWrite(target.storePath, async () => {}, { reentrant: true });
				},
				run: async () => {
					if (!placement) throw new Error(`Session ${sessionKey} dispatch barrier did not start`);
				}
			});
			if (!placement) throw new Error(`Session ${sessionKey} dispatch barrier did not complete`);
			return placement;
		},
		runActivationBarrier: async ({ sessionId, sessionKey, agentId, activate }) => {
			const { isWorkerPlacementSessionRuntimeSupported, managedWorktrees, resolveFreshestSessionEntryFromStoreKeys, resolveGatewaySessionStoreTargetWithStore, resolveWorkerPlacementSessionRuntime } = await loadWorkerPlacementSessionRuntimeModule();
			const target = resolveGatewaySessionStoreTargetWithStore({
				cfg: require_io.getRuntimeConfig(),
				key: sessionKey,
				agentId,
				clone: false
			});
			const lifecycleIdentities = [
				sessionKey,
				target.canonicalKey,
				...target.storeKeys,
				sessionId
			];
			let activePlacement;
			await require_store.runExclusiveSessionLifecycleMutation({
				scope: target.storePath,
				identities: lifecycleIdentities,
				run: async () => {
					const currentConfig = require_io.getRuntimeConfig();
					const currentTarget = resolveGatewaySessionStoreTargetWithStore({
						cfg: currentConfig,
						key: sessionKey,
						agentId,
						clone: false
					});
					const currentEntry = resolveFreshestSessionEntryFromStoreKeys(currentTarget.store, currentTarget.storeKeys);
					const worktree = managedWorktrees.findLiveByOwner("session", currentTarget.canonicalKey);
					if (currentTarget.storePath !== target.storePath || currentTarget.canonicalKey !== target.canonicalKey || currentTarget.agentId !== target.agentId || currentEntry?.sessionId !== sessionId || !currentEntry.worktree?.id || !worktree || worktree.id !== currentEntry.worktree.id || worktree.ownerId !== currentTarget.canonicalKey) throw new WorkerDispatchTargetChangedError(`Session ${sessionKey} changed before cloud worker activation. Retry.`);
					if (currentEntry.archivedAt !== void 0) throw new WorkerDispatchTargetChangedError(`Session ${sessionKey} was archived before cloud worker activation. Retry.`);
					const currentRuntime = resolveWorkerPlacementSessionRuntime({
						cfg: currentConfig,
						entry: currentEntry,
						agentId: currentTarget.agentId,
						sessionKey: currentTarget.canonicalKey
					});
					if (!isWorkerPlacementSessionRuntimeSupported(currentRuntime)) throw new WorkerDispatchTargetChangedError(`Session ${sessionKey} runtime changed to ${currentRuntime} before cloud worker activation. Retry.`);
					activePlacement = activate();
				}
			});
			if (!activePlacement) throw new Error(`Session ${sessionKey} activation barrier did not complete`);
			return activePlacement;
		},
		runReclaimBarrier: async ({ sessionId, sessionKey, agentId, reclaim }) => {
			const { managedWorktrees, resolveFreshestSessionEntryFromStoreKeys, resolveGatewaySessionStoreTargetWithStore } = await loadWorkerPlacementSessionRuntimeModule();
			const target = resolveGatewaySessionStoreTargetWithStore({
				cfg: require_io.getRuntimeConfig(),
				key: sessionKey,
				agentId,
				clone: false
			});
			const lifecycleIdentities = [
				sessionKey,
				target.canonicalKey,
				...target.storeKeys,
				sessionId
			];
			let worktreePath;
			let reclaimedPlacement;
			await require_store.runExclusiveSessionLifecycleMutation({
				scope: target.storePath,
				identities: lifecycleIdentities,
				prepare: async () => {
					const currentTarget = resolveGatewaySessionStoreTargetWithStore({
						cfg: require_io.getRuntimeConfig(),
						key: sessionKey,
						agentId,
						clone: false
					});
					const currentEntry = resolveFreshestSessionEntryFromStoreKeys(currentTarget.store, currentTarget.storeKeys);
					const worktree = managedWorktrees.findLiveByOwner("session", currentTarget.canonicalKey);
					if (currentTarget.storePath !== target.storePath || currentTarget.canonicalKey !== target.canonicalKey || currentTarget.agentId !== target.agentId || currentEntry?.sessionId !== sessionId || !currentEntry.worktree?.id || !worktree || worktree.id !== currentEntry.worktree.id || worktree.ownerId !== currentTarget.canonicalKey) throw new WorkerDispatchTargetChangedError(`Session ${sessionKey} changed before cloud worker stop. Retry.`);
					const placement = params.placements.get(sessionId);
					if (placement?.state !== "active" || placement.turnClaim) throw new Error(`Session ${sessionKey} has active work; wait before stopping its cloud worker`);
					worktreePath = worktree.path;
					if (!await require_store.interruptSessionWorkAdmissions({
						scope: target.storePath,
						identities: lifecycleIdentities,
						timeoutMs: 15e3
					})) throw new Error(`Session ${sessionKey} is still active; cloud worker stop cancelled`);
					await params.placements.waitForTurnClaimRelease(sessionId, { timeoutMs: require_store.SESSION_WORK_ADMISSION_DRAIN_TIMEOUT_MS });
					await require_store.runExclusiveSessionStoreWrite(target.storePath, async () => {}, { reentrant: true });
				},
				run: async () => {
					if (!worktreePath) throw new Error(`Session ${sessionKey} cloud worker stop barrier did not prepare`);
					reclaimedPlacement = await reclaim(worktreePath);
					params.revokeSessionAuthority({
						sessionId,
						sessionKeys: lifecycleIdentities
					});
				}
			});
			if (!reclaimedPlacement) throw new Error(`Session ${sessionKey} cloud worker stop barrier did not complete`);
			return reclaimedPlacement;
		},
		resolveWorkspacePath,
		workspaceOperations
	}));
	const admissionProvider = createWorkerSessionTurnPlacementProvider({
		environments: params.environments,
		placements: params.placements,
		admitNewPlacements: params.admitNewPlacements,
		redispatchReclaimed: createReclaimedPlacementRedispatch({
			environments: params.environments,
			dispatch: dispatchService.dispatch
		}),
		workspaceOperations
	});
	const recoverPendingWorkspaceReconciliations = async () => {
		for (const owner of params.placements.listWorkspaceReconciliationOwners()) try {
			const placement = params.placements.get(owner.sessionId);
			if (placement?.state !== "active" && placement?.state !== "draining" || placement.environmentId !== owner.environmentId || placement.activeOwnerEpoch !== owner.ownerEpoch || placement.generation !== owner.placementGeneration) throw new Error(`Cloud workspace journal has no matching owner: ${owner.sessionId}`);
			const localPath = await resolveWorkspacePath({
				sessionId: placement.sessionId,
				sessionKey: placement.sessionKey,
				agentId: placement.agentId
			});
			const journal = params.placements.loadWorkspaceReconciliation(owner);
			if (!journal) continue;
			await require_workspace_reconcile.recoverWorkerWorkspaceReconciliation({
				root: localPath,
				journal
			});
			params.placements.abortWorkspaceReconciliation(owner);
		} catch (error) {
			workerPlacementLog.error(`cloud workspace recovery deferred for ${owner.sessionId}: ${require_errors.formatErrorMessage(error)}`);
		}
	};
	const startRuntime = async (hooks) => {
		const uninstallPlacementAdmission = require_session_placement_admission.installSessionPlacementAdmissionProvider(admissionProvider);
		const uninstallPlacementResetGuard = require_session_placement_admission.installSessionPlacementResetGuard((sessionId) => {
			const placement = params.placements.get(sessionId);
			if (!placement || placement.state === "local") return;
			return `cloud worker placement is ${placement.state}`;
		});
		let placementReconcileInterval;
		let placementReconcileInFlight;
		let stopped = false;
		const reconcileActivePlacements = () => {
			if (stopped) return Promise.resolve();
			if (placementReconcileInFlight) return placementReconcileInFlight;
			const current = dispatchService.reconcileActive();
			placementReconcileInFlight = current;
			const clearCurrent = () => {
				if (placementReconcileInFlight === current) placementReconcileInFlight = void 0;
			};
			current.then(clearCurrent, (error) => {
				params.warn(`Worker placement reconcile sweep failed: ${require_errors.formatErrorMessage(error)}`);
				clearCurrent();
			});
			return current;
		};
		const sidecar = { stop: async () => {
			if (stopped) return;
			stopped = true;
			clearInterval(placementReconcileInterval);
			placementReconcileInterval = void 0;
			uninstallPlacementAdmission();
			uninstallPlacementResetGuard();
			const environmentStop = params.environments.stop();
			const environmentStopResult = (await Promise.allSettled([...placementReconcileInFlight ? [placementReconcileInFlight] : [], environmentStop])).at(-1);
			if (environmentStopResult?.status === "rejected") throw environmentStopResult.reason;
		} };
		hooks.registerSidecar(sidecar);
		const startupRecovery = recoverPendingWorkspaceReconciliations();
		placementReconcileInFlight = startupRecovery;
		try {
			await startupRecovery;
		} finally {
			if (placementReconcileInFlight === startupRecovery) placementReconcileInFlight = void 0;
		}
		if (hooks.isClosePreludeStarted()) {
			await sidecar.stop();
			return null;
		}
		const startupReconcile = dispatchService.reconcile();
		placementReconcileInFlight = startupReconcile;
		try {
			try {
				await startupReconcile;
			} finally {
				if (placementReconcileInFlight === startupReconcile) placementReconcileInFlight = void 0;
			}
			if (hooks.isClosePreludeStarted()) {
				await sidecar.stop();
				return null;
			}
			params.environments.start();
			placementReconcileInterval = setInterval(() => void reconcileActivePlacements(), WORKER_PLACEMENT_RECONCILE_INTERVAL_MS);
			placementReconcileInterval.unref?.();
			return sidecar;
		} catch (error) {
			await sidecar.stop();
			throw error;
		}
	};
	return {
		dispatchService,
		admissionProvider,
		placements: params.placements,
		startRuntime
	};
}
//#endregion
exports.createGatewayWorkerPlacementRuntime = createGatewayWorkerPlacementRuntime;
