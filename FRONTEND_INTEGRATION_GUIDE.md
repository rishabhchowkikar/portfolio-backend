# 🎮 Frontend Integration Guide - Quiz Backend

This document explains how to integrate your frontend with the Portfolio Backend API for the MCQ Quiz game. It covers all endpoints, data formats, request/response structures, and implementation examples.

---

## Table of Contents

1. [Overview](#overview)
2. [Base URL & Configuration](#base-url--configuration)
3. [API Endpoints](#api-endpoints)
   - [1. Get Questions](#1-get-questions)
   - [2. Submit Answers](#2-submit-answers)
   - [3. Get Leaderboard](#3-get-leaderboard)
   - [4. Submit Score](#4-submit-score)
   - [5. Health Check](#5-health-check)
4. [Frontend Implementation Flow](#frontend-implementation-flow)
5. [Data Models](#data-models)
6. [Error Handling](#error-handling)
7. [Complete Example](#complete-example)

---

## Overview

The backend provides a complete quiz system that:

✅ **Fetches 10 multiple-choice computer science trivia questions** from Open Trivia Database  
✅ **Validates answers** against correct answers  
✅ **Calculates scores** (10 points per correct answer)  
✅ **Manages a GitHub-based leaderboard** for top 3 scores  
✅ **Stores quiz sessions** temporarily for answer validation

---

## Base URL & Configuration

```javascript
// Development
const API_BASE_URL = "http://localhost:3000";

// Production (replace with your deployed URL)
const API_BASE_URL = "https://your-backend-url.com";

// All requests use JSON
const headers = {
  "Content-Type": "application/json",
};
```

---

## API Endpoints

### 1. Get Questions

**Start a new quiz and fetch all 10 questions**

#### Request

```http
GET /questions
Content-Type: application/json
```

```javascript
// JavaScript/Fetch Example
const fetchQuestions = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/questions`);
    const data = await response.json();

    if (data.success) {
      console.log("Quiz ID:", data.quizId);
      console.log("Total Questions:", data.total);
      console.log("Questions:", data.questions);
      return data;
    } else {
      console.error("Error:", data.error);
    }
  } catch (error) {
    console.error("Network error:", error);
  }
};
```

#### Response (Success - 200)

```json
{
  "success": true,
  "quizId": "session_1234567890",
  "total": 10,
  "questions": [
    {
      "id": 1,
      "question": "What does CPU stand for?",
      "options": [
        "Central Processing Unit",
        "Computer Personal Unit",
        "Central Program Utility",
        "Computer Processing Union"
      ]
    },
    {
      "id": 2,
      "question": "Which programming language is known for web development?",
      "options": ["JavaScript", "Assembly", "COBOL", "Fortran"]
    }
    // ... 8 more questions
  ]
}
```

#### Response (Error - 503)

```json
{
  "success": false,
  "message": "No questions available from Open Trivia DB right now"
}
```

#### Key Points

- ⚠️ **Save the `quizId`** - You'll need it when submitting answers
- 📝 **Options are already shuffled** - Correct answer position is randomized
- 🔄 **Session expires** - Quiz session is valid for a limited time
- ❓ **10 questions always** - Exactly 10 computer science trivia questions

---

### 2. Submit Answers

**Submit quiz answers and get the score + updated leaderboard**

#### Request

```http
POST /submit-answers
Content-Type: application/json
```

```javascript
// JavaScript Example
const submitAnswers = async (quizId, answers, playerName) => {
  try {
    const response = await fetch(`${API_BASE_URL}/submit-answers`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        quizId: quizId, // From /questions response
        name: playerName, // Player's name for leaderboard
        answers: answers, // Array of answer objects
      }),
    });

    const data = await response.json();

    if (data.success || data.score !== undefined) {
      console.log("Score:", data.score);
      console.log("Leaderboard:", data.leaderboard);
      return data;
    } else {
      console.error("Error:", data.error);
    }
  } catch (error) {
    console.error("Network error:", error);
  }
};
```

#### Request Body Structure

```json
{
  "quizId": "session_1234567890",
  "name": "John Doe",
  "answers": [
    {
      "questionId": 1,
      "selectedIndex": 0
    },
    {
      "questionId": 2,
      "selectedIndex": 2
    },
    {
      "questionId": 3,
      "selectedIndex": 1
    }
    // ... up to 10 answers
  ]
}
```

#### Answer Object Explanation

```javascript
{
  "questionId": 1,           // ID of the question (1-10)
  "selectedIndex": 0         // Index of selected option (0-3)
                            // Must match one of the options array indices
}
```

#### Example Implementation in Frontend

```javascript
// Store user selections
const userAnswers = [
  { questionId: 1, selectedIndex: 0 }, // User selected option 0
  { questionId: 2, selectedIndex: 2 }, // User selected option 2
  { questionId: 3, selectedIndex: 1 }, // User selected option 1
  // ... continue for all 10 questions
];

// Submit to backend
const result = await submitAnswers(quizId, userAnswers, "John");
```

#### Response (Success - 200)

```json
{
  "success": false,
  "score": 70,
  "leaderboard": [
    {
      "name": "John Doe",
      "score": 70,
      "rank": 1
    },
    {
      "name": "Jane Smith",
      "score": 80,
      "rank": 2
    },
    {
      "name": "Bob Johnson",
      "score": 60,
      "rank": 3
    }
  ]
}
```

#### Response (Error - 400)

```json
{
  "success": false,
  "error": "Valid quizId, name, and array of 10 answers with questionId/selectedIndex required"
}
```

#### Response (Error - 404)

```json
{
  "success": false,
  "error": "Invalid or expired quiz session"
}
```

#### Important Notes

- ✅ **Must submit exactly 10 answers** - One answer per question
- ✅ **selectedIndex must be 0-3** - Valid option index from the options array
- ✅ **Scoring: 10 points per correct answer** - Max score is 100
- ✅ **Score is automatically added to leaderboard** - If it's in top 3
- ⚠️ **Quiz session expires after submission** - Cannot resubmit same quiz
- ⚠️ **Must submit within reasonable time** - Session stored in memory

---

### 3. Get Leaderboard

**Fetch current top 3 scores from GitHub**

#### Request

```http
GET /leaderboard
Content-Type: application/json
```

```javascript
// JavaScript Example
const getLeaderboard = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/leaderboard`);
    const data = await response.json();

    if (data.success) {
      console.log("Leaderboard:", data.leaderboard);
      return data.leaderboard;
    } else {
      console.error("Error:", data.error);
    }
  } catch (error) {
    console.error("Network error:", error);
  }
};
```

#### Response (Success - 200)

```json
{
  "success": true,
  "leaderboard": [
    {
      "name": "Alice Cooper",
      "score": 100,
      "rank": 1
    },
    {
      "name": "Bob Builder",
      "score": 90,
      "rank": 2
    },
    {
      "name": "Charlie Brown",
      "score": 80,
      "rank": 3
    }
  ]
}
```

#### Response (Error - 500)

```json
{
  "success": false,
  "error": "Failed to fetch leaderboard"
}
```

#### Key Points

- 📊 **Shows top 3 scores** - Stored in GitHub README
- 🔄 **Real-time updates** - Updates after each quiz submission
- 💾 **Persistent storage** - Data saved in GitHub repository

---

### 4. Submit Score (Manual)

**Manually submit a score without taking the quiz** (alternative endpoint)

#### Request

```http
POST /submit-score
Content-Type: application/json
```

```json
{
  "name": "Player Name",
  "score": 75
}
```

```javascript
// JavaScript Example
const submitScore = async (playerName, score) => {
  try {
    const response = await fetch(`${API_BASE_URL}/submit-score`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: playerName,
        score: score,
      }),
    });

    const data = await response.json();
    console.log("Updated Leaderboard:", data.leaderboard);
    return data;
  } catch (error) {
    console.error("Error:", error);
  }
};
```

#### Response (Success - 200)

```json
{
  "success": true,
  "leaderboard": [{ "name": "Player Name", "score": 75, "rank": 1 }]
}
```

#### Response (Error - 400)

```json
{
  "success": false,
  "error": "Name and non-negative numeric score are required"
}
```

---

### 5. Health Check

**Check if backend is running**

#### Request

```http
GET /health
```

```javascript
// JavaScript Example
const checkHealth = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    const data = await response.json();
    console.log("Server Status:", data.status);
    console.log("Timestamp:", data.timestamp);
    console.log("Version:", data.version);
    return data.status === "ok";
  } catch (error) {
    console.error("Backend is down");
    return false;
  }
};
```

#### Response (Success - 200)

```json
{
  "status": "ok",
  "timestamp": "2026-01-26T10:30:45.123Z",
  "version": "v1.0"
}
```

---

## Frontend Implementation Flow

### Complete Quiz Flow

```
┌─────────────────────────────────────────────────────┐
│ 1. USER OPENS QUIZ                                  │
└─────────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────┐
│ 2. FETCH QUESTIONS (GET /questions)                 │
│    ✓ Get quizId                                     │
│    ✓ Get 10 questions with options                  │
└─────────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────┐
│ 3. DISPLAY QUESTIONS                                │
│    ✓ Show question text                             │
│    ✓ Show 4 options (radio buttons or buttons)      │
│    ✓ Track user selections                          │
└─────────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────┐
│ 4. USER SUBMITS QUIZ                                │
│    ✓ Collect all user answers                       │
│    ✓ Get player name                                │
└─────────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────┐
│ 5. SUBMIT ANSWERS (POST /submit-answers)            │
│    ✓ Send quizId, name, answers array               │
│    ✓ Backend validates answers                      │
│    ✓ Backend calculates score                       │
│    ✓ Backend updates GitHub leaderboard             │
└─────────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────┐
│ 6. SHOW RESULTS                                     │
│    ✓ Display final score                            │
│    ✓ Show updated leaderboard (top 3)               │
│    ✓ Option to retake quiz                          │
└─────────────────────────────────────────────────────┘
```

---

## Data Models

### Question Object (From Backend)

```javascript
{
  "id": 1,                              // Question number (1-10)
  "question": "What does CPU stand for?",
  "options": [
    "Central Processing Unit",
    "Computer Personal Unit",
    "Central Program Utility",
    "Computer Processing Union"
  ]
}
```

### User Answer Object (To Backend)

```javascript
{
  "questionId": 1,                      // Must match question id
  "selectedIndex": 0                    // Index of selected option (0-3)
}
```

### Leaderboard Entry Object (From Backend)

```javascript
{
  "name": "Player Name",
  "score": 85,
  "rank": 2
}
```

---

## Error Handling

### Common Errors and Solutions

#### Error: "Invalid or expired quiz session"

```javascript
// Problem: Quiz session expired (took too long to submit)
// Solution: Fetch new questions and restart quiz

const handleExpiredSession = async () => {
  console.warn("Quiz session expired");
  const newQuiz = await fetchQuestions();
  // Start fresh quiz with new quizId
};
```

#### Error: "Valid quizId, name, and array of 10 answers..."

```javascript
// Problem: Answer array is incomplete or malformed
// Solution: Ensure all validations

const validateAnswers = (quizId, name, answers) => {
  if (!quizId) return "Missing quizId";
  if (!name || name.trim() === "") return "Missing player name";
  if (!Array.isArray(answers) || answers.length !== 10) {
    return "Must have exactly 10 answers";
  }

  // Check each answer
  for (let answer of answers) {
    if (!answer.questionId || answer.selectedIndex === undefined) {
      return "Invalid answer format";
    }
    if (answer.selectedIndex < 0 || answer.selectedIndex > 3) {
      return "Invalid option index (must be 0-3)";
    }
  }

  return null; // All valid
};
```

#### Error: Network Connection

```javascript
// Problem: Backend is down or unreachable
// Solution: Implement retry logic

const fetchWithRetry = async (url, options = {}, retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, options);
      if (response.ok) return response;

      if (response.status === 503) {
        console.warn(`Attempt ${i + 1}: Service unavailable`);
        if (i < retries - 1) {
          await new Promise((r) => setTimeout(r, 1000)); // Wait 1 second
          continue;
        }
      }
    } catch (error) {
      console.error(`Attempt ${i + 1} failed:`, error);
      if (i < retries - 1) {
        await new Promise((r) => setTimeout(r, 1000));
      }
    }
  }
  throw new Error("Failed after retries");
};
```

---

## Complete Example

### Full Frontend Quiz Implementation

#### HTML Structure

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Quiz Game</title>
    <style>
      body {
        font-family: Arial, sans-serif;
        max-width: 800px;
        margin: 0 auto;
        padding: 20px;
        background: #f5f5f5;
      }
      .container {
        background: white;
        padding: 20px;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }
      .question {
        margin: 20px 0;
      }
      .option {
        display: block;
        margin: 10px 0;
        padding: 10px;
        background: #f0f0f0;
        border: 2px solid transparent;
        border-radius: 4px;
        cursor: pointer;
      }
      .option:hover {
        background: #e0e0e0;
      }
      .option input:checked + label {
        border-color: #007bff;
      }
      button {
        background: #007bff;
        color: white;
        padding: 10px 20px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 16px;
      }
      button:hover {
        background: #0056b3;
      }
      .leaderboard {
        margin-top: 20px;
      }
      .leaderboard-entry {
        display: flex;
        justify-content: space-between;
        padding: 10px;
        background: #f9f9f9;
        border-bottom: 1px solid #ddd;
      }
      .error {
        color: #d32f2f;
        padding: 10px;
        background: #ffebee;
        border-radius: 4px;
        margin: 10px 0;
      }
      .success {
        color: #388e3c;
        padding: 10px;
        background: #e8f5e9;
        border-radius: 4px;
        margin: 10px 0;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <h1>🎮 Computer Science Quiz</h1>

      <!-- Loading State -->
      <div id="loading" style="display:none;">
        <p>Loading questions...</p>
      </div>

      <!-- Quiz Container -->
      <div id="quiz-container" style="display:none;">
        <div id="error-message"></div>

        <div id="questions-area"></div>

        <div style="margin-top: 20px;">
          <label
            >Player Name:
            <input type="text" id="player-name" placeholder="Enter your name" />
          </label>
        </div>

        <button onclick="submitQuiz()">Submit Quiz</button>
      </div>

      <!-- Results Container -->
      <div id="results-container" style="display:none;">
        <h2>Quiz Results</h2>
        <div id="score-display"></div>
        <div class="leaderboard">
          <h3>Top 3 Leaderboard</h3>
          <div id="leaderboard-display"></div>
        </div>
        <button onclick="startNewQuiz()">Take Quiz Again</button>
      </div>
    </div>

    <script src="quiz.js"></script>
  </body>
</html>
```

#### JavaScript Implementation

```javascript
// quiz.js
const API_BASE_URL = "http://localhost:3000";

let quizData = {
  quizId: null,
  questions: [],
  answers: [], // Store user selections
};

// Initialize quiz
async function startNewQuiz() {
  try {
    // Hide all sections
    document.getElementById("results-container").style.display = "none";
    document.getElementById("loading").style.display = "block";
    document.getElementById("quiz-container").style.display = "none";

    // Clear previous data
    quizData = {
      quizId: null,
      questions: [],
      answers: [],
    };

    // Fetch questions
    const response = await fetch(`${API_BASE_URL}/questions`);
    const data = await response.json();

    if (!data.success) {
      showError(data.message || data.error);
      document.getElementById("loading").style.display = "none";
      return;
    }

    // Store quiz data
    quizData.quizId = data.quizId;
    quizData.questions = data.questions;

    // Display questions
    displayQuestions(data.questions);

    // Show quiz container
    document.getElementById("loading").style.display = "none";
    document.getElementById("quiz-container").style.display = "block";
  } catch (error) {
    showError("Failed to fetch questions: " + error.message);
    document.getElementById("loading").style.display = "none";
  }
}

// Display all questions
function displayQuestions(questions) {
  const questionsArea = document.getElementById("questions-area");
  questionsArea.innerHTML = "";

  questions.forEach((q, index) => {
    const questionDiv = document.createElement("div");
    questionDiv.className = "question";

    let optionsHtml = "";
    q.options.forEach((option, optionIndex) => {
      optionsHtml += `
        <label class="option">
          <input 
            type="radio" 
            name="q${q.id}" 
            value="${optionIndex}"
            onchange="recordAnswer(${q.id}, ${optionIndex})"
          >
          ${option}
        </label>
      `;
    });

    questionDiv.innerHTML = `
      <h3>Question ${index + 1} of 10</h3>
      <p><strong>${q.question}</strong></p>
      ${optionsHtml}
    `;

    questionsArea.appendChild(questionDiv);
  });
}

// Record user's answer
function recordAnswer(questionId, selectedIndex) {
  // Remove existing answer for this question
  quizData.answers = quizData.answers.filter(
    (a) => a.questionId !== questionId,
  );

  // Add new answer
  quizData.answers.push({
    questionId: questionId,
    selectedIndex: selectedIndex,
  });
}

// Validate answers before submission
function validateAnswers() {
  const playerName = document.getElementById("player-name").value.trim();

  if (!playerName) {
    showError("Please enter your name");
    return null;
  }

  if (quizData.answers.length !== 10) {
    showError("Please answer all 10 questions");
    return null;
  }

  // Sort answers by questionId for backend
  const sortedAnswers = quizData.answers.sort(
    (a, b) => a.questionId - b.questionId,
  );

  return {
    quizId: quizData.quizId,
    name: playerName,
    answers: sortedAnswers,
  };
}

// Submit quiz answers
async function submitQuiz() {
  const validData = validateAnswers();
  if (!validData) return;

  try {
    document.querySelector("button").disabled = true;

    const response = await fetch(`${API_BASE_URL}/submit-answers`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(validData),
    });

    const data = await response.json();

    if (!response.ok || (!data.success && data.score === undefined)) {
      showError(data.error || "Failed to submit quiz");
      document.querySelector("button").disabled = false;
      return;
    }

    // Show results
    showResults(data.score, data.leaderboard);
  } catch (error) {
    showError("Network error: " + error.message);
    document.querySelector("button").disabled = false;
  }
}

// Display results
function showResults(score, leaderboard) {
  // Hide quiz, show results
  document.getElementById("quiz-container").style.display = "none";
  document.getElementById("results-container").style.display = "block";

  // Display score
  const scoreDisplay = document.getElementById("score-display");
  const percentage = score / 10; // 10 questions × 10 points each = 100 max
  scoreDisplay.innerHTML = `
    <div class="success">
      <h3>Your Score: ${score}/100</h3>
      <p>Correct Answers: ${score / 10} out of 10</p>
    </div>
  `;

  // Display leaderboard
  const leaderboardDisplay = document.getElementById("leaderboard-display");
  leaderboardDisplay.innerHTML = "";

  leaderboard.forEach((entry, index) => {
    const medal = index === 0 ? "🥇" : index === 1 ? "🥈" : "🥉";
    const entryDiv = document.createElement("div");
    entryDiv.className = "leaderboard-entry";
    entryDiv.innerHTML = `
      <span>${medal} ${index + 1}. ${entry.name}</span>
      <strong>${entry.score}/100</strong>
    `;
    leaderboardDisplay.appendChild(entryDiv);
  });
}

// Show error message
function showError(message) {
  const errorDiv = document.getElementById("error-message");
  errorDiv.innerHTML = `<div class="error">${message}</div>`;
  setTimeout(() => {
    errorDiv.innerHTML = "";
  }, 5000);
}

// Start quiz on page load
window.addEventListener("DOMContentLoaded", startNewQuiz);
```

---

## Testing the Integration

### Using cURL

```bash
# 1. Fetch Questions
curl -X GET http://localhost:3000/questions

# 2. Submit Answers
curl -X POST http://localhost:3000/submit-answers \
  -H "Content-Type: application/json" \
  -d '{
    "quizId": "session_xxx",
    "name": "Test Player",
    "answers": [
      {"questionId": 1, "selectedIndex": 0},
      {"questionId": 2, "selectedIndex": 1}
      // ... 8 more answers
    ]
  }'

# 3. Get Leaderboard
curl -X GET http://localhost:3000/leaderboard

# 4. Health Check
curl -X GET http://localhost:3000/health
```

### Using JavaScript Fetch API

```javascript
// Test in browser console

// 1. Get Questions
const questions = await (await fetch("http://localhost:3000/questions")).json();
console.log(questions);

// 2. Get Leaderboard
const leaderboard = await (
  await fetch("http://localhost:3000/leaderboard")
).json();
console.log(leaderboard);
```

---

## Key Takeaways for Frontend

| Task             | Endpoint          | Method | Key Info                 |
| ---------------- | ----------------- | ------ | ------------------------ |
| Start Quiz       | `/questions`      | GET    | Save `quizId`            |
| Submit Answers   | `/submit-answers` | POST   | Send exactly 10 answers  |
| View Leaderboard | `/leaderboard`    | GET    | Top 3 scores             |
| Check Backend    | `/health`         | GET    | Verify server is running |

---

## Important Notes

⚠️ **Quiz Session Management:**

- Each quiz has a unique `quizId`
- Session is temporary (stored in server memory)
- Must submit within reasonable time
- Cannot resubmit same quiz after submission

⚠️ **Answer Validation:**

- Must provide exactly 10 answers
- `selectedIndex` must be 0-3
- `questionId` must match question IDs 1-10
- Questions must be in any order (backend validates by ID)

⚠️ **Leaderboard:**

- Only top 3 scores are stored
- Stored in GitHub repository
- Updates instantly after quiz submission
- Persistent across server restarts

✅ **Best Practices:**

- Always validate user input before sending
- Implement error handling for network failures
- Show loading states during API calls
- Cache questions while quiz is ongoing
- Disable submit button until all questions answered

---

## Support

For backend issues, check the [API_DOCUMENTATION.md](API_DOCUMENTATION.md) file or run `npm start` to ensure the server is running on port 3000.
