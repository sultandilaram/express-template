"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const cors_1 = __importDefault(require("cors"));
const controller_1 = __importDefault(require("./src/controller"));
const morgan_1 = __importDefault(require("morgan"));
// COLORIZE CONSOLE
const colors = require("colors");
// Load environment variables from .env file, where API keys and passwords are configured
dotenv_1.default.config();
// INITIALIZING EXPRESS & PORT
const app = (0, express_1.default)();
const port = process.env.PORT || 4000;
// CONFIGURING MORGAN
app.use((0, morgan_1.default)("dev"));
// FOR RETURNING FILES & IMAGES
app.use(express_1.default.static("/"));
app.use("/uploads", express_1.default.static("uploads"));
// ENABLING CORS
app.use((0, cors_1.default)());
app.options("*", (0, cors_1.default)());
app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, PUT, POST, DELETE");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});
// BODY PARSER
app.use(express_1.default.json({ limit: "50mb" }));
/// ROUTES
app.use("/", controller_1.default);
// STATING SERVER
app.listen(port, () => {
    console.log(colors.bgBrightBlue(`Server is running at: "http://localhost:${port}"`));
});
