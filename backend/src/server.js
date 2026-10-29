require("dotenv").config();

const express = require("express");
const cors = require("cors");

const app = express();

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
  })
);

app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "CampusDine API is running",
    status: "success",
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    status: "healthy",
    service: "CampusDine Backend",
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`CampusDine backend running at http://localhost:${PORT}`);
});