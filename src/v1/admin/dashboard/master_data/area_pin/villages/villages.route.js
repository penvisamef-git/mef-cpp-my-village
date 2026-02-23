const baseRoute = "master-data/area-pin/villages";
const model = require("./villages.model");
const modelProvince = require("../province/province.model");
const modelDistrict = require("../disctrict/district.model");
const modelCommues = require("../commues/commues.model");
const modelVilalgeMore = require("../villages/more/village_more.model");
const mongoose = require("mongoose");
const { dataVillages } = require("../../../../../../area/khmer/villages");

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
    { key: "village_id", label: "ក្រុម/ស្រុក (village_id)" },
    { key: "sqm", label: "ផ្ទែក្រឡា (sqm)" },
    { key: "count", label: "ចំនួនទិន្នន័យ (count)" },
  ];

  prop.app.post(
    `${urlAPI}`,
    prop.api_auth,
    prop.jwt_auth,
    prop.request_user,

    async (req, res) => {
      var data = ({ village_id, sqm, count, note, status } = req.body);

      if (!village_id) {
        return res
          .status(404)
          .send({ success: false, message: "មិនមានទិន្នន័យ" });
      }

      // Check If Exist
      var exist = await model.findOne({ village_id: village_id });
      if (exist) {
        return res
          .status(400)
          .send({ success: false, message: "ទិន្នន័យមានរួចហើយ" });
      }

      const area = await dataVillages();
      const rowData = area.find((row) => row.id == village_id);

      // Done
      var isUnfinishConnection = false;
      data.village_data = rowData;

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
    `${urlAPI}-with-more/:id`, // optional ":id"
    prop.api_auth,
    prop.jwt_auth,
    prop.request_user,
    async (req, res) => {
      try {
        const { id } = req.params;

        if (id) {
          // ✅ Validate ID
          if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
              success: false,
              message: "មិនមានទិន្នន័យនៅក្នុងប្រព័ន្ធ!",
            });
          }

          const unit = await model.findOne({
            _id: id,
            deleted: false,
          });

          if (!unit) {
            return res.status(404).json({
              success: false,
              message: notFoundData,
            });
          }

          var moreVilalge = await modelVilalgeMore.find({ village_id: id });
          var more = [];
          if (moreVilalge) {
            more = moreVilalge;
          }

          return res
            .status(200)
            .json({ success: true, data: unit, more: more });
        }
      } catch (err) {
        res.status(500).json({
          success: false,
          message: "Internal Error",
          message: `មានបញ្ហាក្នុងប្រព័ន្ធសូមព្យាយាមម្តងទៀតពេលក្រោយ: ${err}`,
        });
      }
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

  prop.app.get(
    `${urlAPI}-full-province-district-communes-info`,
    prop.api_auth,
    prop.jwt_auth,
    prop.request_user,
    async (req, res) => {
      var province = await modelProvince.find();
      var district = await modelDistrict.find();
      var communes = await modelCommues.find();

      let result = await getPagination(req.query, model, [], []);
      var getData = result.data;

      var newData = [];
      getData.map((rowVillages) => {
        province.map((rowPro) => {
          if (rowVillages.village_data?.province_id === rowPro?.province_id) {
            var data = {
              village: rowVillages,
              province: rowPro,
            };

            district.map((rowDis) => {
              if (
                rowDis?.district_id === rowVillages?.village_data?.district_id
              ) {
                data.district = rowDis;
              }
            });

            communes.map((rowCom) => {
              if (
                rowCom?.commues_id === rowVillages?.village_data?.commune_id
              ) {
                data.communes = rowCom;
              }
            });

            newData.push(data);
          }
        });
      });

      res.json({ success: true, full_data: newData, ...result });
    }
  );

  prop.app.get(
    `${urlAPI}-data-root-province-district-communes`,
    prop.api_auth,
    prop.jwt_auth,
    prop.request_user,
    async (req, res) => {
      const { village_id } = req.query;

      if (!village_id) {
        if (!mongoose.Types.ObjectId.isValid(village_id)) {
          return res.status(400).json({
            success: false,
            message: "Invalid village_id!",
          });
        }
        return res
          .status(404)
          .send({ success: false, message: "មិនមានទិន្នន័យ" });
      }

      var village = await model.findOne({
        _id: village_id,
      });

      if (!village) {
        return res
          .status(404)
          .send({ success: false, message: "មិនមានទិន្នន័យ" });
      }

      var communes = await modelCommues.findOne({
        commues_id: village.village_data.commune_id,
      });

      var district = await modelDistrict.findOne({
        district_id: village.village_data.district_id,
      });

      var province = await modelProvince.findOne({
        province_id: village.village_data.province_id,
      });

      return res.send({
        success: true,
        data: {
          village: village,
          communes: communes,
          district: district,
          province: province,
        },
      });
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
