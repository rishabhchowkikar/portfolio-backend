const express = require("express");
const axios = require("axios");
const dotenv = require("dotenv");

dotenv.config();

const app = express();
app.use(express.json()); // built-in, recommended over body-parser in newer express

// ──────────────────────────────────────────────
// Configuration check (helps debugging)
console.log("Starting with config:");
console.log("OWNER:", process.env.OWNER);
console.log("REPO: ", process.env.REPO);
console.log("BRANCH:", process.env.BRANCH || "main");
console.log("Token length:", process.env.GITHUB_TOKEN?.length || 0);
// ──────────────────────────────────────────────

async function getReadme() {
  try {
    const response = await axios.get(
      `https://api.github.com/repos/${process.env.OWNER}/${process.env.REPO}/contents/README.md`,
      {
        headers: {
          Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
          Accept: "application/vnd.github.v3+json",
        },
      }
    );

    const content = Buffer.from(response.data.content, "base64").toString(
      "utf-8"
    );

    return {
      content,
      sha: response.data.sha,
    };
  } catch (error) {
    console.error("❌ GET README failed");
    console.error("Status:", error.response?.status);
    console.error("Message:", error.response?.data?.message || error.message);
    throw error;
  }
}

function parseScores(readmeContent) {
  const lines = readmeContent.split("\n");
  const scores = [];

  for (const line of lines) {
    const match = line.match(/^\d\.\s*(.+?)\s*:\s*(\d+)/);
    if (match) {
      const [, name, scoreStr] = match;
      const score = Number(scoreStr.trim());
      if (!isNaN(score)) {
        scores.push({ name: name.trim(), score });
      }
    }
  }

  return scores;
}

function updateTop3(currentScores, newEntry) {
  const all = [...currentScores, newEntry];
  all.sort((a, b) => b.score - a.score);
  return all.slice(0, 3);
}

function generateNewReadme(top3) {
  const lines = top3.map((p, i) => `${i + 1}. ${p.name} : ${p.score}`);

  // Keep some spacing/padding if list is short
  while (lines.length < 3) {
    lines.push(`${lines.length + 1}. --- : 0`);
  }

  return `# 🏆 MCQ Game Leaderboard

## Top 3 Players

${lines.join("\n")}`;
}

async function updateReadme(newContent, sha) {
  try {
    await axios.put(
      `https://api.github.com/repos/${process.env.OWNER}/${process.env.REPO}/contents/README.md`,
      {
        message: "Update leaderboard - new score submitted",
        content: Buffer.from(newContent).toString("base64"),
        sha: sha,
        branch: process.env.BRANCH || "main",
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
          Accept: "application/vnd.github.v3+json",
        },
      }
    );

    console.log("✓ Leaderboard updated successfully");
  } catch (error) {
    console.error("❌ PUT README failed");
    console.error("Status:", error.response?.status);
    console.error("Message:", error.response?.data?.message || error.message);
    throw error;
  }
}

// ──────────────────────────────────────────────
// Routes
// ──────────────────────────────────────────────

app.post("/submit-score", async (req, res) => {
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
});

app.get("/leaderboard", async (req, res) => {
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
});

// Simple health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log("Ready to accept score submissions!");
});
