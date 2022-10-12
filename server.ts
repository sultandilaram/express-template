import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import routes from "./src/controller";
import morgan from "morgan";
import { ResponseHelper } from "./src/helpers";
import crons from "./src/crons";

// COLORIZE CONSOLE
const colors = require("colors");

// Load environment variables from .env file, where API keys and passwords are configured
dotenv.config();

// INITIALIZING EXPRESS & PORT
const app = express();
const port = process.env.PORT || 4000;

// CONFIGURING MORGAN
app.use(morgan("dev"));

// FOR RETURNING FILES & IMAGES
app.use(express.static("/"));
app.use("/uploads", express.static("uploads"));

// ENABLING CORS
app.use(cors());
app.options("*", cors());

app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, PUT, POST, DELETE");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

// BODY PARSER
app.use(express.json({ limit: "50mb" }));

/// ROUTES
app.use("/", routes);

// SCHEDULE CRON JOBS
// crons();

// STATING SERVER
app.listen(port, () => {
  console.log(
    colors.bgBrightBlue(`Server is running at: "http://localhost:${port}"`)
  );
});
