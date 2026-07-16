import { supabase } from "../config/supabase.js";
import type { DeviceCommandRecord, DeviceLocationRecord, DeviceRecord } from "../types.js";
import { HttpError } from "../utils/httpError.js";

type RegisterDeviceInput = {
  deviceName: string;
  deviceIdentifier: string;
  tokenHash: string;
};

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

type CommandInput = {
  commandType: "ring" | "message";
  title?: string;
  body?: string;
  durationSeconds?: number;
  payload?: Record<string, unknown>;
};

function raise(error: { message: string } | null, fallback: string): never {
  throw new HttpError(500, error?.message ?? fallback);
}

export async function createDevice(input: RegisterDeviceInput): Promise<DeviceRecord> {
  const { data, error } = await supabase
    .from("devices")
    .insert({
      device_name: input.deviceName,
      device_identifier: input.deviceIdentifier,
      device_token_hash: input.tokenHash,
      tracking_enabled: false,
      last_seen_at: new Date().toISOString()
    })
    .select("*")
    .single();

  if (error || !data) {
    raise(error, "Unable to create device");
  }

  return data as DeviceRecord;
}

export async function findDeviceByIdentifier(deviceIdentifier: string): Promise<DeviceRecord | null> {
  const { data, error } = await supabase
    .from("devices")
    .select("*")
    .eq("device_identifier", deviceIdentifier)
    .maybeSingle();

  if (error) {
    raise(error, "Unable to load device");
  }

  return data as DeviceRecord | null;
}

export async function findDeviceById(id: string): Promise<DeviceRecord | null> {
  const { data, error } = await supabase.from("devices").select("*").eq("id", id).maybeSingle();

  if (error) {
    raise(error, "Unable to load device");
  }

  return data as DeviceRecord | null;
}

export async function listDevices(): Promise<DeviceRecord[]> {
  const { data, error } = await supabase
    .from("devices")
    .select("*")
    .order("last_seen_at", { ascending: false, nullsFirst: false });

  if (error) {
    raise(error, "Unable to load devices");
  }

  return (data ?? []) as DeviceRecord[];
}

