const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const routerV1 = require("./route.v1");

const errorMiddleware = require("./src/middlewares/error.middleware");

const app = express();

app.use(cors());
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/v1", routerV1);

app.use(errorMiddleware);

module.exports = app;
