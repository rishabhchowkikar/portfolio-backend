const { getReadme, updateReadme } = require("../utils/github");
const {
  generateNewReadme,
  parseScores,
  updateTop3,
} = require("../utils/leaderboard");

const { getAndDeleteQuizSession } = require("../utils/quizSessions");

async function submitScore(req, res, next) {
  const { name, score } = req.body;

  if (!name?.trim() || typeof score !== "number" || score < 0) {
    return res.status(400).json({
      success: false,
      error: "Name and non-negative numeric score are required",
    });
  }

  try {
    const { content, sha } = await getReadme();
    const currentScores = parseScores(content);
    const updatedTop3 = updateTop3(currentScores, {
      name: name.trim(),
      score,
    });

    const newReadme = generateNewReadme(updatedTop3);
    await updateReadme(newReadme, sha);

    res.json({
      success: true,
      leaderboard: updatedTop3,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to update leaderboard",
    });
  }
}

async function getLeaderboard(req, res, next) {
  try {
    const { content } = await getReadme();
    const scores = parseScores(content);

    res.json({
      success: true,
      leaderboard: scores,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to fetch leaderboard",
    });
  }
}

// submitting the answere

async function submitAnswers(req, res, next) {
  try {
    const { quizId, answers, name } = req.body;

    // validation
    if (
      !quizId ||
      !Array.isArray(answers) ||
      answers.length !== 10 ||
      !name ||
      typeof name !== "string" ||
      name.trim() === ""
    ) {
      return res.status(400).json({
        success: false,
        error:
          "Valid quizId, name, and array of 10 answers with questionId/ selectedIndex required",
      });
    }

    // retrive quiz data (delete session after)
    const quizData = getAndDeleteQuizSession(quizId);
    if (!quizData) {
      return res.status(404).json({
        success: false,
        error: "Invalid or expired quiz session",
      });
    }

    // calculate score
    let score = 0;
    answers.forEach((ans) => {
      const question = quizData.find((q) => q.id === ans.questionId);
      if (question && ans.selectedIndex === question._correctIndex) {
        score += 10; //
      }
    });

    // optionally submit to leaderboard
    const readmeData = await getReadme();
    const currentScores = parseScores(readmeData.content);

    const newEntry = { name: name.trim(), score };

    const top3 = updateTop3(currentScores, newEntry);

    const newReadmeContent = generateNewReadme(top3);

    await updateReadme(newReadmeContent, readmeData.sha);

    // return result
    res.json({
      success: true,
      score,
      leaderboard: top3,
    });
  } catch (error) {
    console.error("❌ Quiz submission failed:", error.message);
    res.status(500).json({
      success: false,
      error: "Failed to process quiz answers",
    });
  }
}

module.exports = {
  submitScore,
  getLeaderboard,
  submitAnswers,
};
