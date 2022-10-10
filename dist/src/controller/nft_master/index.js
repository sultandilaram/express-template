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
exports.remove = exports.update = exports.insert = exports.get = exports.get_all = void 0;
const client_1 = require("@prisma/client");
const response_1 = __importDefault(require("../../helper/response"));
/// DEFINING THE PRISMA CLIENT
const prisma = new client_1.PrismaClient();
const get_all = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const data = yield prisma.nft_master.findMany();
        /// SENDING RESPONSE
        return res.json(response_1.default.success(data, "NFT CREATORS MASTER"));
    }
    catch (e) {
        console.error(e, "ERROR");
        return res.json(response_1.default.error(e, "GET ALL NFT CREATORS MASTER"));
    }
});
exports.get_all = get_all;
const get = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    try {
        const data = prisma.nft_master.findUnique({
            where: {
                nft_id: parseInt(id),
            },
        });
        /// SENDING RESPONSE
        return res.json(response_1.default.success(data, "NFT CREATORS MASTER"));
    }
    catch (e) {
        console.error(e, "ERROR");
        return res.json(response_1.default.error(e, "GET NFT CREATORS MASTER"));
    }
});
exports.get = get;
const insert = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const body = req.body;
    if (!body) {
        return res.json(response_1.default.error("BODY NOT FOUND", "NFT MASTER"));
    }
    try {
        const data = yield prisma.nft_master.create({
            data: body,
        });
        /// SENDING RESPONSE
        return res.json(response_1.default.success(data, "CREATED SUCCESSFULLY"));
    }
    catch (e) {
        console.error(e, "ERROR");
        return res.json(response_1.default.error(e, "INSERT NFT MASTER"));
    }
});
exports.insert = insert;
const update = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const body = req.body;
    const { id } = req.params;
    if (!body) {
        return res.json(response_1.default.error("BODY NOT FOUND", "NFT MASTER"));
    }
    try {
        const data = yield prisma.nft_master.update({
            where: {
                nft_id: parseInt(id),
            },
            data: body,
        });
        /// SENDING RESPONSE
        return res.json(response_1.default.success(data, "UPDATED SUCCESSFULLY"));
    }
    catch (e) {
        console.error(e, "ERROR");
        return res.json(response_1.default.error(e, "UPDATE NFT MASTER"));
    }
});
exports.update = update;
const remove = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.body;
    if (!id) {
        return res.json(response_1.default.error("BODY NOT FOUND", "NFT MASTER"));
    }
    try {
        const data = yield prisma.nft_master.delete({
            where: {
                nft_id: id,
            },
        });
        /// SENDING RESPONSE
        return res.json(response_1.default.success(data, "DELETED SUCCESSFULLY"));
    }
    catch (e) {
        console.error(e, "ERROR");
        return res.json(response_1.default.error(e, "DELETE NFT MASTER"));
    }
});
exports.remove = remove;
