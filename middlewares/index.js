import { expressjwt as jwt } from "express-jwt";

import dotenv from "dotenv";
dotenv.config();

export const requireSignin = jwt({
  getToken: (req, res) => req.cookies.token,
  secret: process.env.TOKEN_SECRET,
  algorithms: ["HS256"],
});
