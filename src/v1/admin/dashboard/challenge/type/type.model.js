const mongoose = require("mongoose");

const activityLogSchema = new mongoose.Schema(
  {
    type_name: {
      type: String,
      required: true,
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

module.exports = mongoose.model("Challenge_ProblemType", activityLogSchema);
