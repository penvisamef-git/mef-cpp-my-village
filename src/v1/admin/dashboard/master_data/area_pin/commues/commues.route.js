const baseRoute = "master-data/area-pin/commues";
const model = require("./commues.model");
const modelProvince = require("../province/province.model");
const modelDistrict = require("../disctrict/district.model");

const { dataCommues } = require("../../../../../../area/khmer/commues");

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
  const tital_Toast = "ទិន្នន័យមេ - តំបន់ប្រើប្រាស់ - សង្កាត់/ស្រុក";
  const requestRequired = [
    { key: "commues_id", label: "សង្កាត់/ស្រុក (commues_id)" },
    { key: "sqm", label: "ផ្ទែក្រឡា (sqm)" },
  ];

  prop.app.post(
    `${urlAPI}`,
    prop.api_auth,
    prop.jwt_auth,
    prop.request_user,

    async (req, res) => {
      var data = ({ commues_id, sqm, note, status } = req.body);

      if (!commues_id) {
        return res
          .status(404)
          .send({ success: false, message: "មិនមានទិន្នន័យ" });
      }

      // Check If Exist
      var exist = await model.findOne({ commues_id: commues_id });
      if (exist) {
        return res
          .status(400)
          .send({ success: false, message: "ទិន្នន័យមានរួចហើយ" });
      }

      const districts = await dataCommues();
      const rowData = districts.find((row) => row.id == commues_id);

      // Done
      var isUnfinishConnection = false;
      data.commues_data = rowData;

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

  prop.app.get(
    `${urlAPI}-full-province-district-info`,
    prop.api_auth,
    prop.jwt_auth,
    prop.request_user,
    async (req, res) => {
      var province = await modelProvince.find();
      var district = await modelDistrict.find();
      let result = await getPagination(req.query, model, [], []);
      var getData = result.data;

      var newData = [];
      getData.map((rowCommunes) => {
        province.map((rowPro) => {
          if (rowCommunes.commues_data?.province_id === rowPro?.province_id) {
            var data = {
              commune: rowCommunes,
              province: rowPro,
            };

            district.map((rowDis) => {
              if (
                rowDis?.district_id === rowCommunes?.commues_data?.district_id
              ) {
                data.district = rowDis;
              }
            });

            newData.push(data);
          }
        });
      });

      res.json({ success: true, full_data: newData, ...result });
    }
  );

  prop.app.put(
    `${urlAPI}/:id`,
    prop.api_auth,
    prop.jwt_auth,
    prop.request_user,
    async (req, res) => {
      var data = ({ commues_id, sqm, note, status } = req.body);
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
