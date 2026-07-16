import type { RequestHandler } from "express";
import { z } from "zod";
import { supabase } from "../config/supabase.js";
import { HttpError } from "../utils/httpError.js";

const id = z.string().uuid();
const money = z.number().positive().max(999999999999);

export const transactionSchema = z.object({
  transactionType: z.enum(["income", "expense"]),
  amount: money,
  category: z.string().trim().min(1).max(60),
  description: z.string().trim().max(240).nullable().optional(),
  transactionDate: z.string().date()
});

export const assetSchema = z.object({
  assetName: z.string().trim().min(1).max(100),
  assetType: z.string().trim().min(1).max(60),
  lastServiceDate: z.string().date().nullable().optional(),
  nextServiceDate: z.string().date().nullable().optional(),
  maintenanceCost: z.number().min(0).max(999999999999).default(0),
  notes: z.string().trim().max(500).nullable().optional()
});

export const repairSchema = z.object({
  title: z.string().trim().min(1).max(120),
  description: z.string().trim().max(500).nullable().optional(),
  repairDate: z.string().date(),
  cost: z.number().min(0).max(999999999999).default(0)
});

export const alarmSchema = z.object({
  title: z.string().trim().min(1).max(100),
  message: z.string().trim().min(1).max(240),
  alarmMode: z.enum(["once", "daily"]),
  scheduledAt: z.string().datetime().nullable().optional(),
  alarmTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/).nullable().optional(),
  timezone: z.string().trim().min(3).max(60).default("Asia/Jakarta"),
  enabled: z.boolean().default(true)
}).superRefine((value, context) => {
  if (value.alarmMode === "once" && !value.scheduledAt) context.addIssue({ code: "custom", path: ["scheduledAt"], message: "scheduledAt wajib untuk alarm sekali" });
  if (value.alarmMode === "daily" && !value.alarmTime) context.addIssue({ code: "custom", path: ["alarmTime"], message: "alarmTime wajib untuk alarm harian" });
});

function fail(error: { message: string } | null, fallback: string): never {
  throw new HttpError(500, error?.message ?? fallback);
}

export const listTransactions: RequestHandler = async (_req, res, next) => {
  try {
    const { data, error } = await supabase.from("finance_transactions").select("*").order("transaction_date", { ascending: false }).limit(500);
    if (error) fail(error, "Unable to load transactions");
    res.json(data ?? []);
  } catch (error) { next(error); }
};

export const createTransaction: RequestHandler = async (req, res, next) => {
  try {
    const input = transactionSchema.parse(req.body);
    const { data, error } = await supabase.from("finance_transactions").insert({ transaction_type: input.transactionType, amount: input.amount, category: input.category, description: input.description ?? null, transaction_date: input.transactionDate }).select("*").single();
    if (error || !data) fail(error, "Unable to create transaction");
    res.status(201).json(data);
  } catch (error) { next(error); }
};

export const deleteTransaction: RequestHandler = async (req, res, next) => {
  try { const transactionId = id.parse(req.params.id); const { error } = await supabase.from("finance_transactions").delete().eq("id", transactionId); if (error) fail(error, "Unable to delete transaction"); res.status(204).send(); } catch (error) { next(error); }
};

export const listAssets: RequestHandler = async (_req, res, next) => {
  try { const { data, error } = await supabase.from("service_assets").select("*, service_repairs(*)").order("next_service_date", { ascending: true, nullsFirst: false }); if (error) fail(error, "Unable to load service assets"); res.json(data ?? []); } catch (error) { next(error); }
};

export const createAsset: RequestHandler = async (req, res, next) => {
  try { const input = assetSchema.parse(req.body); const { data, error } = await supabase.from("service_assets").insert({ asset_name: input.assetName, asset_type: input.assetType, last_service_date: input.lastServiceDate ?? null, next_service_date: input.nextServiceDate ?? null, maintenance_cost: input.maintenanceCost, notes: input.notes ?? null }).select("*").single(); if (error || !data) fail(error, "Unable to create service asset"); res.status(201).json(data); } catch (error) { next(error); }
};

export const updateAsset: RequestHandler = async (req, res, next) => {
  try { const assetId = id.parse(req.params.id); const input = assetSchema.parse(req.body); const { data, error } = await supabase.from("service_assets").update({ asset_name: input.assetName, asset_type: input.assetType, last_service_date: input.lastServiceDate ?? null, next_service_date: input.nextServiceDate ?? null, maintenance_cost: input.maintenanceCost, notes: input.notes ?? null }).eq("id", assetId).select("*").single(); if (error || !data) fail(error, "Unable to update service asset"); res.json(data); } catch (error) { next(error); }
};

export const createRepair: RequestHandler = async (req, res, next) => {
  try { const assetId = id.parse(req.params.id); const input = repairSchema.parse(req.body); const { data, error } = await supabase.from("service_repairs").insert({ asset_id: assetId, title: input.title, description: input.description ?? null, repair_date: input.repairDate, cost: input.cost }).select("*").single(); if (error || !data) fail(error, "Unable to create repair history"); res.status(201).json(data); } catch (error) { next(error); }
};

export const listAlarms: RequestHandler = async (_req, res, next) => {
  try { const { data, error } = await supabase.from("alarms").select("*").order("created_at", { ascending: false }); if (error) fail(error, "Unable to load alarms"); res.json(data ?? []); } catch (error) { next(error); }
};

export const createAlarm: RequestHandler = async (req, res, next) => {
  try { const input = alarmSchema.parse(req.body); const { data, error } = await supabase.from("alarms").insert({ title: input.title, message: input.message, alarm_mode: input.alarmMode, scheduled_at: input.scheduledAt ?? null, alarm_time: input.alarmTime ?? null, timezone: input.timezone, enabled: input.enabled }).select("*").single(); if (error || !data) fail(error, "Unable to create alarm"); res.status(201).json(data); } catch (error) { next(error); }
};

export const deleteAlarm: RequestHandler = async (req, res, next) => {
  try { const alarmId = id.parse(req.params.id); const { error } = await supabase.from("alarms").delete().eq("id", alarmId); if (error) fail(error, "Unable to delete alarm"); res.status(204).send(); } catch (error) { next(error); }
};
