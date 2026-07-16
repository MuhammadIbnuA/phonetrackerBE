import type { RequestHandler } from "express";
import { z } from "zod";
import { loginAdmin } from "../services/authService.js";

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

export const login: RequestHandler = async (req, res, next) => {
  try {
    const result = await loginAdmin(req.body.email, req.body.password);
    res.json(result);
  } catch (error) {
    next(error);
  }
};
