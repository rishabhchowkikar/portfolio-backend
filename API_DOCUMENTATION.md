# 📚 Portfolio Backend - Complete API Documentation

## Table of Contents

1. [Project Overview](#project-overview)
2. [Project Structure](#project-structure)
3. [Utility Functions](#utility-functions)
4. [Service Layer (Utils)](#service-layer-utils)
5. [Controllers](#controllers)
6. [Routes](#routes)
7. [API Endpoints](#api-endpoints)
8. [Environment Variables](#environment-variables)
9. [Installation & Running](#installation--running)

---

## Project Overview

**Portfolio Backend** is an Express.js REST API that manages:

- **MCQ Game Leaderboard**: Stores and retrieves top 3 player scores from GitHub README
- **Quiz Questions**: Fetches computer science trivia questions from Open Trivia Database
- **Server Health**: Simple health check endpoint

**Tech Stack:**

- Express.js (Server Framework)
- Axios (HTTP Client)
- dotenv (Environment Variables)
- he (HTML Entity Decoder)
- Node.js

---

## Project Structure

```
portfolio-backend/
├── server.js                          # Main entry point
├── package.json                       # Dependencies & scripts
├── .env                               # Environment variables (not in repo)
├── .gitignore                         # Git ignore rules
│
├── utils/
│   ├── helper.js                      # HTML decoding & array shuffling utilities
│   ├── github.js                      # GitHub API integration
│   └── leaderboard.js                 # Leaderboard logic & parsing
│
├── controllers/
│   ├── scoreController.js             # Score submission & leaderboard retrieval handlers
│   └── questionController.js          # Question fetching handler
│
└── routes/
    ├── scoreRoutes.js                 # Score-related route definitions
    └── questionRoutes.js              # Question route definitions
```

---

## Utility Functions

### `utils/helper.js`

This file contains helper functions for processing trivia data from Open Trivia Database.

#### \*\*Function: `decodeHtml(html)`

**Purpose:** Converts HTML entities to readable text

**Parameters:**

- `html` (string): HTML encoded text

**Returns:** Decoded string

**Example:**

```javascript
// Input
decodeHtml("What is &quot;AI&quot;?");

// Output
('What is "AI"?');
```

**Logic:**

```javascript
function decodeHtml(html) {
  return html ? he.decode(String(html)) : "";
}
```

- Uses the `he` npm package to decode HTML entities
- Returns empty string if input is null/undefined

**Why Needed:** Open Trivia Database returns HTML-encoded characters like `&quot;`, `&amp;`, `&#039;` which need conversion for display.

---

#### \*\*Function: `shuffleArray(array)`

**Purpose:** Randomly shuffles array elements using Fisher-Yates algorithm

**Parameters:**

- `array` (array): Array to shuffle

**Returns:** New shuffled array (original untouched)

**Example:**

```javascript
// Input
shuffleArray([1, 2, 3, 4])[
  // Output (random)
  (3, 1, 4, 2)
];
```

**Logic:**

```javascript
function shuffleArray(array) {
  if (!Array.isArray(array)) return [];

  const shuffled = [...array]; // Create copy
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]; // Swap
  }
  return shuffled;
}
```

**Why Needed:** Ensures the correct answer is not always in the same position, making the quiz fair.

---

## Service Layer (Utils)

### `utils/github.js`

Handles all GitHub API interactions for reading and updating the leaderboard README.

#### \*\*Function: `getReadme()`

**Purpose:** Fetches README.md content from GitHub repository

**Parameters:** None (uses environment variables)

**Returns:** Object with structure:

```javascript
{
  content: "# 🏆 MCQ Game Leaderboard\n...",  // File content
  sha: "abc123def456..."                       // Required for updates
}
```

**Environment Variables Required:**

- `GITHUB_TOKEN`: Personal access token with repo permissions
- `OWNER`: GitHub username
- `REPO`: Repository name

**API Call:**

```javascript
GET https://api.github.com/repos/{OWNER}/{REPO}/contents/README.md
Authorization: Bearer {GITHUB_TOKEN}
```

**Error Handling:**

- Logs status code and error message
- Throws error to be caught by controller

**Example Response (from GitHub API):**

```json
{
  "content": "IyDwn46NjiBNQ1EgR2FtZSBMZWFkZXJib2FyZA==", // Base64 encoded
  "sha": "e6b3ab5f31e2cf66d7ef9f0bab8c5b2a0d8c4f9e"
}
```

---

#### \*\*Function: `updateReadme(newContent, sha)`

**Purpose:** Updates README.md in GitHub repository with new leaderboard

**Parameters:**

- `newContent` (string): New README markdown content
- `sha` (string): Current file SHA (prevents conflicts)

**Returns:** Promise (void on success)

**Environment Variables Required:**

- `GITHUB_TOKEN`: Personal access token
- `OWNER`: GitHub username
- `REPO`: Repository name
- `BRANCH`: Branch name (defaults to "main")

**API Call:**

```javascript
PUT https://api.github.com/repos/{OWNER}/{REPO}/contents/README.md
Authorization: Bearer {GITHUB_TOKEN}
```

**Request Body:**

```json
{
  "message": "Update leaderboard - new score submitted",
  "content": "Base64 encoded content here",
  "sha": "previous sha value",
  "branch": "main"
}
```

**Process:**

1. Encodes new content to Base64 (GitHub requirement)
2. Includes commit message
3. Passes SHA for version control
4. Updates specified branch

---

### `utils/leaderboard.js`

Contains business logic for parsing and updating leaderboard data.

#### \*\*Function: `parseScores(readmeContent)`

**Purpose:** Extracts player scores from README markdown format

**Parameters:**

- `readmeContent` (string): Raw README content

**Returns:** Array of score objects

```javascript
[
  { name: "Alice", score: 95 },
  { name: "Bob", score: 87 },
  { name: "Charlie", score: 92 },
];
```

**Input Format Expected:**

```markdown
# 🏆 MCQ Game Leaderboard

## Top 3 Players

1. Alice : 95
2. Charlie : 92
3. Bob : 87
```

**Regex Pattern:** `/^\d\.\s*(.+?)\s*:\s*(\d+)/`

- `^\d\.` - Line starts with number and period
- `(.+?)` - Captures player name (non-greedy)
- `(\d+)` - Captures numeric score

**Logic:**

1. Splits content by newlines
2. Tests each line against regex
3. Extracts name and score if matched
4. Validates score is a valid number
5. Trims whitespace from names

**Example:**

```javascript
parseScores(`# 🏆 MCQ Game Leaderboard
## Top 3 Players
1. Alice : 95
2. Bob : 87`)[
  // Returns:
  ({ name: "Alice", score: 95 }, { name: "Bob", score: 87 })
];
```

---

#### \*\*Function: `updateTop3(currentScores, newEntry)`

**Purpose:** Merges new score with existing scores and returns top 3

**Parameters:**

- `currentScores` (array): Current leaderboard scores
- `newEntry` (object): New score object `{ name: string, score: number }`

**Returns:** Array of top 3 score objects (sorted descending)

**Logic:**

1. Creates new array combining current scores + new entry
2. Sorts all scores by score in descending order
3. Returns only first 3 entries (slice 0-3)

**Example:**

```javascript
updateTop3(
  [
    { name: "Alice", score: 95 },
    { name: "Bob", score: 87 },
  ],
  { name: "Charlie", score: 92 },
)[
  // Returns:
  ({ name: "Alice", score: 95 },
  { name: "Charlie", score: 92 },
  { name: "Bob", score: 87 })
];
```

**Sorting:** Uses `(a, b) => b.score - a.score` (descending)

---

#### \*\*Function: `generateNewReadme(top3)`

**Purpose:** Creates markdown formatted README with leaderboard

**Parameters:**

- `top3` (array): Array of top 3 score objects

**Returns:** Formatted markdown string

**Output Format:**

```markdown
# 🏆 MCQ Game Leaderboard

## Top 3 Players

1. Alice : 95
2. Charlie : 92
3. Bob : 87
```

**Padding Logic:**

- If fewer than 3 scores exist, pads with placeholder entries
- Format: `{position}. --- : 0`

**Example:**

```javascript
generateNewReadme([{ name: "Alice", score: 95 }])
// Returns:
`# 🏆 MCQ Game Leaderboard

## Top 3 Players

1. Alice : 95
2. --- : 0
3. --- : 0`;
```

---

## Controllers

### `controllers/scoreController.js`

Handles business logic for score submission and leaderboard retrieval.

#### \*\*Function: `submitScore(req, res, next)`

**Purpose:** Validates and submits new score, updates GitHub leaderboard

**Request Body:**

```json
{
  "name": "PlayerName",
  "score": 95
}
```

**Validation Rules:**

1. `name` must be non-empty string (after trim)
2. `score` must be a number
3. `score` must be >= 0

**Execution Flow:**

```
1. Validate input
   ├─ If invalid → Return 400 error
   └─ If valid → Continue
2. Fetch current README from GitHub
   ├─ Parse existing scores
   └─ Get file SHA
3. Create new leaderboard
   ├─ Add new entry
   ├─ Sort by score (descending)
   └─ Keep top 3
4. Generate new README markdown
5. Update GitHub README
6. Return updated leaderboard
```

**Success Response (200):**

```json
{
  "success": true,
  "leaderboard": [
    { "name": "Alice", "score": 95 },
    { "name": "NewPlayer", "score": 90 },
    { "name": "Bob", "score": 87 }
  ]
}
```

**Error Responses:**

**400 - Invalid Input:**

```json
{
  "success": false,
  "error": "Name and non-negative numeric score are required"
}
```

**500 - Server Error:**

```json
{
  "success": false,
  "error": "Failed to update leaderboard"
}
```

**Dependencies:**

- `getReadme()` from `utils/github.js`
- `updateReadme()` from `utils/github.js`
- `parseScores()` from `utils/leaderboard.js`
- `updateTop3()` from `utils/leaderboard.js`
- `generateNewReadme()` from `utils/leaderboard.js`

---

#### \*\*Function: `getLeaderboard(req, res, next)`

**Purpose:** Retrieves current top 3 leaderboard

**Request Parameters:** None

**Execution Flow:**

```
1. Fetch README from GitHub
2. Parse scores from content
3. Return all found scores
```

**Success Response (200):**

```json
{
  "success": true,
  "leaderboard": [
    { "name": "Alice", "score": 95 },
    { "name": "Charlie", "score": 92 },
    { "name": "Bob", "score": 87 }
  ]
}
```

**Error Response (500):**

```json
{
  "success": false,
  "error": "Failed to fetch leaderboard"
}
```

**Dependencies:**

- `getReadme()` from `utils/github.js`
- `parseScores()` from `utils/leaderboard.js`

---

### `controllers/questionController.js`

Handles fetching and formatting trivia questions.

#### \*\*Function: `getQuestions(req, res, next)`

**Purpose:** Fetches 10 computer science MCQ questions from Open Trivia Database

**Request Parameters:** None

**External API Call:**

```
GET https://opentdb.com/api.php?amount=10&category=18&type=multiple
```

**Query Parameters:**

- `amount: 10` - Number of questions to fetch
- `category: 18` - Category ID for "Science: Computers"
- `type: multiple` - Multiple choice format

**Execution Flow:**

```
1. Call Open Trivia DB API
2. Check if results exist
   ├─ If empty → Return 503 (Service Unavailable)
   └─ If valid → Continue
3. Format each question:
   ├─ Decode HTML entities
   ├─ Shuffle answer options
   └─ Create question object
4. Return formatted questions
```

**Success Response (200):**

```json
{
  "success": true,
  "questions": [
    {
      "id": 1,
      "question": "What does CPU stand for?",
      "options": [
        "Central Processing Unit",
        "Computer Personal Unit",
        "Central Program Utility",
        "Computer Processing Unit"
      ]
    },
    {
      "id": 2,
      "question": "What is the binary representation of 10?",
      "options": ["1010", "1110", "1000", "1001"]
    }
  ],
  "total": 10
}
```

**Question Object Structure:**

```javascript
{
  id: 1,                    // Sequential ID (1-10)
  question: "...",          // Decoded question text
  options: [                // Shuffled answer options
    "Correct Answer",
    "Wrong 1",
    "Wrong 2",
    "Wrong 3"
  ]
}
```

**Note:** Current implementation hides:

- `correct_answer` - Not sent to prevent cheating
- `incorrect_answers` - Not sent (only shuffled options)
- `category` - Commented out
- `difficulty` - Commented out

**Error Responses:**

**429 - Rate Limit:**

```json
{
  "success": false,
  "error": "Rate limit exceeded - try again later"
}
```

**503 - No Questions Available:**

```json
{
  "success": false,
  "message": "No questions available from Open Trivia DB right now"
}
```

**500 - Server Error:**

```json
{
  "success": false,
  "error": "Trivia service is having issues"
}
```

**Dependencies:**

- `decodeHtml()` from `utils/helper.js`
- `shuffleArray()` from `utils/helper.js`
- `axios` for HTTP requests

---

## Routes

### `routes/scoreRoutes.js`

Defines routes for leaderboard operations.

```javascript
const express = require("express");
const {
  getLeaderboard,
  submitScore,
} = require("../controllers/scoreController");

const router = express.Router();

router.post("/submit-score", submitScore);
router.get("/leaderboard", getLeaderboard);

module.exports = router;
```

**Routes:**

- `POST /submit-score` → `submitScore()` controller
- `GET /leaderboard` → `getLeaderboard()` controller

---

### `routes/questionRoutes.js`

Defines routes for question operations.

```javascript
const express = require("express");
const { getQuestions } = require("../controllers/questionController");

const router = express.Router();

router.get("/questions", getQuestions);

module.exports = router;
```

**Routes:**

- `GET /questions` → `getQuestions()` controller

---

## API Endpoints

### **1. POST /submit-score**

**Purpose:** Submit player score and update leaderboard

**URL:** `http://localhost:3000/submit-score`

**Method:** POST

**Headers:**

```
Content-Type: application/json
```

**Request Body:**

```json
{
  "name": "Alice",
  "score": 95
}
```

**Success Response (200):**

```json
{
  "success": true,
  "leaderboard": [
    { "name": "Alice", "score": 95 },
    { "name": "Bob", "score": 87 },
    { "name": "Charlie", "score": 82 }
  ]
}
```

**Error Response (400):**

```json
{
  "success": false,
  "error": "Name and non-negative numeric score are required"
}
```

**cURL Example:**

```bash
curl -X POST http://localhost:3000/submit-score \
  -H "Content-Type: application/json" \
  -d '{"name":"Alice","score":95}'
```

---

### **2. GET /leaderboard**

**Purpose:** Retrieve current leaderboard

**URL:** `http://localhost:3000/leaderboard`

**Method:** GET

**Headers:** None required

**Query Parameters:** None

**Success Response (200):**

```json
{
  "success": true,
  "leaderboard": [
    { "name": "Alice", "score": 95 },
    { "name": "Charlie", "score": 92 },
    { "name": "Bob", "score": 87 }
  ]
}
```

**Error Response (500):**

```json
{
  "success": false,
  "error": "Failed to fetch leaderboard"
}
```

**cURL Example:**

```bash
curl http://localhost:3000/leaderboard
```

---

### **3. GET /questions**

**Purpose:** Fetch 10 computer science MCQ questions

**URL:** `http://localhost:3000/questions`

**Method:** GET

**Headers:** None required

**Query Parameters:** None

**Success Response (200):**

```json
{
  "success": true,
  "questions": [
    {
      "id": 1,
      "question": "What does CPU stand for?",
      "options": [
        "Central Processing Unit",
        "Computer Personal Unit",
        "Central Program Utility",
        "Computer Processing Unit"
      ]
    },
    {
      "id": 2,
      "question": "In what year was the first computer bug discovered?",
      "options": ["1947", "1951", "1943", "1949"]
    }
  ],
  "total": 10
}
```

**Error Response (503):**

```json
{
  "success": false,
  "message": "No questions available from Open Trivia DB right now"
}
```

**cURL Example:**

```bash
curl http://localhost:3000/questions
```

---

### **4. GET /health**

**Purpose:** Check server health

**URL:** `http://localhost:3000/health`

**Method:** GET

**Headers:** None required

**Success Response (200):**

```json
{
  "status": "ok",
  "timestamp": "2026-01-25T10:30:45.123Z",
  "version": "v1.0"
}
```

**cURL Example:**

```bash
curl http://localhost:3000/health
```

---

## Environment Variables

Create a `.env` file in the root directory with:

```env
# GitHub Configuration
OWNER=your-github-username
REPO=your-repository-name
BRANCH=main
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx

# Server Configuration
PORT=3000
NODE_ENV=development
```

**Variable Explanations:**

| Variable       | Description           | Example         | Required                 |
| -------------- | --------------------- | --------------- | ------------------------ |
| `OWNER`        | GitHub username       | `john-doe`      | ✅ Yes                   |
| `REPO`         | Repository name       | `portfolio`     | ✅ Yes                   |
| `BRANCH`       | Git branch name       | `main`          | ❌ No (defaults to main) |
| `GITHUB_TOKEN` | Personal access token | `ghp_1a2b3c...` | ✅ Yes                   |
| `PORT`         | Server port           | `3000`          | ❌ No (defaults to 3000) |
| `NODE_ENV`     | Environment type      | `development`   | ❌ No                    |

**How to Get GitHub Token:**

1. Go to https://github.com/settings/tokens
2. Click "Generate new token"
3. Select scopes: `repo` (full control of private repositories)
4. Copy and paste into `.env`

---

## Installation & Running

### **Setup**

```bash
# 1. Navigate to project directory
cd portfolio-backend

# 2. Install dependencies
npm install

# 3. Create .env file with required variables
# (See Environment Variables section above)

# 4. Verify setup
cat .env
```

### **Running**

**Development Mode (with auto-reload):**

```bash
npm run dev
```

**Production Mode:**

```bash
npm start
```

### **Expected Console Output**

```
Starting with config:
OWNER: your-github-username
REPO: your-repository-name
BRANCH: main
Token length: 40
🚀 Server running on http://localhost:3000
```

### **Testing Endpoints**

```bash
# Test health
curl http://localhost:3000/health

# Fetch questions
curl http://localhost:3000/questions

# Get leaderboard
curl http://localhost:3000/leaderboard

# Submit score
curl -X POST http://localhost:3000/submit-score \
  -H "Content-Type: application/json" \
  -d '{"name":"TestPlayer","score":85}'
```

---

## Data Flow Diagram

### Score Submission Flow

```
Client
  │
  └─→ POST /submit-score
       │
       ├─→ scoreController.submitScore()
       │    │
       │    ├─→ Validate input
       │    │
       │    ├─→ utils/github.getReadme()
       │    │    └─→ GitHub API (Fetch README)
       │    │
       │    ├─→ utils/leaderboard.parseScores()
       │    │    └─→ Extract current scores
       │    │
       │    ├─→ utils/leaderboard.updateTop3()
       │    │    └─→ Sort and keep top 3
       │    │
       │    ├─→ utils/leaderboard.generateNewReadme()
       │    │    └─→ Format new README
       │    │
       │    ├─→ utils/github.updateReadme()
       │    │    └─→ GitHub API (Update README)
       │    │
       │    └─→ Return updated leaderboard
       │
       └─→ Response (JSON)
            │
            ├─→ 200: { success: true, leaderboard: [...] }
            ├─→ 400: { success: false, error: "..." }
            └─→ 500: { success: false, error: "..." }
```

### Question Fetching Flow

```
Client
  │
  └─→ GET /questions
       │
       ├─→ questionController.getQuestions()
       │    │
       │    ├─→ Axios (Call Open Trivia DB)
       │    │    └─→ https://opentdb.com/api.php?...
       │    │
       │    ├─→ Format questions:
       │    │    ├─→ utils/helper.decodeHtml()
       │    │    │    └─→ Convert HTML entities
       │    │    │
       │    │    └─→ utils/helper.shuffleArray()
       │    │         └─→ Randomize answer order
       │    │
       │    └─→ Return formatted questions
       │
       └─→ Response (JSON)
            │
            ├─→ 200: { success: true, questions: [...] }
            ├─→ 429: Rate limit exceeded
            └─→ 503: No questions available
```

---

## Security Considerations

1. **GitHub Token:** Store in `.env` (never commit)
2. **Validation:** Input validated in controller
3. **Error Messages:** Generic errors returned to client (details logged)
4. **CORS:** Not enabled (configure if needed for frontend)
5. **Rate Limiting:** Not implemented (add if needed)

---

## Troubleshooting

| Issue                      | Solution                                  |
| -------------------------- | ----------------------------------------- |
| "GITHUB_TOKEN is required" | Check `.env` file exists with valid token |
| "Cannot find module"       | Run `npm install`                         |
| "Port 3000 already in use" | Change PORT in `.env` or kill process     |
| "GitHub 401 Unauthorized"  | Verify token has `repo` scope             |
| "No questions available"   | Open Trivia DB may be down temporarily    |

---

## Summary

This backend provides a complete MCQ game system with:

- ✅ Leaderboard management via GitHub
- ✅ Trivia questions from Open Trivia DB
- ✅ Clean architecture (routes → controllers → utils)
- ✅ Proper error handling
- ✅ Health check endpoint

All data is properly formatted, validated, and handled with appropriate HTTP status codes.
