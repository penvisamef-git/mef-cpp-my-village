const express = require("express");
const connectDB = require("../src/util/db");
const helmet = require("helmet");
const cors = require("cors");
const app = express();
const jwt = require("jsonwebtoken");
const { api_auth } = require("../src/util/api_auth");
const { jwt_auth } = require("../src/util/jwt_auth");
const request_user = require("../src/util/request_user");

// Middleware
app.use(cors());
app.use(express.json());
app.use(helmet());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get("/", (req, res) => {
  res.send({
    success: true,
    message: "API Connected",
  });
});

// Prop Object
const prop = {
  app: app,
  jwt: jwt,
  api_auth: api_auth,
  jwt_auth: jwt_auth,
  request_user: request_user,
};

// Load routes
const adminAPI_V1 = require("../src/v1/admin/index.route");
adminAPI_V1(prop);

// // Connect to database
// connectDB().catch((err) => {
//   console.error("Database connection failed:", err);
// });

// Export for Vercel
module.exports = app;
