import express from "express";
import ResponseHandler from "../../helper/response";

// CONTROLLERS
// import { confirm_wallet, register, login, verify_token, add_wallet } from ".";
import { auth_request } from ".";

// AUTH
import { auth } from "../../middleware/auth";

// ROUTER
const router = express.Router();

// HANDLING ROUTES
router.post("/auth_request/:wallet", auth_request);

// router.get("/confirm_wallet/:wallet", confirm_wallet);
// router.post("/login", login);
// router.post("/register", register);
// router.post("/verify_token", auth, verify_token);
// router.post("/add_wallet", add_wallet);

// HANDLING UNKNOW REQUEST
router.use(function (req, res, next) {
  return res.json(ResponseHandler.not_found(null, "INVALID ROUTE!"));
});

export default router;
