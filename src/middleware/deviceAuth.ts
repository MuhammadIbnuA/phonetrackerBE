import type { RequestHandler } from "express";
import { verifyDeviceToken } from "../services/deviceService.js";
import { HttpError } from "../utils/httpError.js";

declare module "express-serve-static-core" {
  interface Request {
    device?: {
      id: string;
      name: string;
    };
  }
}

export const deviceAuth: RequestHandler = async (req, _res, next) => {
  try {
    const deviceId = req.header("x-device-id");
    const token = req.header("x-device-token");

    if (!deviceId || !token) {
      throw new HttpError(401, "Missing device credentials");
    }

    const device = await verifyDeviceToken(deviceId, token);
    req.device = { id: device.id, name: device.device_name };
    next();
  } catch (error) {
    next(error);
  }
};
