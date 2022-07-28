import express from "express";
import courseCtrl from "../controllers/courseCtrl";
import { requireSignin, isInstructor } from "../middlewares";
import formidable from "express-formidable";

const router = express.Router();

router.post("/course/upload-image", requireSignin, courseCtrl.uploadImage);
router.post("/course/remove-image", requireSignin, courseCtrl.removeImage);
router.post("/course/edit-image/:slug", requireSignin, courseCtrl.editImage);
router.post("/course/create", requireSignin, isInstructor, courseCtrl.create);
router.put("/course/edit/:slug", requireSignin, isInstructor, courseCtrl.edit);
router.get("/course/:slug", requireSignin, isInstructor, courseCtrl.read);
router.post(
  "/course/video-upload/:instructorId",
  requireSignin,
  formidable(),
  courseCtrl.uploadVideo
);
router.post(
  "/course/remove-video/:instructorId",
  requireSignin,
  courseCtrl.removeVideo
);
router.post(
  "/course/lesson/:slug/:instructorId",
  requireSignin,
  courseCtrl.addLesson
);

module.exports = router;

// /api/course/lesson/${slug}/${course.instructor._id}
