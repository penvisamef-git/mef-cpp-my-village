const baseRoute = "download/all";
const mongoose = require("mongoose");
const ExcelJS = require("exceljs"); // npm install exceljs
const ModelMember = require("../dashboard/area_management/party_member/party_member.model");
const ModelJob = require("../dashboard/master_data/job/job_name/job.model");
const route = (prop) => {
  const urlAPI = `/${prop.main_route}/${baseRoute}`;

  // Shared function to get filtered members
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
    getAll = false, // Add this parameter
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

    // Get total count first
    const total = await Model.countDocuments(mongoFilter);

    let data;
    if (getAll) {
      // If getAll is true, get all data without pagination
      data = await Model.find(mongoFilter)
        .sort({ [sortField]: sortOrder })
        .populate(populate);
    } else {
      // Normal paginated query
      data = await Model.find(mongoFilter)
        .sort({ [sortField]: sortOrder })
        .populate(populate)
        .skip(skip)
        .limit(limit);
    }

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

    if (getAll) {
      // Return only data without pagination
      return {
        data: enhancedData,
      };
    }

    // Return with pagination
    const totalPages = Math.ceil(total / limit);
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

  async function getFilteredMembers(reqQuery, model, modelJobName) {
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
    } = reqQuery;

    // Determine location type and ID
    const locationConfigs = [
      { id: village_id, type: "village_id" },
      { id: commune_id, type: "commune_id" },
      { id: district_id, type: "district_id" },
      { id: province_id, type: "province_id" },
    ];

    const activeLocation = locationConfigs.find((config) => config.id);

    if (!activeLocation) {
      throw new Error("មិនមានទិន្នន័យទីតាំង!");
    }

    if (!mongoose.Types.ObjectId.isValid(activeLocation.id)) {
      throw new Error(`${activeLocation.type} មិនត្រឹមត្រូវ!`);
    }

    const jobName = await modelJobName.find({});

    let result = await getPaginationPinArea(
      reqQuery,
      model,
      ["village_id", "education_level_id", "role_in_party_id", ],
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
      true,
    );

    // Add progress calculation to data
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

    return result;
  }

  // ============ -by-pin-area route ============
  prop.app.get(
    `${urlAPI}-by-pin-area`,
    prop.api_auth,
    prop.jwt_auth,
    prop.request_user,
    async (req, res) => {
      try {
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

        const result = await getFilteredMembers(
          req.query,
          ModelMember,
          ModelJob,
        );
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

  // ============ Download route ============
  prop.app.get(
    `${urlAPI}`,
    prop.api_auth,
    prop.jwt_auth,
    prop.request_user,
    async (req, res) => {
      try {
        // Required fields validation (same as above)
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

        // Get the filtered data using the shared function
        const result = await getFilteredMembers(
          req.query,
          ModelMember,
          ModelJob,
        );

        // Check if result has data
        if (!result.data || result.data.length === 0) {
          return res.status(404).send({
            success: false,
            message: "រកមិនឃើញទិន្នន័យ!",
          });
        }

        // Get job data for reference
        const jobData = await ModelJob.find({});

        // Get location name
        const { village_id, commune_id, district_id, province_id } = req.query;
        let locationName = "";
        let locationNameEn =
          result.data[0]?.village_id?.village_data?.full_name_en;

        if (
          village_id &&
          result.data[0]?.village_id?.village_data?.full_name_km
        ) {
          locationName = result.data[0].village_id.village_data.full_name_km;
        } else if (commune_id) {
          locationName = "ឃុំ/សង្កាត់";
        } else if (district_id) {
          locationName = "ស្រុក/ខណ្ឌ";
        } else if (province_id) {
          locationName = "ខេត្ត/ក្រុង";
        }

        // Calculate statistics
        const totalMembers = result.data.length;
        const femaleMembers = result.data.filter(
          (member) => member.sex === "female",
        ).length;
        const currentDate = new Date();
        const khmerDate = `${currentDate.getDate()} ${getKhmerMonth(currentDate.getMonth() + 1)} ${currentDate.getFullYear()}`;

        // Title
        var title = "";
        if (
          req.query.is_member_cpp == "true" ||
          req.query.is_member_cpp == true
        ) {
          title = `បញ្ជីសមាជិកបក្ស ${locationName} គិតត្រឹមថ្ងៃទី ${khmerDate}`;
        } else if (
          req.query.is_member_cpp == "false" ||
          req.query.is_member_cpp == false
        ) {
          title = `បញ្ជីប្រជាពលរដ្ឋ​(មិនមែនសមាជិកបក្ស) ${locationName} គិតត្រឹមថ្ងៃទី ${khmerDate}`;
        } else {
          title = `បញ្ជីប្រជាពលរដ្ឋ ${locationName} គិតត្រឹមថ្ងៃទី ${khmerDate}`;
        }

        // Create workbook
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("ទិន្នន័យ");

        // ============ ADD TITLE AND SUMMARY SECTION ============

        // Title row
        worksheet.mergeCells("A1:O1");
        const titleCell = worksheet.getCell("A1");
        titleCell.value = `${title}`;
        titleCell.font = { bold: true, size: 14, name: "Moul" };
        titleCell.alignment = { horizontal: "center", vertical: "middle" };

        // Summary row 1 - Total members
        worksheet.mergeCells("A2:B2");
        const totalLabelCell = worksheet.getCell("A2");
        totalLabelCell.value = "សរុប";
        totalLabelCell.font = { bold: true, size: 12, name: "Siemreap" };
        totalLabelCell.alignment = { horizontal: "center", vertical: "middle" };
        totalLabelCell.height = 40;

        const totalValueCell = worksheet.getCell("C2");
        totalValueCell.value = totalMembers;
        totalValueCell.font = { bold: true, size: 12, name: "Siemreap" };
        totalValueCell.alignment = { horizontal: "left", vertical: "middle" };

        // Summary row 2 - Female members
        worksheet.mergeCells("A3:B3");
        const femaleLabelCell = worksheet.getCell("A3");
        femaleLabelCell.value = "ស្រី";
        femaleLabelCell.font = { bold: true, size: 12, name: "Siemreap" };
        femaleLabelCell.alignment = {
          horizontal: "center",
          vertical: "middle",
        };

        const femaleValueCell = worksheet.getCell("C3");
        femaleValueCell.value = femaleMembers;
        femaleValueCell.font = { bold: true, size: 12, name: "Siemreap" };
        femaleValueCell.alignment = { horizontal: "left", vertical: "middle" };

        // Empty row for spacing before headers
        worksheet.getRow(4).height = 5;

        // ============ COLUMN HEADERS ============

        // Add headers manually at row 5
        const headers = [
          "ល.រ",
          "គោតនាម-នាម",
          "ភេទ",
          "ថ្ងៃខែឆ្នាំកំណើត",
          "អាយុ",
          "រាជធានី-ខេត្ត",
          "ក្រុង-ស្រុក-ខណ្ឌ",
          "ឃុំ-សង្កាត់",
          "ភូមិ",
          "លេខអត្ត.សញ្ញាណប័ណ្ណ",
          "កម្រិតវប្បធម៌",
          "តួនាទី-មុខរបរ",
          "តួនាទីក្នុងបក្ស",
          "ក្រុមបក្ស",
          "អត្តលេខ គជប",
        ];

        // Set column widths
        const columnWidths = [
          5, 20, 10, 25, 8, 20, 20, 15, 23, 33, 20, 20, 20, 15, 25,
        ];

        headers.forEach((header, index) => {
          const cell = worksheet.getCell(5, index + 1);
          cell.style = {
            color: "",
          };
          cell.value = header;
          worksheet.getColumn(index + 1).width = columnWidths[index];
        });

        // Prepare data from result.data
        var members = [];
        result.data.reverse();

        result.data.forEach((row, i) => {
          const fullAddress = row.village_id?.village_data?.address_km || "";
          const education = row.education_level_id?.name || "";
          const role_in_party = row.role_in_party_id?.tittle || "";
          const party_card_member = row.party_card_member || "";
          var jobAll = "";

          if (row.job_name_id && Array.isArray(row.job_name_id)) {
            row.job_name_id.forEach((rowJob) => {
              jobData.forEach((rowData) => {
                if (rowJob.toString() == rowData._id.toString()) {
                  jobAll += rowData.name + " ,";
                }
              });
            });
          }

         

          members.push([
            i + 1,
            (row.firstname_kh || "") + "  " + (row.lastname_kh || ""),
            row.sex == "male" ? "ប្រុស" : row.sex == "female" ? "ស្រី" : "",
            formatDateWithKhmerMonth(row.dob),
            calculateAge(row.dob),
            getAddressByIndex(fullAddress, 3),
            getAddressByIndex(fullAddress, 2),
            getAddressByIndex(fullAddress, 1),
            getAddressByIndex(fullAddress, 0),
            row.id_card_number || "",
            education,
            jobAll.slice(0, -1) || "",
            role_in_party,
            row.party_leader || "",
            party_card_member,
          ]);
        });

        // Add data rows starting from row 6
        members.forEach((member, index) => {
          const row = worksheet.getRow(6 + index);
          member.forEach((value, colIndex) => {
            row.getCell(colIndex + 1).value = value;
          });
        });

        // Style the header row (row 5)
        const headerRow = worksheet.getRow(5);
        headerRow.font = {
          bold: true,
          color: { argb: "000000" },
          size: 12,
          name: "Moul",
        };
        headerRow.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFADD8E6" },
        };
        headerRow.alignment = {
          vertical: "middle",
          horizontal: "center",
          wrapText: true,
        };
        headerRow.height = 25;

        // Add borders to header
        headerRow.eachCell((cell) => {
          cell.border = {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" },
          };
        });

        // Style all data rows with Siemreap font
        for (let i = 6; i <= members.length + 5; i++) {
          const row = worksheet.getRow(i);
          row.font = {
            name: "Siemreap",
            size: 11,
            color: { argb: "FF000000" },
          };
          row.alignment = {
            vertical: "middle",
            horizontal: "left",
          };

          // Add borders to all cells
          row.eachCell((cell) => {
            cell.border = {
              top: { style: "thin" },
              left: { style: "thin" },
              bottom: { style: "thin" },
              right: { style: "thin" },
            };
          });
        }
        const buffer = await workbook.xlsx.writeBuffer();

        // Create descriptive English filename

        const filename = `${locationNameEn}.xlsx`;

        res.setHeader(
          "Content-Type",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        );
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="${filename}"`,
        );

        // Send file
        res.status(200).send(buffer);
      } catch (error) {
        console.error("Error generating Excel file:", error);
        res.status(500).json({
          error: "Failed to generate Excel file",
          details: error.message,
        });
      }
    },
  );

  function getAddressByIndex(address, index) {
    if (!address) return "";
    const parts = address.split(" ");
    return parts[index] || "";
  }

  function getKhmerMonth(monthNumber) {
    const khmerMonths = {
      1: "មករា",
      2: "កុម្ភៈ",
      3: "មីនា",
      4: "មេសា",
      5: "ឧសភា",
      6: "មិថុនា",
      7: "កក្កដា",
      8: "សីហា",
      9: "កញ្ញា",
      10: "តុលា",
      11: "វិច្ឆិកា",
      12: "ធ្នូ",
    };
    return khmerMonths[monthNumber] || "";
  }
  function formatDateWithKhmerMonth(dob) {
    // Check if dob exists
    if (!dob) return "";

    // Extract values and handle null/undefined
    const day =
      dob.day && dob.day !== null && dob.day !== "null" ? dob.day : null;
    const month =
      dob.month && dob.month !== null && dob.month !== "null"
        ? parseInt(dob.month)
        : null;
    const year =
      dob.year && dob.year !== null && dob.year !== "null" ? dob.year : null;

    // If any part is missing, return empty string
    if (!day || !month || !year || isNaN(month)) {
      return "";
    }

    // Get Khmer month name
    const khmerMonth = getKhmerMonth(month);

    // If month name not found, return empty string
    if (!khmerMonth) return "";

    // Format the date
    return `${day}-${khmerMonth}-${year}`;
  }

  function calculateAge(dob) {
    if (!dob) return "";

    // Extract values and handle null/undefined
    const day =
      dob.day && dob.day !== null && dob.day !== "null"
        ? parseInt(dob.day)
        : null;
    const month =
      dob.month && dob.month !== null && dob.month !== "null"
        ? parseInt(dob.month)
        : null;
    const year =
      dob.year && dob.year !== null && dob.year !== "null"
        ? parseInt(dob.year)
        : null;

    // If any part is missing or invalid, return empty string
    if (!day || !month || !year || isNaN(day) || isNaN(month) || isNaN(year)) {
      return "";
    }

    const today = new Date();
    const birthDate = new Date(year, month - 1, day);

    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    // Adjust age if birthday hasn't occurred this year yet
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }

    return age;
  }
};

module.exports = route;
