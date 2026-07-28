// Surface registry shard A tests cover exposed channel plugin surfaces against registry fixtures.
import { installSurfaceContractRegistryShard } from "../../../../src/channels/plugins/contracts/test-helpers/registry-backed-contract-shards.js";

installSurfaceContractRegistryShard({ shardIndex: 0, shardCount: 8 });
