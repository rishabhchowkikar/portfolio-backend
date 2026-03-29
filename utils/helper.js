const he = require("he");
// Helper functions for cleaning Open Trivia DB data
function decodeHtml(html) {
  return html ? he.decode(String(html)) : "";
}

function shuffleArray(array) {
  if (!Array.isArray(array)) return [];

  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

module.exports = { decodeHtml, shuffleArray };
