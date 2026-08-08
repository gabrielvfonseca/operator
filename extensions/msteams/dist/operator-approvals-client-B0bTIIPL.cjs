const require_client_info = require("./client-info-C2lg7w_c.cjs");
const require_client_start_readiness = require("./client-start-readiness-CjzVtlBH.cjs");
const require_connection_details = require("./connection-details-BmUcttti.cjs");
const require_credentials_secret_inputs = require("./credentials-secret-inputs-WHVXyyR_.cjs");
const require_operator_approval_runtime_token = require("./operator-approval-runtime-token-BZxnDPVJ.cjs");
//#region src/gateway/connection-auth.ts
function toGatewayCredentialOptions(params) {
	const { config, ...rest } = params;
	return {
		cfg: config,
		...rest
	};
}
/** Resolves gateway connection credentials, including configured SecretRef inputs. */
async function resolveGatewayConnectionAuth(params) {
	return await require_credentials_secret_inputs.resolveGatewayCredentialsWithSecretInputs({
		config: params.config,
		...toGatewayCredentialOptions(params)
	});
}
//#endregion
//#region src/gateway/client-bootstrap.ts
/**
* Maps connection-detail source labels to the override kinds that affect auth fallback.
*/
function resolveGatewayUrlOverrideSource(urlSource) {
	if (urlSource === "cli --url") return "cli";
	if (urlSource === "env OPERATOR_GATEWAY_URL") return "env";
}
/**
* Resolves the URL, auth material, and handshake tuning needed to start a GatewayClient.
*/
async function resolveGatewayClientBootstrap(params) {
	const connection = require_connection_details.buildGatewayConnectionDetailsWithResolvers({
		config: params.config,
		url: params.gatewayUrl
	});
	const urlOverrideSource = resolveGatewayUrlOverrideSource(connection.urlSource);
	const auth = await resolveGatewayConnectionAuth({
		config: params.config,
		explicitAuth: params.explicitAuth,
		env: params.env ?? process.env,
		urlOverride: urlOverrideSource ? connection.url : void 0,
		urlOverrideSource
	});
	return {
		url: connection.url,
		urlSource: connection.urlSource,
		preauthHandshakeTimeoutMs: params.config.gateway?.handshakeTimeoutMs,
		auth
	};
}
//#endregion
//#region src/gateway/operator-approvals-client.ts
function shouldSendApprovalRuntimeToken(urlSource) {
	return urlSource === "local loopback" || urlSource === "missing gateway.remote.url (fallback local)";
}
function shouldOmitApprovalRuntimeDeviceIdentity(params) {
	return params.sendsApprovalRuntimeToken;
}
/** Create a Gateway client authorized for operator approval event handling. */
async function createOperatorApprovalsGatewayClient(params) {
	const bootstrap = await resolveGatewayClientBootstrap({
		config: params.config,
		gatewayUrl: params.gatewayUrl,
		env: process.env
	});
	const sendsApprovalRuntimeToken = shouldSendApprovalRuntimeToken(bootstrap.urlSource);
	return new require_client_start_readiness.GatewayClient({
		url: bootstrap.url,
		token: bootstrap.auth.token,
		password: bootstrap.auth.password,
		...sendsApprovalRuntimeToken ? { approvalRuntimeToken: require_operator_approval_runtime_token.getOperatorApprovalRuntimeToken() } : {},
		preauthHandshakeTimeoutMs: bootstrap.preauthHandshakeTimeoutMs,
		clientName: require_client_info.GATEWAY_CLIENT_NAMES.GATEWAY_CLIENT,
		clientDisplayName: params.clientDisplayName,
		mode: require_client_info.GATEWAY_CLIENT_MODES.BACKEND,
		scopes: ["operator.approvals"],
		deviceIdentity: shouldOmitApprovalRuntimeDeviceIdentity({ sendsApprovalRuntimeToken }) ? null : void 0,
		onEvent: params.onEvent,
		onHelloOk: params.onHelloOk,
		onConnectError: params.onConnectError,
		onReconnectPaused: params.onReconnectPaused,
		onClose: params.onClose
	});
}
/** Run a callback with a started operator-approvals Gateway client and close it after. */
async function withOperatorApprovalsGatewayClient(params, run) {
	let readySettled = false;
	let resolveReady;
	let rejectReady;
	const ready = new Promise((resolve, reject) => {
		resolveReady = resolve;
		rejectReady = reject;
	});
	const markReady = () => {
		if (readySettled) return;
		readySettled = true;
		resolveReady();
	};
	const failReady = (err) => {
		if (readySettled) return;
		readySettled = true;
		rejectReady(err);
	};
	const gatewayClient = await createOperatorApprovalsGatewayClient({
		config: params.config,
		gatewayUrl: params.gatewayUrl,
		clientDisplayName: params.clientDisplayName,
		onHelloOk: () => {
			markReady();
		},
		onConnectError: (err) => {
			failReady(err);
		},
		onClose: (code, reason) => {
			failReady(/* @__PURE__ */ new Error(`gateway closed (${code}): ${reason}`));
		}
	});
	try {
		const readiness = await require_client_start_readiness.startGatewayClientWhenEventLoopReady(gatewayClient, { clientOptions: { preauthHandshakeTimeoutMs: params.config.gateway?.handshakeTimeoutMs } });
		if (!readiness.ready) throw new Error(readiness.aborted ? "gateway approval client start aborted before readiness" : "gateway readiness unavailable before approval client start");
		await ready;
		return await run(gatewayClient);
	} finally {
		await gatewayClient.stopAndWait().catch(() => {
			gatewayClient.stop();
		});
	}
}
//#endregion
Object.defineProperty(exports, "createOperatorApprovalsGatewayClient", {
	enumerable: true,
	get: function() {
		return createOperatorApprovalsGatewayClient;
	}
});
Object.defineProperty(exports, "withOperatorApprovalsGatewayClient", {
	enumerable: true,
	get: function() {
		return withOperatorApprovalsGatewayClient;
	}
});
