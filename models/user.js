const mongoose = require("mongoose");

const userSchema = mongoose.Schema(
  {
    lastname: {
      type: String,
      trim: true,
      required: true,
    },
    firstname: {
      type: String,
      trim: true,
      required: true,
    },
    username: {
      type: String,
      trim: true,
      required: true,
    },
    avatar: {
      type: String,
      default: "avatar.png",
      required: false,
    },
    email: {
      type: String,
      trim: true,
      required: true,
      unique: true,
      min: 6,
    },
    avatar: {
      type: [Object],
      required: false,
    },
    password: {
      type: String,
      trim: true,
      required: true,
      min: 4,
    },
    passwordConfirm: {
      type: String,
      trim: true,

      required: true,
      min: 4,
    },
    role: {
      type: [String],
      default: ["Subscriber"],
      enum: ["Subscriber", "Instructor", "Admin"],
    },
    cart: {
      type: Array,
      required: false,
    },
    stripe_account_id: "",
    stripe_seller: {},
    stripeSession: {},
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
