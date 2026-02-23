const baseRoute = "master-data/area-pin/get-all";
const modelProvince = require("../province/province.model");
const modelDistrict = require("../disctrict/district.model");
const modelCommue = require("../commues/commues.model");
const modelVillage = require("../villages/villages.model");

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

  prop.app.get(
    `${urlAPI}`,
    prop.api_auth,
    prop.jwt_auth,
    prop.request_user,
    async (req, res) => {
      const dataProvince = await modelProvince.find({ deleted: false });
      const dataDisctrict = await modelDistrict.find({ deleted: false });
      const dataCommues = await modelCommue.find({ deleted: false });
      const dataVillage = await modelVillage.find({ deleted: false });
      res.status(200).send({
        success: true,
        data: { dataProvince, dataDisctrict, dataCommues, dataVillage },
      });
    }
  );
};

module.exports = route;
