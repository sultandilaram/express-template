"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const response_1 = __importDefault(require("../../helper/response"));
// CONTROLLERS
// import { confirm_wallet, register, login, verify_token, add_wallet } from ".";
const _1 = require(".");
// ROUTER
const router = express_1.default.Router();
// HANDLING ROUTES
router.post("/auth_request/:wallet", _1.auth_request);
// router.get("/confirm_wallet/:wallet", confirm_wallet);
// router.post("/login", login);
// router.post("/register", register);
// router.post("/verify_token", auth, verify_token);
// router.post("/add_wallet", add_wallet);
// HANDLING UNKNOW REQUEST
router.use(function (req, res, next) {
    return res.json(response_1.default.not_found(null, "INVALID ROUTE!"));
});
exports.default = router;
