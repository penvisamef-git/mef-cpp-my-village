const baseRoute = "app/area-management/party-member";
const mongoose = require("mongoose");
const modelPeople = require("../../../admin/dashboard/area_management/party_member/party_member.model");

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

  prop.app.get(
    `${urlAPI}`,
    prop.api_auth,
    prop.jwt_auth,
    prop.request_user,
    async (req, res) => {
      const { province_id, district_id, commune_id, village_id } = req.query;

      // Build dynamic match filter
      let matchFilter = {};

      if (province_id) {
        if (!mongoose.Types.ObjectId.isValid(province_id)) {
          return res.status(400).json({
            success: false,
            message: "Invalid province_id!",
          });
        }
        matchFilter["province_id"] = new mongoose.Types.ObjectId(province_id);
      }

      if (district_id) {
        if (!mongoose.Types.ObjectId.isValid(district_id)) {
          return res.status(400).json({
            success: false,
            message: "Invalid district_id!",
          });
        }
        matchFilter["district_id"] = new mongoose.Types.ObjectId(district_id);
      }

      if (commune_id) {
        if (!mongoose.Types.ObjectId.isValid(commune_id)) {
          return res.status(400).json({
            success: false,
            message: "Invalid commune_id!",
          });
        }
        matchFilter["commune_id"] = new mongoose.Types.ObjectId(commune_id);
      }

      if (village_id) {
        if (!mongoose.Types.ObjectId.isValid(village_id)) {
          return res.status(400).json({
            success: false,
            message: "Invalid village_id!",
          });
        }
        matchFilter["village_id"] = new mongoose.Types.ObjectId(village_id);
      }

      // Male and female counts
      const resultMale = await modelPeople.aggregate([
        { $match: { ...matchFilter, sex: "male" } },
      ]);

      const resultFemale = await modelPeople.aggregate([
        { $match: { ...matchFilter, sex: "female" } },
      ]);

      const today = new Date();

      const aggregationResult = await modelPeople.aggregate([
        { $match: matchFilter }, // apply province filter if provided
        {
          $addFields: {
            dobDate: {
              $dateFromParts: {
                year: "$dob.year",
                month: "$dob.month",
                day: "$dob.day",
              },
            },
          },
        },
        {
          $addFields: {
            age: {
              $dateDiff: {
                startDate: "$dobDate",
                endDate: today,
                unit: "year",
              },
            },
          },
        },
        {
          $group: {
            _id: {
              sex: "$sex",
              ageGroup: {
                $switch: {
                  branches: [
                    { case: { $lte: ["$age", 18] }, then: "under_18" },
                    {
                      case: {
                        $and: [{ $gt: ["$age", 18] }, { $lte: ["$age", 35] }],
                      },
                      then: "up_18_to_35",
                    },
                  ],
                  default: "up_35",
                },
              },
            },
            count: { $sum: 1 },
          },
        },
      ]);

      // Initialize response structure
      const responseData = {
        success: true,
        total: {
          male: resultMale.length,
          female: resultFemale.length,
          count: resultMale.length + resultFemale.length,
        },
        age: {
          under_18: { male: 0, female: 0, count: 0 },
          up_18_to_35: { male: 0, female: 0, count: 0 },
          up_35: { male: 0, female: 0, count: 0 },
        },
      };

      // Fill in the age groups

      for (const record of aggregationResult) {
        const sex = record._id.sex;
        const ageGroup = record._id.ageGroup;
        const count = record.count;

        responseData.age[ageGroup][sex] += count;
        responseData.age[ageGroup].count += count;
      }

      const countFamilySet = new Set();
      [...resultFemale, ...resultMale].forEach((row) => {
        countFamilySet.add(row.family_system_number);
      });
      const countFamily = Array.from(countFamilySet);
      responseData.family_count = countFamily.length;

      res.json(responseData);
    },
  );

  prop.app.get(
    `${urlAPI}-calulation`,
    prop.api_auth,
    prop.jwt_auth,
    prop.request_user,
    async (req, res) => {
      try {
        const { province_id, district_id, commune_id, village_id } = req.query;

        // Build query conditions
        let queryConditions = {
          deleted: false,
          is_alived: true,
        };

        // Add location filters based on hierarchy (only one will be applied)
        if (village_id) {
          if (!mongoose.Types.ObjectId.isValid(village_id)) {
            return res.status(400).json({
              success: false,
              message: "Invalid village_id!",
            });
          }
          queryConditions["village_id"] = new mongoose.Types.ObjectId(
            village_id,
          );
        } else if (commune_id) {
          if (!mongoose.Types.ObjectId.isValid(commune_id)) {
            return res.status(400).json({
              success: false,
              message: "Invalid commune_id!",
            });
          }
          queryConditions["commune_id"] = new mongoose.Types.ObjectId(
            commune_id,
          );
        } else if (district_id) {
          if (!mongoose.Types.ObjectId.isValid(district_id)) {
            return res.status(400).json({
              success: false,
              message: "Invalid district_id!",
            });
          }
          queryConditions["district_id"] = new mongoose.Types.ObjectId(
            district_id,
          );
        } else if (province_id) {
          if (!mongoose.Types.ObjectId.isValid(province_id)) {
            return res.status(400).json({
              success: false,
              message: "Invalid province_id!",
            });
          }
          queryConditions["province_id"] = new mongoose.Types.ObjectId(
            province_id,
          );
        }

        // Get all data with the correct query conditions
        const resultAll = await modelPeople.find(queryConditions);

        // Filter data from the resultAll array
        // Alive people (already filtered by is_alived: true in query)
        const alivePeople = resultAll; // Since we already filtered is_alived: true

        // Gender counts from alive people
        const resultMale = alivePeople.filter(
          (person) => person.sex === "male",
        );
        const resultFemale = alivePeople.filter(
          (person) => person.sex === "female",
        );

        // Calculate gender percentages
        const totalAlive = resultMale.length + resultFemale.length;
        const genderMale =
          totalAlive > 0 ? (resultMale.length * 100) / totalAlive : 0;
        const genderFemale =
          totalAlive > 0 ? (resultFemale.length * 100) / totalAlive : 0;

        // Member Count (CPP members vs non-members)
        const cppMembers = alivePeople.filter(
          (person) => person.is_member_cpp === true,
        );
        const nonMembers = alivePeople.filter(
          (person) => person.is_member_cpp === false,
        );

        const memberPer =
          totalAlive > 0 ? (cppMembers.length * 100) / totalAlive : 0;
        const notMemberPer =
          totalAlive > 0 ? (nonMembers.length * 100) / totalAlive : 0;

        // Get dead people (separate query or filter from all data)
        // Since we filtered is_alived: true in the main query, we need a separate query for dead
        const deadQuery = { ...queryConditions, is_alived: false };
        const dead = await modelPeople.find(deadQuery);

        // Count Unique Families
        const uniqueFamilyCount = new Set(
          resultAll
            .map((row) => row.family_system_number)
            .filter((familyId) => familyId), // Remove null/undefined
        ).size;

        // Send the response
        res.json({
          success: true,
          data: {
            total_member_and_population: totalAlive,
            member_and_not: {
              member: {
                count: cppMembers.length,
                percentage: parseFloat(memberPer.toFixed(2)),
              },
              not_member: {
                count: nonMembers.length,
                percentage: parseFloat(notMemberPer.toFixed(2)),
              },
            },
            male: {
              count: resultMale.length,
              percentage: parseFloat(genderMale.toFixed(2)),
            },
            female: {
              count: resultFemale.length,
              percentage: parseFloat(genderFemale.toFixed(2)),
            },
            family_count: uniqueFamilyCount,
            dead: dead.length,
            total_origin_records: resultAll.length,
          },
        });
      } catch (error) {
        console.error("Error in calculation API:", error);
        res.status(500).json({
          success: false,
          message: "Internal server error",
          error: error.message,
        });
      }
    },
  );
};

module.exports = route;
