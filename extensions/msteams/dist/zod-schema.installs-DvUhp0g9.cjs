let zod = require("zod");
//#region src/config/zod-schema.installs.ts
const InstallSourceSchema = zod.z.union([
	zod.z.literal("npm"),
	zod.z.literal("archive"),
	zod.z.literal("path"),
	zod.z.literal("clawhub"),
	zod.z.literal("git")
]);
const PluginInstallSourceSchema = zod.z.union([InstallSourceSchema, zod.z.literal("marketplace")]);
/** Zod object shape for persisted generic install records. */
const InstallRecordShape = {
	source: InstallSourceSchema,
	spec: zod.z.string().optional(),
	sourcePath: zod.z.string().optional(),
	installPath: zod.z.string().optional(),
	version: zod.z.string().optional(),
	resolvedName: zod.z.string().optional(),
	resolvedVersion: zod.z.string().optional(),
	resolvedSpec: zod.z.string().optional(),
	integrity: zod.z.string().optional(),
	shasum: zod.z.string().optional(),
	resolvedAt: zod.z.string().optional(),
	installedAt: zod.z.string().optional(),
	clawhubUrl: zod.z.string().optional(),
	clawhubPackage: zod.z.string().optional(),
	clawhubFamily: zod.z.union([zod.z.literal("code-plugin"), zod.z.literal("bundle-plugin")]).optional(),
	clawhubChannel: zod.z.union([
		zod.z.literal("official"),
		zod.z.literal("community"),
		zod.z.literal("private")
	]).optional(),
	clawhubTrustDisposition: zod.z.union([
		zod.z.literal("clean"),
		zod.z.literal("review-recommended"),
		zod.z.literal("review-required"),
		zod.z.literal("blocked")
	]).optional(),
	clawhubTrustScanStatus: zod.z.string().optional(),
	clawhubTrustModerationState: zod.z.string().optional(),
	clawhubTrustReasons: zod.z.array(zod.z.string()).optional(),
	clawhubTrustPending: zod.z.boolean().optional(),
	clawhubTrustStale: zod.z.boolean().optional(),
	clawhubTrustCheckedAt: zod.z.string().optional(),
	clawhubTrustAcknowledgedAt: zod.z.string().optional(),
	artifactKind: zod.z.union([zod.z.literal("legacy-zip"), zod.z.literal("npm-pack")]).optional(),
	artifactFormat: zod.z.union([zod.z.literal("zip"), zod.z.literal("tgz")]).optional(),
	npmIntegrity: zod.z.string().optional(),
	npmShasum: zod.z.string().optional(),
	npmTarballName: zod.z.string().optional(),
	clawpackSha256: zod.z.string().optional(),
	clawpackSpecVersion: zod.z.number().int().nonnegative().optional(),
	clawpackManifestSha256: zod.z.string().optional(),
	clawpackSize: zod.z.number().int().nonnegative().optional(),
	gitUrl: zod.z.string().optional(),
	gitRef: zod.z.string().optional(),
	gitCommit: zod.z.string().optional()
};
const PluginInstallRecordShape = {
	...InstallRecordShape,
	source: PluginInstallSourceSchema,
	marketplaceName: zod.z.string().optional(),
	marketplaceSource: zod.z.string().optional(),
	marketplacePlugin: zod.z.string().optional()
};
//#endregion
Object.defineProperty(exports, "InstallRecordShape", {
	enumerable: true,
	get: function() {
		return InstallRecordShape;
	}
});
Object.defineProperty(exports, "PluginInstallRecordShape", {
	enumerable: true,
	get: function() {
		return PluginInstallRecordShape;
	}
});
