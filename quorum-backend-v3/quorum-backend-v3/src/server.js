require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const connectDB = require("./config/db");

// Route imports
const messageRoutes = require("./routes/messages");
const caseRoutes = require("./routes/cases");
const staffRoutes = require("./routes/staff");
const trendRoutes = require("./routes/trends");
const batchRoutes = require("./routes/batch");
const dashboardRoutes = require("./routes/dashboard");
const orchestrationRoutes = require("./routes/orchestration");
const ingestRoutes = require("./routes/ingest");

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_ORIGIN || "http://localhost:3000" }));
app.use(morgan("dev"));
app.use(express.json({ limit: "50mb" }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api/", limiter);

// Routes
app.use("/api/messages", messageRoutes);
app.use("/api/cases", caseRoutes);
app.use("/api/staff", staffRoutes);
app.use("/api/trends", trendRoutes);
app.use("/api/batch", batchRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/orchestrate", orchestrationRoutes);
app.use("/api/ingest", ingestRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Internal server error" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Quorum API running on port ${PORT}`);
});

module.exports = app;
