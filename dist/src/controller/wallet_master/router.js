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
router.get("/", _1.get_all);
router.get("/:wallet", _1.get);
router.post("/", _1.insert);
router.put("/:id", _1.update);
router.delete("/:id", _1.remove);
// HANDLING UNKNOW REQUEST
router.use(function (req, res, next) {
    return res.json(response_1.default.not_found(null, "ROUTE NOT FOUND!"));
});
exports.default = router;
