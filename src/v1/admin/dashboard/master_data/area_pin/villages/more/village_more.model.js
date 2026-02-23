const mongoose = require("mongoose");

const schema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },

    are_code: {
      type: Object,
      required: true,
    },

    village_data: {
      type: Object,
      required: true,
    },

    pin_icon: {
      type: String,
      required: false,
    },

    description: [
      {
        sub_title: {
          type: String,
          required: true,
        },
        value: {
          type: Number,
          required: true,
        },
        location_link: {
          type: String,
          required: false,
        },
      },
    ],

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

module.exports = mongoose.model("MasterData_Area_VillageMore", schema);
