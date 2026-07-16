import type { RequestHandler } from "express";
import { z } from "zod";
import {
  ackCommand,
  getPendingCommands,
  getDevice,
  getDeviceLocations,
  getDevices,
  queueMessageCommand,
  queueRingCommand,
  registerDevice,
  removeDevice,
  saveHeartbeat,
  saveLocation,
  setTrackingSettings
} from "../services/deviceService.js";
import { HttpError } from "../utils/httpError.js";

export const registerDeviceSchema = z.object({
  deviceName: z.string().trim().min(2).max(80),
  deviceIdentifier: z.string().trim().min(8).max(128)
});

export const heartbeatSchema = z.object({
  batteryLevel: z.number().min(0).max(100).optional(),
  networkType: z.string().max(40).optional(),
  hasInternet: z.boolean().optional()
});

export const locationSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  accuracy: z.number().min(0).max(10000),
  batteryLevel: z.number().min(0).max(100),
  networkType: z.string().max(40),
  hasInternet: z.boolean(),
  recordedAt: z.string().datetime(),
  geofenceState: z.enum(["unknown", "inside", "outside"]).optional(),
  geofenceEvent: z.enum(["entered", "exited"]).optional()
});

export const ringSchema = z.object({
  durationSeconds: z.number().int().min(1).max(30).default(5)
});

export const messageSchema = z.object({
  title: z.string().trim().min(1).max(80),
  body: z.string().trim().min(1).max(160)
});

export const trackingSettingsSchema = z.object({
  trackingIntervalSeconds: z.union([
    z.literal(60),
    z.literal(300),
    z.literal(900),
    z.literal(1800),
    z.literal(3600)
  ]),
  geofenceEnabled: z.boolean().default(false),
  minLatitude: z.number().min(-90).max(90).nullable().default(null),
  maxLatitude: z.number().min(-90).max(90).nullable().default(null),
  minLongitude: z.number().min(-180).max(180).nullable().default(null),
  maxLongitude: z.number().min(-180).max(180).nullable().default(null)
});

export const register: RequestHandler = async (req, res, next) => {
  try {
    const result = await registerDevice(req.body.deviceName, req.body.deviceIdentifier);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

export const heartbeat: RequestHandler = async (req, res, next) => {
  try {
    if (!req.device) {
      throw new HttpError(401, "Missing device credentials");
    }

    const result = await saveHeartbeat(req.device.id, req.body);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const me: RequestHandler = async (req, res, next) => {
  try {
    if (!req.device) throw new HttpError(401, "Missing device credentials");
    res.json(await getDevice(req.device.id));
  } catch (error) {
    next(error);
  }
};

export const createLocation: RequestHandler = async (req, res, next) => {
  try {
    if (!req.device) {
      throw new HttpError(401, "Missing device credentials");
    }

    const result = await saveLocation(req.device.id, req.body);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

export const list: RequestHandler = async (_req, res, next) => {
  try {
    res.json(await getDevices());
  } catch (error) {
    next(error);
  }
};

export const show: RequestHandler = async (req, res, next) => {
  try {
    const id = req.params.id;
    if (!id) {
      throw new HttpError(400, "Missing device id");
    }
    res.json(await getDevice(id));
  } catch (error) {
    next(error);
  }
};

export const locations: RequestHandler = async (req, res, next) => {
  try {
    const id = req.params.id;
    if (!id) {
      throw new HttpError(400, "Missing device id");
    }
    const limit = z.coerce.number().int().min(1).max(500).default(100).parse(req.query.limit);
    res.json(await getDeviceLocations(id, limit));
  } catch (error) {
    next(error);
  }
};

export const remove: RequestHandler = async (req, res, next) => {
  try {
    const id = req.params.id;
    if (!id) {
      throw new HttpError(400, "Missing device id");
    }
    res.json(await removeDevice(id));
  } catch (error) {
    next(error);
  }
};

export const ring: RequestHandler = async (req, res, next) => {
  try {
    const id = req.params.id;
    if (!id) {
      throw new HttpError(400, "Missing device id");
    }
    res.status(201).json(await queueRingCommand(id, req.body.durationSeconds));
  } catch (error) {
    next(error);
  }
};

export const message: RequestHandler = async (req, res, next) => {
  try {
    const id = req.params.id;
    if (!id) {
      throw new HttpError(400, "Missing device id");
    }
    res.status(201).json(await queueMessageCommand(id, req.body.title, req.body.body));
  } catch (error) {
    next(error);
  }
};

export const updateTrackingSettings: RequestHandler = async (req, res, next) => {
  try {
    const id = req.params.id;
    if (!id) throw new HttpError(400, "Missing device id");
    res.json(await setTrackingSettings(id, req.body));
  } catch (error) {
    next(error);
  }
};

export const pendingCommands: RequestHandler = async (req, res, next) => {
  try {
    if (!req.device) {
      throw new HttpError(401, "Missing device credentials");
    }
    res.json(await getPendingCommands(req.device.id));
  } catch (error) {
    next(error);
  }
};

export const acknowledgeCommand: RequestHandler = async (req, res, next) => {
  try {
    if (!req.device) {
      throw new HttpError(401, "Missing device credentials");
    }
    const commandId = z.string().uuid().parse(req.params.commandId);
    res.json(await ackCommand(req.device.id, commandId));
  } catch (error) {
    next(error);
  }
};
