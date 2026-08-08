//#region src/shared/bounded-buffer.ts
var BoundedBuffer = class {
	constructor(capacity, overflow, measure = () => 1) {
		this.capacity = capacity;
		this.overflow = overflow;
		this.measure = measure;
		this.values = [];
		this.size = 0;
		this.closed = false;
	}
	push(value) {
		if (this.closed) return false;
		const valueSize = this.measure(value);
		if (this.size + valueSize <= this.capacity) {
			this.values.push(value);
			this.size += valueSize;
			return true;
		}
		if (this.overflow.mode === "latch") {
			this.closed = true;
			return false;
		}
		if (this.overflow.mode === "fail-closed") {
			this.values = [];
			this.size = 0;
			this.closed = true;
			this.overflow.onOverflow();
			return false;
		}
		this.values.push(value);
		this.size += valueSize;
		while (this.size > this.capacity && this.values.length > 1) this.size -= this.measure(this.values.shift());
		if (this.size > this.capacity) {
			const fitted = this.overflow.fit?.(value, this.capacity);
			this.values = fitted === void 0 ? [] : [fitted];
			this.size = fitted === void 0 ? 0 : this.measure(fitted);
		}
		return true;
	}
	drain() {
		const values = this.values;
		this.values = [];
		this.size = 0;
		return values;
	}
};
//#endregion
//#region src/gateway/terminal/output-ring.ts
/**
* Last `cap` chars of `chunk`, nudged forward one unit when the cut would land
* mid-surrogate-pair: a replayed lone surrogate is permanent mojibake, unlike a
* mid-escape cut the emulator repaints over.
*/
function surrogateSafeTail(chunk, cap) {
	const start = chunk.length - cap;
	const splitsPair = start > 0 && /[\uD800-\uDBFF][\uDC00-\uDFFF]/.test(chunk.slice(start - 1, start + 1));
	return chunk.slice(splitsPair ? start + 1 : start);
}
/** Raw output may start mid-escape after whole-write eviction; repaint recovers. */
var TerminalOutputRing = class extends BoundedBuffer {
	constructor(cap) {
		super(cap, {
			mode: "drop-oldest",
			fit: surrogateSafeTail
		}, (chunk) => chunk.length);
	}
	snapshot() {
		return this.values.join("");
	}
};
//#endregion
Object.defineProperty(exports, "BoundedBuffer", {
	enumerable: true,
	get: function() {
		return BoundedBuffer;
	}
});
Object.defineProperty(exports, "TerminalOutputRing", {
	enumerable: true,
	get: function() {
		return TerminalOutputRing;
	}
});
Object.defineProperty(exports, "surrogateSafeTail", {
	enumerable: true,
	get: function() {
		return surrogateSafeTail;
	}
});
