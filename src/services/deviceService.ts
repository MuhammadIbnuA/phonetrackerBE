import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import {
  acknowledgeCommand,
  createCommand,
  deleteDevice,
  createDevice,
  findDeviceById,
  findDeviceByIdentifier,
  insertLocation,
  listDevices,
  listPendingCommands,
  listLocations,
  updateHeartbeat,
  updateTrackingInterval,
  updateGeofence
} from "../repositories/deviceRepository.js";
import type { DeviceRecord } from "../types.js";
import { getDeviceStatus } from "../utils/deviceStatus.js";
import { HttpError } from "../utils/httpError.js";

type TelemetryInput = {
  latitude?: number;
  longitude?: number;
  accuracy?: number;
  batteryLevel?: number;
  networkType?: string;
  hasInternet?: boolean;
  recordedAt?: string;
  geofenceState?: "unknown" | "inside" | "outside";
  geofenceEvent?: "entered" | "exited";
};

function publicDevice(device: DeviceRecord) {
  return {
    id: device.id,
    device_name: device.device_name,
    device_identifier: device.device_identifier,
    last_latitude: device.last_latitude,
    last_longitude: device.last_longitude,
    accuracy: device.accuracy,
    battery_level: device.battery_level,
    network_type: device.network_type,
    has_internet: device.has_internet,
    tracking_enabled: device.tracking_enabled,
    tracking_interval_seconds: device.tracking_interval_seconds,
    geofence_enabled: device.geofence_enabled,
    geofence_min_latitude: device.geofence_min_latitude,
    geofence_max_latitude: device.geofence_max_latitude,
    geofence_min_longitude: device.geofence_min_longitude,
    geofence_max_longitude: device.geofence_max_longitude,
    geofence_state: device.geofence_state,
    geofence_last_event: device.geofence_last_event,
    last_seen_at: device.last_seen_at,
    created_at: device.created_at,
    updated_at: device.updated_at,
    status: getDeviceStatus(device.last_seen_at)
  };
}

export async function registerDevice(deviceName: string, deviceIdentifier: string) {
  const existing = await findDeviceByIdentifier(deviceIdentifier);
  if (existing) {
    throw new HttpError(409, "Device identifier already registered");
  }

  const token = crypto.randomBytes(48).toString("base64url");
  const tokenHash = await bcrypt.hash(token, 12);
  const device = await createDevice({ deviceName, deviceIdentifier, tokenHash });

  return {
    device: publicDevice(device),
    deviceToken: token
  };
}

export async function verifyDeviceToken(deviceId: string, token: string): Promise<DeviceRecord> {
  const device = await findDeviceById(deviceId);
  if (!device) {
    throw new HttpError(401, "Invalid device token");
  }

  const ok = await bcrypt.compare(token, device.device_token_hash);
  if (!ok) {
    throw new HttpError(401, "Invalid device token");
  }

  return device;
}

export async function saveHeartbeat(deviceId: string, input: TelemetryInput) {
  const device = await updateHeartbeat(deviceId, input);
  return publicDevice(device);
}

export async function setTrackingSettings(deviceId: string, input: {
  trackingIntervalSeconds: number;
  geofenceEnabled: boolean;
  minLatitude: number | null;
  maxLatitude: number | null;
  minLongitude: number | null;
  maxLongitude: number | null;
}) {
  await getDevice(deviceId);
  if (input.geofenceEnabled && (
    input.minLatitude === null || input.maxLatitude === null ||
    input.minLongitude === null || input.maxLongitude === null
  )) {
    throw new HttpError(400, "All geofence bounds are required when geofence is enabled");
  }
  if (input.geofenceEnabled && (input.minLatitude! > input.maxLatitude! || input.minLongitude! > input.maxLongitude!)) {
    throw new HttpError(400, "Geofence minimum bounds must not exceed maximum bounds");
  }
  await updateTrackingInterval(deviceId, input.trackingIntervalSeconds);
  return publicDevice(await updateGeofence(deviceId, input));
}

export async function saveLocation(deviceId: string, input: Required<TelemetryInput>) {
  return insertLocation(deviceId, input);
}

export async function getDevices() {
  const devices = await listDevices();
  return devices.map(publicDevice);
}

export async function getDevice(id: string) {
  const device = await findDeviceById(id);
  if (!device) {
    throw new HttpError(404, "Device not found");
  }

  return publicDevice(device);
}

export async function getDeviceLocations(deviceId: string, limit: number) {
  await getDevice(deviceId);
  return listLocations(deviceId, limit);
}

export async function removeDevice(id: string) {
  const device = await getDevice(id);
  await deleteDevice(device.id);
  return device;
}

export async function queueRingCommand(deviceId: string, durationSeconds = 5) {
  await getDevice(deviceId);
  return createCommand(deviceId, {
    commandType: "ring",
    durationSeconds,
    payload: { durationSeconds }
  });
}

export async function queueMessageCommand(deviceId: string, title: string, body: string) {
  await getDevice(deviceId);
  return createCommand(deviceId, {
    commandType: "message",
    title,
    body,
    payload: { title, body }
  });
}

export async function getPendingCommands(deviceId: string) {
  await getDevice(deviceId);
  return listPendingCommands(deviceId);
}

export async function ackCommand(deviceId: string, commandId: string) {
  return acknowledgeCommand(deviceId, commandId);
}
