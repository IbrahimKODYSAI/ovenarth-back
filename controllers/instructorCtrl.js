import User from "../models/user";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import AWS from "aws-sdk";
import dotenv from "dotenv";
const Stripe = require("stripe")(process.env.STRIP_SECRET_KEY);

import nanoid from "nanoid";
import queryString from "query-string";

dotenv.config();

const becomeInstructor = async (req, res) => {
  // 1. find user from database
  try {
    const userId = req.auth;
    const user = await User.findOne({ _id: userId });

    // 2. if user don't have stripe_ccount_id yet ,then create new
    if (!user.stripe_account_id) {
      const account = await Stripe.account.create({ type: "express" });
      // console.log("account =>", account.id);
      user.stripe_account_id = account.id;
      user.save();
    }

    // 3. create account link based on account id (for frontend to complete onboarding)
    let accountLink = await Stripe.accountLinks.create({
      account: user.stripe_account_id,
      refresh_url: process.env.STRIP_REDIRECT_URL,
      return_url: process.env.STRIP_REDIRECT_URL,
      type: "account_onboarding",
    });
    // console.log(accountLink)

    // 4. pre-fill any info such as eamil (optional), then send ural to front end};
    accountLink = Object.assign(accountLink, {
      "stripe_user[email]": user.email,
    });

    //5. then send the account link response to frontend
    res.send(`${accountLink.url}?${queryString.stringify(accountLink)}`);
  } catch (err) {
    console.log("Become instructor error", err);
  }
};

const getAccountStatus = async (req, res) => {
  try {
    const userId = req.auth;
    const user = await User.findOne({ _id: userId });

    const account = await Stripe.accounts.retrieve(user.stripe_account_id);

    if (!account.charges_enable) {
      return res.status(401).send("Unauthorized");
    } else {
      const statusUpdated = await User.findByIdAndUpdate(
        { _id: userId },
        {
          stripe_seller: account,
          $addToSet: { role: "Instructor" },
        },
        { new: true }
      ).select("-password");
      statusUpdated.password = undefined;
      res.json(statusUpdated);
    }
  } catch (err) {
    console.log(err);
  }
};

export default {
  becomeInstructor,
  getAccountStatus,
};
