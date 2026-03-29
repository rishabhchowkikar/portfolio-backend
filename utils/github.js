const axios = require("axios");

async function getReadme() {
  try {
    const response = await axios.get(
      `https://api.github.com/repos/${process.env.OWNER}/${process.env.REPO}/contents/README.md`,
      {
        headers: {
          Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
          Accept: "application/vnd.github.v3+json",
        },
      },
    );

    const content = Buffer.from(response.data.content, "base64").toString(
      "utf-8",
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
      },
    );

    console.log("✓ Leaderboard updated successfully");
  } catch (error) {
    console.error("❌ PUT README failed");
    console.error("Status:", error.response?.status);
    console.error("Message:", error.response?.data?.message || error.message);
    throw error;
  }
}

module.exports = {
  getReadme,
  updateReadme,
};
