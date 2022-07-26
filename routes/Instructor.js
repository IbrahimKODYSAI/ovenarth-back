import express from "express";
import instructorCtrl from "../controllers/instructorCtrl";
import { requireSignin } from "../middlewares";

const router = express.Router();

router.post(
  "/become-instructor",
  requireSignin,
  instructorCtrl.becomeInstructor
);

// router.get("/send-email", authCtrl.sendTestEmail);

module.exports = router;
