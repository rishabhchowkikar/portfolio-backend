// parsing the score
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

// updating top 3
function updateTop3(currentScores, newEntry) {
  const all = [...currentScores, newEntry];
  all.sort((a, b) => b.score - a.score);
  return all.slice(0, 3);
}

// generating new readme
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

module.exports = {
  parseScores,
  generateNewReadme,
  updateTop3,
};
