// Plugin registry shard G tests cover channel plugin contracts against registry-backed fixtures.
import { installPluginContractRegistryShard } from "../../../../src/channels/plugins/contracts/test-helpers/registry-backed-contract-shards.js";

installPluginContractRegistryShard({ shardIndex: 6, shardCount: 8 });
