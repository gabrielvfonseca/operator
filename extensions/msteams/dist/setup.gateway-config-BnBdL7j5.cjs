require("./rolldown-runtime-u92d-OFm.cjs");
const require_types_secrets = require("./types.secrets-2BFwbY6H.cjs");
const require_node_command_policy = require("./node-command-policy-DFyVSMm6.cjs");
const require_i18n = require("./i18n-DzMW5U-T.cjs");
const require_provider_auth_mode = require("./provider-auth-mode-D_4tVmIf.cjs");
const require_provider_auth_ref = require("./provider-auth-ref-DFo0sjpQ.cjs");
const require_tailscale = require("./tailscale-ViriHRUQ.cjs");
const require_secret_mask = require("./secret-mask-if3T4TYf.cjs");
const require_error_format = require("./error-format-IzEUBRNs.cjs");
const require_parse_port = require("./parse-port-Bpmz65Aw.cjs");
const require_random_token = require("./random-token-BjnIqlbc.cjs");
const require_onboard_helpers = require("./onboard-helpers-B8YMO226.cjs");
const require_setup_secret_input = require("./setup.secret-input-BaApiN1b.cjs");
const require_gateway_control_ui_origins = require("./gateway-control-ui-origins-5OS_jUqX.cjs");
let _gabrielvfonseca_normalization_core = require("@gabrielvfonseca/normalization-core");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
let _gabrielvfonseca_net_policy_ip = require("@gabrielvfonseca/net-policy/ip");
let _gabrielvfonseca_net_policy_ipv4 = require("@gabrielvfonseca/net-policy/ipv4");
//#region src/gateway/gateway-config-prompts.shared.ts
const TAILSCALE_EXPOSURE_OPTIONS = [
	{
		value: "off",
		label: "Off",
		hint: "No Tailscale exposure"
	},
	{
		value: "serve",
		label: "Serve",
		hint: "Private HTTPS for your tailnet (devices on Tailscale)"
	},
	{
		value: "funnel",
		label: "Funnel",
		hint: "Public HTTPS via Tailscale Funnel (internet)"
	}
];
function normalizeTailnetHostForUrl(rawHost) {
	const trimmed = rawHost.trim().replace(/\.$/, "");
	if (!trimmed) return null;
	const parsed = (0, _gabrielvfonseca_net_policy_ip.parseCanonicalIpAddress)(trimmed);
	if (parsed && (0, _gabrielvfonseca_net_policy_ip.isIpv6Address)(parsed)) return `[${(0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(parsed.toString())}]`;
	return trimmed;
}
function buildTailnetHttpsOrigin(rawHost) {
	const normalizedHost = normalizeTailnetHostForUrl(rawHost);
	if (!normalizedHost) return null;
	try {
		return new URL(`https://${normalizedHost}`).origin;
	} catch {
		return null;
	}
}
function appendAllowedOrigin(existing, origin) {
	const current = existing ?? [];
	const normalized = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(origin);
	if (current.some((entry) => (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(entry) === normalized)) return current;
	return [...current, origin];
}
async function maybeAddTailnetOriginToControlUiAllowedOrigins(params) {
	if (params.tailscaleMode !== "serve" && params.tailscaleMode !== "funnel") return params.config;
	const tsOrigin = await require_tailscale.getTailnetHostname(void 0, params.tailscaleBin ?? void 0).then((host) => buildTailnetHttpsOrigin((0, _gabrielvfonseca_normalization_core.expectDefined)(host, "gateway config prompts.shared host"))).catch(() => null);
	if (!tsOrigin) return params.config;
	const updatedOrigins = appendAllowedOrigin(params.config.gateway?.controlUi?.allowedOrigins ?? [], tsOrigin);
	return {
		...params.config,
		gateway: {
			...params.config.gateway,
			controlUi: {
				...params.config.gateway?.controlUi,
				allowedOrigins: updatedOrigins
			}
		}
	};
}
//#endregion
//#region src/wizard/setup.gateway-config.ts
function getLocalizedTailscaleExposureOptions() {
	return TAILSCALE_EXPOSURE_OPTIONS.map((option) => ({
		hint: require_i18n.t(`wizard.gatewayTailscale.${option.value}Hint`),
		label: require_i18n.t(`wizard.gatewayTailscale.${option.value}`),
		value: option.value
	}));
}
function normalizeWizardTextInput(value) {
	return typeof value === "string" ? value.trim() : "";
}
function validateGatewayPortInput(value) {
	if (require_parse_port.parsePort(value) === null) return require_error_format.formatPortRangeHint();
}
async function configureGatewayForSetup(opts) {
	const { flow, localPort, quickstartGateway, prompter } = opts;
	let { nextConfig } = opts;
	const port = flow === "quickstart" ? quickstartGateway.port : require_parse_port.parsePort(await prompter.text({
		message: require_i18n.t("wizard.gateway.port"),
		initialValue: String(localPort),
		validate: validateGatewayPortInput
	}));
	if (port === null) throw new Error(require_error_format.formatPortRangeHint());
	let bind = flow === "quickstart" ? quickstartGateway.bind : await prompter.select({
		message: require_i18n.t("wizard.gateway.bindAddress"),
		options: [
			{
				value: "loopback",
				label: require_i18n.t("wizard.gateway.bindLoopback"),
				hint: require_i18n.t("wizard.gateway.bindLoopbackHint")
			},
			{
				value: "lan",
				label: require_i18n.t("wizard.gateway.bindLan"),
				hint: require_i18n.t("wizard.gateway.bindLanHint")
			},
			{
				value: "tailnet",
				label: require_i18n.t("wizard.gateway.bindTailnet"),
				hint: require_i18n.t("wizard.gateway.bindTailnetHint")
			},
			{
				value: "auto",
				label: require_i18n.t("wizard.gateway.bindAuto"),
				hint: require_i18n.t("wizard.gateway.bindAutoHint")
			},
			{
				value: "custom",
				label: require_i18n.t("wizard.gateway.bindCustom"),
				hint: require_i18n.t("wizard.gateway.bindCustomHint")
			}
		]
	});
	let customBindHost = quickstartGateway.customBindHost;
	if (bind === "custom") {
		if (flow !== "quickstart" || !customBindHost) {
			const input = await prompter.text({
				message: require_i18n.t("wizard.gateway.bindCustomIp"),
				placeholder: "192.168.1.100",
				initialValue: customBindHost ?? "",
				validate: _gabrielvfonseca_net_policy_ipv4.validateDottedDecimalIPv4Input
			});
			customBindHost = typeof input === "string" ? input.trim() : void 0;
		}
	}
	let authMode = flow === "quickstart" ? quickstartGateway.authMode : await prompter.select({
		message: require_i18n.t("wizard.gateway.accessProtection"),
		options: [{
			value: "token",
			label: require_i18n.t("common.tokenRecommended"),
			hint: require_i18n.t("wizard.gateway.plaintextTokenHint")
		}, {
			value: "password",
			label: require_i18n.t("common.password")
		}],
		initialValue: "token"
	});
	const tailscaleMode = flow === "quickstart" ? quickstartGateway.tailscaleMode : await prompter.select({
		message: require_i18n.t("wizard.gateway.tailscaleExposure"),
		options: getLocalizedTailscaleExposureOptions()
	});
	let tailscaleBin = null;
	if (tailscaleMode !== "off") {
		tailscaleBin = await require_tailscale.findTailscaleBinary();
		if (!tailscaleBin) await prompter.note(require_i18n.t("wizard.gatewayTailscale.missingBinNote"), require_i18n.t("wizard.gatewayTailscale.warningTitle"));
	}
	let tailscaleResetOnExit = flow === "quickstart" ? quickstartGateway.tailscaleResetOnExit : false;
	if (tailscaleMode !== "off" && flow !== "quickstart") {
		await prompter.note(require_i18n.t("wizard.gatewayTailscale.docsNote"), "Tailscale");
		tailscaleResetOnExit = await prompter.confirm({
			message: require_i18n.t("wizard.gateway.tailscaleReset"),
			initialValue: false
		});
	}
	if (tailscaleMode !== "off" && bind !== "loopback") {
		await prompter.note(require_i18n.t("wizard.gatewayNotes.tailscaleBindLoopback"), require_i18n.t("wizard.gatewayNotes.bindTitle"));
		bind = "loopback";
		customBindHost = void 0;
	}
	if (tailscaleMode === "funnel" && authMode !== "password") {
		await prompter.note(require_i18n.t("wizard.gatewayNotes.tailscaleFunnelPassword"), require_i18n.t("wizard.gateway.auth"));
		authMode = "password";
	}
	let gatewayToken;
	let gatewayTokenInput;
	if (authMode === "token") {
		const quickstartTokenString = require_types_secrets.normalizeSecretInputString(quickstartGateway.token);
		const quickstartTokenRef = require_types_secrets.resolveSecretInputRef({
			value: quickstartGateway.token,
			defaults: nextConfig.secrets?.defaults
		}).ref;
		if ((flow === "quickstart" && opts.secretInputMode !== "ref" ? quickstartTokenRef ? "ref" : "plaintext" : await require_provider_auth_mode.resolveSecretInputModeForEnvSelection({
			prompter,
			explicitMode: opts.secretInputMode,
			copy: {
				modeMessage: require_i18n.t("wizard.gateway.authTokenMode"),
				plaintextLabel: require_i18n.t("wizard.gateway.plaintextTokenLabel"),
				plaintextHint: require_i18n.t("wizard.gateway.plaintextTokenHint"),
				refLabel: require_i18n.t("wizard.gateway.refLabel"),
				refHint: require_i18n.t("wizard.gateway.refHint")
			}
		})) === "ref") if (flow === "quickstart" && quickstartTokenRef) {
			gatewayTokenInput = quickstartTokenRef;
			gatewayToken = await require_setup_secret_input.resolveSetupSecretInputString({
				config: nextConfig,
				value: quickstartTokenRef,
				path: "gateway.auth.token",
				env: process.env
			});
		} else {
			const resolved = await require_provider_auth_ref.promptSecretRefForSetup({
				provider: "gateway-auth-token",
				config: nextConfig,
				prompter,
				preferredEnvVar: "OPERATOR_GATEWAY_TOKEN",
				copy: {
					sourceMessage: require_i18n.t("wizard.gateway.authTokenStoredMessage"),
					envVarPlaceholder: "OPERATOR_GATEWAY_TOKEN"
				}
			});
			gatewayTokenInput = resolved.ref;
			gatewayToken = resolved.resolvedValue;
		}
		else if (flow === "quickstart") {
			gatewayToken = (quickstartTokenString ?? require_onboard_helpers.normalizeGatewayTokenInput(process.env.OPERATOR_GATEWAY_TOKEN)) || require_random_token.randomToken();
			gatewayTokenInput = gatewayToken;
		} else {
			const existingToken = quickstartTokenString ?? require_onboard_helpers.normalizeGatewayTokenInput(process.env.OPERATOR_GATEWAY_TOKEN);
			let tokenInput;
			if (existingToken) tokenInput = await prompter.confirm({
				message: require_i18n.t("wizard.gateway.existingTokenConfirm", { token: require_secret_mask.maskApiKey(existingToken) }),
				initialValue: true
			}) ? existingToken : await prompter.text({
				message: require_i18n.t("wizard.gateway.tokenPromptGenerate"),
				placeholder: require_i18n.t("wizard.gateway.tokenPlaceholder"),
				sensitive: true
			});
			else tokenInput = await prompter.text({
				message: require_i18n.t("wizard.gateway.tokenPromptGenerate"),
				placeholder: require_i18n.t("wizard.gateway.tokenPlaceholder"),
				sensitive: true
			});
			gatewayToken = require_onboard_helpers.normalizeGatewayTokenInput(tokenInput) || require_random_token.randomToken();
			gatewayTokenInput = gatewayToken;
		}
	}
	if (authMode === "password") {
		let password = flow === "quickstart" && quickstartGateway.password ? quickstartGateway.password : void 0;
		if (!password) if (await require_provider_auth_mode.resolveSecretInputModeForEnvSelection({
			prompter,
			explicitMode: opts.secretInputMode,
			copy: {
				modeMessage: require_i18n.t("wizard.gateway.authPasswordMode"),
				plaintextLabel: require_i18n.t("wizard.gateway.plaintextPasswordLabel"),
				plaintextHint: require_i18n.t("wizard.gateway.plaintextPasswordHint")
			}
		}) === "ref") password = (await require_provider_auth_ref.promptSecretRefForSetup({
			provider: "gateway-auth-password",
			config: nextConfig,
			prompter,
			preferredEnvVar: "OPERATOR_GATEWAY_PASSWORD",
			copy: {
				sourceMessage: require_i18n.t("wizard.gateway.authPasswordStoredMessage"),
				envVarPlaceholder: "OPERATOR_GATEWAY_PASSWORD"
			}
		})).ref;
		else password = normalizeWizardTextInput(await prompter.text({
			message: require_i18n.t("wizard.gateway.passwordPrompt"),
			validate: require_onboard_helpers.validateGatewayPasswordInput,
			sensitive: true
		}));
		nextConfig = {
			...nextConfig,
			gateway: {
				...nextConfig.gateway,
				auth: {
					...nextConfig.gateway?.auth,
					mode: "password",
					password
				}
			}
		};
	} else if (authMode === "token") nextConfig = {
		...nextConfig,
		gateway: {
			...nextConfig.gateway,
			auth: {
				...nextConfig.gateway?.auth,
				mode: "token",
				token: gatewayTokenInput
			}
		}
	};
	nextConfig = {
		...nextConfig,
		gateway: {
			...nextConfig.gateway,
			port,
			bind,
			...bind === "custom" && customBindHost ? { customBindHost } : {},
			tailscale: {
				...nextConfig.gateway?.tailscale,
				mode: tailscaleMode,
				resetOnExit: tailscaleResetOnExit
			}
		}
	};
	if (flow === "quickstart" && bind === "loopback" && nextConfig.gateway?.controlUi?.allowInsecureAuth === void 0) nextConfig = {
		...nextConfig,
		gateway: {
			...nextConfig.gateway,
			controlUi: {
				...nextConfig.gateway?.controlUi,
				allowInsecureAuth: true
			}
		}
	};
	nextConfig = require_gateway_control_ui_origins.ensureControlUiAllowedOriginsForNonLoopbackBind(nextConfig, { requireControlUiEnabled: true }).config;
	nextConfig = await maybeAddTailnetOriginToControlUiAllowedOrigins({
		config: nextConfig,
		tailscaleMode,
		tailscaleBin
	});
	if (!quickstartGateway.hasExisting && nextConfig.gateway?.nodes?.denyCommands === void 0 && nextConfig.gateway?.nodes?.allowCommands === void 0 && nextConfig.gateway?.nodes?.browser === void 0) nextConfig = {
		...nextConfig,
		gateway: {
			...nextConfig.gateway,
			nodes: {
				...nextConfig.gateway?.nodes,
				denyCommands: [...require_node_command_policy.DEFAULT_DANGEROUS_NODE_COMMANDS]
			}
		}
	};
	return {
		nextConfig,
		settings: {
			port,
			bind,
			customBindHost: bind === "custom" ? customBindHost : void 0,
			authMode,
			gatewayToken,
			tailscaleMode,
			tailscaleResetOnExit
		}
	};
}
//#endregion
exports.configureGatewayForSetup = configureGatewayForSetup;
