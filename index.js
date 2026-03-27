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
const mongoose = require("mongoose");

// Middleware
app.use(cors());
app.use(express.json());
app.use(helmet());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint (no DB required)
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

app.get("/", (req, res) => {
  api_auth(req, res, () => {
    res.send({
      success: true,
      message: "API Connected",
    });
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("Global error:", err);
  res.status(500).json({
    success: false,
    message: "Internal server error",
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
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

// Async function to initialize routes after DB connection
const initializeApp = async () => {
  try {
    // Connect to MongoDB
    await connectDB();
    console.log("✅ MongoDB connected");

    // Load routes after DB is connected
    const adminAPI_V1 = require("./src/v1/admin/index.route");
    adminAPI_V1(prop);

    console.log("✅ Routes initialized");
  } catch (error) {
    console.error("❌ Failed to initialize app:", error);
    // Don't crash, just log the error
  }
};

// Initialize app
initializeApp();

// For Vercel - export the app
module.exports = app;

// For local development
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}
