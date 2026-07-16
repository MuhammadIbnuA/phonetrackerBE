import type { DeviceStatus } from "../types.js";

export function getDeviceStatus(lastSeenAt: string | null): DeviceStatus {
  if (!lastSeenAt) {
    return "offline";
  }

  const ageMs = Date.now() - new Date(lastSeenAt).getTime();
  if (ageMs <= 90_000) {
    return "online";
  }

  if (ageMs <= 300_000) {
    return "stale";
  }

  return "offline";
}
