const baseRoute = "challenge/type";
const model = require("./type.model");
const modelVillage = require("../../master_data/area_pin/villages/villages.model");
const modelCommues = require("../../master_data/area_pin/commues/commues.model");
const modelDistrict = require("../../master_data/area_pin/disctrict/district.model");
const modelProvince = require("../../master_data/area_pin/province/province.model");
const mongoose = require("mongoose");

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
  const tital_Toast = "បញ្ហាប្រឈម - ប្រភេទ";
  const requestRequired = [
    { key: "type_name", label: "ឈ្មោះប្រភេទបញ្ហាប្រឈម (type_name)" },
  ];

  prop.app.post(
    `${urlAPI}`,
    prop.api_auth,
    prop.jwt_auth,
    prop.request_user,

    async (req, res) => {
      var data = ({ type_name, village_id, note, status } = req.body);

      if (!village_id) {
        if (!mongoose.Types.ObjectId.isValid(village_id)) {
          return res.status(400).json({
            success: false,
            message: "មិនមានទិន្នន័យភូមិ!",
          });
        }
      }

      if (village_id == "") {
        return res.status(400).json({
          success: false,
          message: "មិនមានទិន្នន័យភូមិ!",
        });
      }

      const village = await modelVillage.findOne({
        _id: village_id,
        deleted: false,
      });

      if (!village) {
        return res.status(400).json({
          success: false,
          message: "មិនមានទិន្នន័យភូមិ!",
        });
      }

      // prepare id
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

  prop.app.delete(
    `${urlAPI}/:id`,
    prop.api_auth,
    prop.jwt_auth,
    prop.request_user,
    async (req, res) => {
      await remove(res, req, model, tital_Toast, "NA");
    }
  );
};

module.exports = route;
