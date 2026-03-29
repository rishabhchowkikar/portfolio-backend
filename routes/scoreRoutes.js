const express = require("express");
const {
  getLeaderboard,
  submitScore,
  submitAnswers,
} = require("../controllers/scoreController");

const router = express.Router();

router.post("/submit-score", submitScore);
router.get("/leaderboard", getLeaderboard);

// submit routes
router.post("/submit-answers", submitAnswers);

module.exports = router;
