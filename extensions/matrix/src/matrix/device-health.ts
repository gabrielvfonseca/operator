// Matrix plugin module implements device health behavior.
export type MatrixManagedDeviceInfo = {
  deviceId: string;
  displayName: string | null;
  current: boolean;
};

type MatrixDeviceHealthSummary = {
  currentDeviceId: string | null;
  staleOperatorDevices: MatrixManagedDeviceInfo[];
  currentOperatorDevices: MatrixManagedDeviceInfo[];
};

const OPERATOR_DEVICE_NAME_PREFIX = "Operator ";

export function isOperatorManagedMatrixDevice(displayName: string | null | undefined): boolean {
  return displayName?.startsWith(OPERATOR_DEVICE_NAME_PREFIX) === true;
}

export function summarizeMatrixDeviceHealth(
  devices: MatrixManagedDeviceInfo[],
): MatrixDeviceHealthSummary {
  const currentDeviceId = devices.find((device) => device.current)?.deviceId ?? null;
  const openClawDevices = devices.filter((device) =>
    isOperatorManagedMatrixDevice(device.displayName),
  );
  return {
    currentDeviceId,
    staleOperatorDevices: openClawDevices.filter((device) => !device.current),
    currentOperatorDevices: openClawDevices.filter((device) => device.current),
  };
}
