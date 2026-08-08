const require_diagnostic_payload = require("./diagnostic-payload-D1efA3wp.cjs");
const require_hooks = require("./hooks-Dd_4unef.cjs");
//#region src/gateway/http-common.ts
/**
* Apply baseline security headers that are safe for all response types (API JSON,
* HTML pages, static assets, SSE streams). Headers that restrict framing or set a
* Content-Security-Policy are intentionally omitted here because some handlers
* (canvas host, A2UI) serve content that may be loaded inside frames.
*/
function setDefaultSecurityHeaders(res, opts) {
	res.setHeader("X-Content-Type-Options", "nosniff");
	res.setHeader("Referrer-Policy", "no-referrer");
	res.setHeader("Permissions-Policy", "camera=(), microphone=(self), geolocation=()");
	const strictTransportSecurity = opts?.strictTransportSecurity;
	if (typeof strictTransportSecurity === "string" && strictTransportSecurity.length > 0) res.setHeader("Strict-Transport-Security", strictTransportSecurity);
}
function sendJson(res, status, body) {
	res.statusCode = status;
	res.setHeader("Content-Type", "application/json; charset=utf-8");
	res.end(JSON.stringify(body));
}
function sendText(res, status, body) {
	res.statusCode = status;
	res.setHeader("Content-Type", "text/plain; charset=utf-8");
	res.end(body);
}
function sendMethodNotAllowed(res, allow = "POST") {
	res.setHeader("Allow", allow);
	sendText(res, 405, "Method Not Allowed");
}
function sendUnauthorized(res) {
	sendJson(res, 401, { error: {
		message: "Unauthorized",
		type: "unauthorized"
	} });
}
function sendRateLimited(res, retryAfterMs) {
	if (retryAfterMs && retryAfterMs > 0) res.setHeader("Retry-After", String(Math.ceil(retryAfterMs / 1e3)));
	sendJson(res, 429, { error: {
		message: "Too many failed authentication attempts. Please try again later.",
		type: "rate_limited"
	} });
}
function sendGatewayAuthFailure(res, authResult) {
	if (authResult.rateLimited) {
		sendRateLimited(res, authResult.retryAfterMs);
		return;
	}
	sendUnauthorized(res);
}
function sendInvalidRequest(res, message) {
	sendJson(res, 400, { error: {
		message,
		type: "invalid_request_error"
	} });
}
function buildMissingScopeForbiddenBody(missingScope) {
	return {
		ok: false,
		error: {
			type: "forbidden",
			message: `missing scope: ${missingScope}`
		}
	};
}
function sendMissingScopeForbidden(res, missingScope) {
	sendJson(res, 403, buildMissingScopeForbiddenBody(missingScope));
}
async function readJsonBodyOrError(req, res, maxBytes) {
	const body = await require_hooks.readJsonBody(req, maxBytes);
	if (!body.ok) {
		if (body.error === "payload too large") {
			const contentLength = require_diagnostic_payload.parseContentLengthHeader(req.headers?.["content-length"]);
			require_diagnostic_payload.logRejectedLargePayload({
				surface: "gateway.http.json",
				limitBytes: maxBytes,
				reason: "json_body_limit",
				...contentLength !== void 0 ? { bytes: contentLength } : {}
			});
			sendJson(res, 413, { error: {
				message: "Payload too large",
				type: "invalid_request_error"
			} });
			return;
		}
		if (body.error === "request body timeout") {
			sendJson(res, 408, { error: {
				message: "Request body timeout",
				type: "invalid_request_error"
			} });
			return;
		}
		sendInvalidRequest(res, body.error);
		return;
	}
	return body.value;
}
function writeDone(res) {
	res.write("data: [DONE]\n\n");
}
function setSseHeaders(res) {
	res.statusCode = 200;
	res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
	res.setHeader("Cache-Control", "no-cache");
	res.setHeader("Connection", "keep-alive");
	res.flushHeaders?.();
}
/** Abort reason used when the HTTP client disconnects before delivery. */
var ClientDisconnectError = class extends Error {
	constructor(message = "HTTP client disconnected") {
		super(message);
		this.name = "ClientDisconnectError";
	}
};
function watchClientDisconnect(req, res, abortController, onDisconnect) {
	const sockets = Array.from(new Set([req.socket, res.socket].filter((socket) => socket !== null)));
	if (sockets.length === 0) return () => {};
	const handleClose = () => {
		onDisconnect?.();
		if (!abortController.signal.aborted) abortController.abort(new ClientDisconnectError());
	};
	for (const socket of sockets) socket.on("close", handleClose);
	return () => {
		for (const socket of sockets) socket.off("close", handleClose);
	};
}
//#endregion
Object.defineProperty(exports, "buildMissingScopeForbiddenBody", {
	enumerable: true,
	get: function() {
		return buildMissingScopeForbiddenBody;
	}
});
Object.defineProperty(exports, "readJsonBodyOrError", {
	enumerable: true,
	get: function() {
		return readJsonBodyOrError;
	}
});
Object.defineProperty(exports, "sendGatewayAuthFailure", {
	enumerable: true,
	get: function() {
		return sendGatewayAuthFailure;
	}
});
Object.defineProperty(exports, "sendInvalidRequest", {
	enumerable: true,
	get: function() {
		return sendInvalidRequest;
	}
});
Object.defineProperty(exports, "sendJson", {
	enumerable: true,
	get: function() {
		return sendJson;
	}
});
Object.defineProperty(exports, "sendMethodNotAllowed", {
	enumerable: true,
	get: function() {
		return sendMethodNotAllowed;
	}
});
Object.defineProperty(exports, "sendMissingScopeForbidden", {
	enumerable: true,
	get: function() {
		return sendMissingScopeForbidden;
	}
});
Object.defineProperty(exports, "sendRateLimited", {
	enumerable: true,
	get: function() {
		return sendRateLimited;
	}
});
Object.defineProperty(exports, "sendUnauthorized", {
	enumerable: true,
	get: function() {
		return sendUnauthorized;
	}
});
Object.defineProperty(exports, "setDefaultSecurityHeaders", {
	enumerable: true,
	get: function() {
		return setDefaultSecurityHeaders;
	}
});
Object.defineProperty(exports, "setSseHeaders", {
	enumerable: true,
	get: function() {
		return setSseHeaders;
	}
});
Object.defineProperty(exports, "watchClientDisconnect", {
	enumerable: true,
	get: function() {
		return watchClientDisconnect;
	}
});
Object.defineProperty(exports, "writeDone", {
	enumerable: true,
	get: function() {
		return writeDone;
	}
});
