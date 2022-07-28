import User from "../models/user";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import AWS from "aws-sdk";
import dotenv from "dotenv";

import nanoid from "nanoid";

dotenv.config();

const awsConfig = {
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
  apiVersion: process.env.AWS_API_VERSION,
};

const SES = new AWS.SES(awsConfig);

//VALIDATION

import {
  registerValidation,
  loginValidation,
  passwordResetValidation,
} from "../validation";

const register = async (req, res) => {
  const firstname = req.body.firstname;
  const lastname = req.body.lastname;
  const username = req.body.username;
  const email = req.body.email;
  const password = req.body.password;
  const passwordConfirm = req.body.passwordConfirm;
  try {
    //  VALIDATE THE DATA DEFORE CREATING A USER
    const { error } = registerValidation(req.body);
    if (error) return res.status(400).send(error.details[0].message);

    // Checking if user already exist in databade
    const emailExist = await User.findOne({ email: email });
    if (emailExist) return res.status(400).send("Email already exists");

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const hashedPasswordConfirm = await bcrypt.hash(passwordConfirm, salt);

    // creat a user
    const user = new User({
      firstname: firstname,
      lastname: lastname,
      username: username,
      email: email,
      password: hashedPassword,
      passwordConfirm: hashedPasswordConfirm,
    });

    await user.save();
    res.send({
      user: user._id,
    });
  } catch (err) {
    res.status(400).send(err);
  }
};

const login = async (req, res) => {
  console.log(req.body);
  const email = req.body.email;
  const password = req.body.password;

  try {
    //VALIDATE DATA BEFORE LOGING
    const { error } = loginValidation(req.body);
    if (error) return res.status(400).send(error.details[0].message);

    // Check if user exist in database
    const user = await User.findOne({ email: email });
    if (!user) return res.status(422).send({ error: `Email doesn't exist` });

    // PASSWORD IS CORRECT
    const validPass = await bcrypt.compare(password, user.password);
    if (!validPass) return res.status(403).send({ error: `Invalid Password` });

    // Creat and assign a token
    const token = jwt.sign({ _id: user._id }, process.env.TOKEN_SECRET, {
      expiresIn: "7d",
    });

    // return user and token to client, exclude hashed password
    user.password = undefined;

    // send token in cookie
    res.cookie("token", token, {
      httpOnly: true,
      // secure: true // only works on https
    });

    //send user as json response
    res.json(user);
  } catch (err) {
    console.log(err);
    return res.status(400).send("Error. Try again.");
  }

  // res.send('Logged in !')
};

const getUserProfile = async (req, res) => {
  try {
    const userId = req.auth._id;
    const foundUser = await User.findOne({ _id: userId });
    if (!foundUser) return res.status(400).send("User not found");

    return res.json({
      user: {
        firstname: foundUser.firstname,
        lastname: foundUser.lastname,
        username: foundUser.username,
        email: foundUser.email,
        avatar: foundUser.avatar,
        role: foundUser.role,
      },
    });
  } catch (err) {
    return res.status(400).send(err, "User not connected.");
  }
};

const lougOut = async (req, res) => {
  try {
    res.clearCookie("token");
    return res.json({ message: "Sign out success." });
  } catch (err) {
    console.log(err);
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const shortCode = nanoid(6).toUpperCase();
    const user = await User.findOneAndUpdate(
      { email },
      { passwordResetCode: shortCode }
    );
    if (!user) return res.status(400).send("User not found");

    // prepare for email

    const params = {
      Source: process.env.EMAIL_FROM,
      Destination: {
        ToAddresses: [email],
      },
      ReplyToAddresses: [process.env.EMAIL_FROM],
      Message: {
        Body: {
          Html: {
            Charset: "UTF8",
            Data: `
            <html>
              <h1>Reset password link</h1>
              <p>Please use the following link to reset password</p>
              <h2 style="color:red;">${shortCode}</h2>
              <i><a>OvenArth.com</a></i>
            </html>
            `,
          },
        },
        Subject: {
          Charset: "UTF8",
          Data: "Password reset code",
        },
      },
    };

    const emailSent = SES.sendEmail(params).promise();

    emailSent
      .then((data) => {
        console.log(data);
        res.json({ ok: true });
      })
      .catch((err) => {
        console.log(err);
      });
  } catch (err) {
    console.log(err);
    return res.status(400).send(err, "Something went wrong");
  }
};

const resetPassword = async (req, res) => {
  try {
    const { code, email, password, passwordConfirm } = req.body;

    const { error } = passwordResetValidation(req.body);
    if (error) return res.status(400).send(error.details[0].message);

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const hashedPasswordConfirm = await bcrypt.hash(passwordConfirm, salt);

    const foundCode = await User.findOneAndUpdate(
      { email, passwordResetCode: code },
      {
        password: hashedPassword,
        passwordConfirm: hashedPasswordConfirm,
        passwordResetCode: "",
      }
    );
    if (!foundCode) return res.status(422).send(`Wrong code`);
    return res.json({ message: "Password reset successfull." });
  } catch (err) {
    console.log(err);
    return res.json({ message: "Something went wrong." });
  }
};

export default {
  register,
  login,
  getUserProfile,
  lougOut,
  forgotPassword,
  resetPassword,
};
