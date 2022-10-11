"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.auth = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const response_1 = __importDefault(require("../helper/response"));
const auth = (req, res, next) => {
    console.log(req.headers.authorization, "AUTHORIZATION");
    if (req.headers.authorization &&
        req.headers.authorization.split(" ")[0] === "Bearer") {
        const token = req.headers.authorization.split(" ")[1];
        /// Verify token
        try {
            const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || "secret");
            req.user = decoded;
            next();
        }
        catch (err) {
            return res.json(response_1.default.un_autorized(null, "TOKEN"));
        }
    }
    else {
        return res.json(response_1.default.un_autorized(null, "No token, authorization denied"));
    }
};
exports.auth = auth;
