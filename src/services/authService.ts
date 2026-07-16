import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { HttpError } from "../utils/httpError.js";

export async function loginAdmin(email: string, password: string): Promise<{ token: string }> {
  if (email.toLowerCase() !== env.ADMIN_EMAIL.toLowerCase()) {
    throw new HttpError(401, "Invalid credentials");
  }

  const ok = await bcrypt.compare(password, env.ADMIN_PASSWORD_HASH);
  if (!ok) {
    throw new HttpError(401, "Invalid credentials");
  }

  return {
    token: jwt.sign({ sub: env.ADMIN_EMAIL, role: "admin" }, env.JWT_SECRET, { expiresIn: "12h" })
  };
}
