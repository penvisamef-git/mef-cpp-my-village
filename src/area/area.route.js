const baseRoute = "khmer-area";
const { dataCityProvince } = require("./khmer/province_and_city");
const { dataDistrict } = require("./khmer/district");
const { dataCommues } = require("./khmer/commues");
const { dataVillages } = require("./khmer/villages");
const route = (prop) => {
  // **************** Declaration ****************
  const urlAPI = `/${prop.main_route}/${baseRoute}`;

  prop.app.get(
    `${urlAPI}/city-province`,
    prop.api_auth,
    prop.jwt_auth,
    prop.request_user,
    async (req, res) => {
      try {
        const provinces = await dataCityProvince(); // Always load the data
        const id = req.query.id; // ✅ Get ID from query parameters

        if (!id) {
          // Return all provinces
          return res.send({ success: true, data: provinces });
        }

        // Find specific province by ID
        const province = provinces.find((row) => row.id == id);

        if (province) {
          return res.send({ success: true, data: province });
        } else {
          return res
            .status(404)
            .send({ success: false, message: "Province or City not found." });
        }
      } catch (err) {
        console.error("Error fetching provinces:", err);
        res
          .status(500)
          .send({ success: false, message: "Internal server error." });
      }
    }
  );

  prop.app.get(
    `${urlAPI}/district/`,
    prop.api_auth,
    prop.jwt_auth,
    prop.request_user,
    async (req, res) => {
      try {
        const district = await dataDistrict(); // Always load the data
        const province_id = req.query.province_id; // ✅ Get ID from query parameters

        if (!province_id) {
          return res.send({
            success: false,
            data: "Please enter province_id!",
          });
        }

        const data = district.filter((row) => row.province_id == province_id);
        return res.send({ success: true, count: data.length, data: data });
      } catch (err) {
        console.error("Error fetching district:", err);
        res
          .status(500)
          .send({ success: false, message: "Internal server error." });
      }
    }
  );

  prop.app.get(
    `${urlAPI}/commues/`,
    prop.api_auth,
    prop.jwt_auth,
    prop.request_user,
    async (req, res) => {
      try {
        const province_id = req.query.province_id;
        const district_id = req.query.district_id;

        const communes = await dataCommues(); // Load all commune data

        // Optional filtering logic (example)
        let filteredData = communes;

        if (province_id) {
          filteredData = filteredData.filter(
            (row) => row.province_id == province_id
          );
        }

        if (district_id) {
          filteredData = filteredData.filter(
            (row) => row.district_id == district_id
          );
        }

        res.send({
          success: true,
          count: filteredData.length,
          data: filteredData,
        });
      } catch (err) {
        console.error("Error fetching communes:", err);
        res
          .status(500)
          .send({ success: false, message: "Internal server error." });
      }
    }
  );

  prop.app.get(
    `${urlAPI}/villages/`,
    prop.api_auth,
    prop.jwt_auth,
    prop.request_user,
    async (req, res) => {
      try {
        const province_id = req.query.province_id;
        const district_id = req.query.district_id;
        const commune_id = req.query.commune_id;

        const communes = await dataVillages();

        // Optional filtering logic (example)
        let filteredData = communes;

        if (province_id) {
          filteredData = filteredData.filter(
            (row) => row.province_id == province_id
          );
        }

        if (district_id) {
          filteredData = filteredData.filter(
            (row) => row.district_id == district_id
          );
        }

        if (commune_id) {
          filteredData = filteredData.filter(
            (row) => row.commune_id == commune_id
          );
        }

        res.send({
          success: true,
          count: filteredData.length,
          data: filteredData,
        });
      } catch (err) {
        console.error("Error fetching communes:", err);
        res
          .status(500)
          .send({ success: false, message: "Internal server error." });
      }
    }
  );
};

module.exports = route;
