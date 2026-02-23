const baseRoute = "app/area-management/village-election-office";
const modelEelectionOffice = require("../../../admin/dashboard/master_data/office_election/office_election.model");
const modelVillage = require("../../../admin/dashboard/master_data/area_pin/villages/villages.model");
const modelCommune = require("../../../admin/dashboard/master_data/area_pin/commues/commues.model");
const modelDistrict = require("../../../admin/dashboard/master_data/area_pin/disctrict/district.model");
const modelProvince = require("../../../admin/dashboard/master_data/area_pin/province/province.model");
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

  prop.app.get(
    `${urlAPI}`,
    prop.api_auth,
    prop.jwt_auth,
    prop.request_user,
    async (req, res) => {
      const { province_id, district_id, commune_id, village_id } = req.query;

      if (village_id) {
        if (!mongoose.Types.ObjectId.isValid(village_id)) {
          return res.status(400).json({
            success: false,
            message: "Invalid village_id!",
          });
        }

        var village = await modelVillage.findOne({
          _id: village_id,
        });

        if (!village) {
          return res.status(400).json({
            success: false,
            message: "Invalid village_id!",
          });
        }

        // Check Election Office
        const electionOffice = await modelEelectionOffice.find({
          village_id: village_id,
        });

        res.send({
          success: true,
          data_election_office: electionOffice,
          origin: village,
        });
        return;
      } else if (commune_id) {
        if (!mongoose.Types.ObjectId.isValid(commune_id)) {
          return res.status(400).json({
            success: false,
            message: "Invalid commune_id!",
          });
        }

        var communes = await modelCommune.findOne({
          _id: commune_id,
        });

        var filterVillage = await modelVillage.find({
          "village_data.commune_id": communes.commues_id,
        });

        let election_office = [];
        for (const row of filterVillage) {
          const moreVillage = await modelEelectionOffice.find({
            village_id: row.id,
          });

          if (moreVillage && moreVillage.length > 0) {
            election_office.push(...moreVillage); // Append all found documents
          }
        }

        res.send({
          success: true,
          data_election_office: election_office,
          origin: filterVillage,
        });
      } else if (district_id) {
        if (!mongoose.Types.ObjectId.isValid(district_id)) {
          return res.status(400).json({
            success: false,
            message: "Invalid district_id!",
          });
        }
        const district = await modelDistrict.findOne({
          _id: district_id,
        });

        var filterVillage = await modelVillage.find({
          "village_data.district_id": district.district_id,
        });

        let election_office = [];
        for (const row of filterVillage) {
          const moreVillage = await modelEelectionOffice.find({
            village_id: row.id,
          });

          if (moreVillage && moreVillage.length > 0) {
            election_office.push(...moreVillage); // Append all found documents
          }
        }

        res.send({
          success: true,
          data_election_office: election_office,
          origin: filterVillage,
        });
      } else if (province_id) {
        if (!mongoose.Types.ObjectId.isValid(province_id)) {
          return res.status(400).json({
            success: false,
            message: "Invalid province_id!",
          });
        }
        const province = await modelProvince.findOne({
          _id: province_id,
        });

        var filterVillage = await modelVillage.find({
          "village_data.province_id": province.province_id,
        });

        let election_office = [];
        for (const row of filterVillage) {
          const moreVillage = await modelEelectionOffice.find({
            village_id: row.id,
          });

          if (moreVillage && moreVillage.length > 0) {
            election_office.push(...moreVillage); // Append all found documents
          }
        }

        res.send({
          success: true,
          data_election_office: election_office,
          origin: filterVillage,
        });
      }
    }
  );
};

module.exports = route;
