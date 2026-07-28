// Surface registry shard F tests cover exposed channel plugin surfaces against registry fixtures.
import { installSurfaceContractRegistryShard } from "../../../../src/channels/plugins/contracts/test-helpers/registry-backed-contract-shards.js";

installSurfaceContractRegistryShard({ shardIndex: 5, shardCount: 8 });
