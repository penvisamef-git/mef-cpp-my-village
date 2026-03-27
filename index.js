const express = require("express");
const connectDB = require("./src/util/db");
const helmet = require("helmet");
const cors = require("cors");
const app = express();
const jwt = require("jsonwebtoken");
const PORT = process.env.api_port || 8085;
const { api_auth } = require("./src/util/api_auth");
const { jwt_auth } = require("./src/util/jwt_auth");
const request_user = require("./src/util/request_user");

app.use(cors());
app.use(express.json());
app.use(helmet());
app.use(express.urlencoded({ extended: true }));

// ================= Connection =================
(connectDB(),
  app.get("/", (req, res) => {
    api_auth(req, res, () => {
      res.send({
        success: true,
        message: "API Connected",
      });
    });
  }));

// Prop Object
const prop = {
  app: app,
  jwt: jwt,
  api_auth: api_auth,
  jwt_auth: jwt_auth,
  request_user: request_user,
};

const adminAPI_V1 = require("./src/v1/admin/index.route");
adminAPI_V1(prop);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

module.exports = app;
