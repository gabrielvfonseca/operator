require("./rolldown-runtime-u92d-OFm.cjs");
const require_message_channel = require("./message-channel-jMzaqV09.cjs");
const require_http_common = require("./http-common-DeY7J8eb.cjs");
const require_http_auth_utils = require("./http-auth-utils-D-0od5yP.cjs");
require("./http-utils-C_86u7P2.cjs");
const require_tools_invoke_shared = require("./tools-invoke-shared-7YK_P9ZO.cjs");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
//#region src/gateway/tools-invoke-http.ts
const DEFAULT_BODY_BYTES = 2 * 1024 * 1024;
/** Handle `/tools/invoke` requests and return false when another HTTP route should handle them. */
async function handleToolsInvokeHttpRequest(req, res, opts) {
	let url;
	try {
		url = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`);
	} catch {
		res.writeHead(400, { "Content-Type": "application/json" });
		res.end(JSON.stringify({
			error: "bad_request",
			message: "Invalid request URL"
		}));
		return true;
	}
	if (url.pathname !== "/tools/invoke") return false;
	if (req.method !== "POST") {
		require_http_common.sendMethodNotAllowed(res, "POST");
		return true;
	}
	const authResult = await require_http_auth_utils.authorizeScopedGatewayHttpRequestOrReply({
		req,
		res,
		auth: opts.auth,
		trustedProxies: opts.trustedProxies,
		allowRealIpFallback: opts.allowRealIpFallback,
		rateLimiter: opts.rateLimiter,
		operatorMethod: "agent",
		resolveOperatorScopes: require_http_auth_utils.resolveOpenAiCompatibleHttpOperatorScopes
	});
	if (!authResult) return true;
	const { cfg, requestAuth } = authResult;
	const bodyUnknown = await require_http_common.readJsonBodyOrError(req, res, opts.maxBodyBytes ?? DEFAULT_BODY_BYTES);
	if (bodyUnknown === void 0) return true;
	const body = bodyUnknown ?? {};
	const messageChannel = require_message_channel.normalizeMessageChannel(require_http_auth_utils.getHeader(req, "x-operator-message-channel") ?? "");
	const accountId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(require_http_auth_utils.getHeader(req, "x-operator-account-id"));
	const agentTo = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(require_http_auth_utils.getHeader(req, "x-operator-message-to"));
	const agentThreadId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(require_http_auth_utils.getHeader(req, "x-operator-thread-id"));
	const senderIsOwner = require_http_auth_utils.resolveOpenAiCompatibleHttpSenderIsOwner(req, requestAuth);
	const outcome = await require_tools_invoke_shared.invokeGatewayTool({
		cfg,
		input: body,
		messageChannel: messageChannel ?? void 0,
		accountId,
		agentTo,
		agentThreadId,
		senderIsOwner,
		conversationReadOrigin: "direct-operator",
		toolCallIdPrefix: "http"
	});
	if (outcome.ok) require_http_common.sendJson(res, outcome.status, {
		ok: true,
		result: outcome.result
	});
	else require_http_common.sendJson(res, outcome.status, {
		ok: false,
		error: outcome.error
	});
	return true;
}
//#endregion
exports.handleToolsInvokeHttpRequest = handleToolsInvokeHttpRequest;
