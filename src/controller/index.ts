import express from "express";
import { ResponseHelper } from "../helpers";

import { auth } from "../middlewares";

/// MODULES
import authRouter from "./auth";
import collections from "./collections";
import user from "./user";

// ROUTER
const router = express.Router();

// HANDLING ROUTES
router.use("/auth", authRouter);
router.use("/collections", collections);
router.use("/user", auth, user);

// HANDLING UNKNOW REQUEST
router.use((_, res) => new ResponseHelper(res).notFound("Path not found"));

export default router;
