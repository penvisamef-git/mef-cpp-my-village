const baseRoute = "app/area-management/people";
const mongoose = require("mongoose");
const modelPartyMember = require("../../../admin/dashboard/area_management/party_member/party_member.model");
const modelVillage = require("../../../admin/dashboard/master_data/area_pin/villages/villages.model");
const modelCommune = require("../../../admin/dashboard/master_data/area_pin/commues/commues.model");
const modelDistrict = require("../../../admin/dashboard/master_data/area_pin/disctrict/district.model");
const modelProvince = require("../../../admin/dashboard/master_data/area_pin/province/province.model");
const modelVillageMore = require("../../../admin/dashboard/master_data/area_pin/villages/more/village_more.model");
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

        var moreVilalge = await modelVillageMore.find({
          village_id: village_id,
        });
        var more = [];
        if (moreVilalge) {
          more = moreVilalge;
        }
        res.send({
          success: true,
          data: village.count,
          more: more,
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

        let more = [];
        for (const row of filterVillage) {
          const moreVillage = await modelVillageMore.find({
            village_id: row.id,
          });

          if (moreVillage && moreVillage.length > 0) {
            more.push(...moreVillage); // Append all found documents
          }
        }

        var countObject = {
          people: {
            male: 0,
            female: 0,
            family_count: 0,
          },
          home: 0,
          pagoda: 0,
          migrant: {
            in: 0,
            out: 0,
          },
        };
        if (filterVillage) {
          filterVillage?.map((row) => {
            var countLocal = row.count;
            countObject.people.male += countLocal.people.male;
            countObject.people.female += countLocal.people.female;
            countObject.people.family_count += countLocal.people.family_count;
            countObject.home += countLocal.home;
            countObject.pagoda += countLocal.pagoda;
            countObject.migrant.in += countLocal.migrant.in;
            countObject.migrant.out += countLocal.migrant.out;
          });
        }

        res.send({
          success: true,
          data: countObject,
          more: more,
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

        let more = [];
        for (const row of filterVillage) {
          const moreVillage = await modelVillageMore.find({
            village_id: row.id,
          });

          if (moreVillage && moreVillage.length > 0) {
            more.push(...moreVillage); // Append all found documents
          }
        }

        var countObject = {
          people: {
            male: 0,
            female: 0,
            family_count: 0,
          },
          home: 0,
          pagoda: 0,
          migrant: {
            in: 0,
            out: 0,
          },
        };

        if (filterVillage) {
          filterVillage?.map((row) => {
            var countLocal = row.count;
            countObject.people.male += countLocal.people.male;
            countObject.people.female += countLocal.people.female;
            countObject.people.family_count += countLocal.people.family_count;
            countObject.home += countLocal.home;
            countObject.pagoda += countLocal.pagoda;
            countObject.migrant.in += countLocal.migrant.in;
            countObject.migrant.out += countLocal.migrant.out;
          });
        }

        res.send({
          success: true,
          data: countObject,
          more: more,
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

        let more = [];
        for (const row of filterVillage) {
          const moreVillage = await modelVillageMore.find({
            village_id: row.id,
          });

          if (moreVillage && moreVillage.length > 0) {
            more.push(...moreVillage); // Append all found documents
          }
        }

        var countObject = {
          people: {
            male: 0,
            female: 0,
            family_count: 0,
          },
          home: 0,
          pagoda: 0,
          migrant: {
            in: 0,
            out: 0,
          },
        };

        if (filterVillage) {
          filterVillage?.map((row) => {
            var countLocal = row.count;
            countObject.people.male += countLocal.people.male;
            countObject.people.female += countLocal.people.female;
            countObject.people.family_count += countLocal.people.family_count;
            countObject.home += countLocal.home;
            countObject.pagoda += countLocal.pagoda;
            countObject.migrant.in += countLocal.migrant.in;
            countObject.migrant.out += countLocal.migrant.out;
          });
        }

        res.send({
          success: true,
          data: countObject,
          more: more,
          origin: filterVillage,
        });
      } else {
        res.send({
          success: false,
          message: "មិនមានទិន្នន័យ",
        });
      }
    }
  );
};

module.exports = route;
