"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const response_1 = __importDefault(require("../helper/response"));
/// MODULES
const router_1 = __importDefault(require("./auth/router"));
// ROUTER
const router = express_1.default.Router();
// HANDLING ROUTES
router.use("/auth", router_1.default);
// HANDLING UNKNOW REQUEST
router.use(function (req, res, next) {
    return res.json(response_1.default.not_found(null, "ROUTE NOT FOUND!"));
});
exports.default = router;
