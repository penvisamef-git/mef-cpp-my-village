const mongoose = require("mongoose");
const userSchema = new mongoose.Schema(
  {
    firstname: { type: String, required: true },
    lastname: { type: String, required: true },
    contact: { type: String, required: false },
    email: { type: String, required: true },
    organization: { type: String, required: false },
    job_title: { type: String, required: false },
    password: { type: String, required: true },
    camdigi_key_id: { type: String, required: false },
    group_user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UserGroupPermission",
      required: true,
    },

    is_first_login: {
      type: Boolean,
      default: true,
    },
    is_super_admin: {
      type: Boolean,
      default: false,
    },

    // >>>>>> Defualt <<<<< //
    note: String,
    status: {
      type: Boolean,
      default: true,
    },
    deleted: {
      type: Boolean,
      default: false,
    },
    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    updated_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: { createdAt: "created_date", updatedAt: "updated_date" },
  },
);
module.exports = mongoose.model("User", userSchema);
