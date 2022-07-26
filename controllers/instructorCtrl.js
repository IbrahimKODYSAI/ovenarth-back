import User from "../models/user";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import AWS from "aws-sdk";
import dotenv from "dotenv";

import nanoid from "nanoid";

dotenv.config();

const becomeInstructor = () => {
  console.log("tesst");
};

export default {
  becomeInstructor,
};
