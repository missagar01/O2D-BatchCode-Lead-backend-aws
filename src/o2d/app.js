const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const routes = require("./routes/index.js");

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

// ✅ Register routes
app.use("/", routes);

module.exports = app;
