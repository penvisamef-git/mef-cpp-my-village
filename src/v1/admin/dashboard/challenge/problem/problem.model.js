const mongoose = require("mongoose");

const activityLogSchema = new mongoose.Schema(
  {
    tittle: {
      type: String,
      required: true,
    },

    article: {
      type: String,
      required: true,
    },

    date_posted: {
      type: {
        year: { type: Number, required: true },
        month: { type: Number, required: true },
        day: { type: Number, required: true },
        hour: { type: Number, required: true },
        minute: { type: Number, required: true },
        second: { type: Number, required: true },
      },
      required: true,
    },

    image_thumnail_url: {
      type: String,
      required: false,
    },

    image_group: {
      type: [
        {
          name: {
            type: String,
            required: false,
          },
          url: {
            type: String,
            required: false,
          },
        },
      ],
      required: false,
    },

    village_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MasterData_Area_Village",
      required: true,
    },

    district_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MasterData_Area_District",
      required: true,
    },

    commune_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MasterData_Area_Commune",
      required: true,
    },

    province_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MasterData_Area_Province",
      required: true,
    },

    challenge_type_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Challenge_ProblemType",
      required: true,
    },

    // Defualt //
    note: {
      type: String,
      required: false,
    },
    status: {
      type: Boolean,
      default: true,
      required: false,
    },
    deleted: {
      type: Boolean,
      default: false,
      required: false,
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
  }
);

module.exports = mongoose.model("Challenge_Problem", activityLogSchema);
