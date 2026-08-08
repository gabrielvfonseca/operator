const require_ansi = require("./ansi-DY9p-M6m.cjs");
const require_theme = require("./theme-DwRpEiJc.cjs");
const require_prompts = require("./prompts-DyiRjrc3.cjs");
const require_prompt_style = require("./prompt-style-DDurS--q.cjs");
const require_note = require("./note-DKh-wVkx.cjs");
const require_progress = require("./progress-JkW4pQSo.cjs");
const require_prompt_select_styled_params = require("./prompt-select-styled-params-D3WyR__7.cjs");
let _gabrielvfonseca_normalization_core = require("@gabrielvfonseca/normalization-core");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
let node_util = require("node:util");
let _clack_prompts = require("@clack/prompts");
let _clack_core = require("@clack/core");
//#region src/wizard/clack-navigation-prompts.ts
function getOptionLabel(option) {
	return option.label ?? String(option.value ?? "");
}
function computeLabel(label, format) {
	if (!label.includes("\n")) return format(label);
	return label.split("\n").map((line) => format(line)).join("\n");
}
function getFilteredOption(searchText, option) {
	if (!searchText) return true;
	const term = searchText.toLowerCase();
	return getOptionLabel(option).toLowerCase().includes(term) || (option.hint ?? "").toLowerCase().includes(term) || String(option.value).toLowerCase().includes(term);
}
function formatNavigationFooter(navigation) {
	if (!navigation || !navigation.canGoBack && !navigation.canGoForward) return "";
	return [navigation.canGoBack ? (0, node_util.styleText)("dim", "← back") : void 0, navigation.canGoForward ? (0, node_util.styleText)("dim", "→ next") : void 0].filter(Boolean).join("  ");
}
function navigationFooterLines(guideVisible, barStyle, navigation, extraHints = []) {
	const footer = formatNavigationFooter(navigation);
	if (!footer) return [];
	const hintLine = [footer, ...extraHints].join("  ");
	return [`${guideVisible ? `${(0, node_util.styleText)(barStyle, _clack_prompts.S_BAR)}  ` : ""}${hintLine}`];
}
function hasGuide(opts) {
	return opts.withGuide ?? _clack_core.settings.withGuide;
}
function selectOptionRenderer(option, state) {
	const label = getOptionLabel(option);
	switch (state) {
		case "disabled": return `${(0, node_util.styleText)("gray", _clack_prompts.S_RADIO_INACTIVE)} ${computeLabel(label, (text) => (0, node_util.styleText)("gray", text))}${option.hint ? ` ${(0, node_util.styleText)("dim", `(${option.hint})`)}` : ""}`;
		case "selected": return computeLabel(label, (text) => (0, node_util.styleText)("dim", text));
		case "active": return `${(0, node_util.styleText)("green", _clack_prompts.S_RADIO_ACTIVE)} ${label}${option.hint ? ` ${(0, node_util.styleText)("dim", `(${option.hint})`)}` : ""}`;
		case "cancelled": return computeLabel(label, (text) => (0, node_util.styleText)(["strikethrough", "dim"], text));
		default: return `${(0, node_util.styleText)("dim", _clack_prompts.S_RADIO_INACTIVE)} ${computeLabel(label, (text) => (0, node_util.styleText)("dim", text))}`;
	}
}
function selectWithNavigationFooter(opts) {
	return new _clack_core.SelectPrompt({
		options: opts.options,
		signal: opts.signal,
		input: opts.input,
		output: opts.output,
		initialValue: opts.initialValue,
		render() {
			const showGuide = hasGuide(opts);
			const titlePrefix = `${(0, _clack_prompts.symbol)(this.state)}  `;
			const titlePrefixBar = `${(0, _clack_prompts.symbolBar)(this.state)}  `;
			const messageLines = (0, _clack_core.wrapTextWithPrefix)(opts.output, opts.message, titlePrefixBar, titlePrefix);
			const title = `${showGuide ? `${(0, node_util.styleText)("gray", _clack_prompts.S_BAR)}\n` : ""}${messageLines}\n`;
			switch (this.state) {
				case "submit": {
					const submitPrefix = showGuide ? `${(0, node_util.styleText)("gray", _clack_prompts.S_BAR)}  ` : "";
					return `${title}${(0, _clack_core.wrapTextWithPrefix)(opts.output, selectOptionRenderer((0, _gabrielvfonseca_normalization_core.expectDefined)(this.options[this.cursor], "options entry at this.cursor"), "selected"), submitPrefix)}`;
				}
				case "cancel": {
					const cancelPrefix = showGuide ? `${(0, node_util.styleText)("gray", _clack_prompts.S_BAR)}  ` : "";
					return `${title}${(0, _clack_core.wrapTextWithPrefix)(opts.output, selectOptionRenderer((0, _gabrielvfonseca_normalization_core.expectDefined)(this.options[this.cursor], "options entry at this.cursor"), "cancelled"), cancelPrefix)}${showGuide ? `\n${(0, node_util.styleText)("gray", _clack_prompts.S_BAR)}` : ""}`;
				}
				default: {
					const prefix = showGuide ? `${(0, node_util.styleText)("cyan", _clack_prompts.S_BAR)}  ` : "";
					const footerLines = [...navigationFooterLines(showGuide, "cyan", opts.navigation, [(0, node_util.styleText)("dim", "↑/↓ option")]), showGuide ? (0, node_util.styleText)("cyan", _clack_prompts.S_BAR_END) : ""];
					const titleLineCount = title.split("\n").length;
					const footerLineCount = footerLines.length + 1;
					return `${title}${prefix}${(0, _clack_prompts.limitOptions)({
						output: opts.output,
						cursor: this.cursor,
						options: this.options,
						maxItems: opts.maxItems,
						columnPadding: prefix.length,
						rowPadding: titleLineCount + footerLineCount,
						style: (item, active) => selectOptionRenderer(item, item.disabled ? "disabled" : active ? "active" : "inactive")
					}).join(`\n${prefix}`)}\n${footerLines.join("\n")}\n`;
				}
			}
		}
	}).prompt();
}
function autocompleteWithNavigationFooter(opts) {
	return new _clack_core.AutocompletePrompt({
		options: opts.options,
		initialValue: opts.initialValue === void 0 ? void 0 : [opts.initialValue],
		initialUserInput: opts.initialUserInput,
		placeholder: opts.placeholder,
		filter: opts.filter ?? getFilteredOption,
		signal: opts.signal,
		input: opts.input,
		output: opts.output,
		validate: opts.validate,
		render() {
			const showGuide = hasGuide(opts);
			const headings = showGuide ? [(0, node_util.styleText)("gray", _clack_prompts.S_BAR), `${(0, _clack_prompts.symbol)(this.state)}  ${opts.message}`] : [`${(0, _clack_prompts.symbol)(this.state)}  ${opts.message}`];
			const userInput = this.userInput;
			const options = this.options;
			const showPlaceholder = userInput === "" && opts.placeholder !== void 0;
			const opt = (option, state) => {
				const label = getOptionLabel(option);
				const hint = option.hint && option.value === this.focusedValue ? (0, node_util.styleText)("dim", ` (${option.hint})`) : "";
				switch (state) {
					case "active": return `${(0, node_util.styleText)("green", _clack_prompts.S_RADIO_ACTIVE)} ${label}${hint}`;
					case "inactive": return `${(0, node_util.styleText)("dim", _clack_prompts.S_RADIO_INACTIVE)} ${(0, node_util.styleText)("dim", label)}`;
					case "disabled": return `${(0, node_util.styleText)("gray", _clack_prompts.S_RADIO_INACTIVE)} ${(0, node_util.styleText)(["strikethrough", "gray"], label)}`;
				}
				return "";
			};
			switch (this.state) {
				case "submit": {
					const selected = options.filter((option) => this.selectedValues.includes(option.value));
					const label = selected.length > 0 ? `  ${(0, node_util.styleText)("dim", selected.map(getOptionLabel).join(", "))}` : "";
					const submitPrefix = showGuide ? (0, node_util.styleText)("gray", _clack_prompts.S_BAR) : "";
					return `${headings.join("\n")}\n${submitPrefix}${label}`;
				}
				case "cancel": {
					const userInputText = userInput ? `  ${(0, node_util.styleText)(["strikethrough", "dim"], userInput)}` : "";
					const cancelPrefix = showGuide ? (0, node_util.styleText)("gray", _clack_prompts.S_BAR) : "";
					return `${headings.join("\n")}\n${cancelPrefix}${userInputText}`;
				}
				default: {
					const barStyle = this.state === "error" ? "yellow" : "cyan";
					const guidePrefix = showGuide ? `${(0, node_util.styleText)(barStyle, _clack_prompts.S_BAR)}  ` : "";
					const guidePrefixEnd = showGuide ? (0, node_util.styleText)(barStyle, _clack_prompts.S_BAR_END) : "";
					const searchText = this.isNavigating || showPlaceholder ? opts.placeholder || userInput ? ` ${(0, node_util.styleText)("dim", showPlaceholder ? opts.placeholder ?? "" : userInput)}` : "" : ` ${this.userInputWithCursor}`;
					const matches = this.filteredOptions.length !== options.length ? (0, node_util.styleText)("dim", ` (${this.filteredOptions.length} match${this.filteredOptions.length === 1 ? "" : "es"})`) : "";
					const noResults = this.filteredOptions.length === 0 && userInput ? [`${guidePrefix}${(0, node_util.styleText)("yellow", "No matches found")}`] : [];
					const validationError = this.state === "error" ? [`${guidePrefix}${(0, node_util.styleText)("yellow", this.error)}`] : [];
					if (showGuide) headings.push(guidePrefix.trimEnd());
					headings.push(`${guidePrefix}${(0, node_util.styleText)("dim", "Search:")}${searchText}${matches}`, ...noResults, ...validationError);
					const footers = [
						`${guidePrefix}${[
							`${(0, node_util.styleText)("dim", "↑/↓")} to select`,
							`${(0, node_util.styleText)("dim", "Enter:")} confirm`,
							`${(0, node_util.styleText)("dim", "Type:")} to search`
						].join(" • ")}`,
						...navigationFooterLines(showGuide, barStyle, opts.navigation),
						guidePrefixEnd
					];
					const displayOptions = this.filteredOptions.length === 0 ? [] : (0, _clack_prompts.limitOptions)({
						cursor: this.cursor,
						options: this.filteredOptions,
						columnPadding: showGuide ? 3 : 0,
						rowPadding: headings.length + footers.length,
						style: (option, active) => opt(option, option.disabled ? "disabled" : active ? "active" : "inactive"),
						maxItems: opts.maxItems,
						output: opts.output
					});
					return [
						...headings,
						...displayOptions.map((option) => `${guidePrefix}${option}`),
						...footers
					].join("\n");
				}
			}
		}
	}).prompt();
}
function textWithNavigationFooter(opts) {
	return new _clack_core.TextPrompt({
		validate: opts.validate,
		placeholder: opts.placeholder,
		defaultValue: opts.defaultValue,
		initialValue: opts.initialValue,
		output: opts.output,
		signal: opts.signal,
		input: opts.input,
		render() {
			const showGuide = hasGuide(opts);
			const title = `${`${showGuide ? `${(0, node_util.styleText)("gray", _clack_prompts.S_BAR)}\n` : ""}${(0, _clack_prompts.symbol)(this.state)}  `}${opts.message}\n`;
			const placeholder = opts.placeholder ? (0, node_util.styleText)("inverse", opts.placeholder[0] ?? "") + (0, node_util.styleText)("dim", opts.placeholder.slice(1)) : (0, node_util.styleText)(["inverse", "hidden"], "_");
			const userInput = !this.userInput ? placeholder : this.userInputWithCursor;
			const value = this.value ?? "";
			switch (this.state) {
				case "error": {
					const errorText = this.error ? `  ${(0, node_util.styleText)("yellow", this.error)}` : "";
					const errorPrefix = showGuide ? `${(0, node_util.styleText)("yellow", _clack_prompts.S_BAR)}  ` : "";
					const errorPrefixEnd = showGuide ? (0, node_util.styleText)("yellow", _clack_prompts.S_BAR_END) : "";
					const footerLines = navigationFooterLines(showGuide, "yellow", opts.navigation);
					return `${title.trim()}\n${errorPrefix}${userInput}\n${footerLines.length ? `${footerLines.join("\n")}\n` : ""}${errorPrefixEnd}${errorText}\n`;
				}
				case "submit": {
					const valueText = value ? `  ${(0, node_util.styleText)("dim", value)}` : "";
					return `${title}${showGuide ? (0, node_util.styleText)("gray", _clack_prompts.S_BAR) : ""}${valueText}`;
				}
				case "cancel": {
					const valueText = value ? `  ${(0, node_util.styleText)(["strikethrough", "dim"], value)}` : "";
					const cancelPrefix = showGuide ? (0, node_util.styleText)("gray", _clack_prompts.S_BAR) : "";
					return `${title}${cancelPrefix}${valueText}${value.trim() ? `\n${cancelPrefix}` : ""}`;
				}
				default: {
					const defaultPrefix = showGuide ? `${(0, node_util.styleText)("cyan", _clack_prompts.S_BAR)}  ` : "";
					const defaultPrefixEnd = showGuide ? (0, node_util.styleText)("cyan", _clack_prompts.S_BAR_END) : "";
					const footerLines = navigationFooterLines(showGuide, "cyan", opts.navigation);
					return `${title}${defaultPrefix}${userInput}\n${footerLines.length ? `${footerLines.join("\n")}\n` : ""}${defaultPrefixEnd}\n`;
				}
			}
		}
	}).prompt();
}
function passwordWithNavigationFooter(opts) {
	return new _clack_core.PasswordPrompt({
		validate: opts.validate,
		mask: opts.mask ?? _clack_prompts.S_PASSWORD_MASK,
		signal: opts.signal,
		input: opts.input,
		output: opts.output,
		render() {
			const showGuide = hasGuide(opts);
			const title = `${showGuide ? `${(0, node_util.styleText)("gray", _clack_prompts.S_BAR)}\n` : ""}${(0, _clack_prompts.symbol)(this.state)}  ${opts.message}\n`;
			const userInput = this.userInputWithCursor;
			const masked = this.masked;
			switch (this.state) {
				case "error": {
					const errorPrefix = showGuide ? `${(0, node_util.styleText)("yellow", _clack_prompts.S_BAR)}  ` : "";
					const errorPrefixEnd = showGuide ? `${(0, node_util.styleText)("yellow", _clack_prompts.S_BAR_END)}  ` : "";
					const maskedText = masked ?? "";
					if (opts.clearOnError) this.clear();
					const footerLines = navigationFooterLines(showGuide, "yellow", opts.navigation);
					return `${title.trim()}\n${errorPrefix}${maskedText}\n${footerLines.length ? `${footerLines.join("\n")}\n` : ""}${errorPrefixEnd}${(0, node_util.styleText)("yellow", this.error)}\n`;
				}
				case "submit": return `${title}${showGuide ? `${(0, node_util.styleText)("gray", _clack_prompts.S_BAR)}  ` : ""}${masked ? (0, node_util.styleText)("dim", masked) : ""}`;
				case "cancel": return `${title}${showGuide ? `${(0, node_util.styleText)("gray", _clack_prompts.S_BAR)}  ` : ""}${masked ? (0, node_util.styleText)(["strikethrough", "dim"], masked) : ""}${masked && showGuide ? `\n${(0, node_util.styleText)("gray", _clack_prompts.S_BAR)}` : ""}`;
				default: {
					const defaultPrefix = showGuide ? `${(0, node_util.styleText)("cyan", _clack_prompts.S_BAR)}  ` : "";
					const defaultPrefixEnd = showGuide ? (0, node_util.styleText)("cyan", _clack_prompts.S_BAR_END) : "";
					const footerLines = navigationFooterLines(showGuide, "cyan", opts.navigation);
					return `${title}${defaultPrefix}${userInput}\n${footerLines.length ? `${footerLines.join("\n")}\n` : ""}${defaultPrefixEnd}\n`;
				}
			}
		}
	}).prompt();
}
function multiselectOptionRenderer(option, state) {
	const label = getOptionLabel(option);
	if (state === "disabled") return `${(0, node_util.styleText)("gray", _clack_prompts.S_CHECKBOX_INACTIVE)} ${computeLabel(label, (str) => (0, node_util.styleText)(["strikethrough", "gray"], str))}${option.hint ? ` ${(0, node_util.styleText)("dim", `(${option.hint})`)}` : ""}`;
	if (state === "active") return `${(0, node_util.styleText)("cyan", _clack_prompts.S_CHECKBOX_ACTIVE)} ${label}${option.hint ? ` ${(0, node_util.styleText)("dim", `(${option.hint})`)}` : ""}`;
	if (state === "selected") return `${(0, node_util.styleText)("green", _clack_prompts.S_CHECKBOX_SELECTED)} ${computeLabel(label, (text) => (0, node_util.styleText)("dim", text))}${option.hint ? ` ${(0, node_util.styleText)("dim", `(${option.hint})`)}` : ""}`;
	if (state === "cancelled") return computeLabel(label, (text) => (0, node_util.styleText)(["strikethrough", "dim"], text));
	if (state === "active-selected") return `${(0, node_util.styleText)("green", _clack_prompts.S_CHECKBOX_SELECTED)} ${label}${option.hint ? ` ${(0, node_util.styleText)("dim", `(${option.hint})`)}` : ""}`;
	if (state === "submitted") return computeLabel(label, (text) => (0, node_util.styleText)("dim", text));
	return `${(0, node_util.styleText)("dim", _clack_prompts.S_CHECKBOX_INACTIVE)} ${computeLabel(label, (text) => (0, node_util.styleText)("dim", text))}`;
}
function multiselectWithNavigationFooter(opts) {
	const required = opts.required ?? true;
	return new _clack_core.MultiSelectPrompt({
		options: opts.options,
		signal: opts.signal,
		input: opts.input,
		output: opts.output,
		initialValues: opts.initialValues,
		cursorAt: opts.cursorAt,
		validate(selected) {
			if (required && (selected === void 0 || selected.length === 0)) return `Please select at least one option.\n${(0, node_util.styleText)("reset", (0, node_util.styleText)("dim", `Press ${(0, node_util.styleText)([
				"gray",
				"bgWhite",
				"inverse"
			], " space ")} to select, ${(0, node_util.styleText)("gray", (0, node_util.styleText)("bgWhite", (0, node_util.styleText)("inverse", " enter ")))} to submit`))}`;
		},
		render() {
			const showGuide = hasGuide(opts);
			const wrappedMessage = (0, _clack_core.wrapTextWithPrefix)(opts.output, opts.message, showGuide ? `${(0, _clack_prompts.symbolBar)(this.state)}  ` : "", `${(0, _clack_prompts.symbol)(this.state)}  `);
			const title = `${showGuide ? `${(0, node_util.styleText)("gray", _clack_prompts.S_BAR)}\n` : ""}${wrappedMessage}\n`;
			const value = this.value ?? [];
			const styleOption = (option, active) => {
				if (option.disabled) return multiselectOptionRenderer(option, "disabled");
				const selected = value.includes(option.value);
				if (active && selected) return multiselectOptionRenderer(option, "active-selected");
				if (selected) return multiselectOptionRenderer(option, "selected");
				return multiselectOptionRenderer(option, active ? "active" : "inactive");
			};
			switch (this.state) {
				case "submit": {
					const submitText = this.options.filter(({ value: optionValue }) => value.includes(optionValue)).map((option) => multiselectOptionRenderer(option, "submitted")).join((0, node_util.styleText)("dim", ", ")) || (0, node_util.styleText)("dim", "none");
					return `${title}${(0, _clack_core.wrapTextWithPrefix)(opts.output, submitText, showGuide ? `${(0, node_util.styleText)("gray", _clack_prompts.S_BAR)}  ` : "")}`;
				}
				case "cancel": {
					const label = this.options.filter(({ value: optionValue }) => value.includes(optionValue)).map((option) => multiselectOptionRenderer(option, "cancelled")).join((0, node_util.styleText)("dim", ", "));
					if (label.trim() === "") return `${title}${(0, node_util.styleText)("gray", _clack_prompts.S_BAR)}`;
					return `${title}${(0, _clack_core.wrapTextWithPrefix)(opts.output, label, showGuide ? `${(0, node_util.styleText)("gray", _clack_prompts.S_BAR)}  ` : "")}${showGuide ? `\n${(0, node_util.styleText)("gray", _clack_prompts.S_BAR)}` : ""}`;
				}
				case "error": {
					const prefix = showGuide ? `${(0, node_util.styleText)("yellow", _clack_prompts.S_BAR)}  ` : "";
					const footer = this.error.split("\n").map((line, index) => index === 0 ? `${showGuide ? `${(0, node_util.styleText)("yellow", _clack_prompts.S_BAR_END)}  ` : ""}${(0, node_util.styleText)("yellow", line)}` : `   ${line}`).join("\n");
					const titleLineCount = title.split("\n").length;
					const footerLineCount = footer.split("\n").length + 1;
					return `${title}${prefix}${(0, _clack_prompts.limitOptions)({
						output: opts.output,
						options: this.options,
						cursor: this.cursor,
						maxItems: opts.maxItems,
						columnPadding: prefix.length,
						rowPadding: titleLineCount + footerLineCount,
						style: styleOption
					}).join(`\n${prefix}`)}\n${footer}\n`;
				}
				default: {
					const prefix = showGuide ? `${(0, node_util.styleText)("cyan", _clack_prompts.S_BAR)}  ` : "";
					const footerLines = [...navigationFooterLines(showGuide, "cyan", opts.navigation, [(0, node_util.styleText)("dim", "↑/↓ option"), (0, node_util.styleText)("dim", "space select")]), showGuide ? (0, node_util.styleText)("cyan", _clack_prompts.S_BAR_END) : ""];
					const titleLineCount = title.split("\n").length;
					const footerLineCount = footerLines.length + 1;
					return `${title}${prefix}${(0, _clack_prompts.limitOptions)({
						output: opts.output,
						options: this.options,
						cursor: this.cursor,
						maxItems: opts.maxItems,
						columnPadding: prefix.length,
						rowPadding: titleLineCount + footerLineCount,
						style: styleOption
					}).join(`\n${prefix}`)}\n${footerLines.join("\n")}\n`;
				}
			}
		}
	}).prompt();
}
function autocompleteMultiselectWithNavigationFooter(opts) {
	const formatOption = (option, active, selectedValues, focusedValue) => {
		const isSelected = selectedValues.includes(option.value);
		const label = getOptionLabel(option);
		const hint = option.hint && focusedValue !== void 0 && option.value === focusedValue ? (0, node_util.styleText)("dim", ` (${option.hint})`) : "";
		const checkbox = isSelected ? (0, node_util.styleText)("green", _clack_prompts.S_CHECKBOX_SELECTED) : (0, node_util.styleText)("dim", _clack_prompts.S_CHECKBOX_INACTIVE);
		if (option.disabled) return `${(0, node_util.styleText)("gray", _clack_prompts.S_CHECKBOX_INACTIVE)} ${(0, node_util.styleText)(["strikethrough", "gray"], label)}`;
		if (active) return `${checkbox} ${label}${hint}`;
		return `${checkbox} ${(0, node_util.styleText)("dim", label)}`;
	};
	const prompt = new _clack_core.AutocompletePrompt({
		options: opts.options,
		multiple: true,
		placeholder: opts.placeholder,
		filter: opts.filter ?? getFilteredOption,
		validate: () => {
			if (opts.required && prompt.selectedValues.length === 0) return "Please select at least one item";
		},
		initialValue: opts.initialValues,
		signal: opts.signal,
		input: opts.input,
		output: opts.output,
		render() {
			const showGuide = hasGuide(opts);
			const title = `${showGuide ? `${(0, node_util.styleText)("gray", _clack_prompts.S_BAR)}\n` : ""}${(0, _clack_prompts.symbol)(this.state)}  ${opts.message}\n`;
			const userInput = this.userInput;
			const showPlaceholder = userInput === "" && opts.placeholder !== void 0;
			const searchText = this.isNavigating || showPlaceholder ? (0, node_util.styleText)("dim", showPlaceholder ? opts.placeholder ?? "" : userInput) : this.userInputWithCursor;
			const options = this.options;
			const matches = this.filteredOptions.length !== options.length ? (0, node_util.styleText)("dim", ` (${this.filteredOptions.length} match${this.filteredOptions.length === 1 ? "" : "es"})`) : "";
			switch (this.state) {
				case "submit": return `${title}${showGuide ? `${(0, node_util.styleText)("gray", _clack_prompts.S_BAR)}  ` : ""}${(0, node_util.styleText)("dim", `${this.selectedValues.length} items selected`)}`;
				case "cancel": return `${title}${showGuide ? `${(0, node_util.styleText)("gray", _clack_prompts.S_BAR)}  ` : ""}${(0, node_util.styleText)(["strikethrough", "dim"], userInput)}`;
				default: {
					const barStyle = this.state === "error" ? "yellow" : "cyan";
					const guidePrefix = showGuide ? `${(0, node_util.styleText)(barStyle, _clack_prompts.S_BAR)}  ` : "";
					const guidePrefixEnd = showGuide ? (0, node_util.styleText)(barStyle, _clack_prompts.S_BAR_END) : "";
					const instructions = [
						`${(0, node_util.styleText)("dim", "↑/↓")} to navigate`,
						`${(0, node_util.styleText)("dim", this.isNavigating ? "Space/Tab:" : "Tab:")} select`,
						`${(0, node_util.styleText)("dim", "Enter:")} confirm`,
						`${(0, node_util.styleText)("dim", "Type:")} to search`
					];
					const noResults = this.filteredOptions.length === 0 && userInput ? [`${guidePrefix}${(0, node_util.styleText)("yellow", "No matches found")}`] : [];
					const errorMessage = this.state === "error" ? [`${guidePrefix}${(0, node_util.styleText)("yellow", this.error)}`] : [];
					const headerLines = [
						...`${title}${showGuide ? (0, node_util.styleText)(barStyle, _clack_prompts.S_BAR) : ""}`.split("\n"),
						`${guidePrefix}${(0, node_util.styleText)("dim", "Search:")} ${searchText}${matches}`,
						...noResults,
						...errorMessage
					];
					const footerLines = [
						`${guidePrefix}${instructions.join(" • ")}`,
						...navigationFooterLines(showGuide, barStyle, opts.navigation),
						guidePrefixEnd
					];
					const displayOptions = (0, _clack_prompts.limitOptions)({
						cursor: this.cursor,
						options: this.filteredOptions,
						style: (option, active) => formatOption(option, active, this.selectedValues, this.focusedValue),
						maxItems: opts.maxItems,
						output: opts.output,
						rowPadding: headerLines.length + footerLines.length
					});
					return [
						...headerLines,
						...displayOptions.map((option) => `${guidePrefix}${option}`),
						...footerLines
					].join("\n");
				}
			}
		}
	});
	return prompt.prompt();
}
function confirmWithNavigationFooter(opts) {
	const active = opts.active ?? "Yes";
	const inactive = opts.inactive ?? "No";
	return new _clack_core.ConfirmPrompt({
		active,
		inactive,
		signal: opts.signal,
		input: opts.input,
		output: opts.output,
		initialValue: opts.initialValue ?? true,
		render() {
			const showGuide = hasGuide(opts);
			const titlePrefix = `${(0, _clack_prompts.symbol)(this.state)}  `;
			const titlePrefixBar = showGuide ? `${(0, node_util.styleText)("gray", _clack_prompts.S_BAR)}  ` : "";
			const messageLines = (0, _clack_core.wrapTextWithPrefix)(opts.output, opts.message, titlePrefixBar, titlePrefix);
			const title = `${showGuide ? `${(0, node_util.styleText)("gray", _clack_prompts.S_BAR)}\n` : ""}${messageLines}\n`;
			const value = this.value ? active : inactive;
			switch (this.state) {
				case "submit": return `${title}${showGuide ? `${(0, node_util.styleText)("gray", _clack_prompts.S_BAR)}  ` : ""}${(0, node_util.styleText)("dim", value)}`;
				case "cancel": return `${title}${showGuide ? `${(0, node_util.styleText)("gray", _clack_prompts.S_BAR)}  ` : ""}${(0, node_util.styleText)(["strikethrough", "dim"], value)}${showGuide ? `\n${(0, node_util.styleText)("gray", _clack_prompts.S_BAR)}` : ""}`;
				default: {
					const defaultPrefix = showGuide ? `${(0, node_util.styleText)("cyan", _clack_prompts.S_BAR)}  ` : "";
					const defaultPrefixEnd = showGuide ? (0, node_util.styleText)("cyan", _clack_prompts.S_BAR_END) : "";
					const separator = opts.vertical ? showGuide ? `\n${(0, node_util.styleText)("cyan", _clack_prompts.S_BAR)}  ` : "\n" : ` ${(0, node_util.styleText)("dim", "/")} `;
					const footerLines = navigationFooterLines(showGuide, "cyan", opts.navigation, [(0, node_util.styleText)("dim", "↑/↓ option")]);
					return `${title}${defaultPrefix}${this.value ? `${(0, node_util.styleText)("green", _clack_prompts.S_RADIO_ACTIVE)} ${active}` : `${(0, node_util.styleText)("dim", _clack_prompts.S_RADIO_INACTIVE)} ${(0, node_util.styleText)("dim", active)}`}${separator}${!this.value ? `${(0, node_util.styleText)("green", _clack_prompts.S_RADIO_ACTIVE)} ${inactive}` : `${(0, node_util.styleText)("dim", _clack_prompts.S_RADIO_INACTIVE)} ${(0, node_util.styleText)("dim", inactive)}`}\n${footerLines.length > 0 ? `${footerLines.join("\n")}\n` : ""}${defaultPrefixEnd}\n`;
				}
			}
		}
	}).prompt();
}
//#endregion
//#region src/wizard/clack-prompter.ts
function guardCancel(value) {
	if ((0, _clack_prompts.isCancel)(value)) {
		(0, _clack_prompts.cancel)(require_prompt_style.stylePromptTitle("Setup cancelled.") ?? "Setup cancelled.");
		throw new require_prompts.WizardCancelledError();
	}
	return value;
}
function resolveNavigationDirection(navigation, key) {
	if (key?.name === "left" && navigation?.canGoBack) return "back";
	if (key?.name === "right" && navigation?.canGoForward) return "forward";
}
function hasPromptNavigation(navigation) {
	return navigation?.canGoBack === true || navigation?.canGoForward === true;
}
async function withHorizontalCursorActionsDisabled(disabled, work) {
	if (!disabled) return await work();
	const hadLeft = _clack_prompts.settings.actions.has("left");
	const hadRight = _clack_prompts.settings.actions.has("right");
	_clack_prompts.settings.actions.delete("left");
	_clack_prompts.settings.actions.delete("right");
	try {
		return await work();
	} finally {
		if (hadLeft) _clack_prompts.settings.actions.add("left");
		if (hadRight) _clack_prompts.settings.actions.add("right");
	}
}
async function runPromptWithNavigation(navigation, work) {
	if (!hasPromptNavigation(navigation)) return guardCancel(await work(void 0));
	const controller = new AbortController();
	let navigationDirection;
	const onKeypress = (_input, key) => {
		const nextDirection = resolveNavigationDirection(navigation, key);
		if (!nextDirection) return;
		navigationDirection ??= nextDirection;
		controller.abort();
	};
	try {
		process.stdin.on("keypress", onKeypress);
		const value = await work(controller.signal);
		if (navigationDirection) throw new require_prompts.WizardNavigationError(navigationDirection);
		return guardCancel(value);
	} finally {
		process.stdin.off("keypress", onKeypress);
	}
}
function normalizeSearchTokens(search) {
	return (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(search).split(/\s+/).map((token) => token.trim()).filter((token) => token.length > 0);
}
function buildOptionSearchText(option) {
	return (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(`${require_ansi.stripAnsi(option.label ?? "")} ${require_ansi.stripAnsi(option.hint ?? "")} ${String(option.value ?? "")}`);
}
function tokenizedOptionFilter(search, option) {
	const tokens = normalizeSearchTokens(search);
	if (tokens.length === 0) return true;
	const haystack = buildOptionSearchText(option);
	return tokens.every((token) => haystack.includes(token));
}
function createClackPrompter() {
	return {
		intro: async (title) => {
			(0, _clack_prompts.intro)(require_prompt_style.stylePromptTitle(title) ?? title);
		},
		outro: async (message) => {
			(0, _clack_prompts.outro)(require_prompt_style.stylePromptTitle(message) ?? message);
		},
		note: async (message, title) => {
			require_note.note(message, title);
		},
		plain: async (message) => {
			process.stdout.write(message.endsWith("\n") ? message : `${message}\n`);
		},
		select: async (params) => {
			const { message, options: styledOptions } = require_prompt_select_styled_params.styleSelectParams(params);
			const options = styledOptions;
			return await withHorizontalCursorActionsDisabled(hasPromptNavigation(params.navigation), async () => await runPromptWithNavigation(params.navigation, async (signal) => {
				if (params.searchable) return params.navigation ? await autocompleteWithNavigationFooter({
					message,
					options,
					initialValue: params.initialValue,
					filter: tokenizedOptionFilter,
					signal,
					navigation: params.navigation
				}) : await (0, _clack_prompts.autocomplete)({
					message,
					options,
					initialValue: params.initialValue,
					filter: tokenizedOptionFilter,
					signal
				});
				return params.navigation ? await selectWithNavigationFooter({
					message,
					options,
					initialValue: params.initialValue,
					signal,
					navigation: params.navigation
				}) : await (0, _clack_prompts.select)({
					message,
					options,
					initialValue: params.initialValue,
					signal
				});
			}));
		},
		multiselect: async (params) => {
			const { message, options: styledOptions } = require_prompt_select_styled_params.styleSelectParams(params);
			const options = styledOptions;
			return await withHorizontalCursorActionsDisabled(hasPromptNavigation(params.navigation), async () => await runPromptWithNavigation(params.navigation, async (signal) => {
				if (params.searchable) return params.navigation ? await autocompleteMultiselectWithNavigationFooter({
					message,
					options,
					initialValues: params.initialValues,
					filter: tokenizedOptionFilter,
					signal,
					navigation: params.navigation
				}) : await (0, _clack_prompts.autocompleteMultiselect)({
					message,
					options,
					initialValues: params.initialValues,
					filter: tokenizedOptionFilter,
					signal
				});
				return params.navigation ? await multiselectWithNavigationFooter({
					message,
					options,
					initialValues: params.initialValues,
					signal,
					navigation: params.navigation
				}) : await (0, _clack_prompts.multiselect)({
					message,
					options,
					initialValues: params.initialValues,
					signal
				});
			}));
		},
		text: async (params) => {
			const validate = params.validate;
			return await withHorizontalCursorActionsDisabled(hasPromptNavigation(params.navigation), async () => await runPromptWithNavigation(params.navigation, async (signal) => {
				const message = require_prompt_style.stylePromptMessage(params.message);
				const validateInput = validate ? (value) => validate(value ?? "") : void 0;
				if (params.sensitive) return params.navigation ? await passwordWithNavigationFooter({
					message,
					validate: validateInput,
					navigation: params.navigation,
					signal
				}) : await (0, _clack_prompts.password)({
					message,
					validate: validateInput,
					signal
				});
				return params.navigation ? await textWithNavigationFooter({
					message,
					initialValue: params.initialValue,
					placeholder: params.placeholder,
					validate: validateInput,
					navigation: params.navigation,
					signal
				}) : await (0, _clack_prompts.text)({
					message,
					initialValue: params.initialValue,
					placeholder: params.placeholder,
					validate: validateInput,
					signal
				});
			}));
		},
		confirm: async (params) => await withHorizontalCursorActionsDisabled(hasPromptNavigation(params.navigation), async () => await runPromptWithNavigation(params.navigation, async (signal) => {
			const message = require_prompt_style.stylePromptMessage(params.message);
			if (params.navigation) return await confirmWithNavigationFooter({
				message,
				initialValue: params.initialValue,
				vertical: params.layout === "vertical",
				navigation: params.navigation,
				signal
			});
			return await (0, _clack_prompts.confirm)({
				message,
				initialValue: params.initialValue,
				vertical: params.layout === "vertical",
				signal
			});
		})),
		progress: (label) => {
			const spin = (0, _clack_prompts.spinner)();
			spin.start(require_theme.theme.accent(label));
			const osc = require_progress.createCliProgress({
				label,
				indeterminate: true,
				enabled: true,
				fallback: "none"
			});
			return {
				update: (message) => {
					spin.message(require_theme.theme.accent(message));
					osc.setLabel(message);
				},
				stop: (message) => {
					osc.done();
					if (message === void 0) spin.clear();
					else spin.stop(message);
				}
			};
		}
	};
}
//#endregion
Object.defineProperty(exports, "createClackPrompter", {
	enumerable: true,
	get: function() {
		return createClackPrompter;
	}
});
