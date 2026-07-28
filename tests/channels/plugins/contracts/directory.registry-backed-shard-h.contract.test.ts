// Directory registry shard H tests cover directory channel contracts against registry-backed fixtures.
import { installDirectoryContractRegistryShard } from "../../../../src/channels/plugins/contracts/test-helpers/registry-backed-contract-shards.js";

installDirectoryContractRegistryShard({ shardIndex: 7, shardCount: 8 });