export async function updateHeartbeat(deviceId: string, input: TelemetryInput): Promise<DeviceRecord> {
  const update: Record<string, unknown> = {
    last_seen_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  if (typeof input.batteryLevel === "number") update.battery_level = input.batteryLevel;
  if (input.networkType) update.network_type = input.networkType;
  if (typeof input.hasInternet === "boolean") update.has_internet = input.hasInternet;

  const { data, error } = await supabase.from("devices").update(update).eq("id", deviceId).select("*").single();

  if (error || !data) {
    raise(error, "Unable to update heartbeat");
  }

  return data as DeviceRecord;
}

export async function updateTrackingInterval(deviceId: string, seconds: number): Promise<DeviceRecord> {
  const { data, error } = await supabase
    .from("devices")
    .update({ tracking_interval_seconds: seconds, updated_at: new Date().toISOString() })
    .eq("id", deviceId)
    .select("*")
    .single();

  if (error || !data) {
    raise(error, "Unable to update tracking interval");
  }

  return data as DeviceRecord;
}

export async function updateGeofence(deviceId: string, input: {
  geofenceEnabled: boolean;
  minLatitude: number | null;
  maxLatitude: number | null;
  minLongitude: number | null;
  maxLongitude: number | null;
}): Promise<DeviceRecord> {
  const { data, error } = await supabase
    .from("devices")
    .update({
      geofence_enabled: input.geofenceEnabled,
      geofence_min_latitude: input.minLatitude,
      geofence_max_latitude: input.maxLatitude,
      geofence_min_longitude: input.minLongitude,
      geofence_max_longitude: input.maxLongitude,
      updated_at: new Date().toISOString()
    })
    .eq("id", deviceId)
    .select("*")
    .single();

  if (error || !data) raise(error, "Unable to update geofence");
  return data as DeviceRecord;
}

export async function insertLocation(deviceId: string, input: Required<TelemetryInput>): Promise<DeviceLocationRecord> {
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("device_locations")
    .insert({
      device_id: deviceId,
      latitude: input.latitude,
      longitude: input.longitude,
      accuracy: input.accuracy,
      battery_level: input.batteryLevel,
      network_type: input.networkType,
      recorded_at: input.recordedAt,
      received_at: now
    })
    .select("*")
    .single();

  if (error || !data) {
    raise(error, "Unable to insert location");
  }

  const latestUpdate: Record<string, unknown> = {
      last_latitude: input.latitude,
      last_longitude: input.longitude,
      accuracy: input.accuracy,
      battery_level: input.batteryLevel,
      network_type: input.networkType,
      has_internet: input.hasInternet,
      last_seen_at: now,
      updated_at: now
  };
  if (input.geofenceState) latestUpdate.geofence_state = input.geofenceState;
  if (input.geofenceEvent) latestUpdate.geofence_last_event = input.geofenceEvent;

  const { error: updateError } = await supabase
    .from("devices")
    .update(latestUpdate)
    .eq("id", deviceId);

  if (updateError) {
    raise(updateError, "Unable to update latest device location");
  }

  return data as DeviceLocationRecord;
}

export async function listLocations(deviceId: string, limit: number): Promise<DeviceLocationRecord[]> {
  const { data, error } = await supabase
    .from("device_locations")
    .select("*")
    .eq("device_id", deviceId)
    .order("recorded_at", { ascending: false })
    .limit(limit);

  if (error) {
    raise(error, "Unable to load locations");
  }

  return (data ?? []) as DeviceLocationRecord[];
}

export async function deleteDevice(id: string): Promise<void> {
  const { error } = await supabase.from("devices").delete().eq("id", id);
  if (error) {
    raise(error, "Unable to delete device");
  }
}

export async function createCommand(deviceId: string, input: CommandInput): Promise<DeviceCommandRecord> {
  const { data, error } = await supabase
    .from("device_commands")
    .insert({
      device_id: deviceId,
      command_type: input.commandType,
      title: input.title ?? null,
      body: input.body ?? null,
      duration_seconds: input.durationSeconds ?? null,
      payload: input.payload ?? null,
      status: "pending"
    })
    .select("*")
    .single();

  if (error || !data) {
    raise(error, "Unable to create device command");
  }

  return data as DeviceCommandRecord;
}

export async function listPendingCommands(deviceId: string): Promise<DeviceCommandRecord[]> {
  await queueDueAlarms(deviceId);
  const { data, error } = await supabase
    .from("device_commands")
    .select("*")
    .eq("device_id", deviceId)
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  if (error) {
    raise(error, "Unable to load pending commands");
  }

  const commands = (data ?? []) as DeviceCommandRecord[];
  if (commands.length === 0) {
    return commands;
  }

  const commandIds = commands.map((command) => command.id);
  const now = new Date().toISOString();
  const { error: updateError } = await supabase
    .from("device_commands")
    .update({ status: "sent", sent_at: now, updated_at: now })
    .in("id", commandIds);

  if (updateError) {
    raise(updateError, "Unable to mark commands as sent");
  }

  return commands;
}

async function queueDueAlarms(deviceId: string): Promise<void> {
  const { data: alarms, error } = await supabase.from("alarms").select("*").eq("enabled", true);
  if (error) raise(error, "Unable to load alarms");
  const now = new Date();
  for (const alarm of alarms ?? []) {
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: alarm.timezone ?? "Asia/Jakarta",
      year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false
    }).formatToParts(now).reduce<Record<string, string>>((result, part) => { result[part.type] = part.value; return result; }, {});
    const dateKey = `${parts.year}-${parts.month}-${parts.day}`;
    const currentTime = `${parts.hour}:${parts.minute}`;
    const due = alarm.alarm_mode === "daily"
      ? Boolean(alarm.alarm_time && currentTime >= String(alarm.alarm_time).slice(0, 5))
      : Boolean(alarm.scheduled_at && new Date(alarm.scheduled_at) <= now);
    if (!due) continue;
    const occurrenceKey = alarm.alarm_mode === "daily" ? dateKey : String(alarm.scheduled_at);
    const { data: delivery, error: deliveryError } = await supabase.from("alarm_deliveries").insert({ alarm_id: alarm.id, device_id: deviceId, occurrence_key: occurrenceKey }).select("id").maybeSingle();
    if (deliveryError || !delivery) continue;
    await createCommand(deviceId, { commandType: "ring", durationSeconds: 10, title: alarm.title, body: alarm.message, payload: { alarmId: alarm.id, occurrenceKey } });
  }
}

export async function acknowledgeCommand(deviceId: string, commandId: string): Promise<DeviceCommandRecord> {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("device_commands")
    .update({ status: "executed", executed_at: now, updated_at: now })
    .eq("id", commandId)
    .eq("device_id", deviceId)
    .select("*")
    .single();

  if (error || !data) {
    raise(error, "Unable to acknowledge command");
  }

  return data as DeviceCommandRecord;
}
