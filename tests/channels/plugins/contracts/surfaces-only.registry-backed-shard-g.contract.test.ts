// Surface registry shard G tests cover exposed channel plugin surfaces against registry fixtures.
import { installSurfaceContractRegistryShard } from "../../../../src/channels/plugins/contracts/test-helpers/registry-backed-contract-shards.js";

installSurfaceContractRegistryShard({ shardIndex: 6, shardCount: 8 });
