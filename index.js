const express = require("express");
const connectDB = require("./src/util/db");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const cors = require("cors");
const app = express();
const jwt = require("jsonwebtoken");
const PORT = process.env.api_port || 8085;
const { api_auth } = require("./src/util/api_auth");
const { jwt_auth } = require("./src/util/jwt_auth");
const request_user = require("./src/util/request_user");
const https = require("https");
const mongoose = require("mongoose");

// app.use(
//   rateLimit({
//     windowMs: 15 * 60 * 1000,
//     max: 100,
//     message: "Too many requests",
//   })
// );
app.use(cors());
app.use(express.json());
app.use(helmet());
app.use(express.urlencoded({ extended: true }));
// app.use(express.json({ limit: "1kb" }));
// app.use(
//   cors({
//     origin: ["http://localhost:3000", "*"],
//     methods: ["GET", "POST", "PUT", "DELETE"],
//     credentials: true,
//   })
// );

//  ================= Connection =================
(connectDB(),
  app.get("/", (req, res) => {
    api_auth(req, res, () => {
      res.send({
        success: true,
        message: "API Connected",
      });
    });
  }));





// Routes
app.get("/", (req, res) => {
  res.send("Hello World ----- 888888888 ------");
});

app.get("/about", (req, res) => {
  res.json({
    message: "This is About Page",
  });
});


const prop = {
    app :app
}


// Start Server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
