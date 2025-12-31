const { Router } = require("express");
const { login, logout } = require("../controllers/login.controller.js");

const router = Router();

router.post("/login", login);
router.post("/logout", logout);

module.exports = router;
