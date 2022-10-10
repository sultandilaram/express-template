"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.create_nonce = void 0;
const crypto_1 = __importDefault(require("crypto"));
const create_nonce = () => {
    const nonce = crypto_1.default.randomBytes(32).toString("base64");
    return nonce;
};
exports.create_nonce = create_nonce;
