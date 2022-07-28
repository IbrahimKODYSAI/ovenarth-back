import express from "express";
import authCtrl from "../controllers/authCtrl";
import { requireSignin } from "../middlewares";

const router = express.Router();

router.post("/user/register", authCtrl.register);
router.post("/user/login", authCtrl.login);
router.get("/user/logout", authCtrl.lougOut);
router.get("/user/profile", requireSignin, authCtrl.getUserProfile);
router.post("/user/send-code", authCtrl.forgotPassword);
router.post("/user/password-reset", authCtrl.resetPassword);

// router.get("/send-email", authCtrl.sendTestEmail);

module.exports = router;
