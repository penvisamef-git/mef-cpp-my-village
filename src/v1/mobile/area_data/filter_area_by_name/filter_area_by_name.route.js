const baseRoute = "app/area-management/filter-area-by-name";
const modelProvince = require("../../../admin/dashboard/master_data/area_pin/province/province.model");
const modelDistrict = require("../../../admin/dashboard/master_data/area_pin/disctrict/district.model");
const modelCommue = require("../../../admin/dashboard/master_data/area_pin/commues/commues.model");
const modelVillage = require("../../../admin/dashboard/master_data/area_pin/villages/villages.model");

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
    `${urlAPI}/province/:name`,
    prop.api_auth,
    prop.jwt_auth,
    prop.request_user,
    async (req, res) => {
      const { name } = req.params;
      const listprovince = await modelProvince.find();

      // Combine name_km fields and find the matching province
      const found = listprovince.find((row) => {
        const nameLocal =
          row.province_data?.administrative_unit?.name_km +
          row.province_data?.name_km;
        return nameLocal === name;
      });

      if (found) {
        return res.status(200).json({ success: true, data: found });
      }

      return res.status(400).json({
        success: false,
        data: "មិនមានទិន្នន័យ!",
      });
    }
  );

  prop.app.get(
    `${urlAPI}/district/:name`,
    prop.api_auth,
    prop.jwt_auth,
    prop.request_user,
    async (req, res) => {
      const { name } = req.params;
      const list = await modelDistrict.find();

      // Combine name_km fields and find the matching province
      const found = list.find((row) => {
        const nameLocal =
          row.district_data?.administrative_unit?.name_km +
          row.district_data?.name_km;
        return nameLocal === name;
      });

      if (found) {
        return res.status(200).json({ success: true, data: found });
      }

      return res.status(400).json({
        success: false,
        data: "មិនមានទិន្នន័យ!",
      });
    }
  );

  prop.app.get(
    `${urlAPI}/commue/:name`,
    prop.api_auth,
    prop.jwt_auth,
    prop.request_user,
    async (req, res) => {
      const { name } = req.params;
      const list = await modelCommue.find();

      // Combine name_km fields and find the matching province
      const found = list.find((row) => {
        const nameLocal =
          row.commues_data?.administrative_unit?.name_km +
          row.commues_data?.name_km;
        return nameLocal === name;
      });

      if (found) {
        return res.status(200).json({ success: true, data: found });
      }

      return res.status(400).json({
        success: false,
        data: "មិនមានទិន្នន័យ!",
      });
    }
  );

  prop.app.get(
    `${urlAPI}/village/:name`,
    prop.api_auth,
    prop.jwt_auth,
    prop.request_user,
    async (req, res) => {
      const { name } = req.params;
      const list = await modelVillage.find();

      // Combine name_km fields and find the matching province
      const found = list.find((row) => {
        const nameLocal =
          row.village_data?.administrative_unit?.name_km +
          row.village_data?.name_km;
        return nameLocal === name;
      });

      if (found) {
        return res.status(200).json({ success: true, data: found });
      }

      return res.status(400).json({
        success: false,
        data: "មិនមានទិន្នន័យ!",
      });
    }
  );
};

module.exports = route;
