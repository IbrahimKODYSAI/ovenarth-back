const express = require("express");
const router = express.Router();
const verify = require("../utils/verifyToken");
const authCtrl = require("../controllers/authCtrl");

router.post("/user/register", authCtrl.register);
router.post("/user/login", authCtrl.login);
router.get("/user/profile", verify, authCtrl.getUserProfile);

module.exports = router;
