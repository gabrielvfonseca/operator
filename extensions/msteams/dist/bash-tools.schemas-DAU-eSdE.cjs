const require_typebox = require("./typebox-Cmpdg63i.cjs");
let typebox = require("typebox");
/** Parameters accepted by the exec tool. */
const execSchema = typebox.Type.Object({
	command: typebox.Type.String({ description: "Shell command to execute" }),
	workdir: typebox.Type.Optional(typebox.Type.String({ description: "Working directory. Blank/whitespace values are invalid; omit to use the default cwd." })),
	env: typebox.Type.Optional(typebox.Type.Record(typebox.Type.String(), typebox.Type.String())),
	yieldMs: typebox.Type.Optional(typebox.Type.Number({ description: "Milliseconds to wait before backgrounding (default 10000)" })),
	background: typebox.Type.Optional(typebox.Type.Boolean({ description: "Run in background immediately" })),
	timeout: typebox.Type.Optional(typebox.Type.Number({ description: "Timeout in seconds (optional, kills process on expiry)" })),
	pty: typebox.Type.Optional(typebox.Type.Boolean({ description: "Run in a pseudo-terminal (PTY) when available (TTY-required CLIs, coding agents)" })),
	elevated: typebox.Type.Optional(typebox.Type.Boolean({ description: "Run on the host with elevated permissions (if allowed)" })),
	host: require_typebox.optionalStringEnum([
		"auto",
		"sandbox",
		"gateway",
		"node"
	], { description: "Exec host/target (auto|sandbox|gateway|node)." }),
	security: typebox.Type.Optional(typebox.Type.String({ description: "Ignored for normal calls; exec security is set by tools.exec.security and host approvals." })),
	ask: typebox.Type.Optional(typebox.Type.String({ description: "Baseline ask comes from tools.exec.ask and host approvals; channel-origin calls ignore per-call ask when effective host ask is off." })),
	node: typebox.Type.Optional(typebox.Type.String({ description: "Node id/name for host=node." }))
});
/** Parameters exposed by node-only exec surfaces. */
const nodeExecSchema = typebox.Type.Object({
	command: execSchema.properties.command,
	workdir: execSchema.properties.workdir,
	env: execSchema.properties.env,
	timeout: execSchema.properties.timeout,
	host: require_typebox.optionalStringEnum(["node"], { description: "Exec target. Only node is available on this tool surface." }),
	node: execSchema.properties.node
});
/** Parameters accepted by the process-control tool. */
const processSchema = typebox.Type.Object({
	action: typebox.Type.String({ description: "Process action (list|poll|log|write|send-keys|submit|paste|kill|clear|remove)" }),
	sessionId: typebox.Type.Optional(typebox.Type.String({ description: "Session id for actions other than list" })),
	data: typebox.Type.Optional(typebox.Type.String({ description: "Data to write for write" })),
	keys: typebox.Type.Optional(typebox.Type.Array(typebox.Type.String(), { description: "Key tokens to send for send-keys" })),
	hex: typebox.Type.Optional(typebox.Type.Array(typebox.Type.String(), { description: "Hex bytes to send for send-keys" })),
	literal: typebox.Type.Optional(typebox.Type.String({ description: "Literal string for send-keys" })),
	text: typebox.Type.Optional(typebox.Type.String({ description: "Text to paste for paste" })),
	bracketed: typebox.Type.Optional(typebox.Type.Boolean({ description: "Wrap paste in bracketed mode" })),
	eof: typebox.Type.Optional(typebox.Type.Boolean({ description: "Close stdin after write" })),
	offset: typebox.Type.Optional(typebox.Type.Number({ description: "Log offset" })),
	limit: typebox.Type.Optional(typebox.Type.Number({ description: "Log length" })),
	timeout: typebox.Type.Optional(typebox.Type.Number({
		description: "For poll: wait up to this many milliseconds before returning; max 30000 ms, higher values are clamped to 30000",
		minimum: 0
	}))
});
//#endregion
Object.defineProperty(exports, "execSchema", {
	enumerable: true,
	get: function() {
		return execSchema;
	}
});
Object.defineProperty(exports, "nodeExecSchema", {
	enumerable: true,
	get: function() {
		return nodeExecSchema;
	}
});
Object.defineProperty(exports, "processSchema", {
	enumerable: true,
	get: function() {
		return processSchema;
	}
});
