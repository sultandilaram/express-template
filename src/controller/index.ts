import express from "express";
import { ResponseHelper } from "../helpers";

/// MODULES
import auth from "./auth";
import collections from "./collections";
import user from "./user";

// ROUTER
const router = express.Router();

// HANDLING ROUTES
router.use("/auth", auth);
router.use("/collections", collections);
router.use("/user", user);

// HANDLING UNKNOW REQUEST
router.use((_, res) => new ResponseHelper(res).notFound("Path not found"));

export default router;
