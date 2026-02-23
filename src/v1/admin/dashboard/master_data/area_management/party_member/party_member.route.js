const baseRoute = "area-management/party-member";
const model = require("../../../../dashboard/area_management/party-member");
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
  const tital_Toast = "គ្រប់គ្រងតំបន់ - ប្រជាពលរដ្ឋ";
  const requestRequired = [
    { key: "firstname", label: "នាម (firstname)" },
    { key: "lastname", label: "ក្តោនាម (lastname)" },
    {
      key: "family_system_number",
      label: "លេខកូដគ្រួសារ (family_system_number)",
    },
    {
      key: "sex",
      label: "ភេទ (sex)",
    },

    {
      key: "dob",
      label: "ថ្ងៃខែឆ្នាំកំណើត (dob)",
    },

    {
      key: "date_joined_party",
      label: "ថ្ងៃចូលបក្ស (date_joined_party)",
    },

    {
      key: "party_leader",
      label: "ក្រុមបក្សទី (party_leader)",
    },

    {
      key: "party_sub_leader",
      label: "អនុសាខាទី (party_sub_leader)",
    },

    {
      key: "education_level_id",
      label: "កម្រិតវប្បធម៌ (education_level_id)",
    },

    {
      key: "job_name_id",
      label: "ការងារ (job_name_id)",
    },

    {
      key: "province_id",
      label: "ក្រុង/ខេត្ត (province_id)",
    },

    {
      key: "district_id",
      label: "ខណ្ធ/ស្រុក (district_id)",
    },

    {
      key: "commune_id",
      label: "សង្កាត់/ឃុំ (commune_id)",
    },

    {
      key: "village_id",
      label: "ក្រុម/ឃុំ (village_id)",
    },
  ];

  prop.app.post(
    `${urlAPI}`,
    prop.api_auth,
    prop.jwt_auth,
    prop.request_user,

    async (req, res) => {
      var data = ({ name, note, status } = req.body);
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
      var data = ({ name, note, status } = req.body);
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
