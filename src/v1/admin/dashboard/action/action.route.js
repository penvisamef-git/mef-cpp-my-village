const baseRoute = "action";
const model = require("./action.model");
const multer = require("multer");
const cloudinary = require("../../../../util/cloudinaryConfig/cloudinaryConfig");
const modeVillage = require("../../../admin/dashboard/master_data/area_pin/villages/villages.model");
const modelCommues = require("../../../admin/dashboard/master_data/area_pin/commues/commues.model");
const modelDistrict = require("../../../admin/dashboard/master_data/area_pin/disctrict/district.model");
const modelProvince = require("../../../admin/dashboard/master_data/area_pin/province/province.model");
const fs = require("fs");
const mongoose = require("mongoose");
const {
  post,
  getByID,
  getAll,
  update,
  remove,
  getPagination,
} = require("../../../../util/request/crud");

const route = (prop) => {
  // **************** Declaration ****************
  const urlAPI = `/${prop.main_route}/${baseRoute}`;
  const tital_Toast = "សកម្មភាព";
  const requestRequired = [
    // { key: "tittle", label: "Title (tittle)" },
    // { key: "article", label: "Article (article)" },
  ];

  // Temporary storage folder
  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, "uploads/");
    },
    filename: function (req, file, cb) {
      cb(null, Date.now() + "-" + file.originalname); // optional: unique file name
    },
  });

  // File filter to allow only PNG and JPG/JPEG
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
      files: 10, // max 10 files
      fileSize: 10 * 1024 * 1024, // max 10 MB per file
    },
  });

  prop.app.post(
    `${urlAPI}`,
    prop.api_auth,
    prop.jwt_auth,
    prop.request_user,

    // Multer handler for thumbnail + group images
    (req, res, next) => {
      upload.fields([
        { name: "image_thumnail", maxCount: 1 },
        { name: "image_group", maxCount: 10 },
      ])(req, res, (err) => {
        if (err) {
          return res.status(400).json({ status: false, message: err.message });
        }
        next();
      });
    },

    async (req, res) => {
      try {
        const { tittle, article, village_id } = req.body;
        let data = { tittle, article };
        // ------ REQUIRED FIELD CHECK ------
        if (!tittle || !article) {
          return res.status(400).json({
            status: false,
            message: "Both 'tittle' and 'article' are required.",
          });
        }

        if (!village_id) {
          return res.status(400).json({
            status: false,
            message: "Vilalge ID 'village_id' is required.",
          });
        }

        if (village_id) {
          if (!mongoose.Types.ObjectId.isValid(village_id)) {
            return res.status(400).json({
              success: false,
              message: "មិនមានទិន្នន័យមិនត្រឹមត្រូវ​!",
            });
          }
        }

        const village = await modeVillage.findOne({
          _id: village_id,
          deleted: false,
        });

        if (!village) {
          return res.status(400).json({
            success: false,
            message: "មិនមានទិន្នន័យភូមិ!",
          });
        }

        const commues = await modelCommues.findOne({
          commues_id: village.village_data.commune_id,
          deleted: false,
        });

        const disctrict = await modelDistrict.findOne({
          district_id: village.village_data.district_id,
          deleted: false,
        });

        const province = await modelProvince.findOne({
          province_id: village.village_data.province_id,
          deleted: false,
        });

        data.village_id = village_id;
        data.commune_id = commues._id;
        data.district_id = disctrict._id;
        data.province_id = province._id;

        const date = new Date();

        data.date_posted = {
          day: date.getDate(),
          month: date.getMonth() + 1,
          year: date.getFullYear(),
          hour: date.getHours(),
          minute: date.getMinutes(),
          second: date.getSeconds(),
        };

        const filesThumbnail = req.files["image_thumnail"]
          ? req.files["image_thumnail"][0]
          : null;

        const filesGroup = req.files["image_group"] || [];

        if (!filesThumbnail && filesGroup.length === 0) {
          return res.status(400).json({
            status: false,
            message: "No images uploaded",
          });
        }

        // ---- TOTAL SIZE CHECK (max 15MB) ----
        const totalSize =
          (filesThumbnail ? filesThumbnail.size : 0) +
          filesGroup.reduce((acc, file) => acc + file.size, 0);

        if (totalSize > 15 * 1024 * 1024) {
          return res.status(400).json({
            status: false,
            message: "Total size of all images must not exceed 15 MB",
          });
        }

        // -------------------------------
        // Upload to Cloudinary: THUMBNAIL
        // -------------------------------
        let thumbnailURL = null;

        if (filesThumbnail) {
          const uploadThumb = await cloudinary.uploader.upload(
            filesThumbnail.path,
            { folder: "action_posted/thumbnail" }
          );
          thumbnailURL = uploadThumb.secure_url;

          fs.unlinkSync(filesThumbnail.path);
        }

        // -------------------------------
        // Upload GROUP IMAGES to Cloudinary
        // -------------------------------
        let uploadedGroup = [];

        for (const file of filesGroup) {
          const cloud = await cloudinary.uploader.upload(file.path, {
            folder: "action_posted/group",
          });

          uploadedGroup.push({
            name: file.originalname,
            url: cloud.secure_url,
          });

          fs.unlinkSync(file.path);
        }

        // Save URL to database
        data.image_group = uploadedGroup;
        data.image_thumnail_url = thumbnailURL || "";

        // -------------------------
        // Save to MongoDB (your fn)
        // -------------------------
        var isUnfinishConnection = true;
        var dataAdded = await post(
          res,
          req,
          requestRequired,
          data,
          model,
          tital_Toast,
          "NA",
          isUnfinishConnection
        );

        if (isUnfinishConnection) {
          return res.send({
            success: true,
            data: dataAdded,
          });
        }
      } catch (error) {
        console.error(error);
        res.status(500).json({
          status: false,
          message: "Server error",
          error: error.message,
        });
      }
    }
  );

  prop.app.get(
    `${urlAPI}/:id`, // optional ":id"
    prop.api_auth,
    prop.jwt_auth,
    prop.request_user,
    async (req, res) => {
      await getByID(res, req, model, false);
    }
  );

  prop.app.get(
    `${urlAPI}-all`,
    prop.api_auth,
    prop.jwt_auth,
    prop.request_user,
    async (req, res) => {
      await getAll(res, req, model, false);
    }
  );

  prop.app.get(
    `${urlAPI}`,
    prop.api_auth,
    prop.jwt_auth,
    prop.request_user,
    async (req, res) => {
      let result = await getPagination(req.query, model, ["created_by"], []);
      res.json({ success: true, ...result });
    }
  );

  prop.app.delete(
    `${urlAPI}/:id`,
    prop.api_auth,
    prop.jwt_auth,
    prop.request_user,

    async (req, res) => {
      try {
        const { id } = req.params;

        // Validate ID
        if (!mongoose.Types.ObjectId.isValid(id)) {
          return res.status(400).json({
            success: false,
            message: "ID មិនត្រឹមត្រូវ",
          });
        }

        // Find item
        const data = await model.findOne({ _id: id, deleted: false });
        if (!data) {
          return res.status(404).json({
            success: false,
            message: "មិនមានទិន្នន័យនៅក្នុងប្រព័ន្ធ!",
          });
        }

        // ============================
        // Function: Extract Cloudinary Public ID
        // ============================
        function extractPublicId(url) {
          if (!url) return null;

          let parts = url.split("/upload/");
          if (parts.length < 2) return null;

          let path = parts[1];
          // Example: v1733300000/action_posted/group/xyz778.jpg

          // Remove version number (v123456/)
          path = path.replace(/^v[0-9]+\//, "");

          // Remove extension
          return path.replace(/\.(jpg|jpeg|png|webp)$/i, "");
        }

        // -----------------------------
        // 📌 1. DELETE THUMBNAIL
        // -----------------------------
        if (data.image_thumnail_url) {
          const publicIdThumb = extractPublicId(data.image_thumnail_url);
          if (publicIdThumb) {
            await cloudinary.uploader.destroy(publicIdThumb);
          }
        }

        // -----------------------------
        // 📌 2. DELETE IMAGE GROUP
        // -----------------------------
        if (data.image_group && data.image_group.length > 0) {
          for (const img of data.image_group) {
            const publicId = extractPublicId(img.url);
            if (publicId) {
              await cloudinary.uploader.destroy(publicId);
            }
          }
        }

        // -----------------------------
        // 📌 3. Delete MongoDB Document
        // -----------------------------
        await model.deleteOne({ _id: id });

        return res.json({
          success: true,
          message: "ទិន្នន័យត្រូវបានលុបដោយជោគជ័យ!",
        });
      } catch (error) {
        console.error(error);
        return res.status(500).json({
          success: false,
          message: "Server Error",
          error: error.message,
        });
      }
    }
  );

  prop.app.get(
    `${urlAPI}-by-pin-area`,
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
          // Get Paginations
          result = await getPaginations(
            req.query,
            model,
            ["created_by"],
            [],
            "village_id",
            village_id
          );
          return res.send({ success: true, ...result });
        } else if (commune_id) {
          if (!mongoose.Types.ObjectId.isValid(commune_id)) {
            return res.status(400).send({
              success: false,
              message: "commune_id មិនត្រឹមត្រូវ!",
            });
          }

          // Get Paginations
          result = await getPaginations(
            req.query,
            model,
            ["created_by"],
            [],
            "commune_id",
            commune_id
          );
          return res.send({ success: true, ...result });
        } else if (district_id) {
          if (!mongoose.Types.ObjectId.isValid(district_id)) {
            return res.status(400).send({
              success: false,
              message: "district_id មិនត្រឹមត្រូវ!",
            });
          }

          // Get Paginations
          result = await getPaginations(
            req.query,
            model,
            ["created_by"],
            [],
            "district_id",
            district_id
          );
          return res.send({ success: true, ...result });
        } else if (province_id) {
          if (!mongoose.Types.ObjectId.isValid(province_id)) {
            return res.status(400).send({
              success: false,
              message: "province_id មិនត្រឹមត្រូវ!",
            });
          }

          // Get Paginations
          result = await getPaginations(
            req.query,
            model,
            ["created_by"],
            [],
            "province_id",
            province_id
          );
          return res.send({ success: true, ...result });
        }

        return res.send({
          success: false,
          message:
            "សូមបញ្ចូល province_id ឬ district_id ឬ commune_id ឬ village_id",
        });
      } catch (error) {
        return res.status(500).send({
          success: false,
          message: "មានបញ្ហាក្នុងការទាញយកទិន្នន័យ",
        });
      }
    }
  );

  async function getPaginations(
    query,
    Model,
    populate = [],
    additionalFilter = [],
    key_Area,
    id_Area
  ) {
    // Pagination
    const page = parseInt(query.page, 10) || 1;
    const limit = parseInt(query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    // Sorting
    const sortField = query.sort || "created_date";
    const sortOrder = query.order === "asc" ? 1 : -1;

    // Soft delete toggle
    const includeDeleted = query.includeDeleted === "true";
    const deleteFilter = includeDeleted ? {} : { deleted: false };

    // Specific ID Filter (q_id + q_key_id)
    const qId = query.q_id;
    const qKeyId = query.q_key_id;
    let specificOr = [];

    if (qId && qKeyId) {
      let ids;
      let fields;

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

    // General keyword search (q + q_key)
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
          (field.endsWith("_id") && mongoose.Types.ObjectId.isValid(keyword)) ||
          (field.endsWith("created_by_id") &&
            mongoose.Types.ObjectId.isValid(keyword))
        ) {
          return { [field]: new mongoose.Types.ObjectId(keyword) };
        }
        return { [field]: { $regex: keyword, $options: "i" } };
      });
    }

    // Compose final MongoDB filter
    let mongoFilter = {
      ...deleteFilter,
      [key_Area]: new mongoose.Types.ObjectId(id_Area),
    };

    if (specificOr.length && generalOr.length) {
      mongoFilter.$and = [{ $or: specificOr }, { $or: generalOr }];
    } else if (specificOr.length) {
      mongoFilter.$or = specificOr;
    } else if (generalOr.length) {
      mongoFilter.$or = generalOr;
    }

    // ✅ Add additional filters like is_super_admin: false
    if (additionalFilter.length > 0) {
      if (mongoFilter.$and) {
        mongoFilter.$and.push(...additionalFilter);
      } else {
        mongoFilter.$and = [...additionalFilter];
      }
    }

    // Query database with filter, pagination, sorting
    const [data, total] = await Promise.all([
      Model.find(mongoFilter)
        .sort({ [sortField]: sortOrder })
        .populate(populate)
        .skip(skip)
        .limit(limit),
      Model.countDocuments(mongoFilter),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data,
      pagination: {
        total,
        totalPages,
        currentPage: page,
        pageSize: limit,
      },
    };
  }

  // Put style
  //   {
  //   "tittle": "Updated title",
  //   "article": "Updated article",
  //   "remove_images": ["691bdd24c2d952fc95a41c23", "691bdd24c2d952fc95a41c24"]
  // }

  prop.app.put(
    `${urlAPI}/:id`,
    prop.api_auth,
    prop.jwt_auth,
    prop.request_user,
    (req, res, next) => {
      upload.fields([
        { name: "image_thumnail", maxCount: 1 },
        { name: "image_group", maxCount: 10 },
      ])(req, res, (err) => {
        if (err)
          return res.status(400).json({ status: false, message: err.message });
        next();
      });
    },
    async (req, res) => {
      try {
        const { id } = req.params;
        const { tittle, article, remove_images } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
          return res
            .status(400)
            .json({ success: false, message: "Invalid ID" });
        }

        const data = await model.findOne({ _id: id });
        if (!data)
          return res.status(404).json({ success: false, message: "Not found" });

        let updatedData = {};

        // Optional fields
        if (tittle) updatedData.tittle = tittle;
        if (article) updatedData.article = article;

        const filesThumbnail = req.files["image_thumnail"]
          ? req.files["image_thumnail"][0]
          : null;
        const filesGroup = req.files["image_group"] || [];

        const extractPublicId = (url) => {
          if (!url) return null;
          const parts = url.split("/upload/");
          if (parts.length < 2) return null;
          const path = parts[1].replace(/^v[0-9]+\//, "");
          return path.replace(/\.(jpg|jpeg|png|webp)$/i, "");
        };

        // -----------------------------
        // 1️⃣ Update Thumbnail if provided
        // -----------------------------
        if (filesThumbnail) {
          if (data.image_thumnail_url) {
            const oldThumbId = extractPublicId(data.image_thumnail_url);
            if (oldThumbId) await cloudinary.uploader.destroy(oldThumbId);
          }
          const uploadThumb = await cloudinary.uploader.upload(
            filesThumbnail.path,
            { folder: "action_posted/thumbnail" }
          );
          updatedData.image_thumnail_url = uploadThumb.secure_url;
          fs.unlinkSync(filesThumbnail.path);
        }

        // -----------------------------
        // 2️⃣ Update Group images
        // -----------------------------
        let remainingImages = data.image_group || [];

        if (remove_images && Array.isArray(remove_images)) {
          remainingImages = remainingImages.filter(
            (img) => !remove_images.includes(img._id.toString())
          );

          for (const img of data.image_group) {
            if (remove_images.includes(img._id.toString())) {
              const publicId = extractPublicId(img.url);
              if (publicId) await cloudinary.uploader.destroy(publicId);
            }
          }
        }

        // Add newly uploaded images
        if (filesGroup.length > 0) {
          for (const file of filesGroup) {
            const cloud = await cloudinary.uploader.upload(file.path, {
              folder: "action_posted/group",
            });
            remainingImages.push({
              name: file.originalname,
              url: cloud.secure_url,
            });
            fs.unlinkSync(file.path);
          }
        }

        updatedData.image_group = remainingImages;

        // -----------------------------
        // 3️⃣ Update date_posted
        // -----------------------------
        const date = new Date();
        updatedData.date_posted = {
          day: date.getDate(),
          month: date.getMonth() + 1,
          year: date.getFullYear(),
          hour: date.getHours(),
          minute: date.getMinutes(),
          second: date.getSeconds(),
        };

        // -----------------------------
        // 4️⃣ Save to MongoDB
        // -----------------------------
        const updatedDocument = await model.findByIdAndUpdate(id, updatedData, {
          new: true,
        });

        return res.json({
          success: true,
          message: "Updated successfully",
          data: updatedDocument,
        });
      } catch (error) {
        console.error(error);
        return res.status(500).json({
          success: false,
          message: "Server error",
          error: error.message,
        });
      }
    }
  );
};

module.exports = route;
