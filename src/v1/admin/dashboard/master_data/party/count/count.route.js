const baseRoute = "master-data/party/count";
const model = require("./count.model");
const modelVillage = require("../../../master_data/area_pin/villages/villages.model");
const modelCommue = require("../../../master_data/area_pin/commues/commues.model");
const modelDistrict = require("../../../master_data/area_pin/disctrict/district.model");
const modelProvince = require("../../../master_data/area_pin/province/province.model");
const mongoose = require("mongoose");
const {
  post,
  getByID,
  getAll,
  update,
  remove,
  getPagination,
} = require("../../../../../../util/request/crud");
const route = (prop) => {
  // **************** Declaration ****************
  const urlAPI = `/${prop.main_route}/${baseRoute}`;
  const tital_Toast = "ទិន្នន័យមេ - លេខលំនាំដើម";
  const requestRequired = [];

  prop.app.post(
    `${urlAPI}`, // optional ":id"
    prop.api_auth,
    prop.jwt_auth,
    prop.request_user,
    async (req, res) => {
      var data = ({
        count_branch_member,
        count_family_system_number,
        count_group_leader,
        village_id,
        note,
        status,
      } = req.body);

      if (!mongoose.Types.ObjectId.isValid(village_id)) {
        return res.status(400).json({
          success: false,
          message: "មិនមានទិន្នន័យនៅក្នុងប្រព័ន្ធ (village_id)!",
        });
      }

      const village = await modelVillage.findOne({
        _id: village_id,
      });

      if (!village) {
        return res.status(400).json({
          success: false,
          message: "មិនមានទិន្នន័យនៅក្នុងប្រព័ន្ធ (village_id)!",
        });
      }

      var areaCommune_id = village.village_data.commune_id;
      var areaDistrict_id = village.village_data.district_id;
      var areaProvince_id = village.village_data.province_id;

      const commune = await modelCommue.findOne({
        commues_id: areaCommune_id,
      });

      const district = await modelDistrict.findOne({
        district_id: areaDistrict_id,
      });

      const province = await modelProvince.findOne({
        province_id: areaProvince_id,
      });

      data.commune_id = commune._id;
      data.district_id = district._id;
      data.province_id = province._id;

      // Check is village is village_id
      var currentData = await model.findOne({
        village_id: village_id,
      });

      if (currentData) {
        if (currentData.village_id == village_id) {
          return res.status(400).json({
            success: false,
            message: "ភូមិមិននៅក្នុងប្រព័ន្ធ (village_id)!",
          });
        }
      }

      var isUnfinishConnection = false;
      await post(
        res,
        req,
        requestRequired,
        data,
        model,
        tital_Toast,
        "NA",
        isUnfinishConnection
      );
    }
  );

  prop.app.delete(
    `${urlAPI}/:id`,
    prop.api_auth,
    prop.jwt_auth,
    prop.request_user,
    async (req, res) => {
      await remove(res, req, model, tital_Toast, "NA");
    }
  );

  prop.app.get(
    `${urlAPI}`,
    prop.api_auth,
    prop.jwt_auth,
    prop.request_user,
    async (req, res) => {
      let result = await getPagination(req.query, model, [], []);
      res.json({ success: true, ...result });
    }
  );

  prop.app.put(
    `${urlAPI}/:id`,
    prop.api_auth,
    prop.jwt_auth,
    prop.request_user,
    async (req, res) => {
      var data = ({ office_name, map_link, note, status } = req.body);
      await update(res, req, [], data, model, tital_Toast, "NA");
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
    `${urlAPI}-filter-by-area-id`,
    prop.api_auth,
    prop.jwt_auth,
    prop.request_user,
    async (req, res) => {
      const { area, id } = req.query;

      // Validate required parameters
      if (!area) {
        return res.status(400).json({
          success: false,
          message: "មិនមានទិន្នន័យនៅក្នុងប្រព័ន្ធ (area)!",
        });
      }

      if (!id) {
        return res.status(400).json({
          success: false,
          message: "មិនមានទិន្នន័យនៅក្នុងប្រព័ន្ធ (id)!",
        });
      }

      // Validate MongoDB ObjectId
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: "មិនមានទិន្នន័យនៅក្នុងប្រព័ន្ធ - មិនត្រឹមត្រូវ(id)!",
        });
      }

      try {
        // Fixed: Use area as the field name and id as the value
        const query = { [area]: id };
        const result = await model.findOne(query);

        if (!result) {
          return res.status(404).json({
            success: false,
            message: "មិនមានទិន្នន័យត្រូវបានរកឃើញ!",
          });
        }

        res.json({
          success: true,
          data: result,
          query: query, // Optional: for debugging
        });
      } catch (e) {
        console.error("Database error:", e);
        res.status(500).json({
          success: false,
          message: "កំហុសក្នុងការទាញយកទិន្នន័យ!",
        });
      }
    }
  );
};

module.exports = route;
