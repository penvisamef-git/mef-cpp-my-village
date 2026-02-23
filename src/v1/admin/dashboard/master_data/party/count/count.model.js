const mongoose = require("mongoose");

const activityLogSchema = new mongoose.Schema(
  {
    count_branch_member: {
      // លេខអនុសាខា
      type: Number,
      required: true,
      default: 0,
    },

    count_group_leader: {
      // លេខមេក្រុម
      type: Number,
      required: true,
      default: 0,
    },
    count_family_system_number: {
      // លេខគ្រួសារ
      type: Number,
      required: true,
      default: 0,
    },

    province_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MasterData_Area_Province",
      required: true,
    },

    district_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MasterData_Area_District",
      required: true,
    },

    commune_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MasterData_Area_Commues",
      required: true,
    },

    village_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MasterData_Area_Village",
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

module.exports = mongoose.model("MasterData_PartyCount", activityLogSchema);
