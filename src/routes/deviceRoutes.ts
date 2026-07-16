import { Router } from "express";
import {
  acknowledgeCommand,
  heartbeat,
  heartbeatSchema,
  list,
  locations,
  message,
  messageSchema,
  me,
  pendingCommands,
  register,
  registerDeviceSchema,
  remove,
  ring,
  ringSchema,
  show,
  trackingSettingsSchema,
  updateTrackingSettings
} from "../controllers/deviceController.js";
import { adminAuth } from "../middleware/adminAuth.js";
import { deviceAuth } from "../middleware/deviceAuth.js";
import { validateBody } from "../middleware/validate.js";

export const deviceRoutes = Router();

deviceRoutes.post("/register", validateBody(registerDeviceSchema), register);
deviceRoutes.post("/heartbeat", deviceAuth, validateBody(heartbeatSchema), heartbeat);
deviceRoutes.get("/me", deviceAuth, me);
deviceRoutes.get("/commands/pending", deviceAuth, pendingCommands);
deviceRoutes.post("/commands/:commandId/ack", deviceAuth, acknowledgeCommand);
deviceRoutes.get("/", adminAuth, list);
deviceRoutes.get("/:id", adminAuth, show);
deviceRoutes.get("/:id/locations", adminAuth, locations);
deviceRoutes.delete("/:id", adminAuth, remove);
deviceRoutes.post("/:id/delete", adminAuth, remove);
deviceRoutes.post("/:id/ring", adminAuth, validateBody(ringSchema), ring);
deviceRoutes.post("/:id/message", adminAuth, validateBody(messageSchema), message);
deviceRoutes.patch("/:id/settings", adminAuth, validateBody(trackingSettingsSchema), updateTrackingSettings);
