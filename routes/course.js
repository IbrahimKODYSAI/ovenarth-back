import express from "express";
import courseCtrl from "../controllers/courseCtrl";
import { requireSignin, isInstructor } from "../middlewares";

const router = express.Router();

router.post("/course/upload-image", requireSignin, courseCtrl.uploadImage);
router.post("/course/remove-image", requireSignin, courseCtrl.removeImage);
router.post("/course/create", requireSignin, isInstructor, courseCtrl.create);
router.get("/course/:slug", requireSignin, isInstructor, courseCtrl.read);

module.exports = router;
