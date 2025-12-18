const express = require("express");
const { getProducts } = require("../controllers/product.controller.js");

const router = express.Router();

router.get("/", getProducts);

module.exports = router;
