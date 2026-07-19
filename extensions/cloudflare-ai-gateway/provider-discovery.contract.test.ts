// Cloudflare Ai Gateway tests cover provider discovery.contract plugin behavior.
import { describeCloudflareAiGatewayProviderDiscoveryContract } from "@gabrielvfonseca/operator/plugin-sdk/provider-test-contracts";

describeCloudflareAiGatewayProviderDiscoveryContract(() => import("./index.js"));
