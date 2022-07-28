import express from "express";
import cookieParser from "cookie-parser";
import mongoose from "mongoose";
import csrf from "csurf";
import cors from "cors";
import { readdirSync } from "fs";
import morgan from "morgan";

import dotenv from "dotenv";
dotenv.config();

const csrfProtection = csrf({ cookie: true });
// express app

const app = express();
app.use(cookieParser());

import path from "path";

// connect to db

mongoose
  .connect(process.env.DB_CONNECTION)
  .then(() => {
    console.log("DB connected !");
  })
  .catch((error) => {
    console.log("DB error", error);
  });

// Middlewares

app.use(cors({ origin: true }));

app.use(express.urlencoded({ extended: true }));

app.use(
  express.json({
    verify: (req, res, buffer) => (req["rawBody"] = buffer),
  })
);
app.use(morgan("dev"));

// Route  middlewares

app.get("/", (req, res) => {
  res.send("we are on home server");
});

readdirSync("./routes").map((route) =>
  app.use("/api", require(`./routes/${route}`))
);

app.use(csrfProtection);

app.get("/api/csrf-token", (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

// server listen

const port = process.env.PORT || 3001;

app.listen(port, () => {
  console.log(`server is up and running on port ${port}`);
});
