"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const response_1 = __importDefault(require("../../helper/response"));
// CONTROLLERS
const _1 = require(".");
// ROUTER
const router = express_1.default.Router();
// HANDLING ROUTES
router.get("/confirm_wallet/:wallet", _1.confirm_wallet);
router.post("/login/", _1.login);
router.post("/register", _1.register);
// HANDLING UNKNOW REQUEST
router.use(function (req, res, next) {
    return res.json(response_1.default.not_found(null, "INVALID ROUTE!"));
});
exports.default = router;
