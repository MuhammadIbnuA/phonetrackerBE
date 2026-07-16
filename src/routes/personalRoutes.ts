import { Router } from "express";
import { adminAuth } from "../middleware/adminAuth.js";
import { validateBody } from "../middleware/validate.js";
import { alarmSchema, assetSchema, createAlarm, createAsset, createRepair, createTransaction, deleteAlarm, deleteTransaction, listAlarms, listAssets, listTransactions, repairSchema, transactionSchema, updateAsset } from "../controllers/personalController.js";

export const personalRoutes = Router();
personalRoutes.use(adminAuth);
personalRoutes.get("/finance/transactions", listTransactions);
personalRoutes.post("/finance/transactions", validateBody(transactionSchema), createTransaction);
personalRoutes.delete("/finance/transactions/:id", deleteTransaction);
personalRoutes.get("/service/assets", listAssets);
personalRoutes.post("/service/assets", validateBody(assetSchema), createAsset);
personalRoutes.patch("/service/assets/:id", validateBody(assetSchema), updateAsset);
personalRoutes.post("/service/assets/:id/repairs", validateBody(repairSchema), createRepair);
personalRoutes.get("/alarms", listAlarms);
personalRoutes.post("/alarms", validateBody(alarmSchema), createAlarm);
personalRoutes.delete("/alarms/:id", deleteAlarm);
