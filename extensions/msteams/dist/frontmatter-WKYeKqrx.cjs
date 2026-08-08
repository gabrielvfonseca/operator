let yaml = require("yaml");
//#region packages/markdown-core/src/frontmatter.ts
function stripQuotes(value) {
	const quote = value.at(0);
	return (quote === "\"" || quote === "'") && value.at(-1) === quote ? value.slice(1, -1) : value;
}
function coerceYamlFrontmatterValue(value) {
	if (value === null || value === void 0) return;
	if (typeof value === "string") return {
		value: value.trim(),
		kind: "scalar"
	};
	if (typeof value === "number" || typeof value === "boolean") return {
		value: String(value),
		kind: "scalar"
	};
	if (typeof value === "object") try {
		return {
			value: JSON.stringify(value),
			kind: "structured"
		};
	} catch {
		return;
	}
}
function parseLineFrontmatter(block) {
	const result = {};
	const lines = block.split("\n");
	for (let i = 0; i < lines.length; i += 1) {
		const match = lines.at(i)?.match(/^([\w-]+):\s*(.*)$/);
		const key = match?.[1];
		const rawValue = match?.[2];
		if (!key || rawValue === void 0) continue;
		let value = rawValue.trim();
		if (!value && /^[ \t]/.test(lines.at(i + 1) ?? "")) {
			const valueLines = [];
			while (i + 1 < lines.length) {
				const line = lines.at(i + 1);
				if (line === void 0 || line && !/^[ \t]/.test(line)) break;
				valueLines.push(line);
				i += 1;
			}
			value = valueLines.join("\n").trim();
		} else value = stripQuotes(value);
		if (value) result[key] = value;
	}
	return result;
}
function parseYamlFrontmatter(block) {
	const fallback = parseLineFrontmatter(block);
	try {
		const doc = (0, yaml.parseDocument)(block, {
			schema: "core",
			prettyErrors: false
		});
		if (doc.errors.length > 0 || !(0, yaml.isMap)(doc.contents)) return fallback;
		const parsed = doc.toJS();
		if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return fallback;
		const inlineColonKeys = /* @__PURE__ */ new Set();
		for (const pair of doc.contents.items) {
			if (!(0, yaml.isNode)(pair.key)) continue;
			const start = pair.key.range?.[0];
			if (start === void 0) continue;
			const lineEnd = block.indexOf("\n", start);
			const match = block.slice(start, lineEnd === -1 ? block.length : lineEnd).match(/^([\w-]+):\s*(.*)$/);
			if (match?.[1] && match[2]?.includes(":")) inlineColonKeys.add(match[1]);
		}
		const result = {};
		for (const [rawKey, value] of Object.entries(parsed)) {
			const key = rawKey.trim();
			const coerced = key ? coerceYamlFrontmatterValue(value) : void 0;
			if (!coerced) continue;
			const fallbackValue = Object.hasOwn(fallback, key) ? fallback[key] : void 0;
			result[key] = coerced.kind === "structured" && inlineColonKeys.has(key) && fallbackValue !== void 0 ? fallbackValue : coerced.value;
		}
		for (const [key, value] of Object.entries(fallback)) if (!Object.hasOwn(result, key)) result[key] = value;
		return result;
	} catch {
		return fallback;
	}
}
function normalizeFrontmatterContent(content) {
	return content.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
}
const FRONTMATTER_CLOSING_DELIMITER = /(?:^|\n)---[^\S\n]*(?:\n|(?![\s\S]))/;
function extractFrontmatterBlockFromNormalized(normalized) {
	const opening = /^---[^\S\n]*\n/.exec(normalized);
	if (!opening) return;
	const blockStart = opening[0].length;
	const tail = normalized.slice(blockStart);
	const closing = FRONTMATTER_CLOSING_DELIMITER.exec(tail);
	if (!closing) return;
	return {
		block: tail.slice(0, closing.index),
		body: tail.slice(closing.index + closing[0].length)
	};
}
/** Splits a complete leading YAML frontmatter block from its Markdown body. */
function extractFrontmatterBlock(content) {
	return extractFrontmatterBlockFromNormalized(normalizeFrontmatterContent(content));
}
/** Removes a leading YAML frontmatter block and returns the remaining Markdown body. */
function stripFrontmatterBlock(content) {
	const normalized = normalizeFrontmatterContent(content);
	return (extractFrontmatterBlockFromNormalized(normalized)?.body ?? normalized).trim();
}
/** Parses leading YAML frontmatter into string values used by skill and metadata loaders. */
function parseFrontmatterBlock(content) {
	const block = extractFrontmatterBlock(content)?.block;
	return block ? parseYamlFrontmatter(block) : {};
}
//#endregion
Object.defineProperty(exports, "extractFrontmatterBlock", {
	enumerable: true,
	get: function() {
		return extractFrontmatterBlock;
	}
});
Object.defineProperty(exports, "parseFrontmatterBlock", {
	enumerable: true,
	get: function() {
		return parseFrontmatterBlock;
	}
});
Object.defineProperty(exports, "stripFrontmatterBlock", {
	enumerable: true,
	get: function() {
		return stripFrontmatterBlock;
	}
});
