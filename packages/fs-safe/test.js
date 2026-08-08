import { root } from "./dist/index.js";

console.log("Testing fs-safe package...");
const fsRoot = root("/tmp");
console.log("Root handle created successfully");

const testPath = "test.txt";
fsRoot.write(testPath, "Hello, World!", { mkdir: true })
  .then(() => {
    console.log("File written successfully");
    return fsRoot.read(testPath);
  })
  .then((result) => {
    console.log(`File read successfully: ${result.buffer.toString()}`);
    return fsRoot.stat(testPath);
  })
  .then((stats) => {
    console.log(`File stats: size=${stats.size}`);
    console.log("All tests passed!");
  })
  .catch((err) => {
    console.error("Test failed:", err);
    process.exit(1);
  });
