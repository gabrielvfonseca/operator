// Directory registry shard C tests cover directory channel contracts against registry-backed fixtures.
import { installDirectoryContractRegistryShard } from "../../../../src/channels/plugins/contracts/test-helpers/registry-backed-contract-shards.js";

installDirectoryContractRegistryShard({ shardIndex: 2, shardCount: 8 });
