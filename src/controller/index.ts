import express from "express";
import ResponseHandler from "../helper/response";

/// MODULES
import auth from "./auth/router";

// ROUTER
const router = express.Router();

// HANDLING ROUTES
router.use("/auth", auth);

// HANDLING UNKNOW REQUEST
router.use(function (req, res, next) {
  return res.json(ResponseHandler.not_found(null, "ROUTE NOT FOUND!"));
});

export default router;
