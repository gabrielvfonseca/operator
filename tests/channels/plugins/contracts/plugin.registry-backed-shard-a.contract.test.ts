// Plugin registry shard A tests cover channel plugin contracts against registry-backed fixtures.
import { installPluginContractRegistryShard } from "../../../../src/channels/plugins/contracts/test-helpers/registry-backed-contract-shards.js";

installPluginContractRegistryShard({ shardIndex: 0, shardCount: 8 });
