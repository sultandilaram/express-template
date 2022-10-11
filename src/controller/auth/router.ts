import express from "express";
import { ResponseHelper } from "../../helper";

// CONTROLLERS
import * as handlers from ".";
// import { confirm_wallet, register, login, verify_token, add_wallet } from ".";
import { bypass_auth } from "../../middleware/auth";

// ROUTER
const router = express.Router();

router.post("/auth", bypass_auth, handlers.authenticate);
router.post("/auth/request", handlers.auth_request);

// HANDLING ROUTES
// router.post("/auth_request/:wallet", auth_request);

// router.get("/confirm_wallet/:wallet", confirm_wallet);
// router.post("/login", login);
// router.post("/register", register);
// router.post("/verify_token", auth, verify_token);
// router.post("/add_wallet", add_wallet);

// HANDLING UNKNOW REQUEST
router.use(function (req, res, next) {
  return new ResponseHelper(res).notFound();
});

export default router;
