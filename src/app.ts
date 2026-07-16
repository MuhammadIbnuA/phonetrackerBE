import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { createLocation, locationSchema } from "./controllers/deviceController.js";
import { env } from "./config/env.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { deviceAuth } from "./middleware/deviceAuth.js";
import { validateBody } from "./middleware/validate.js";
import { authRoutes } from "./routes/authRoutes.js";
import { deviceRoutes } from "./routes/deviceRoutes.js";
import { personalRoutes } from "./routes/personalRoutes.js";

export const app = express();

app.use(helmet());
app.use(
  cors({
    origin: env.CORS_ORIGIN ? env.CORS_ORIGIN.split(",").map((origin) => origin.trim()) : true,
    credentials: true
  })
);
app.use(express.json({ limit: "512kb" }));
app.use(morgan("combined"));

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/api/auth", authRoutes);
app.use("/api/devices", deviceRoutes);
app.use("/api", personalRoutes);
app.post("/api/locations", deviceAuth, validateBody(locationSchema), createLocation);

app.use(errorHandler);
