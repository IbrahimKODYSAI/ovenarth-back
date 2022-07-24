const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
import { readdirSync } from "fs";
const morgan = require("morgan");

require("dotenv/config");

// express app

const app = express();
const path = require("path");

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

// server listen

const port = process.env.PORT || 3001;

app.listen(port, () => {
  console.log(`server is up and running on port ${port}`);
});
