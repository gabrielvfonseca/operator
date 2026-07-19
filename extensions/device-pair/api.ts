// Device Pair API module exposes the plugin public contract.
export {
  approveDevicePairing,
  clearDeviceBootstrapTokens,
  issueDeviceBootstrapToken,
  PAIRING_SETUP_BOOTSTRAP_PROFILE,
  listDevicePairing,
  revokeDeviceBootstrapToken,
  type DeviceBootstrapProfile,
} from "openclaw/plugin-sdk/device-bootstrap";
export { definePluginEntry, type OperatorPluginApi } from "openclaw/plugin-sdk/plugin-entry";
export {
  resolveGatewayBindUrl,
  resolveGatewayPort,
  resolveTailnetHostWithRunner,
  resolveTailscaleServeGatewayUrlsWithRunner,
} from "openclaw/plugin-sdk/core";
export { resolveAdvertisedLanHost } from "openclaw/plugin-sdk/gateway-runtime";
export {
  resolvePreferredOperatorTmpDir,
  runPluginCommandWithTimeout,
} from "openclaw/plugin-sdk/sandbox";
export { renderQrPngBase64, renderQrPngDataUrl, writeQrPngTempFile } from "./qr-image.js";
