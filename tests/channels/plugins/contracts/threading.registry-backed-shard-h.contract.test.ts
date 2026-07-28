// Threading registry shard H tests cover thread binding contracts against registry-backed fixtures.
import { installThreadingContractRegistryShard } from "../../../../src/channels/plugins/contracts/test-helpers/registry-backed-contract-shards.js";

installThreadingContractRegistryShard({ shardIndex: 7, shardCount: 8 });
