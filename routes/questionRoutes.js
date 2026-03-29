const express = require("express");
// const { getQuestions } = require("../controllers/questionController");

const {
  getSingleQuestion,
  startQuiz,
} = require("../controllers/questionController");
const router = express.Router();

// Start a new quiz session (only return quizid + total)
router.get("/quiz/start", startQuiz);

// get one specific question
router.get("/quiz/question/:quizId/:number", getSingleQuestion);
// router.get("/questions", getQuestions);

module.exports = router;
