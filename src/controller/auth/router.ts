import express from "express";
import ResponseHandler from "../../helper/response";

// CONTROLLERS
import { confirm_wallet, register, login } from ".";

// ROUTER
const router = express.Router();

// HANDLING ROUTES
router.get("/confirm_wallet/:wallet", confirm_wallet);
router.post("/login/", login);
router.post("/register", register);

// HANDLING UNKNOW REQUEST
router.use(function (req, res, next) {
  return res.json(ResponseHandler.not_found(null, "INVALID ROUTE!"));
});

export default router;
