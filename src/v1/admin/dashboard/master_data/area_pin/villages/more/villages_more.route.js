const baseRoute = "master-data/area-pin/villages-more";
const model = require("./village_more.model");
const modelVillage = require("../villages.model");
const mongoose = require("mongoose");

const {
  post,
  getByID,
  getAll,
  update,
  remove,
  getPagination,
} = require("../../../../../../../util/request/crud");

const route = (prop) => {
  // **************** Declaration ****************SSS
  const urlAPI = `/${prop.main_route}/${baseRoute}`;
  const tital_Toast = "ទិន្នន័យមេ - តំបន់ប្រើប្រាស់ - សង្កាត់/ស្រុក ទិន្នន័យផ្សេងៗ ";
  const requestRequired = [
    { key: "village_id", label: "ក្រុម/ស្រុក (village_id)" },
    { key: "description", label: "ពណ៌នា (description)" },
  ];

  prop.app.post(
    `${urlAPI}`,
    prop.api_auth,
    prop.jwt_auth,
    prop.request_user,

    async (req, res) => {
      var data = ({ village_id, note, status } = req.body);

      if (!village_id) {
        if (!mongoose.Types.ObjectId.isValid(village_id)) {
          return res
            .status(404)
            .send({ success: false, message: "មិនមានទិន្នន័យ" });
        }
        return res
          .status(404)
          .send({ success: false, message: "មិនមានទិន្នន័យ" });
      }

      var village = await modelVillage.findOne({
        _id: village_id,
      });
      if (!village) {
        return res
          .status(404)
          .send({ success: false, message: "មិនមានទិន្នន័យ" });
      }

      // Done
      var isUnfinishConnection = false;
      data.village_data = village;
      data.are_code = {
        province_id: village.village_data.province_id,
        district_id: village.village_data.district_id,
        commune_id: village.village_data.commune_id,
        village_id: village.village_id,
      };

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
      var data = ({ village_id, count, sqm, note, status } = req.body);
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
