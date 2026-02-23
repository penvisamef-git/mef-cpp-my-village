const mongoose = require("mongoose");

const activityLogSchema = new mongoose.Schema(
  {
    //==================//
    // User Info
    is_alived: {
      type: Boolean,
      required: true,
      default: true,
    },

    firstname_en: {
      type: String,
      required: false,
      default: null,
    },

    lastname_en: {
      type: String,
      required: false,
      default: null,
    },

    firstname_kh: {
      type: String,
      required: true,
      default: null,
      default: null,
    },

    lastname_kh: {
      type: String,
      required: true,
    },

    sex: {
      type: String,
      required: false,
      default: null,
    },

    dob: {
      type: {
        day: Number,
        month: Number,
        year: Number,
      },
      required: false,
      default: null,
    },

    contact: {
      type: String,
      required: false,
      default: null,
    },

    id_card_number: {
      type: String,
      required: false,
      default: null,
    },

    matual_status: {
      type: String,
      required: false,
      default: null,
    },

    address: {
      type: String,
      required: false,
      default: null,
    },

    //==================//
    // Job and Work
    education_type_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MasterData_EducationType",
      required: false,
      default: null,
    },

    education_level_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MasterData_EducationLevel",
      required: false,
      default: null,
    },

    job_type_id: {
      type: Array,
      required: false,
      default: null,
    },

    job_name_id: {
      type: Array,
      required: false,
      default: null,
    },

    //==================//
    // Family
    family_number: {
      type: String,
      required: false,
      default: null,
    },

    family_system_number: {
      type: String,
      required: false,
      default: null,
    },

    //==================//
    // Party
    is_member_cpp: {
      type: Boolean,
      required: false,
      default: false, // ❌ Removed duplicate default
    },

    date_joined_party: {
      type: {
        day: Number,
        month: Number,
        year: Number,
      },
      required: false,
      default: null,
    },

    party_leader: {
      type: Number,
      required: false,
      default: null,
    },

    party_sub_leader: {
      type: Number,
      required: false,
      default: null,
    },

    is_have_party_card_member: {
      type: Boolean,
      required: false,
      default: false,
    },

    party_card_member: {
      type: String, // ✅ Changed from Boolean to String
      required: false,
      default: null, // ✅ Changed from false to null
    },

    role_in_party_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MasterData_RoleInParty",
      required: false,
      default: null,
    },

    google_map_house_location: {
      type: {
        lat: Number,
        long: Number,
        google_map_url: String,
        address: String,
      },
      required: false,
      default: null,
    },

    //==================//
    //Other
    image_other: {
      type: [
        {
          image_url: {
            type: String,
            required: false,
            default: null,
          },
        },
      ],
      required: false,
      default: null, // ✅ This is the only default at this level
    },

    image_profile: {
      type: String,
      required: false,
      default: null,
    },

    //==================//
    //Needed
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

    // Default //
    note: {
      type: String,
      required: false,
      default: null,
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
  },
);

module.exports = mongoose.model(
  "AreaMagnagement_PartyPeople",
  activityLogSchema,
);
