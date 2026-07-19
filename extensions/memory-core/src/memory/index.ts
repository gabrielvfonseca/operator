// Memory Core plugin entrypoint registers its Operator integration.
export { MemoryIndexManager } from "./manager.js";
export {
  closeAllMemorySearchManagers,
  closeMemorySearchManager,
  getMemorySearchManager,
} from "./search-manager.js";
