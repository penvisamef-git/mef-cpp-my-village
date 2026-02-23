const mongoose = require("mongoose");

const schema = new mongoose.Schema(
  {
    village_id: {
      type: String,
      required: true,
    },

    count: {
      type: Object,
      required: false,
    },

    sqm: {
      type: Number,
      required: true,
    },

    village_data: {
      type: Object,
      required: true,
    },

    google_location: {
      type: {
        lat: { type: Number, required: true },
        lng: { type: Number, required: true },
        link: { type: String, required: false },
        border: [
          {
            lat: { type: Number, required: true },
            lng: { type: Number, required: true },
          },
        ],
      },
      required: false,
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

module.exports = mongoose.model("MasterData_Area_Village", schema);
