const require_string_coerce = require("./string-coerce-DZiVVAdw.cjs");
const require_deliver = require("./deliver-1KcHW32R.cjs");
const require_payload = require("./payload-CpwK2DJY.cjs");
require("./security-runtime-DuzdER7a.cjs");
//#region extensions/msteams/src/presentation.ts
const MSTEAMS_PRESENTATION_CAPABILITIES = {
	supported: true,
	buttons: true,
	selects: false,
	context: true,
	divider: true,
	limits: {
		actions: {
			supportsStyles: false,
			supportsDisabled: false
		},
		text: { markdownDialect: "markdown" }
	}
};
function buildMSTeamsPresentationCard(params) {
	const body = [];
	const text = require_string_coerce.normalizeOptionalString(params.text);
	if (text) body.push({
		type: "TextBlock",
		text,
		wrap: true
	});
	const presentation = require_deliver.adaptMessagePresentationForChannel({
		presentation: params.presentation,
		capabilities: MSTEAMS_PRESENTATION_CAPABILITIES
	});
	if (presentation.title) body.push({
		type: "TextBlock",
		text: presentation.title,
		weight: "Bolder",
		size: "Medium",
		wrap: true
	});
	const actions = [];
	for (const block of presentation.blocks) {
		if (block.type === "text" || block.type === "context") {
			body.push({
				type: "TextBlock",
				text: block.text,
				wrap: true,
				...block.type === "context" ? {
					isSubtle: true,
					size: "Small"
				} : {}
			});
			continue;
		}
		if (block.type === "divider") {
			body.push({
				type: "TextBlock",
				text: "---",
				wrap: true,
				isSubtle: true
			});
			continue;
		}
		if (block.type === "buttons") for (const button of block.buttons) {
			const action = require_payload.resolveMessagePresentationButtonAction(button);
			if (action?.type === "url" || action?.type === "web-app") {
				actions.push({
					type: "Action.OpenUrl",
					title: button.label,
					url: action.url
				});
				continue;
			}
			if (action?.type === "command") {
				actions.push({
					type: "Action.Submit",
					title: button.label,
					data: action.command
				});
				continue;
			}
			if (action?.type === "callback") actions.push({
				type: "Action.Submit",
				title: button.label,
				data: {
					value: action.value,
					label: button.label
				}
			});
		}
	}
	return {
		type: "AdaptiveCard",
		version: "1.4",
		body,
		...actions.length ? { actions } : {}
	};
}
//#endregion
Object.defineProperty(exports, "MSTEAMS_PRESENTATION_CAPABILITIES", {
	enumerable: true,
	get: function() {
		return MSTEAMS_PRESENTATION_CAPABILITIES;
	}
});
Object.defineProperty(exports, "buildMSTeamsPresentationCard", {
	enumerable: true,
	get: function() {
		return buildMSTeamsPresentationCard;
	}
});
