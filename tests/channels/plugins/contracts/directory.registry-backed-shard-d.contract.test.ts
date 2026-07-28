// Directory registry shard D tests cover directory channel contracts against registry-backed fixtures.
import { installDirectoryContractRegistryShard } from "../../../../src/channels/plugins/contracts/test-helpers/registry-backed-contract-shards.js";

installDirectoryContractRegistryShard({ shardIndex: 3, shardCount: 8 });
