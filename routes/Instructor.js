import express from "express";
import instructorCtrl from "../controllers/instructorCtrl";
import { requireSignin } from "../middlewares";

const router = express.Router();

router.post(
  "/become-instructor",
  requireSignin,
  instructorCtrl.becomeInstructor
);
router.post(
  "/get-account-status",
  requireSignin,
  instructorCtrl.getAccountStatus
);
router.get(
  "/current-instructor",
  requireSignin,
  instructorCtrl.currentInstructor
);
router.get(
  "/instructor-courses",
  requireSignin,
  instructorCtrl.instructorCourse
);

// router.get("/send-email", authCtrl.sendTestEmail);

module.exports = router;
