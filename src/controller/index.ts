import express from "express";
import { ResponseHelper } from "../helper";

/// MODULES
import auth from "./auth/router";

// ROUTER
const router = express.Router();

// HANDLING ROUTES
router.use("/auth", auth);

// HANDLING UNKNOW REQUEST
router.use(function (req, res, next) {
  return new ResponseHelper(res).notFound();
});

export default router;
