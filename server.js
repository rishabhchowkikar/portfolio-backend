const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const scoreRoutes = require("./routes/scoreRoutes");
const questionRoutes = require("./routes/questionRoutes");

dotenv.config();

const app = express();
app.use(express.json());
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true); // Postman / curl

      if (
        origin.startsWith("http://localhost") ||
        origin.startsWith("http://127.0.0.1")
      ) {
        return callback(null, true);
      }

      callback(new Error("Not allowed by CORS"));
    },
  }),
);

// ──────────────────────────────────────────────
// Configuration check (helps debugging)
console.log("Starting with config:");
console.log("OWNER:", process.env.OWNER);
console.log("REPO: ", process.env.REPO);
console.log("BRANCH:", process.env.BRANCH || "main");
// ──────────────────────────────────────────────

// use routes
app.use(scoreRoutes);
app.use(questionRoutes);

// Simple health check
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    version: "v1.0",
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
