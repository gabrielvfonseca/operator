require("./rolldown-runtime-u92d-OFm.cjs");
const require_command_format = require("./command-format-C4ZW2nwK.cjs");
const require_runtime = require("./runtime-BOSfFY3R.cjs");
const require_io = require("./io-DU1xmwPS.cjs");
require("./config-DT0qiglW.cjs");
const require_prompt_style = require("./prompt-style-DDurS--q.cjs");
const require_progress = require("./progress-JkW4pQSo.cjs");
const require_prompt = require("./prompt-VQppewrU.cjs");
const require_migration = require("./migration-ty5IFml7.cjs");
const require_migration_provider_runtime = require("./migration-provider-runtime-BfZcEKfA.cjs");
const require_output = require("./output-yAsarn29.cjs");
const require_apply = require("./apply-B8BP96o8.cjs");
let node_util = require("node:util");
let _clack_prompts = require("@clack/prompts");
let _clack_core = require("@clack/core");
//#region src/commands/migrate/skill-selection-prompt.ts
/** Custom Clack multi-select prompt for Codex migration skill/plugin choices. */
function formatOption(option, state) {
	const label = option.label ?? option.value;
	const withHint = option.hint ? `${label} ${(0, node_util.styleText)("dim", `(${option.hint})`)}` : label;
	switch (state) {
		case "active": return `${(0, node_util.styleText)("cyan", _clack_prompts.S_CHECKBOX_ACTIVE)} ${withHint}`;
		case "active-selected": return `${(0, node_util.styleText)("green", _clack_prompts.S_CHECKBOX_SELECTED)} ${withHint}`;
		case "cancelled": return (0, node_util.styleText)(["strikethrough", "dim"], label);
		case "disabled": return `${(0, node_util.styleText)("gray", _clack_prompts.S_CHECKBOX_INACTIVE)} ${(0, node_util.styleText)(["strikethrough", "gray"], label)}${option.hint ? ` ${(0, node_util.styleText)("dim", `(${option.hint})`)}` : ""}`;
		case "selected": return `${(0, node_util.styleText)("green", _clack_prompts.S_CHECKBOX_SELECTED)} ${(0, node_util.styleText)("dim", withHint)}`;
		case "submitted": return (0, node_util.styleText)("dim", label);
		case "inactive": return `${(0, node_util.styleText)("dim", _clack_prompts.S_CHECKBOX_INACTIVE)} ${(0, node_util.styleText)("dim", withHint)}`;
	}
	return withHint;
}
/** Prompts for migration selection values and reconciles all/none/recommended shortcuts. */
function promptMigrationSkillSelectionValues(opts) {
	const prompt = new _clack_core.MultiSelectPrompt({
		options: opts.options,
		signal: opts.signal,
		input: opts.input,
		output: opts.output,
		initialValues: opts.initialValues,
		cursorAt: opts.cursorAt,
		render() {
			const withGuide = opts.withGuide ?? _clack_core.settings.withGuide;
			const message = (0, _clack_core.wrapTextWithPrefix)(opts.output, opts.message, withGuide ? `${(0, _clack_prompts.symbolBar)(this.state)}  ` : "", `${(0, _clack_prompts.symbol)(this.state)}  `);
			const header = `${withGuide ? `${(0, node_util.styleText)("gray", _clack_prompts.S_BAR)}\n` : ""}${message}\n`;
			const value = this.value ?? [];
			const optionState = (option, active) => {
				if (option.disabled) return formatOption(option, "disabled");
				const selected = value.includes(option.value);
				if (active && selected) return formatOption(option, "active-selected");
				if (selected) return formatOption(option, "selected");
				return formatOption(option, active ? "active" : "inactive");
			};
			switch (this.state) {
				case "submit": {
					const label = this.options.filter((option) => value.includes(option.value)).map((option) => formatOption(option, "submitted")).join((0, node_util.styleText)("dim", ", ")) || (0, node_util.styleText)("dim", "none");
					return `${header}${(0, _clack_core.wrapTextWithPrefix)(opts.output, label, withGuide ? `${(0, node_util.styleText)("gray", _clack_prompts.S_BAR)}  ` : "")}`;
				}
				case "cancel": {
					const selected = this.options.filter((option) => value.includes(option.value)).map((option) => formatOption(option, "cancelled")).join((0, node_util.styleText)("dim", ", "));
					if (selected.trim() === "") return `${header}${(0, node_util.styleText)("gray", _clack_prompts.S_BAR)}`;
					return `${header}${(0, _clack_core.wrapTextWithPrefix)(opts.output, selected, withGuide ? `${(0, node_util.styleText)("gray", _clack_prompts.S_BAR)}  ` : "")}${withGuide ? `\n${(0, node_util.styleText)("gray", _clack_prompts.S_BAR)}` : ""}`;
				}
				case "error": {
					const prefix = withGuide ? `${(0, node_util.styleText)("yellow", _clack_prompts.S_BAR)}  ` : "";
					return `${header}${prefix}${(0, _clack_prompts.limitOptions)({
						output: opts.output,
						options: this.options,
						cursor: this.cursor,
						maxItems: opts.maxItems,
						columnPadding: prefix.length,
						rowPadding: header.split("\n").length + this.error.split("\n").length + 1,
						style: optionState
					}).join(`\n${prefix}`)}\n${this.error.split("\n").map((line, index) => index === 0 ? `${withGuide ? `${(0, node_util.styleText)("yellow", _clack_prompts.S_BAR_END)}  ` : ""}${(0, node_util.styleText)("yellow", line)}` : `   ${line}`).join("\n")}\n`;
				}
				default: {
					const prefix = withGuide ? `${(0, node_util.styleText)("cyan", _clack_prompts.S_BAR)}  ` : "";
					return `${header}${prefix}${(0, _clack_prompts.limitOptions)({
						output: opts.output,
						options: this.options,
						cursor: this.cursor,
						maxItems: opts.maxItems,
						columnPadding: prefix.length,
						rowPadding: header.split("\n").length + (withGuide ? 2 : 1),
						style: optionState
					}).join(`\n${prefix}`)}\n${withGuide ? (0, node_util.styleText)("cyan", _clack_prompts.S_BAR_END) : ""}\n`;
				}
			}
		}
	});
	let lastSelectedValues = [...prompt.value ?? []];
	let lastSpaceDeselectedValue;
	prompt.on("cursor", (key) => {
		if (key !== "space") {
			lastSpaceDeselectedValue = void 0;
			return;
		}
		const activatedValue = prompt.options[prompt.cursor]?.value;
		if (activatedValue === "__operator_migrate_accept_recommended__") {
			prompt.value = [...opts.initialValues ?? []];
			lastSpaceDeselectedValue = void 0;
			lastSelectedValues = [...prompt.value ?? []];
			return;
		}
		const previousValues = lastSelectedValues;
		const selectedValuesAfterClack = prompt.value ?? [];
		prompt.value = require_apply.reconcileInteractiveMigrationSkillToggleValues(selectedValuesAfterClack, activatedValue, opts.selectableValues);
		lastSpaceDeselectedValue = activatedValue !== void 0 && opts.selectableValues.includes(activatedValue) && previousValues.includes(activatedValue) && !(prompt.value ?? []).includes(activatedValue) ? activatedValue : void 0;
		lastSelectedValues = [...prompt.value ?? []];
	});
	prompt.on("key", (key, info) => {
		if (info.name === "return") {
			const activatedOption = prompt.options[prompt.cursor];
			const activatedValue = activatedOption?.disabled ? void 0 : activatedOption?.value;
			if (activatedValue === "__operator_migrate_accept_recommended__") {
				prompt.value = [...opts.initialValues ?? []];
				lastSpaceDeselectedValue = void 0;
				lastSelectedValues = [...prompt.value ?? []];
				return;
			}
			prompt.value = require_apply.reconcileInteractiveMigrationEnterValues(prompt.value ?? [], activatedValue, opts.selectableValues, { preserveDeselectedActivatedValue: activatedValue !== void 0 && activatedValue === lastSpaceDeselectedValue && !(prompt.value ?? []).includes(activatedValue) });
			lastSpaceDeselectedValue = void 0;
			lastSelectedValues = [...prompt.value ?? []];
			return;
		}
		if (key !== "a" && key !== "i") return;
		prompt.value = require_apply.reconcileInteractiveMigrationShortcutValues(lastSelectedValues, prompt.value ?? [], opts.selectableValues, key);
		lastSpaceDeselectedValue = void 0;
		lastSelectedValues = [...prompt.value ?? []];
	});
	return prompt.prompt();
}
//#endregion
//#region src/commands/migrate.ts
/** CLI command orchestration for migration list, plan, and apply flows. */
function selectMigrationItems(plan, opts) {
	return require_apply.applyMigrationPluginSelection(require_apply.applyMigrationSkillSelection(plan, opts.skills), opts.plugins);
}
function hasAuthCredentialCandidate(plan) {
	return plan.items.some((item) => item.kind === "auth" || item.kind === "secret" || item.sensitive === true);
}
function hasPlannedAuthCredentialItem(plan) {
	return plan.items.some((item) => item.status === "planned" && (item.kind === "auth" || item.kind === "secret" || item.sensitive === true));
}
function resolveDefaultIncludeSecrets(opts) {
	if (opts.authCredentials === false) return {
		...opts,
		includeSecrets: false
	};
	if (opts.includeSecrets !== void 0) return opts;
	return opts;
}
function shouldPromptForAuthCredentials(opts) {
	return opts.includeSecrets === void 0 && opts.authCredentials !== false && !opts.yes && !opts.json && process.stdin.isTTY;
}
async function createMigrationPlanWithProgress(runtime, opts) {
	const createPlan = async () => await require_apply.createMigrationPlan(runtime, opts);
	if (opts.json) return selectMigrationItems(await createPlan(), opts);
	return selectMigrationItems(await require_progress.withProgress({
		label: `Scanning ${opts.provider} migration…`,
		indeterminate: true
	}, async (progress) => {
		progress.setLabel("Reading migration source…");
		const planLocal = await createPlan();
		progress.tick();
		return planLocal;
	}), opts);
}
async function createInteractiveMigrationPlanWithAuthPrompt(runtime, opts) {
	if (!shouldPromptForAuthCredentials(opts)) return await migratePlanCommand(runtime, resolveDefaultIncludeSecrets(opts));
	const initialPlan = await migratePlanCommand(runtime, {
		...opts,
		includeSecrets: false,
		suppressPlanLog: true
	});
	if (!hasAuthCredentialCandidate(initialPlan)) {
		if (!opts.suppressPlanLog) _clack_prompts.log.message(require_output.formatMigrationPreview(initialPlan).join("\n"));
		return initialPlan;
	}
	const includeSecrets = await (0, _clack_prompts.confirm)({
		message: require_prompt_style.stylePromptMessage("Do you want to migrate your auth credentials as well?"),
		initialValue: true
	});
	if ((0, _clack_prompts.isCancel)(includeSecrets)) {
		(0, _clack_prompts.cancel)(require_prompt_style.stylePromptTitle("Migration cancelled.") ?? "Migration cancelled.");
		runtime.exit(0);
		throw new Error("unreachable");
	}
	const finalPlan = includeSecrets ? await migratePlanCommand(runtime, {
		...opts,
		includeSecrets: true,
		suppressPlanLog: true
	}) : initialPlan;
	if (!opts.suppressPlanLog) _clack_prompts.log.message(require_output.formatMigrationPreview(finalPlan).join("\n"));
	return finalPlan;
}
function assertVerifyPluginAppsProvider(providerId, opts) {
	if (opts.verifyPluginApps && providerId !== "codex") throw new Error("--verify-plugin-apps is only supported for Codex migrations.");
}
async function promptCodexMigrationSkillSelection(runtime, plan, opts) {
	if (plan.providerId !== "codex" || opts.yes || opts.json || opts.skills !== void 0 || !process.stdin.isTTY) return plan;
	const skillItems = require_apply.getSelectableMigrationSkillItems(plan);
	if (skillItems.length === 0) return plan;
	const selected = await promptMigrationSkillSelectionValues({
		message: require_prompt_style.stylePromptMessage("Select Codex skills to migrate into this agent"),
		options: [
			{
				value: require_apply.MIGRATION_SELECTION_ACCEPT,
				label: "Accept recommended",
				hint: "Migrate every recommended skill"
			},
			...skillItems.map((item) => {
				const hint = require_apply.formatMigrationSkillSelectionHint(item);
				return {
					value: require_apply.getMigrationSkillSelectionValue(item),
					label: require_apply.formatMigrationSkillSelectionLabel(item),
					hint: hint === void 0 ? void 0 : require_prompt_style.stylePromptHint(hint)
				};
			}),
			{
				value: require_apply.MIGRATION_SELECTION_TOGGLE_ALL_ON,
				label: "Toggle all on"
			},
			{
				value: require_apply.MIGRATION_SELECTION_TOGGLE_ALL_OFF,
				label: "Toggle all off"
			}
		],
		initialValues: require_apply.getDefaultMigrationSkillSelectionValues(skillItems),
		selectableValues: skillItems.map(require_apply.getMigrationSkillSelectionValue),
		cursorAt: require_apply.MIGRATION_SELECTION_ACCEPT
	});
	if ((0, _clack_prompts.isCancel)(selected)) {
		(0, _clack_prompts.cancel)(require_prompt_style.stylePromptTitle("Migration cancelled.") ?? "Migration cancelled.");
		runtime.log("Migration cancelled.");
		return null;
	}
	const selection = require_apply.resolveInteractiveMigrationSkillSelection(skillItems, selected ?? []);
	const selectedPlan = require_apply.applyMigrationSelectedSkillItemIds(plan, selection.selectedItemIds);
	runtime.log(`Selected ${selection.selectedItemIds.size} of ${skillItems.length} Codex skills for migration.`);
	return selectedPlan;
}
async function promptCodexMigrationPluginSelection(runtime, plan, opts) {
	if (plan.providerId !== "codex" || opts.yes || opts.json || opts.plugins !== void 0 || !process.stdin.isTTY) return plan;
	const pluginItems = require_apply.getSelectableMigrationPluginItems(plan);
	if (pluginItems.length === 0) return plan;
	const selected = await promptMigrationSkillSelectionValues({
		message: require_prompt_style.stylePromptMessage("Select native Codex plugins to activate in this agent"),
		options: [
			{
				value: require_apply.MIGRATION_SELECTION_ACCEPT,
				label: "Accept recommended",
				hint: "Migrate every recommended plugin"
			},
			...pluginItems.map((item) => {
				const hint = require_apply.formatMigrationPluginSelectionHint(item);
				return {
					value: require_apply.getMigrationPluginSelectionValue(item),
					label: require_apply.formatMigrationPluginSelectionLabel(item),
					hint: hint === void 0 ? void 0 : require_prompt_style.stylePromptHint(hint)
				};
			}),
			{
				value: require_apply.MIGRATION_SELECTION_TOGGLE_ALL_ON,
				label: "Toggle all on"
			},
			{
				value: require_apply.MIGRATION_SELECTION_TOGGLE_ALL_OFF,
				label: "Toggle all off"
			}
		],
		initialValues: require_apply.getDefaultMigrationPluginSelectionValues(pluginItems),
		selectableValues: pluginItems.map(require_apply.getMigrationPluginSelectionValue),
		cursorAt: require_apply.MIGRATION_SELECTION_ACCEPT
	});
	if ((0, _clack_prompts.isCancel)(selected)) {
		(0, _clack_prompts.cancel)(require_prompt_style.stylePromptTitle("Migration cancelled.") ?? "Migration cancelled.");
		runtime.log("Migration cancelled.");
		return null;
	}
	const selection = require_apply.resolveInteractiveMigrationPluginSelection(pluginItems, selected ?? []);
	const selectedPlan = require_apply.applyMigrationSelectedPluginItemIds(plan, selection.selectedItemIds);
	runtime.log(`Selected ${selection.selectedItemIds.size} of ${pluginItems.length} native Codex plugins for activation.`);
	return selectedPlan;
}
async function promptCodexMigrationSelections(runtime, plan, opts) {
	const skillSelectedPlan = await promptCodexMigrationSkillSelection(runtime, plan, opts);
	if (!skillSelectedPlan) return null;
	return await promptCodexMigrationPluginSelection(runtime, skillSelectedPlan, opts);
}
function hasSelectedCodexMigrationWork(plan) {
	return plan.items.some((item) => item.status === "planned" && (item.kind === "auth" || item.kind === "secret" || item.kind === "skill" && item.action === "copy" || item.kind === "plugin" && item.action === "install"));
}
function shouldSkipCodexApplyAfterInteractiveSelection(plan) {
	return plan.providerId === "codex" && !hasSelectedCodexMigrationWork(plan);
}
function hasCodexSubscriptionRequiredPlugin(plan) {
	if (plan.providerId !== "codex") return false;
	return plan.items.some((item) => item.reason === "codex_subscription_required");
}
function readCodexSubscriptionWarning(plan) {
	return plan.warnings?.find((warning) => warning.includes("Codex app-backed plugin migration requires"));
}
function logNoCodexSelection(runtime, plan) {
	if (hasCodexSubscriptionRequiredPlugin(plan)) {
		const warning = readCodexSubscriptionWarning(plan);
		if (warning) runtime.log(warning);
		runtime.log("No Codex skills selected; native Codex plugins are not eligible for migration in this run.");
		return;
	}
	runtime.log("No Codex skills or native Codex plugins selected for migration.");
}
/** Lists available migration providers as JSON or terse terminal rows. */
async function migrateListCommand(runtime, opts = {}) {
	const cfg = require_io.getRuntimeConfig();
	require_migration_provider_runtime.ensureStandaloneMigrationProviderRegistryLoaded({ cfg });
	const providers = require_migration_provider_runtime.resolvePluginMigrationProviders({ cfg }).map((provider) => ({
		id: provider.id,
		label: provider.label,
		description: provider.description
	}));
	if (opts.json) {
		require_runtime.writeRuntimeJson(runtime, { providers });
		return;
	}
	if (providers.length === 0) {
		runtime.log(`No migration providers found. Run ${require_command_format.formatCliCommand("operator plugins list")} to verify provider plugins are installed and enabled.`);
		return;
	}
	runtime.log(providers.map((provider) => provider.description ? `${provider.id}\t${provider.label} - ${provider.description}` : `${provider.id}\t${provider.label}`).join("\n"));
}
/** Creates and prints a migration plan without applying it. */
async function migratePlanCommand(runtime, opts) {
	const providerId = opts.provider?.trim();
	if (!providerId) throw new Error(`Migration provider is required. Run ${require_command_format.formatCliCommand("operator migrate list")} to choose one.`);
	const resolvedOpts = resolveDefaultIncludeSecrets(opts);
	assertVerifyPluginAppsProvider(providerId, resolvedOpts);
	const plan = await createMigrationPlanWithProgress(runtime, {
		...resolvedOpts,
		provider: providerId
	});
	if (resolvedOpts.json) require_runtime.writeRuntimeJson(runtime, require_migration.redactMigrationPlan(plan));
	else if (resolvedOpts.suppressPlanLog !== true) _clack_prompts.log.message(require_output.formatMigrationPreview(plan).join("\n"));
	return plan;
}
async function migrateApplyCommand(runtime, opts) {
	const providerId = opts.provider?.trim();
	if (!providerId) throw new Error(`Migration provider is required. Run ${require_command_format.formatCliCommand("operator migrate list")} to choose one.`);
	assertVerifyPluginAppsProvider(providerId, opts);
	if (opts.noBackup && !opts.force) throw new Error("--no-backup requires --force because it skips the automatic rollback copy.");
	if (!opts.yes && !process.stdin.isTTY) throw new Error(`operator migrate apply requires --yes in non-interactive mode. Preview first with ${require_command_format.formatCliCommand("operator migrate plan --provider <provider>")}.`);
	const provider = require_apply.resolveMigrationProvider(providerId, opts.configOverride);
	if (!opts.yes) {
		const plan = await createInteractiveMigrationPlanWithAuthPrompt(runtime, {
			...opts,
			provider: providerId,
			json: opts.json
		});
		if (opts.json) return plan;
		const selectedPlan = await promptCodexMigrationSelections(runtime, plan, opts);
		if (!selectedPlan) return plan;
		if (shouldSkipCodexApplyAfterInteractiveSelection(selectedPlan)) {
			logNoCodexSelection(runtime, selectedPlan);
			return selectedPlan;
		}
		if (!await require_prompt.promptYesNo("Apply this migration now?", false)) {
			runtime.log("Migration cancelled.");
			return selectedPlan;
		}
		return await require_apply.runMigrationApply({
			runtime,
			opts: {
				...opts,
				provider: providerId,
				yes: true,
				includeSecrets: opts.includeSecrets ?? hasPlannedAuthCredentialItem(selectedPlan),
				preflightPlan: selectedPlan
			},
			providerId,
			provider
		});
	}
	return await require_apply.runMigrationApply({
		runtime,
		opts: resolveDefaultIncludeSecrets(opts),
		providerId,
		provider
	});
}
/** Default migrate command: list providers, plan, dry-run, or apply based on flags. */
async function migrateDefaultCommand(runtime, opts) {
	const providerId = opts.provider?.trim();
	if (!providerId) {
		await migrateListCommand(runtime, { json: opts.json });
		return {
			providerId: "list",
			source: "",
			summary: {
				total: 0,
				planned: 0,
				migrated: 0,
				skipped: 0,
				conflicts: 0,
				errors: 0,
				sensitive: 0
			},
			items: []
		};
	}
	assertVerifyPluginAppsProvider(providerId, opts);
	const resolvedOpts = resolveDefaultIncludeSecrets(opts);
	const plan = opts.json && opts.yes && !opts.dryRun ? selectMigrationItems(await require_apply.createMigrationPlan(runtime, {
		...resolvedOpts,
		provider: providerId
	}), resolvedOpts) : !opts.yes && process.stdin.isTTY ? await createInteractiveMigrationPlanWithAuthPrompt(runtime, {
		...opts,
		provider: providerId,
		json: opts.json && (opts.dryRun || !opts.yes)
	}) : await migratePlanCommand(runtime, {
		...resolvedOpts,
		provider: providerId,
		json: opts.json && (opts.dryRun || !opts.yes)
	});
	if (opts.dryRun) return plan;
	if (opts.json && !opts.yes) return plan;
	if (!opts.yes) {
		if (!process.stdin.isTTY) {
			runtime.log("Re-run with --yes to apply this migration non-interactively.");
			return plan;
		}
		const selectedPlan = await promptCodexMigrationSelections(runtime, plan, opts);
		if (!selectedPlan) return plan;
		if (shouldSkipCodexApplyAfterInteractiveSelection(selectedPlan)) {
			logNoCodexSelection(runtime, selectedPlan);
			return selectedPlan;
		}
		if (!await require_prompt.promptYesNo("Apply this migration now?", false)) {
			runtime.log("Migration cancelled.");
			return selectedPlan;
		}
		return await migrateApplyCommand(runtime, {
			...opts,
			provider: providerId,
			yes: true,
			includeSecrets: opts.includeSecrets ?? hasPlannedAuthCredentialItem(selectedPlan),
			json: opts.json,
			preflightPlan: selectedPlan
		});
	}
	return await migrateApplyCommand(runtime, {
		...resolvedOpts,
		provider: providerId,
		yes: true,
		json: opts.json,
		preflightPlan: plan
	});
}
//#endregion
exports.migrateApplyCommand = migrateApplyCommand;
exports.migrateDefaultCommand = migrateDefaultCommand;
exports.migrateListCommand = migrateListCommand;
exports.migratePlanCommand = migratePlanCommand;
