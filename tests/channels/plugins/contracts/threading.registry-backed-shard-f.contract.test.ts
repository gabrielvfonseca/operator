// Threading registry shard F tests cover thread binding contracts against registry-backed fixtures.
import { installThreadingContractRegistryShard } from "../../../../src/channels/plugins/contracts/test-helpers/registry-backed-contract-shards.js";

installThreadingContractRegistryShard({ shardIndex: 5, shardCount: 8 });
