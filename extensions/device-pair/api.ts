// Device Pair API module exposes the plugin public contract.
export {
  approveDevicePairing,
  clearDeviceBootstrapTokens,
  issueDeviceBootstrapToken,
  PAIRING_SETUP_BOOTSTRAP_PROFILE,
  listDevicePairing,
  revokeDeviceBootstrapToken,
  type DeviceBootstrapProfile,
} from "@gabrielvfonseca/operator/plugin-sdk/device-bootstrap";
export {
  definePluginEntry,
  type OperatorPluginApi,
} from "@gabrielvfonseca/operator/plugin-sdk/plugin-entry";
export {
  resolveGatewayBindUrl,
  resolveGatewayPort,
  resolveTailnetHostWithRunner,
  resolveTailscaleServeGatewayUrlsWithRunner,
} from "@gabrielvfonseca/operator/plugin-sdk/core";
export { resolveAdvertisedLanHost } from "@gabrielvfonseca/operator/plugin-sdk/gateway-runtime";
export {
  resolvePreferredOperatorTmpDir,
  runPluginCommandWithTimeout,
} from "@gabrielvfonseca/operator/plugin-sdk/sandbox";
export { renderQrPngBase64, renderQrPngDataUrl, writeQrPngTempFile } from "./qr-image.js";
