const axios = require("axios");
const { decodeHtml, shuffleArray } = require("../utils/helper");
const { createQuizSession, getQuizSession } = require("../utils/quizSessions");

const OPENTDB_API = "https://opentdb.com/api.php";

async function startQuiz(req, res) {
  try {
    const response = await axios.get(OPENTDB_API, {
      params: {
        amount: 10,
        category: 18, // Science: Computers
        type: "multiple",
      },
    });

    const results = response.data.results;
    if (!results || results.length === 0) {
      return res.status(503).json({
        success: false,
        message: "No questions available from Open Trivia DB right now",
      });
    }

    // Prepare internal data (with correct answers stored)
    const internalQuizData = results.map((q, index) => {
      const question = decodeHtml(q.question);
      const correct = decodeHtml(q.correct_answer);
      const incorrect = q.incorrect_answers.map(decodeHtml);
      const options = shuffleArray([correct, ...incorrect]);
      const correctIndex = options.indexOf(correct);

      return {
        id: index + 1,
        question,
        options,
        _correctIndex: correctIndex,
      };
    });

    const quizId = createQuizSession(internalQuizData);

    res.json({
      success: true,
      quizId,
      total: 10,
    });
  } catch (error) {
    console.error("❌ Open Trivia DB fetch failed:", error.message);

    let status = 500;
    let message = "Failed to start quiz";

    if (error.response) {
      status = error.response.status;
      if (status === 429) message = "Rate limit exceeded - try again later";
      else if (status === 404) message = "Invalid API parameters";
      else if (status >= 500) message = "Trivia service is having issues";
    }

    res.status(status).json({
      success: false,
      error: message,
    });
  }
}

async function getSingleQuestion(req, res) {
  const { quizId, number } = req.params;
  const qNumber = parseInt(number, 10);

  if (isNaN(qNumber) || qNumber < 1) {
    return res.status(400).json({
      success: false,
      error: "Invalid question number",
    });
  }

  const quizData = getQuizSession(quizId);

  if (!quizData) {
    return res.status(404).json({
      success: false,
      error: "Quiz session not found or expired",
    });
  }

  if (qNumber > quizData.length) {
    return res.status(404).json({
      success: false,
      error: "Question number out of range",
    });
  }

  const q = quizData[qNumber - 1];

  res.json({
    success: true,
    question: {
      id: q.id,
      question: q.question,
      options: q.options,
    },
  });
}

module.exports = {
  startQuiz,
  getSingleQuestion,
};
