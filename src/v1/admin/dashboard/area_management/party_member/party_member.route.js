const baseRoute = "area-management/party-member";
const mongoose = require("mongoose");
const model = require("./party_member.model");
const modelVillage = require("../../master_data/area_pin/villages/villages.model");
const modelCommue = require("../../master_data/area_pin/commues/commues.model");
const modelDistrict = require("../../master_data/area_pin/disctrict/district.model");
const modelProvince = require("../../master_data/area_pin/province/province.model");
const modelEducation_level = require("../../master_data/education/education_level/education_level.model");
const modelJobName = require("../../master_data/job/job_name/job.model");
const modelJobType = require("../../master_data/job/job_type/job_type.model");
const modelRoleInParty = require("../../master_data/role_in_party/role_in_party.model");
const modelElectionOffice = require("../../master_data/office_election/office_election.model");
const modelCount = require("../../master_data/party/count/count.model");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;

const {
  post,
  getByID,
  getAll,
  update,
  remove,
  getPagination,
} = require("../../../../../util/request/crud");

const route = (prop) => {
  // **************** Declaration ****************
  const urlAPI = `/${prop.main_route}/${baseRoute}`;
  const tital_Toast = "គ្រប់គ្រងតំបន់ - ប្រជាពលរដ្ឋ";
  const requestRequired = [
    { key: "firstname_kh", label: "នាម (firstname_kh)" },
    { key: "lastname_kh", label: "ក្តោនាម (lastname_kh)" },
    {
      key: "village_id",
      label: "ក្រុម/ឃុំ (village_id)",
    },
  ];

  // Memory storage for Vercel compatibility
  const storage = multer.memoryStorage();

  const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png/;
    const mimetype = allowedTypes.test(file.mimetype);
    const extname = allowedTypes.test(file.originalname.toLowerCase());

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error("Only .png, .jpg and .jpeg format allowed!"));
  };

  const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
      files: 11, // max 11 files (1 profile + 10 others)
      fileSize: 10 * 1024 * 1024, // max 10 MB per file
    },
  });

  // Helper function to upload buffer to Cloudinary
  async function uploadToCloudinary(buffer, folder, originalname) {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: folder,
          public_id: `${Date.now()}-${originalname.split(".")[0]}`,
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        },
      );
      uploadStream.end(buffer);
    });
  }

  // POST endpoint - UNCOMMENT AND FIX for Vercel
  prop.app.post(
    `${urlAPI}`,
    prop.api_auth,
    prop.jwt_auth,
    prop.request_user,

    // Multer handler for profile + other images
    (req, res, next) => {
      upload.fields([
        { name: "image_profile", maxCount: 1 },
        { name: "image_other", maxCount: 10 },
      ])(req, res, (err) => {
        if (err) {
          return res.status(400).json({ status: false, message: err.message });
        }
        next();
      });
    },

    async (req, res) => {
      try {
        var data = ({
          is_alived,
          firstname_en,
          lastname_en,
          firstname_kh,
          lastname_kh,
          sex,
          dob,
          contact,
          matual_status,
          address,
          education_level_id,
          job_name_id,
          family_number,
          family_system_number,
          is_member_cpp,
          date_joined_party,
          party_leader,
          party_sub_leader,
          is_have_party_card_member,
          party_card_member,
          role_in_party_id,
          village_id,
          google_map_house_location,
          note,
          id_card_number,
        } = req.body);

        // Check Null
        if (data.role_in_party_id === "") {
          data.role_in_party_id = null;
        }

        if (!data.google_map_house_location) {
          data.google_map_house_location = null;
        }

        // Handle uploaded images - OPTIONAL
        const filesProfile =
          req.files && req.files["image_profile"]
            ? req.files["image_profile"][0]
            : null;
        const filesOther =
          req.files && req.files["image_other"] ? req.files["image_other"] : [];

        // ---- TOTAL SIZE CHECK (max 15MB) ----
        const totalSize =
          (filesProfile ? filesProfile.size : 0) +
          filesOther.reduce((acc, file) => acc + file.size, 0);

        if (totalSize > 15 * 1024 * 1024) {
          return res.status(400).json({
            status: false,
            message: "Total size of all images must not exceed 15 MB",
          });
        }

        // -------------------------------
        // Upload to Cloudinary: PROFILE IMAGE (from buffer)
        // -------------------------------
        let profileImageURL = null;

        if (filesProfile) {
          try {
            const uploadResult = await uploadToCloudinary(
              filesProfile.buffer,
              "population/profile",
              filesProfile.originalname,
            );
            profileImageURL = uploadResult.secure_url;
            data.image_profile = profileImageURL;
          } catch (cloudinaryError) {
            console.error("Cloudinary upload error:", cloudinaryError);
            return res.status(500).json({
              status: false,
              message: "Failed to upload profile image to Cloudinary",
              error: cloudinaryError.message,
            });
          }
        }

        // -------------------------------
        // Upload OTHER IMAGES to Cloudinary (from buffer)
        // -------------------------------
        let uploadedOtherImages = [];

        if (filesOther.length > 0) {
          for (const file of filesOther) {
            try {
              const uploadResult = await uploadToCloudinary(
                file.buffer,
                "population/other",
                file.originalname,
              );

              uploadedOtherImages.push({
                name: file.originalname,
                image_url: uploadResult.secure_url,
              });
            } catch (cloudinaryError) {
              console.error(
                "Cloudinary upload error for",
                file.originalname,
                ":",
                cloudinaryError,
              );
              // Continue with other files even if one fails
            }
          }
        }

        // Save URLs to database if any images uploaded
        if (uploadedOtherImages.length > 0) {
          data.image_other = uploadedOtherImages;
        }

        // Step 1 : Check Location
        if (village_id) {
          if (!mongoose.Types.ObjectId.isValid(village_id)) {
            return res.status(400).json({
              success: false,
              message: "មិនមានទិន្នន័យក្រុម/ឃុំ!",
            });
          }

          // Get CommuneId, DistrictId, ProvinceId
          var village = await modelVillage.findOne({ _id: village_id });

          if (!village) {
            return res.status(400).json({
              success: false,
              message: "មិនមានទិន្នន័យក្រុម/ឃុំ!",
            });
          }

          // Find the commune
          var commune = await modelCommue.findOne({
            commues_id: village.village_data.commune_id,
          });

          if (!commune) {
            return res.status(400).json({
              success: false,
              message: "មិនមានទិន្នន័យឃុំ!",
            });
          }

          // Find the district
          var district = await modelDistrict.findOne({
            district_id: village.village_data.district_id,
          });

          if (!district) {
            return res.status(400).json({
              success: false,
              message: "មិនមានទិន្នន័យតំបន់!",
            });
          }

          // Find the province
          var province = await modelProvince.findOne({
            province_id: village.village_data.province_id,
          });

          if (!province) {
            return res.status(400).json({
              success: false,
              message: "មិនមានទិន្នន័យក្រុង!",
            });
          }

          // Result
          data.province_id = province._id;
          data.district_id = district._id;
          data.commune_id = commune._id;
          data.village_id = village_id;
        }

        // Step 2 : Check Education Type and ID
        if (education_level_id) {
          if (!mongoose.Types.ObjectId.isValid(education_level_id)) {
            return res.status(400).json({
              success: false,
              message: "មិនមានទិន្នន័យកម្រិតវប្បធម៌!",
            });
          }

          var education_level = await modelEducation_level
            .findOne({ _id: education_level_id })
            .populate("education_type_id");

          if (!education_level) {
            return res.status(400).json({
              success: false,
              message: "មិនមានទិន្នន័យកម្រិតវប្បធម៌!",
            });
          }

          // Result
          data.education_level_id = education_level._id;
          data.education_type_id = education_level.education_type_id._id;
        }

        // Step 3 : Job Type ID as Array
        if (job_name_id) {
          var listData = [];
          var listOfType = [];

          // Parse if it's a JSON string
          let jobIds = job_name_id;
          if (typeof job_name_id === "string") {
            try {
              jobIds = JSON.parse(job_name_id);
            } catch (e) {
              // If it's a single ID as string, wrap in array
              if (job_name_id) {
                jobIds = [job_name_id];
              } else {
                jobIds = [];
              }
            }
          }

          if (Array.isArray(jobIds) && jobIds.length > 0) {
            for (let i = 0; i < jobIds.length; i++) {
              // Clean the ID string
              let cleanId = jobIds[i].toString();

              // Remove surrounding quotes if present
              if (cleanId.startsWith('"') && cleanId.endsWith('"')) {
                cleanId = cleanId.substring(1, cleanId.length - 1);
              }

              // Also remove escaped quotes
              cleanId = cleanId.replace(/^\\"/, "").replace(/\\"$/, "");

              // Remove all remaining quotes
              cleanId = cleanId.replace(/"/g, "");

              if (!mongoose.Types.ObjectId.isValid(cleanId)) {
                return res.status(400).json({
                  success: false,
                  message: "មិនមានទិន្នន័យការងារ!",
                });
              }

              listData.push(new mongoose.Types.ObjectId(cleanId));
            }

            const jobs = await modelJobName
              .find({
                _id: { $in: listData },
              })
              .populate("job_type_id");

            var listOfType = [];
            jobs.forEach((row) => {
              var isCanAdd = true;

              listOfType.forEach((item) => {
                if (item.toString() === row.job_type_id._id.toString()) {
                  isCanAdd = false;
                }
              });

              if (isCanAdd) {
                listOfType.push(row.job_type_id._id);
              }
            });

            data.job_type_id = listOfType;
            data.job_name_id = listData;
          }
        } else {
          data.job_type_id = null;
          data.job_name_id = null;
        }

        var isUnfinishConnection = true;
        await post(
          res,
          req,
          requestRequired,
          data,
          model,
          tital_Toast,
          "NA",
          isUnfinishConnection,
        );

        if (isUnfinishConnection) {
          return res.send({
            success: true,
            message: "Member created successfully",
            data: data,
          });
        }
      } catch (error) {
        console.error("Server error:", error);
        res.status(500).json({
          status: false,
          message: "Server error",
          error: error.message,
        });
      }
    },
  );

  // GET by ID endpoint
  prop.app.get(
    `${urlAPI}/:id`,
    prop.api_auth,
    prop.jwt_auth,
    prop.request_user,
    async (req, res) => {
      await getByID(res, req, model, false);
    },
  );

  // GET with family endpoint
  prop.app.get(
    `${urlAPI}-with-family/:id`,
    prop.api_auth,
    prop.jwt_auth,
    prop.request_user,
    async (req, res) => {
      await getByIDMember(res, req, model, false);
    },
  );

  async function getByIDMember(res, req, model, isDeleted) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: "ID is required!",
        });
      }

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: "មិនមានទិន្នន័យនៅក្នុងប្រព័ន្ធ!",
        });
      }

      const currentData = await model
        .findOne({
          _id: id,
          deleted: isDeleted,
        })
        .populate([
          "role_in_party_id",
          "village_id",
          "education_level_id",
          "education_type_id",
          "created_by",
        ]);

      if (!currentData) {
        return res.status(404).json({
          success: false,
          message: "មិនមានទិន្នន័យនៅក្នុងប្រព័ន្ធ!",
        });
      }

      const jobName = await modelJobName.find({});
      const jobType = await modelJobType.find({});

      let job_data = [];
      let job_type_data = [];

      if (currentData.job_name_id && Array.isArray(currentData.job_name_id)) {
        for (let i = 0; i < currentData.job_name_id.length; i++) {
          const jobId = currentData.job_name_id[i];

          if (mongoose.Types.ObjectId.isValid(jobId)) {
            const foundJob = jobName.find(
              (row) => row._id.toString() === jobId.toString(),
            );

            if (foundJob) {
              job_data.push(foundJob);
            }
          }
        }
      }

      if (currentData.job_type_id && Array.isArray(currentData.job_type_id)) {
        for (let i = 0; i < currentData.job_type_id.length; i++) {
          const jobId = currentData.job_type_id[i];
          if (mongoose.Types.ObjectId.isValid(jobId)) {
            const foundJob = jobType.find(
              (row) => row._id.toString() === jobId.toString(),
            );

            if (foundJob) {
              job_type_data.push(foundJob);
            }
          }
        }
      }

      var memberFamily = [];
      if (
        currentData.family_system_number == "".toString() ||
        currentData.family_system_number == null ||
        currentData.family_system_number == undefined
      ) {
        // skip - don't fetch family members
      } else {
        var filter = {
          village_id: currentData.village_id,
          family_system_number: currentData.family_system_number,
          deleted: false,
          _id: { $ne: currentData._id },
        };
        memberFamily = await model.find(filter);
      }

      const result = {
        ...currentData.toObject(),
        job_data: job_data,
        job_type_data: job_type_data,
        member_family: memberFamily,
      };

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err) {
      console.error("Error in getByIDMember:", err);
      res.status(500).json({
        success: false,
        message: `មានបញ្ហាក្នុងប្រព័ន្ធសូមព្យាយាមម្តងទៀតពេលក្រោយ: ${err.message}`,
      });
    }
  }

  // GET all endpoint
  prop.app.get(
    `${urlAPI}-all`,
    prop.api_auth,
    prop.jwt_auth,
    prop.request_user,
    async (req, res) => {
      await getAll(res, req, model, false);
    },
  );

  // GET pagination endpoint
  prop.app.get(
    `${urlAPI}`,
    prop.api_auth,
    prop.jwt_auth,
    prop.request_user,
    async (req, res) => {
      try {
        let result = await getPagination(
          req.query,
          model,
          ["village_id", "role_in_party_id", "education_level_id"],
          [],
        );
        res.json({ success: true, ...result });
      } catch (error) {
        res.status(500).json({
          success: false,
          message: "Error fetching paginated data",
        });
      }
    },
  );

  // GET by pin area endpoint
  prop.app.get(
    `${urlAPI}-by-pin-area`,
    prop.api_auth,
    prop.jwt_auth,
    prop.request_user,
    async (req, res) => {
      try {
        const {
          province_id,
          district_id,
          commune_id,
          village_id,
          sex,
          matual_status,
          age_start,
          age_end,
          joined_year_start,
          joined_year_end,
          party_leader,
          party_sub_leader,
          role_in_party_id,
          is_member_cpp,
        } = req.query;

        // Required fields validation
        const requiredFields = {
          sex: "sex មិនត្រឹមត្រូវ! (all,male,female)",
          matual_status:
            "matual_status មិនត្រឹមត្រូវ! (single,married,divorce)",
          party_leader: "party_leader មិនត្រឹមត្រូវ!",
          party_sub_leader: "party_sub_leader មិនត្រឹមត្រូវ!",
          role_in_party_id: "role_in_party_id មិនត្រឹមត្រូវ!",
        };

        for (const [field, message] of Object.entries(requiredFields)) {
          if (!req.query[field]) {
            return res.status(400).json({ success: false, message });
          }
        }

        // Determine location type and ID
        const locationConfigs = [
          { id: village_id, type: "village_id" },
          { id: commune_id, type: "commune_id" },
          { id: district_id, type: "district_id" },
          { id: province_id, type: "province_id" },
        ];

        const activeLocation = locationConfigs.find((config) => config.id);

        if (!activeLocation) {
          return res.status(400).json({
            success: false,
            message:
              "មិនមានទិន្នន័យទីតាំង! (province_id, district_id, commune_id, village_id)",
          });
        }

        if (!mongoose.Types.ObjectId.isValid(activeLocation.id)) {
          return res.status(400).json({
            success: false,
            message: `${activeLocation.type} មិនត្រឹមត្រូវ!`,
          });
        }

        const jobName = await modelJobName.find({});

        let result = await getPaginationPinArea(
          req.query,
          model,
          ["village_id", "education_level_id", "role_in_party_id"],
          [{ deleted: false }],
          sex,
          matual_status,
          age_start,
          age_end,
          joined_year_start,
          joined_year_end,
          activeLocation.type,
          activeLocation.id,
          jobName,
          party_leader,
          party_sub_leader,
          role_in_party_id,
          is_member_cpp,
        );

        result.data = result.data.map((record) => {
          let progress = 0;
          const fieldsPerPoint = 100 / 16;

          const hasValue = (value) => {
            if (value === null || value === undefined) return false;
            if (typeof value === "string") return value.trim() !== "";
            if (typeof value === "object") return Object.keys(value).length > 0;
            return true;
          };

          if (hasValue(record.firstname_en)) progress += fieldsPerPoint;
          if (hasValue(record.lastname_en)) progress += fieldsPerPoint;
          if (hasValue(record.firstname_kh)) progress += fieldsPerPoint;
          if (hasValue(record.lastname_kh)) progress += fieldsPerPoint;
          if (hasValue(record.sex)) progress += fieldsPerPoint;
          if (hasValue(record.contact)) progress += fieldsPerPoint;
          if (hasValue(record.id_card_number)) progress += fieldsPerPoint;
          if (hasValue(record.matual_status)) progress += fieldsPerPoint;
          if (hasValue(record.address)) progress += fieldsPerPoint;
          if (hasValue(record.education_type_id)) progress += fieldsPerPoint;
          if (hasValue(record.education_level_id)) progress += fieldsPerPoint;
          if (hasValue(record.job_name_id)) progress += fieldsPerPoint;
          if (hasValue(record.family_number)) progress += fieldsPerPoint;
          if (hasValue(record.google_map_house_location))
            progress += fieldsPerPoint;
          if (hasValue(record.image_profile)) progress += fieldsPerPoint;
          if (hasValue(record.image_other)) progress += fieldsPerPoint;

          progress = Math.min(100, Math.max(0, progress));
          progress = Math.round(progress * 100) / 100;

          return {
            ...record,
            document_progress: progress,
          };
        });

        return res.json({ success: true, ...result });
      } catch (error) {
        console.error("Error in -by-pin-area:", error);
        return res.status(500).json({
          success: false,
          message: "Server error occurred",
          error: error.message,
        });
      }
    },
  );

  async function getPaginationPinArea(
    query,
    Model,
    populate = [],
    additionalFilter = [],
    sex,
    matual_status,
    age_start,
    age_end,
    joined_year_start,
    joined_year_end,
    pin_area_name,
    pin_area_id,
    jobName,
    party_leader,
    party_sub_leader,
    role_in_party_id,
    is_member_cpp,
  ) {
    const page = parseInt(query.page, 10) || 1;
    const limit = parseInt(query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const sortField = query.sort || "created_date";
    const sortOrder = query.order === "asc" ? 1 : -1;

    const includeDeleted = query.includeDeleted === "true";
    const deleteFilter = includeDeleted ? {} : { deleted: false };

    const specialFilter = {
      [pin_area_name]: new mongoose.Types.ObjectId(pin_area_id),
    };

    if (sex && sex.toLowerCase() !== "all") {
      specialFilter.sex = { $regex: `^${sex}$`, $options: "i" };
    }

    if (matual_status && matual_status.toLowerCase() !== "all") {
      specialFilter.matual_status = {
        $regex: `^${matual_status}$`,
        $options: "i",
      };
    }

    if (age_start && age_end) {
      const today = new Date();
      const minBirthYear = today.getFullYear() - age_end;
      const maxBirthYear = today.getFullYear() - age_start;

      specialFilter.$expr = {
        $and: [
          {
            $gte: [
              {
                $dateFromParts: {
                  year: "$dob.year",
                  month: "$dob.month",
                  day: "$dob.day",
                },
              },
              new Date(minBirthYear, today.getMonth(), today.getDate()),
            ],
          },
          {
            $lte: [
              {
                $dateFromParts: {
                  year: "$dob.year",
                  month: "$dob.month",
                  day: "$dob.day",
                },
              },
              new Date(maxBirthYear, today.getMonth(), today.getDate()),
            ],
          },
        ],
      };
    }

    if (joined_year_start && joined_year_end) {
      if (joined_year_start == "all" || joined_year_end == "all") {
      } else {
        specialFilter.$expr = specialFilter.$expr || { $and: [] };

        specialFilter.$expr.$and.push({
          $and: [
            {
              $gte: [
                {
                  $dateFromParts: {
                    year: "$date_joined_party.year",
                    month: "$date_joined_party.month",
                    day: "$date_joined_party.day",
                  },
                },
                new Date(joined_year_start, 0, 1),
              ],
            },
            {
              $lte: [
                {
                  $dateFromParts: {
                    year: "$date_joined_party.year",
                    month: "$date_joined_party.month",
                    day: "$date_joined_party.day",
                  },
                },
                new Date(joined_year_end, 11, 31),
              ],
            },
          ],
        });
      }
    }

    if (
      is_member_cpp !== undefined &&
      is_member_cpp !== null &&
      is_member_cpp !== ""
    ) {
      if (is_member_cpp === true || is_member_cpp === "true") {
        specialFilter.is_member_cpp = true;
      } else if (is_member_cpp === false || is_member_cpp === "false") {
        specialFilter.is_member_cpp = false;
      }
    }

    if (party_leader && party_leader != "all") {
      specialFilter.party_leader = party_leader;
    }

    if (party_sub_leader && party_sub_leader != "all") {
      specialFilter.party_sub_leader = party_sub_leader;
    }

    if (role_in_party_id) {
      if (role_in_party_id === "all") {
        // No filter for "all"
      } else if (role_in_party_id === "no_role") {
        specialFilter.$or = [
          { role_in_party_id: { $exists: false } },
          { role_in_party_id: null },
        ];
      } else {
        specialFilter.role_in_party_id = role_in_party_id;
      }
    }

    const qId = query.q_id;
    const qKeyId = query.q_key_id;
    let specificOr = [];

    if (qId && qKeyId) {
      let ids, fields;
      try {
        ids = Array.isArray(qId) ? qId : JSON.parse(qId);
      } catch {
        ids = [qId];
      }
      try {
        fields = Array.isArray(qKeyId) ? qKeyId : JSON.parse(qKeyId || "[]");
      } catch {
        fields = qKeyId ? qKeyId.split(",") : [];
      }

      const validObjectIds = ids
        .filter((id) => mongoose.Types.ObjectId.isValid(id))
        .map((id) => new mongoose.Types.ObjectId(id));

      if (fields.length && validObjectIds.length) {
        specificOr = fields.map((field) => ({
          [field]: { $in: validObjectIds },
        }));
      }
    }

    const keyword = query.q?.trim();
    const qKeys = query.q_key;
    let generalOr = [];

    if (keyword && qKeys) {
      let fields;
      try {
        fields = Array.isArray(qKeys) ? qKeys : JSON.parse(qKeys || "[]");
      } catch {
        fields = qKeys ? qKeys.split(",") : [];
      }

      generalOr = fields.map((field) => {
        if (
          (field.endsWith("_id") || field.endsWith("created_by_id")) &&
          mongoose.Types.ObjectId.isValid(keyword)
        ) {
          return { [field]: new mongoose.Types.ObjectId(keyword) };
        }
        return { [field]: { $regex: keyword, $options: "i" } };
      });
    }

    let mongoFilter = { ...deleteFilter, ...specialFilter };

    if (specificOr.length && generalOr.length) {
      mongoFilter.$and = [{ $or: specificOr }, { $or: generalOr }];
    } else if (specificOr.length) {
      mongoFilter.$or = specificOr;
    } else if (generalOr.length) {
      mongoFilter.$or = generalOr;
    }

    if (additionalFilter.length > 0) {
      if (mongoFilter.$and) {
        mongoFilter.$and.push(...additionalFilter);
      } else {
        mongoFilter.$and = [...additionalFilter];
      }
    }

    const [data, total] = await Promise.all([
      Model.find(mongoFilter)
        .sort({ [sortField]: sortOrder })
        .populate(populate)
        .skip(skip)
        .limit(limit),
      Model.countDocuments(mongoFilter),
    ]);

    const totalPages = Math.ceil(total / limit);

    const enhancedData = data.map((row) => {
      const jobData = [];

      if (
        row.job_name_id != null &&
        Array.isArray(row.job_name_id) &&
        row.job_name_id.length > 0
      ) {
        row.job_name_id.forEach((rowJobId) => {
          jobName.forEach((job) => {
            if (job._id.toString() === rowJobId.toString()) {
              jobData.push(job);
            }
          });
        });
      }

      return {
        ...(row.toObject?.() || row),
        jobData: jobData,
      };
    });

    return {
      data: enhancedData,
      pagination: {
        total,
        totalPages,
        currentPage: page,
        pageSize: limit,
      },
    };
  }

  // Area statistics endpoint
  prop.app.get(
    `${urlAPI}-area-statistics`,
    prop.api_auth,
    prop.jwt_auth,
    prop.request_user,
    async (req, res) => {
      const { province_id, district_id, commune_id, village_id } = req.query;

      try {
        let result = {};

        if (village_id) {
          if (!mongoose.Types.ObjectId.isValid(village_id)) {
            return res.status(400).send({
              success: false,
              message: "village_id មិនត្រឹមត្រូវ!",
            });
          }
          result = await getAreaStatistics("village_id", village_id);
          return res.json({ success: true, ...result });
        }

        if (commune_id) {
          if (!mongoose.Types.ObjectId.isValid(commune_id)) {
            return res.status(400).send({
              success: false,
              message: "commune_id មិនត្រឹមត្រូវ!",
            });
          }
          result = await getAreaStatistics("commune_id", commune_id);
          return res.json({ success: true, ...result });
        }

        if (district_id) {
          if (!mongoose.Types.ObjectId.isValid(district_id)) {
            return res.status(400).send({
              success: false,
              message: "district_id មិនត្រឹមត្រូវ!",
            });
          }
          result = await getAreaStatistics("district_id", district_id);
          return res.json({ success: true, ...result });
        }

        if (province_id) {
          if (!mongoose.Types.ObjectId.isValid(province_id)) {
            return res.status(400).send({
              success: false,
              message: "province_id មិនត្រឹមត្រូវ!",
            });
          }
          result = await getAreaStatistics("province_id", province_id);
          return res.json({ success: true, ...result });
        }

        return res.status(400).send({
          success: false,
          message:
            "មិនមានទិន្នន័យទីតាំង! (province_id,district_id,commune_id,village_id)",
        });
      } catch (error) {
        console.error("Error in area statistics:", error);
        return res.status(500).send({
          success: false,
          message: "មានបញ្ហាក្នុងការទាញយកទិន្នន័យ",
        });
      }
    },
  );

  async function getAreaStatistics(pin_area_name, pin_area_id) {
    const areaFilter = {
      [pin_area_name]: new mongoose.Types.ObjectId(pin_area_id),
      deleted: false,
    };

    // Use Promise.all for better performance
    const [
      totalPopulation,
      maleCount,
      femaleCount,
      singleCount,
      marriedCount,
      divorceCount,
      youthCount,
      adultCount,
      seniorCount,
    ] = await Promise.all([
      model.countDocuments(areaFilter),
      model.countDocuments({
        ...areaFilter,
        sex: { $regex: "^male$", $options: "i" },
      }),
      model.countDocuments({
        ...areaFilter,
        sex: { $regex: "^female$", $options: "i" },
      }),
      model.countDocuments({
        ...areaFilter,
        matual_status: { $regex: "^single$", $options: "i" },
      }),
      model.countDocuments({
        ...areaFilter,
        matual_status: { $regex: "^married$", $options: "i" },
      }),
      model.countDocuments({
        ...areaFilter,
        matual_status: { $regex: "^divorce$", $options: "i" },
      }),
      getAgeGroupCount(areaFilter, 18, 25),
      getAgeGroupCount(areaFilter, 26, 60),
      getAgeGroupCount(areaFilter, 61, 120),
    ]);

    return {
      statistics: {
        total_members: totalPopulation,
        gender: {
          male: maleCount,
          female: femaleCount,
        },
        marital_status: {
          single: singleCount,
          married: marriedCount,
          divorce: divorceCount,
        },
        age_groups: {
          youth: youthCount,
          adult: adultCount,
          senior: seniorCount,
        },
      },
    };
  }

  // Helper function for age group counts
  async function getAgeGroupCount(baseFilter, minAge, maxAge) {
    const today = new Date();
    const minBirthYear = today.getFullYear() - maxAge;
    const maxBirthYear = today.getFullYear() - minAge;

    return await model.countDocuments({
      ...baseFilter,
      $expr: {
        $and: [
          {
            $gte: [
              {
                $dateFromParts: {
                  year: "$dob.year",
                  month: "$dob.month",
                  day: "$dob.day",
                },
              },
              new Date(minBirthYear, today.getMonth(), today.getDate()),
            ],
          },
          {
            $lte: [
              {
                $dateFromParts: {
                  year: "$dob.year",
                  month: "$dob.month",
                  day: "$dob.day",
                },
              },
              new Date(maxBirthYear, today.getMonth(), today.getDate()),
            ],
          },
        ],
      },
    });
  }

  // PUT endpoint - UNCOMMENT AND FIX for Vercel
  prop.app.put(
    `${urlAPI}/:id`,
    prop.api_auth,
    prop.jwt_auth,
    prop.request_user,

    (req, res, next) => {
      upload.fields([
        { name: "image_profile", maxCount: 1 },
        { name: "image_other", maxCount: 10 },
      ])(req, res, (err) => {
        if (err) {
          return res.status(400).json({ status: false, message: err.message });
        }
        next();
      });
    },

    async (req, res) => {
      try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
          return res.status(400).json({
            success: false,
            message: "Invalid member ID",
          });
        }

        var data = ({
          is_alived,
          firstname_en,
          lastname_en,
          firstname_kh,
          lastname_kh,
          sex,
          dob,
          contact,
          matual_status,
          address,
          education_level_id,
          job_name_id,
          family_number,
          family_system_number,
          is_member_cpp,
          date_joined_party,
          party_leader,
          party_sub_leader,
          is_have_party_card_member,
          party_card_member,
          role_in_party_id,
          village_id,
          google_map_house_location,
          note,
          id_card_number,
          images_to_delete,
        } = req.body);

        if (data.role_in_party_id === "") {
          data.role_in_party_id = null;
        }

        if (!data.google_map_house_location) {
          data.google_map_house_location = null;
        }

        const filesProfile =
          req.files && req.files["image_profile"]
            ? req.files["image_profile"][0]
            : null;
        const filesOther =
          req.files && req.files["image_other"] ? req.files["image_other"] : [];

        const totalSize =
          (filesProfile ? filesProfile.size : 0) +
          filesOther.reduce((acc, file) => acc + file.size, 0);

        if (totalSize > 15 * 1024 * 1024) {
          return res.status(400).json({
            status: false,
            message: "Total size of all images must not exceed 15 MB",
          });
        }

        let profileImageURL = null;

        if (filesProfile) {
          try {
            const uploadResult = await uploadToCloudinary(
              filesProfile.buffer,
              "population/profile",
              filesProfile.originalname,
            );
            profileImageURL = uploadResult.secure_url;
            data.image_profile = profileImageURL;
          } catch (cloudinaryError) {
            console.error("Cloudinary upload error:", cloudinaryError);
            return res.status(500).json({
              status: false,
              message: "Failed to upload profile image to Cloudinary",
              error: cloudinaryError.message,
            });
          }
        }

        let uploadedOtherImages = [];

        if (filesOther.length > 0) {
          for (const file of filesOther) {
            try {
              const uploadResult = await uploadToCloudinary(
                file.buffer,
                "population/other",
                file.originalname,
              );

              uploadedOtherImages.push({
                name: file.originalname,
                image_url: uploadResult.secure_url,
              });
            } catch (cloudinaryError) {
              console.error(
                "Cloudinary upload error for",
                file.originalname,
                ":",
                cloudinaryError,
              );
            }
          }
        }

        let imagesToDelete = [];
        if (images_to_delete) {
          try {
            if (typeof images_to_delete === "string") {
              imagesToDelete = JSON.parse(images_to_delete);
            } else if (Array.isArray(images_to_delete)) {
              imagesToDelete = images_to_delete;
            }
            data.images_to_delete = imagesToDelete;
          } catch (e) {
            console.error("Error parsing images_to_delete:", e);
          }
        }

        if (uploadedOtherImages.length > 0) {
          const existingMember = await model.findById(id);

          if (existingMember && existingMember.image_other) {
            const existingImages = existingMember.image_other.filter(
              (img) => !imagesToDelete.includes(img._id.toString()),
            );
            data.image_other = [...existingImages, ...uploadedOtherImages];
          } else {
            data.image_other = uploadedOtherImages;
          }
        } else if (imagesToDelete.length > 0) {
          const existingMember = await model.findById(id);

          if (existingMember && existingMember.image_other) {
            data.image_other = existingMember.image_other.filter(
              (img) => !imagesToDelete.includes(img._id.toString()),
            );
          }
        }

        if (village_id) {
          if (!mongoose.Types.ObjectId.isValid(village_id)) {
            return res.status(400).json({
              success: false,
              message: "មិនមានទិន្នន័យក្រុម/ឃុំ!",
            });
          }

          var village = await modelVillage.findOne({ _id: village_id });

          if (!village) {
            return res.status(400).json({
              success: false,
              message: "មិនមានទិន្នន័យក្រុម/ឃុំ!",
            });
          }

          var commune = await modelCommue.findOne({
            commues_id: village.village_data.commune_id,
          });

          if (!commune) {
            return res.status(400).json({
              success: false,
              message: "មិនមានទិន្នន័យឃុំ!",
            });
          }

          var district = await modelDistrict.findOne({
            district_id: village.village_data.district_id,
          });

          if (!district) {
            return res.status(400).json({
              success: false,
              message: "មិនមានទិន្នន័យតំបន់!",
            });
          }

          var province = await modelProvince.findOne({
            province_id: village.village_data.province_id,
          });

          if (!province) {
            return res.status(400).json({
              success: false,
              message: "មិនមានទិន្នន័យក្រុង!",
            });
          }

          data.province_id = province._id;
          data.district_id = district._id;
          data.commune_id = commune._id;
          data.village_id = village_id;
        }

        if (education_level_id) {
          if (!mongoose.Types.ObjectId.isValid(education_level_id)) {
            return res.status(400).json({
              success: false,
              message: "មិនមានទិន្នន័យកម្រិតវប្បធម៌!",
            });
          }

          var education_level = await modelEducation_level
            .findOne({ _id: education_level_id })
            .populate("education_type_id");

          if (!education_level) {
            return res.status(400).json({
              success: false,
              message: "មិនមានទិន្នន័យកម្រិតវប្បធម៌!",
            });
          }

          data.education_level_id = education_level._id;
          data.education_type_id = education_level.education_type_id._id;
        }

        if (job_name_id) {
          var listData = [];
          var listOfType = [];

          let jobIds = job_name_id;
          if (typeof job_name_id === "string") {
            try {
              jobIds = JSON.parse(job_name_id);
            } catch (e) {
              if (job_name_id) {
                jobIds = [job_name_id];
              } else {
                jobIds = [];
              }
            }
          }

          if (Array.isArray(jobIds) && jobIds.length > 0) {
            for (let i = 0; i < jobIds.length; i++) {
              let cleanId = jobIds[i].toString();

              if (cleanId.startsWith('"') && cleanId.endsWith('"')) {
                cleanId = cleanId.substring(1, cleanId.length - 1);
              }

              cleanId = cleanId.replace(/^\\"/, "").replace(/\\"$/, "");
              cleanId = cleanId.replace(/"/g, "");

              if (!mongoose.Types.ObjectId.isValid(cleanId)) {
                return res.status(400).json({
                  success: false,
                  message: "មិនមានទិន្នន័យការងារ!",
                });
              }

              listData.push(new mongoose.Types.ObjectId(cleanId));
            }

            const jobs = await modelJobName
              .find({
                _id: { $in: listData },
              })
              .populate("job_type_id");

            var listOfType = [];
            jobs.forEach((row) => {
              var isCanAdd = true;

              listOfType.forEach((item) => {
                if (item.toString() === row.job_type_id._id.toString()) {
                  isCanAdd = false;
                }
              });

              if (isCanAdd) {
                listOfType.push(row.job_type_id._id);
              }
            });

            data.job_type_id = listOfType;
            data.job_name_id = listData;
          }
        } else {
          data.job_type_id = null;
          data.job_name_id = null;
        }

        // Handle empty strings
        if (firstname_en == "" || firstname_en == null) {
          data.firstname_en = null;
        }
        if (lastname_en == "" || lastname_en == null) {
          data.lastname_en = null;
        }
        if (
          req.body["dob[day]"] &&
          req.body["dob[month]"] &&
          req.body["dob[year]"]
        ) {
          if (
            req.body["dob[day]"] !== "" &&
            req.body["dob[month]"] !== "" &&
            req.body["dob[year]"] !== ""
          ) {
            data.dob = {
              day: parseInt(req.body["dob[day]"], 10),
              month: parseInt(req.body["dob[month]"], 10),
              year: parseInt(req.body["dob[year]"], 10),
            };
          } else {
            data.dob = null;
          }
        } else {
          if (req.body.dob === "null" || req.body.dob === "") {
            data.dob = null;
          }
        }

        if (contact == "" || contact == null) {
          data.contact = null;
        }
        if (id_card_number == "" || id_card_number == null) {
          data.id_card_number = null;
        }
        if (address == "" || address == null) {
          data.address = null;
        }
        if (family_number == "" || family_number == null) {
          data.family_number = null;
        }

        let hasLocationData = false;

        if (
          req.body.google_map_house_location &&
          typeof req.body.google_map_house_location === "object"
        ) {
          data.google_map_house_location = req.body.google_map_house_location;
          hasLocationData = true;
        } else if (
          req.body["google_map_house_location[lat]"] !== undefined ||
          req.body["google_map_house_location[long]"] !== undefined ||
          req.body["google_map_house_location[address]"] !== undefined ||
          req.body["google_map_house_location[google_map_url]"] !== undefined
        ) {
          const lat = req.body["google_map_house_location[lat]"];
          const long = req.body["google_map_house_location[long]"];
          const address = req.body["google_map_house_location[address]"];
          const url = req.body["google_map_house_location[google_map_url]"];

          const allEmpty =
            (!lat || lat === "") &&
            (!long || long === "") &&
            (!address || address === "") &&
            (!url || url === "");

          if (allEmpty) {
            data.google_map_house_location = null;
            hasLocationData = true;
          } else {
            data.google_map_house_location = {
              lat: lat ? parseFloat(lat) : 0,
              long: long ? parseFloat(long) : 0,
              address: address || "",
              google_map_url: url || "",
            };
            hasLocationData = true;
          }
        } else if (
          req.body.google_map_house_location &&
          typeof req.body.google_map_house_location === "string"
        ) {
          try {
            const parsed = JSON.parse(req.body.google_map_house_location);
            data.google_map_house_location = parsed;
            hasLocationData = true;
          } catch (e) {}
        }

        if (!hasLocationData) {
          delete data.google_map_house_location;
        }

        if (
          req.body["date_joined_party[day]"] ||
          req.body["date_joined_party[month]"] ||
          req.body["date_joined_party[year]"]
        ) {
          if (
            req.body["date_joined_party[day]"] !== "" &&
            req.body["date_joined_party[month]"] !== "" &&
            req.body["date_joined_party[year]"] !== ""
          ) {
            data.date_joined_party = {
              day: parseInt(req.body["date_joined_party[day]"], 10),
              month: parseInt(req.body["date_joined_party[month]"], 10),
              year: parseInt(req.body["date_joined_party[year]"], 10),
            };
          } else {
            data.date_joined_party = null;
          }
        } else {
          if (
            req.body.date_joined_party === "null" ||
            req.body.date_joined_party === ""
          ) {
            data.date_joined_party = null;
          }
        }

        if (party_leader == "" || party_leader == null) {
          data.party_leader = null;
        }

        if (party_sub_leader == "" || party_sub_leader == null) {
          data.party_sub_leader = null;
        }

        if (party_card_member == "" || party_card_member == null) {
          data.party_card_member = null;
        }

        const updatedMember = await model.findByIdAndUpdate(
          id,
          { $set: data },
          { new: true, runValidators: true },
        );

        if (!updatedMember) {
          return res.status(404).json({
            success: false,
            message: "Member not found",
          });
        }

        return res.status(200).json({
          success: true,
          message: "Member updated successfully",
          data: updatedMember,
        });
      } catch (error) {
        console.error("Server error:", error);
        res.status(500).json({
          status: false,
          message: "Server error",
          error: error.message,
        });
      }
    },
  );

  // DELETE endpoint
  prop.app.delete(
    `${urlAPI}/:id`,
    prop.api_auth,
    prop.jwt_auth,
    prop.request_user,
    async (req, res) => {
      await remove(res, req, model, tital_Toast, "NA");
    },
  );

  // GET retrieve data for create
  prop.app.get(
    `${urlAPI}-retrieve-data-for-create`,
    prop.api_auth,
    prop.jwt_auth,
    prop.request_user,
    async (req, res) => {
      try {
        const { village_id } = req.query;

        // Use Promise.all for parallel queries
        const [dataEducationLevel, dataJobName, dataRoleInParty] =
          await Promise.all([
            modelEducation_level.find({}),
            modelJobName.find({}),
            modelRoleInParty.find({}),
          ]);

        if (!village_id) {
          return res.status(400).json({
            success: false,
            message: "មិនមានទិន្នន័យការងារ",
          });
        }

        if (village_id) {
          if (!mongoose.Types.ObjectId.isValid(village_id)) {
            return res.status(400).json({
              success: false,
              message: "មិនមានទិន្នន័យនៅក្នុងប្រព័ន្ធ!",
            });
          }
        }

        const dataElectionOffice = await modelElectionOffice.find({
          village_id: village_id,
        });

        return res.json({
          village_id: village_id,
          success: true,
          data: {
            success: true,
            education_level: dataEducationLevel,
            job_name: dataJobName,
            matual_status: [
              {
                label: "នៅលីវ",
                value: "single",
              },
              {
                label: "បានរៀបការ",
                value: "married",
              },
              {
                label: "លែងលះ",
                value: "divorced",
              },
            ],
            gender: [
              {
                label: "ប្រុស",
                value: "male",
              },
              {
                label: "ស្រី",
                value: "female",
              },
            ],
            role_in_party: dataRoleInParty,
            election_office: dataElectionOffice,
          },
        });
      } catch (error) {
        console.error("Error in retrieve-data-for-create:", error);
        return res.status(500).json({
          success: false,
          message: "Server error",
        });
      }
    },
  );

  // GET filter party sub leader
  prop.app.get(
    `${urlAPI}-filter-party-sub-leader/`,
    prop.api_auth,
    prop.jwt_auth,
    prop.request_user,
    async (req, res) => {
      const {
        party_sub_leader,
        village_id,
        province_id,
        district_id,
        commune_id,
      } = req.query;

      if (!party_sub_leader) {
        return res.send({
          success: false,
          message: "មិនមានទិន្នន័យ​ (party_sub_leader) ក្នុងប្រព័ន្ធ!",
        });
      }

      try {
        let result = {};

        if (village_id) {
          if (!mongoose.Types.ObjectId.isValid(village_id)) {
            return res.status(400).send({
              success: false,
              message: "village_id មិនត្រឹមត្រូវ!",
            });
          }
          result = await getFilterPartySub(
            req,
            party_sub_leader,
            "village_id",
            village_id,
          );
          return res.json({ success: true, ...result });
        }

        if (commune_id) {
          if (!mongoose.Types.ObjectId.isValid(commune_id)) {
            return res.status(400).send({
              success: false,
              message: "commune_id មិនត្រឹមត្រូវ!",
            });
          }
          result = await getFilterPartySub(
            req,
            party_sub_leader,
            "commune_id",
            commune_id,
          );
          return res.json({ success: true, ...result });
        }

        if (district_id) {
          if (!mongoose.Types.ObjectId.isValid(district_id)) {
            return res.status(400).send({
              success: false,
              message: "district_id មិនត្រឹមត្រូវ!",
            });
          }
          result = await getFilterPartySub(
            req,
            party_sub_leader,
            "district_id",
            district_id,
          );
          return res.json({ success: true, ...result });
        }

        if (province_id) {
          if (!mongoose.Types.ObjectId.isValid(province_id)) {
            return res.status(400).send({
              success: false,
              message: "province_id មិនត្រឹមត្រូវ!",
            });
          }
          result = await getFilterPartySub(
            req,
            party_sub_leader,
            "province_id",
            province_id,
          );
          return res.json({ success: true, ...result });
        }

        return res.json({
          success: false,
          message:
            "មិនមានទិន្នន័យក្នុងប្រព័ន្ធ commune_id, district_id, province_id, village_id!",
        });
      } catch (error) {
        console.error("Error in filter-party-sub-leader:", error);
        return res.status(500).json({
          success: false,
          message: "Server error",
        });
      }
    },
  );

  async function getFilterPartySub(
    req,
    party_sub_leader,
    area_name,
    pin_area_id,
  ) {
    const filters = [];

    if (area_name && pin_area_id) {
      const filterObj = {};
      filterObj[area_name] = pin_area_id;
      filters.push(filterObj);
    }

    if (party_sub_leader) {
      filters.push({ party_sub_leader: party_sub_leader });
    }

    return await getPagination(req.query, model, [], filters);
  }
};

module.exports = route;
