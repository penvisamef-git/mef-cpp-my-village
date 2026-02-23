const QRCode = require("qrcode");
const { encryptQR, decryptQR } = require("../../util/encryptQR");
const crypto = require("crypto");
const baseRoute = "qrcode-generator/auth/login";
const Model = require("./authQRCodeLogin.model");
const ModelUser = require("../admin/user/user.model");
const { use } = require("react");
const {
  post,
  getByID,
  getAll,
  update,
  remove,
} = require("../../util/request/crud");
const route = (prop) => {
  function checkValidtion(res, req, requiredFields) {
    for (const field of requiredFields) {
      const value = req.body[field.key];

      if (
        value === undefined || // missing key
        value === null || // null value
        value === "" // empty string
      ) {
        return res.json({
          success: false,
          message: `សូមបញ្ចូល ${field.label}`,
        });
      }
    }
  }

  const ENCRYPTION_KEY = crypto
    .createHash("sha256")
    .update(String("my_secret_key"))
    .digest(); // Must be 32 chars for AES-256
  const IV_LENGTH = 16; // AES block size

  // Encrypt function
  function encrypt(text) {
    let iv = crypto.randomBytes(IV_LENGTH);
    let cipher = crypto.createCipheriv(
      "aes-256-cbc",
      Buffer.from(ENCRYPTION_KEY),
      iv,
    );
    let encrypted = cipher.update(text, "utf8", "base64");
    encrypted += cipher.final("base64");
    return iv.toString("base64") + ":" + encrypted;
  }

  // Decrypt function
  function decrypt(text) {
    let parts = text.split(":");
    let iv = Buffer.from(parts[0], "base64");
    let encryptedText = parts[1];
    let decipher = crypto.createDecipheriv(
      "aes-256-cbc",
      Buffer.from(ENCRYPTION_KEY),
      iv,
    );
    let decrypted = decipher.update(encryptedText, "base64", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  }

  const urlAPI = `/${prop.main_route}/${baseRoute}`;

  prop.app.post(
    `${urlAPI}-generator`,
    prop.api_auth,
    prop.jwt_auth,
    prop.request_user,
    async (req, res) => {
      try {
        // Check Param
        const {
          email,
          is_expired,
          date_expired,
          is_count,
          count,
          note,
          status,
        } = req.body;

        const requiredFields = [
          { key: "email", label: "email" },
          { key: "is_expired", label: "is_expired" },
          { key: "date_expired", label: "date_expired" },
          { key: "is_count", label: "is_count" },
          { key: "count", label: "count" },
        ];
        checkValidtion(res, req, requiredFields);

        var user = await ModelUser.findOne({
          email: email,
        });

        if (!user) {
          return res.status(404).send({
            success: false,
            message: "Invalid user!",
          });
        }

        //Check Use if QR code already just update
        const existQR = Model.find({
          email: email,
        });

        if (existQR) {
          await Model.deleteOne({
            email: email,
          });
        }

        const date = new Date();
        var date_generated = {
          day: date.getDate(),
          month: date.getMonth() + 1,
          year: date.getFullYear(),
          hour: date.getHours(),
          minute: date.getMinutes(),
          second: date.getSeconds(),
        };

        //Add to Data

        const data = await Model.create({
          qr: "",
          encrypted: "NA",
          email,
          user_id: user._id,
          date_generated: date_generated,
          is_expired,
          date_expired,
          is_count,
          count,
          note,
          status,
          created_by: user._id,
          updated_by: user._id,
        });

        const encrypted = encryptQR({
          date_generated,
          id: data._id,
          email,
          is_expired,
          date_expired,
          is_count,
          count,
          user_id: user._id,
        });

        const qrImage = await QRCode.toDataURL(encrypted);

        // add encrypt
        await Model.updateOne({ email }, { $set: { encrypted, qr: qrImage } });

        delete user.password;
        return res.json({
          success: true,
          qr_image: qrImage,
          encrypted,
          data,
        });
      } catch (err) {
        console.error(err);
        res
          .status(500)
          .json({ success: false, message: "QR generation failed" });
      }
    },
  );

  // 🔹 QR Code receiver/decryptor
  prop.app.post(`${urlAPI}-receiver`, prop.api_auth, async (req, res) => {
    try {
      const { encrypted } = req.body;
      if (!encrypted) {
        return res
          .status(400)
          .json({ success: false, message: "Missing encrypted data" });
      }
      const dataDecrypt = decryptQR(encrypted);

      //===========================//
      // Find QR Code and Validation
      const dataQR = await Model.findOne({
        _id: dataDecrypt.id,
      });
      if (!dataQR) {
        return res
          .status(400)
          .json({ success: false, message: "QR Code មិនត្រឹមត្រូវ!" });
      }

      //===========================//
      // if approved all
      if (!dataQR.is_expired && !dataQR.is_count) {
        // Skip
      } else {
        //===========================//
        // Check Data QR is valid or expired or count
        if (dataQR.is_expired) {
          //===========================//
          // Check Date is Remove if expired
          const exp = dataQR.date_expired;
          const expiredDate = new Date(
            exp.year,
            exp.month - 1, // JS months are 0-based
            exp.day,
            exp.hour,
            exp.minute,
            exp.second,
          );

          const now = new Date();
          if (now > expiredDate) {
            // Remove QR
            await Model.deleteOne({
              _id: dataDecrypt.id,
            });
            return res.status(400).json({
              success: false,
              message: "QR Code ផុតកំណត់!",
            });
          }
        }

        //===========================//
        // count

        if (dataQR.is_count) {
          // Check if count  = 0
          if (dataQR.count > 0) {
            //===========================//
            // Minus count
            const count = dataQR.count - 1;
            await Model.updateOne(
              { _id: dataDecrypt.id },
              { $set: { count: count } },
            );
          } else {
            await Model.deleteOne({
              _id: dataDecrypt.id,
            });
            return res.status(400).json({
              success: false,
              message: "QR Code មិនអាចប្រើប្រាស់បាន!",
            });
          }
        }
      }

      // Find user by email in your database
      var user = await ModelUser.findOne({
        email: dataDecrypt.email,
      });

      if (!user) {
        // If no user found, return 400 error
        return res.status(400).json({
          success: false,
          message: "មិនមានគណនី!",
        });
      }

      let userObj = user.toObject(); // Convert Mongoose document to plain JS object

      userObj.token = encrypt(user.password); // Add token field
      delete userObj.password; // Remove password field

      return res.json({
        success: true,
        user: userObj, // Now safe to send
        data: dataDecrypt,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: "បញ្ហាក្នុងប្រព័ន្ធ!" });
    }
  });

  prop.app.get(
    `${urlAPI}-generator`,
    prop.api_auth,
    prop.jwt_auth,
    prop.request_user,
    async (req, res) => {
      let result = await getPagination(req.query, Model, ["user_id"], []);
      result.data = result.data.filter(
        (item) => !item.user_id || item.user_id.is_super_admin !== true,
      );

      // Update the total count
      result.pagination.total = result.data.length;
      result.pagination.totalPages = Math.ceil(
        result.data.length / result.pagination.pageSize,
      );

      res.json({ success: true, ...result });
    },
  );

  async function getPagination(
    query,
    Model,
    populate = [],
    additionalFilter = [],
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

  prop.app.get(
    `${urlAPI}-generator/:id`,
    prop.api_auth,
    prop.jwt_auth,
    prop.request_user,
    async (req, res) => {
      try {
        const { id } = req.params;

        const result = await Model.findOne(id).populate("user_id");

        if (!result) {
          return res.status(404).json({
            success: false,
            message: "Data not found",
          });
        }

        res.json({
          success: true,
          data: result,
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          message: error.message,
        });
      }
    },
  );
  prop.app.get(
    `${urlAPI}-generator-by-user-id/:id`,
    prop.api_auth,
    prop.jwt_auth,
    prop.request_user,
    async (req, res) => {
      try {
        const { id } = req.params;

        const result = await Model.findOne({
          user_id: id,
        }).populate("user_id");

        if (!result) {
          return res.status(404).json({
            success: false,
            message: "Data not found",
          });
        }

        res.json({
          success: true,
          data: result,
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          message: error.message,
        });
      }
    },
  );

  prop.app.delete(
    `${urlAPI}-generator/:id`,
    prop.api_auth,
    prop.jwt_auth,
    prop.request_user,
    async (req, res) => {
      try {
        const { id } = req.params;

        // Check if ID is provided
        if (!id) {
          return res.status(400).send({
            success: false,
            message: "ID is required",
          });
        }

        // Find and permanently delete the QR code
        const deletedQRCode = await Model.findByIdAndDelete({
          _id: id,
        });

        // Check if QR code existed
        if (!deletedQRCode) {
          return res.status(404).send({
            success: false,
            message: "QR Code not found",
          });
        }

        res.status(200).send({
          success: true,
          message: "QR Code permanently deleted successfully",
        });
      } catch (error) {
        console.error("Error permanently deleting QR Code:", error);
        res.status(500).send({
          success: false,
          message: "Failed to permanently delete QR Code",
          error: error.message,
        });
      }
    },
  );
};

module.exports = route;
