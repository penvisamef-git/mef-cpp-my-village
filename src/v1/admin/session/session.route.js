const helper = require("../../../util/helper");
const User = require("../user/user.model");
const ActivityLogCategory = require("../activity_log_category/activity_log_category.model");
const ActivityLog = require("../activity_log/activity_log.model");
const Session = require("./session.model");
const baseRoute = "session";

const route = (prop) => {
  const urlAPI = `/${prop.main_route}/${baseRoute}`;

  prop.app.get(
    `${urlAPI}`,
    prop.api_auth,
    prop.jwt_auth,
    prop.request_user,
    async (req, res) => {
      // Populate user_id and then populate group_user_id inside user_id
      const populateConfig = [
        {
          path: "user_id",
          select: "-password", // Exclude password
          populate: {
            path: "group_user_id", // This will populate the group details
            select: "name note status", // Select only the fields you need
          },
        },
      ];

      let result = await getPagination(req.query, Session, populateConfig, []);

      // Filter out sessions where user is super admin
      if (result.data && Array.isArray(result.data)) {
        result.data = result.data.filter((session) => {
          // Check if user exists and is not super admin
          return !(session.user_id && session.user_id.is_super_admin === true);
        });

        // Update pagination counts
        result.pagination.total = result.data.length;
        result.pagination.totalPages = Math.ceil(
          result.data.length / (req.query.limit || 10),
        );
      }

      res.json({ success: true, ...result });
    },
  );
  prop.app.post(`${urlAPI}`, prop.api_auth, async (req, res) => {
    const { user_id } = req.body;

    // 1. Validate required fields
    const requiredFields = { email, password };
    for (const [key, value] of Object.entries(requiredFields)) {
      if (!value) {
        return res.json({
          success: false,
          message: `Field '${key}' is required`,
        });
      }
    }

    // 2. Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // 3. Check password (plaintext example — use bcrypt in real app)
    if (user.password !== password) {
      return res.json({ success: false, message: "Invalid Password!" });
    }

    // 4. Log activity after successful login
    const categoryLog = await ActivityLogCategory.findOne({ title: "auth" });
    if (!categoryLog) {
      return res
        .status(404)
        .json({ success: false, message: "Activity log category not found" });
    }
    const log = new ActivityLog({
      title: `ឧបករណ៍ ${
        helper.extractDeviceInfo(req).device
      } បានចូលគណនី (សាអេឡិចត្រូនិច : ${email})`,
      description: `ប្រើប្រាស់ ${
        helper.extractDeviceInfo(req).browser
      } ចូលក្នុងប្រព័ន្ធ - ${helper.cambodiaDate()}`,
      activity_log_category_id: categoryLog._id,
      create_by_id: user._id,
      device: helper.extractDeviceInfo(req), // optional
      time: helper.cambodiaDate(),
    });

    await log.save();

    // 5. Return success
    const userData = user.toObject();
    delete userData.password;
    const access_token = prop.jwt.sign(
      { userName: email, user: password },
      "access_token",
      { expiresIn: "3000h" },
    );
    userData.access_token = access_token;
    res.json({ success: true, data: userData });
  });

  prop.app.delete(
    `${urlAPI}/:id`,
    prop.api_auth,
    prop.jwt_auth,
    prop.request_user,
    async (req, res) => {
      try {
        const sessionId = req.params.id;

        // Check if session exists
        const session = await Session.findById(sessionId);

        if (!session) {
          return res.status(404).json({
            success: false,
            message: "Session not found",
          });
        }

        // Hard delete - permanently remove from database
        await Session.findByIdAndDelete(sessionId);

        return res.json({
          success: true,
          message: "Session deleted permanently",
        });
      } catch (error) {
        console.error("Error deleting session:", error);
        return res.status(500).json({
          success: false,
          message: "Failed to delete session",
          error: error.message,
        });
      }
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
    const deleteFilter = {};

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
};

module.exports = route;
