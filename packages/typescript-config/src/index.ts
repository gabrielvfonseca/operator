export const configs = {
  base: "./base.json",
  core: "./core.json",
  extensions: "./extensions.json",
  package: "./package.json",
  test: "./test.json",
  e2e: "./e2e.json",
} as const;

export type ConfigName = keyof typeof configs;
