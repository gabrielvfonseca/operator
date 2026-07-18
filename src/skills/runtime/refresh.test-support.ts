import "./refresh.js";

type SkillsRefreshTestApi = {
  resetSkillsRefreshForTest(): Promise<void>;
};

function getTestApi(): SkillsRefreshTestApi {
  return (globalThis as Record<PropertyKey, unknown>)[
    Symbol.for("operator.skillsRefreshTestApi")
  ] as SkillsRefreshTestApi;
}

export async function resetSkillsRefreshForTest(): Promise<void> {
  await getTestApi().resetSkillsRefreshForTest();
}
