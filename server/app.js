const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const path = require("path");
const routerV1 = require("./route.v1");

const errorMiddleware = require("./src/middlewares/error.middleware");

const app = express();

const allowedOrigins = [
    "https://matchill.io.vn",
    "https://www.matchill.io.vn",
    "http://localhost:9010",
    "http://localhost:5173",
    "http://127.0.0.1:9010",
    "http://localhost:5173",
];

const corsOptions = {
    origin(origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            return callback(null, true);
        }

        return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

app.use("/api/v1", routerV1);

app.use(errorMiddleware);

module.exports = app;
