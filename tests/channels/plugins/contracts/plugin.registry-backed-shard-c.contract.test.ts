// Plugin registry shard C tests cover channel plugin contracts against registry-backed fixtures.
import { installPluginContractRegistryShard } from "../../../../src/channels/plugins/contracts/test-helpers/registry-backed-contract-shards.js";

installPluginContractRegistryShard({ shardIndex: 2, shardCount: 8 });
