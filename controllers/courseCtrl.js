import Course from "../models/course";
import dotenv from "dotenv";
import AWS from "aws-sdk";
import nanoid from "nanoid";
import slugify from "slugify";
import { readFileSync } from "fs";
import express from "express";
import course from "../models/course";
import { exec } from "child_process";
import { stringify } from "querystring";

dotenv.config();

const awsConfig = {
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
  apiVersion: process.env.AWS_API_VERSION,
};

const S3 = new AWS.S3(awsConfig);

const uploadImage = async (req, res) => {
  try {
    const { image } = req.body;
    if (!image) return res.status(400).send("No image");

    const base64Data = new Buffer.from(
      image.replace(/^data:image\/\w+;base64,/, " "),
      "base64"
    );

    const type = image.split(";")[0].split("/")[1];

    const params = {
      Bucket: "onvenarth",
      Key: `${nanoid()}.${type}`,
      Body: base64Data,
      ACL: "public-read",
      ContentEncoding: "base64",
      ContentType: `ìmage/${type}`,
    };

    S3.upload(params, (err, data) => {
      if (err) {
        console.log(err);
        return res.sendStatus(400);
      }

      console.log(data);
      res.send(data);
    });
  } catch (err) {
    console.log(err);
  }
};

const removeImage = async (req, res) => {
  try {
    const { image } = req.body;

    const params = {
      Bucket: image.Bucket,
      Key: image.Key,
    };

    S3.deleteObject(params, (err, data) => {
      if (err) {
        console.log(err);
        return res.sendStatus(400);
      }
      res.send({ ok: true });
    });
  } catch (err) {
    console.log(err);
  }
};

const uploadVideo = async (req, res) => {
  try {
    const userId = req.auth._id;
    const instructorId = req.params.instructorId;

    if (userId !== instructorId) {
      return res.status(400).send("Unauthorized");
    }
    const { video } = req.files;
    if (!video) return res.status(400).send("No video");

    const params = {
      Bucket: "onvenarth",
      Key: `${nanoid()}.${video.type.split("/")[1]}`,
      Body: readFileSync(video.path),
      ACL: "public-read",
      ContentEncoding: "base64",
      ContentType: video.type,
    };

    S3.upload(params, (err, data) => {
      if (err) {
        console.log(err);
        return res.sendStatus(400);
      }

      console.log(data);
      res.send(data);
    });
  } catch (err) {
    console.log(err);
  }
};

const removeVideo = async (req, res) => {
  try {
    const userId = req.auth._id;
    const instructorId = req.params.instructorId;

    if (userId !== instructorId) {
      return res.status(400).send("Unauthorized");
    }

    const { video } = req.body;
    if (!video) return res.status(400).send("No video");

    const params = {
      Bucket: video.Bucket,
      Key: video.Key,
    };

    S3.deleteObject(params, (err, data) => {
      if (err) {
        console.log(err);
        return res.sendStatus(400);
      }
      res.send(data);
    });
  } catch (err) {
    console.log(err);
  }
};

const editImage = async (req, res) => {
  const { slug } = req.params;
  try {
    const { image } = req.body;
    const imagefound = await Course.findOneAndUpdate(
      { slug },
      { image: {} },
      { new: true }
    ).exec();

    const params = {
      Bucket: image.Bucket,
      Key: image.Key,
    };

    S3.deleteObject(params, (err, data) => {
      if (err) {
        console.log(err);
        return res.sendStatus(400);
      }
      res.json(imagefound);
    });
  } catch (err) {
    console.log(err);
  }
};

