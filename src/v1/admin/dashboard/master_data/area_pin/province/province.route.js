const baseRoute = "master-data/area-pin/province";
const model = require("./province.model");
const {
  dataCityProvince,
} = require("../../../../../../area/khmer/province_and_city");

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
  const tital_Toast = "ទិន្នន័យមេ - តំបង់ប្រើប្រាស់ - ក្រុងនិងខេត្ត";
  const requestRequired = [
    { key: "province_id", label: "ក្រុងនិងខេត្ត (province_id)" },
    { key: "sqm", label: "ផ្ទែក្រឡា (sqm)" },
  ];

  prop.app.post(
    `${urlAPI}`,
    prop.api_auth,
    prop.jwt_auth,
    prop.request_user,

    async (req, res) => {
      var data = ({ province_id, sqm, note, status } = req.body);

      if (!province_id) {
        return res
          .status(404)
          .send({ success: false, message: "មិនមានទិន្នន័យ" });
      }

      // Check If Exist
      var exist = await model.findOne({ province_id: province_id });
      if (exist) {
        return res
          .status(400)
          .send({ success: false, message: "ទិន្នន័យមានរួចហើយ" });
      }

      // Check In List
      const provinces = await dataCityProvince();
      const province = provinces.find((row) => row.id == province_id);

      if (!province) {
        return res
          .status(404)
          .send({ success: false, message: "មិនមានទិន្នន័យ" });
      }

      // Done
      var isUnfinishConnection = false;
      data.province_data = province;
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
      var data = ({ province_id, sqm, note, status } = req.body);
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
