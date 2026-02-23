const baseRoute = "master-data/education-level";
const model = require("./education_level.model");
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
  const tital_Toast = "ទិន្នន័យមេ - កម្រិតវប្បធម៌";
  const requestRequired = [
    {
      key: "name",
      label: "កម្រិតវប្បធម៌ (title_education)",
    },
    {
      key: "education_type_id",
      label: "ប្រភេទកម្រិតសិក្សា (education_type_id)",
    },
  ];

  prop.app.post(
    `${urlAPI}`,
    prop.api_auth,
    prop.jwt_auth,
    prop.request_user,

    async (req, res) => {
      var data = ({ name, education_type_id, note, status } = req.body);

      // Check ID
      if (education_type_id) {
        if (!mongoose.Types.ObjectId.isValid(education_type_id)) {
          return res.status(400).json({
            success: false,
            message: "មិនមានទិន្នន័យប្រភេទកម្រិតសិក្សា!",
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
      let result = await getPagination(
        req.query,
        model,
        ["education_type_id"],
        []
      );
      res.json({ success: true, ...result });
    }
  );

  prop.app.put(
    `${urlAPI}/:id`,
    prop.api_auth,
    prop.jwt_auth,
    prop.request_user,
    async (req, res) => {
      var data = ({ name, education_type_id, note, status } = req.body);
      await update(res, req, [], data, model, "ទិន្នន័យមេ - ការងារ", "NA");
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
