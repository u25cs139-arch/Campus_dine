require("dotenv").config();

const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 5000;

// ================================
// MIDDLEWARE
// ================================

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
  })
);

app.use(express.json());

// ================================
// HEALTH CHECK
// ================================

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "CampusDine Backend API is running!",
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "CampusDine API is healthy",
    timestamp: new Date().toISOString(),
  });
});

// ================================
// QUERY LAB ROUTES
// ================================

const queryLabRoutes = require("./routes/queryLab");

app.use("/api/query-lab", queryLabRoutes);

// ================================
// 404 HANDLER
// ================================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// ================================
// GLOBAL ERROR HANDLER
// ================================

app.use((err, req, res, next) => {
  console.error("Server error:", err);

  res.status(500).json({
    success: false,
    error: "Internal server error",
  });
});

// ================================
// START SERVER
// ================================

app.listen(PORT, () => {
  console.log("------------------------------------");
  console.log(" CampusDine Backend Started");
  console.log("------------------------------------");
  console.log(`Server: http://localhost:${PORT}`);
  console.log(`Health: http://localhost:${PORT}/api/health`);
  console.log(`Query Lab: http://localhost:${PORT}/api/query-lab/menu`);
  console.log("------------------------------------");
});
app.listen(PORT, () => {
  console.log("CampusDine Backend Started");
  console.log(`Server: http://localhost:${PORT}`);
  console.log(`Health: http://localhost:${PORT}/api/health`);
});