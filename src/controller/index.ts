import express from "express";
import { ResponseHelper } from "../helpers";

/// MODULES
import auth from "./auth";

// ROUTER
const router = express.Router();

// HANDLING ROUTES
router.use("/auth", auth);

// HANDLING UNKNOW REQUEST
router.use((_, res) => new ResponseHelper(res).notFound("Path not found"));

export default router;
