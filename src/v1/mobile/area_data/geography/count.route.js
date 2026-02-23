const baseRoute = "app/area-management/geography";
const mongoose = require("mongoose");
const modelProvince = require("../../../admin/dashboard/master_data/area_pin/province/province.model");
const modelVillage = require("../../../admin/dashboard/master_data/area_pin/villages/villages.model");
const modelCommunes = require("../../../admin/dashboard/master_data/area_pin/commues/commues.model");
const modelDisctrict = require("../../../admin/dashboard/master_data/area_pin/disctrict/district.model");

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
      var sqm = 0;
      var dataResponse = {};

      if (village_id) {
        if (!mongoose.Types.ObjectId.isValid(village_id)) {
          return res.status(400).json({
            success: false,
            message: "Invalid village_id!",
          });
        }
        const village = await modelVillage.findOne({
          _id: village_id,
        });
        if (!village) {
          return res.status(400).json({
            success: false,
            message: "Invalid village_id!",
          });
        } else {
          sqm = village.sqm;
        }

        dataResponse = {
          success: true,
          sqm: sqm,
          village: village,
        };
      } else if (commune_id) {
        if (!mongoose.Types.ObjectId.isValid(commune_id)) {
          return res.status(400).json({
            success: false,
            message: "Invalid commune_id!",
          });
        }
        const commune = await modelCommunes.findOne({
          _id: commune_id,
        });
        if (!commune) {
          return res.status(400).json({
            success: false,
            message: "Invalid commune_id!",
          });
        } else {
          sqm = commune.sqm;
        }

        dataResponse = {
          success: true,
          sqm: sqm,
          commune: commune,
        };
      } else if (district_id) {
        if (!mongoose.Types.ObjectId.isValid(district_id)) {
          return res.status(400).json({
            success: false,
            message: "Invalid district_id!",
          });
        }
        const district = await modelDisctrict.findOne({
          _id: district_id,
        });
        if (!district) {
          return res.status(400).json({
            success: false,
            message: "Invalid district_id!",
          });
        } else {
          sqm = district.sqm;
        }

        dataResponse = {
          success: true,
          sqm: sqm,
          district: district,
        };
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
        if (!province) {
          return res.status(400).json({
            success: false,
            message: "Invalid province_id!",
          });
        } else {
          sqm = province.sqm;
        }

        dataResponse = {
          success: true,
          sqm: sqm,
          province: province,
        };
      } else {
        return res.status(400).json({
          success: false,
          message:
            "Invalid [province_id, district_id, commune_id, village_id]!",
        });
      }

      return res.status(200).send(dataResponse);
    }
  );
};

module.exports = route;