const create = async (req, res) => {
  try {
    const alreadyExist = await Course.findOne({
      slug: slugify(req.body.name.toLowerCase()),
    });
    if (alreadyExist) return res.status(400).send("Title is taken");

    const course = await new Course({
      slug: slugify(req.body.name),
      instructor: req.auth._id,
      ...req.body,
    }).save();

    res.json(course);
  } catch (err) {
    console.log(err);
    return res
      .status(400)
      .send("Course create failed. Please try again or later");
  }
};
const edit = async (req, res) => {
  const { slug } = req.params;
  const { name, category, description, price, paid, image, course } = req.body;
  const newcourse = course;
  try {
    const course = await Course.findOneAndUpdate(
      { slug },
      {
        name,
        category,
        description,
        price,
        paid,
        image,
        lesson: newcourse.lesson,
        slug: slugify(name),
      },
      { new: true }
    ).exec();

    res.json(course);
  } catch (err) {
    console.log(err);
    return res
      .status(400)
      .send("Course update failed. Please try again or later");
  }
};

const read = async (req, res) => {
  try {
    const course = await Course.findOne({
      slug: req.params.slug,
    })
      .populate("instructor", "_id name")
      .exec();
    res.json(course);
  } catch (err) {
    console.log(err);
  }
};

const addLesson = async (req, res) => {
  const { slug, instructorId } = req.params;
  const { video, title, content } = req.body;
  const userId = req.auth._id;

  if (userId !== instructorId) {
    return res.status(400).send("Unauthorized");
  }

  const updated = await Course.findOneAndUpdate(
    { slug },
    {
      $push: { lesson: { title, content, video, slug: slugify(title) } },
    },
    { new: true }
  )
    .populate("instructor", "_id name")
    .exec();

  res.json(updated);

  try {
  } catch (err) {
    console.log(err);
    res.status(400).send("Add lesson failed");
  }
};

const updateLesson = async (req, res) => {
  try {
    const { slug } = req.params;
    const userId = req.auth._id;

    const { video, title, content, free_preview, _id } = req.body;

    const course = await Course.findOne({ slug }).select("instructor").exec();

    if (userId != course.instructor._id) {
      return res.status(400).send("Unauthorized");
    }

    const updated = await Course.updateOne(
      { "lesson._id": _id },
      {
        $set: {
          "lesson.$.title": title,
          "lesson.$.content": content,
          "lesson.$.video": video,
          "lesson.$.free_preview": free_preview,
        },
      },
      { new: true }
    ).exec();

    res.json({ ok: true });
    console.log("updated", updated);
  } catch (err) {
    console.log(err);
    res.status(400).send("Update lesson failed.");
  }
};

const publishCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const course = await Course.findById(courseId).select("instructor").exec();

    if (course.instructor != req.auth._id) {
      return res.satatus(400).send("Unauthorized");
    }

    const published = await Course.findByIdAndUpdate(
      courseId,
      { published: true },
      { new: true }
    ).exec();
    res.json(published);
  } catch (err) {
    return res.status(400).send("publish course failded");
  }
};

const unpublishCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const course = await Course.findById(courseId).select("instructor").exec();

    if (course.instructor != req.auth._id) {
      return res.satatus(400).send("Unauthorized");
    }

    const unpublished = await Course.findByIdAndUpdate(
      courseId,
      { published: false },
      { new: true }
    ).exec();
    res.json(unpublished);
  } catch (err) {
    return res.status(400).send("Unpublish course failded");
  }
};

export const courses = async (req, res) => {
  const all = await Course.find({ published: true })
    .populate("instructor", "_id name")
    .exec();
  res.json(all);
};

// const removeLesson = async (req, res) => {
//   const { slug, lessonId } = req.params;
//   const course = await Course.findOne({ slug }).exec();
//   console.log(course.instructor);
//   if (req.auth._id != course.instructor) {
//     return res.status(400).send("Unauthorized");
//   }
//   const courseToDelete = await Course.findByIdAndUpdate(course._id, {
//     $pull: { lesson: { _id: lessonId } },
//   }).exec();

//   res.json({ ok: true });
// };

export default {
  // removeLesson
  uploadImage,
  removeImage,
  uploadVideo,
  removeVideo,
  create,
  read,
  edit,
  addLesson,
  editImage,
  updateLesson,
  unpublishCourse,
  publishCourse,
  courses,
};
