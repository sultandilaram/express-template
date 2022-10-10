"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = exports.confirm_wallet = exports.login = void 0;
const client_1 = require("@prisma/client");
const jwt_1 = require("../../helper/jwt");
const nonce_1 = require("../../helper/nonce");
const response_1 = __importDefault(require("../../helper/response"));
const prisma = new client_1.PrismaClient();
const login = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const body = req.body;
    if (!body.wallet_address || !body.signature) {
        const nonce = (0, nonce_1.create_nonce)();
        return res
            .header("nonce", nonce)
            .json(response_1.default.success(null, "NONCE SEND!"));
    }
    else {
        const user = yield prisma.user_master.findUnique({
            where: {
                user_id: body.id,
            },
        });
        if (user) {
            const token = (0, jwt_1.generate_token)({
                id: user.user_id,
                wallet: body.wallet_address,
                signature: body.signature,
            });
            return res.json(response_1.default.success({ token }, "LOGIN SUCCESS!"));
        }
        return res.json(response_1.default.not_found(null, "USER NOT FOUND!"));
    }
});
exports.login = login;
const confirm_wallet = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { wallet } = req.params;
    try {
        const data = yield prisma.wallet_master.findUnique({
            where: {
                wallet_address: wallet,
            },
        });
        if (data) {
            return res.json(response_1.default.success(data, "WALLET FOUND"));
        }
        else {
            return res.json(response_1.default.error("WALLET NOT FOUND", "WALLET"));
        }
    }
    catch (e) {
        console.error(e, "ERROR");
        return res.json(response_1.default.error(e, "WALLET"));
    }
});
exports.confirm_wallet = confirm_wallet;
const register = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const body = req.body;
    const wallet_address = req.body.wallet_address;
    delete body.wallet_address;
    if (!body) {
        return res.json(response_1.default.error("BODY NOT FOUND", "NFT MASTER"));
    }
    try {
        const data = yield prisma.user_master.create({
            data: body,
        });
        if (data) {
            const wallets = yield prisma.wallet_master.create({
                data: {
                    wallet_address: wallet_address,
                    user_id: data.user_id,
                },
            });
            if (wallets) {
                return res.json(response_1.default.success(data, "CREATED SUCCESSFULLY"));
            }
            return res.json(response_1.default.error(data, "USER CREATED BUT WALLET NOT CREATED"));
        }
        else {
            console.error(data, "ERROR");
            return res.json(response_1.default.error("ERROR", "NFT MASTER"));
        }
    }
    catch (e) {
        console.error(e, "ERROR");
        return res.json(response_1.default.error(e, "INSERT NFT MASTER"));
    }
});
exports.register = register;
