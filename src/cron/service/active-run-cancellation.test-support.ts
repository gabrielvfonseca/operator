import "./active-run-cancellation.js";

type ActiveCronTaskRunTestApi = {
  resetActiveCronTaskRunsForTests(): void;
};

function getTestApi(): ActiveCronTaskRunTestApi {
  return (globalThis as Record<PropertyKey, unknown>)[
    Symbol.for("operator.activeCronTaskRunTestApi")
  ] as ActiveCronTaskRunTestApi;
}

export function resetActiveCronTaskRunsForTests(): void {
  getTestApi().resetActiveCronTaskRunsForTests();
}
