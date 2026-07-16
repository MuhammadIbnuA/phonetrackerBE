export type DeviceStatus = "online" | "stale" | "offline";

export type DeviceRecord = {
  id: string;
  device_name: string;
  device_identifier: string;
  device_token_hash: string;
  last_latitude: number | null;
  last_longitude: number | null;
  accuracy: number | null;
  battery_level: number | null;
  network_type: string | null;
  has_internet: boolean | null;
  tracking_enabled: boolean;
  tracking_interval_seconds: number;
  geofence_enabled: boolean;
  geofence_min_latitude: number | null;
  geofence_max_latitude: number | null;
  geofence_min_longitude: number | null;
  geofence_max_longitude: number | null;
  geofence_state: "unknown" | "inside" | "outside";
  geofence_last_event: "entered" | "exited" | null;
  last_seen_at: string | null;
  created_at: string;
  updated_at: string;
};

export type DeviceLocationRecord = {
  id: string;
  device_id: string;
  latitude: number;
  longitude: number;
  accuracy: number | null;
  battery_level: number | null;
  network_type: string | null;
  recorded_at: string;
  received_at: string;
};

export type AuthenticatedDevice = {
  id: string;
  name: string;
};

export type DeviceCommandStatus = "pending" | "sent" | "executed" | "failed";

export type DeviceCommandType = "ring" | "message";

export type DeviceCommandRecord = {
  id: string;
  device_id: string;
  command_type: DeviceCommandType;
  title: string | null;
  body: string | null;
  duration_seconds: number | null;
  payload: Record<string, unknown> | null;
  status: DeviceCommandStatus;
  sent_at: string | null;
  executed_at: string | null;
  created_at: string;
  updated_at: string;
};
