const { v4: uuidv4 } = require("uuid");
const sessions = new Map();

/**
 * Creates a new quiz session and returns the quizId.
 * @param {Array} quizData - Array of question objects with _correctIndex.
 * @param {number} ttlMinutes - Time to live in minutes (default 20).
 * @returns {string} quizId
 */

/**
 * Retrieves quiz data by quizId if not expired. Deletes after retrieval (one-time use).
 * @param {string} quizId
 * @returns {Array|null} Quiz data array or null if invalid/expired.
 */
function createQuizSession(quizData, ttlMinutes = 20) {
  const quizId = uuidv4();
  const expires = Date.now() + ttlMinutes * 60 * 1000;
  sessions.set(quizId, { data: quizData, expires });
  // Auto-cleanup after TTL
  setTimeout(() => sessions.delete(quizId), ttlMinutes * 60 * 1000);
  return quizId;
}

function getAndDeleteQuizSession(quizId) {
  const session = sessions.get(quizId);
  if (!session || Date.now() > session.expires) {
    sessions.delete(quizId);
    return null;
  }
  sessions.delete(quizId); // One-time use: delete immediately after retrieval
  return session.data;
}

/**
 * Gets quiz data by quizId if not expired.
 * DOES NOT delete the session (used when fetching individual questions)
 * @param {string} quizId
 * @returns {Array|null} Quiz data array or null if invalid/expired
 */
function getQuizSession(quizId) {
  const session = sessions.get(quizId);
  if (!session || Date.now > session.expires) {
    sessions.delete(quizId);
    return null;
  }

  return session.data;
}

module.exports = { createQuizSession, getAndDeleteQuizSession, getQuizSession };
