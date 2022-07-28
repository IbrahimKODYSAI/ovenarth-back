import { expressjwt as jwt } from "express-jwt";

import dotenv from "dotenv";
import User from "../models/user";
dotenv.config();

export const requireSignin = jwt({
  getToken: (req, res) => req.cookies.token,
  secret: process.env.TOKEN_SECRET,
  algorithms: ["HS256"],
});

export const isInstructor = async (req, res, next) => {
  try {
    const userId = req.auth._id;
    const user = await User.findById({ _id: userId });
    if (!user.role.includes("Instructor")) {
      res.sendStatus(403);
    } else {
      next();
    }
  } catch (err) {
    console.log(err);
  }
};
