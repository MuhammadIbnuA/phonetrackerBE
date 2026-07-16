import { Router } from "express";
import { login, loginSchema } from "../controllers/authController.js";
import { validateBody } from "../middleware/validate.js";

export const authRoutes = Router();

authRoutes.post("/login", validateBody(loginSchema), login);
