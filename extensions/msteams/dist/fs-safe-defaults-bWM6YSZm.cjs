let _openclaw_fs_safe_config = require("@openclaw/fs-safe/config");
//#region src/infra/fs-safe-defaults.ts
if (!(process.env.FS_SAFE_PYTHON_MODE != null || process.env.OPERATOR_FS_SAFE_PYTHON_MODE != null)) (0, _openclaw_fs_safe_config.configureFsSafePython)({ mode: "off" });
//#endregion
