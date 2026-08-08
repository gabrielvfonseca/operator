//#region src/shared/deferred.ts
const promiseWithResolvers = Promise;
function createDeferred() {
	return promiseWithResolvers.withResolvers();
}
//#endregion
Object.defineProperty(exports, "createDeferred", {
	enumerable: true,
	get: function() {
		return createDeferred;
	}
});
