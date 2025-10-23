# GitCode.dev

> **"A platform that turns coding challenges into your real GitHub portfolio."**

## 🧩 Overview
**GitCode.dev** is an educational platform for developers that combines algorithmic problem-solving with automatic GitHub portfolio building and AI assistance.  
The platform allows users to solve programming challenges directly in the browser, automatically publish accepted solutions to their GitHub repository, and receive feedback from an integrated AI mentor.

---

## 🚀 MVP Scope

### 1️⃣ Authentication & User Profile
- Sign in with **GitHub OAuth**.
- Fetch basic profile data (avatar, username, bio, and email if available).
- Store minimal local profile data linked to GitHub ID.

### 2️⃣ Tasks & Code Editor
- Task catalog with filtering (by category, difficulty).
- Interactive online code editor (powered by **Monaco Editor**).
- Initial support for **one or two languages** (Python, JavaScript).

### 3️⃣ Solution Evaluation
- Server-side code execution and unit testing.
- Result feedback including:
  - ✅ correctness (passed/failed),
  - ⚙️ execution time,
  - 💾 memory usage.
- Automatic solution acceptance after passing all tests.

### 4️⃣ GitHub Integration
- Once a solution is accepted:
  - Automatically **commit and push** code to the user’s repository.
  - Include metadata and task link in the commit message.
- Optionally generate a simple **README section** showcasing progress and solved tasks.

### 5️⃣ AI Assistance (Basic Layer)
- **AI Code Reviewer**: basic analysis of code style and potential anti-patterns using static rules or an external LLM API.
- **AI Tutor (Hint Mode)**: provides guiding hints without revealing full solutions.

### 6️⃣ Admin Panel (Minimal Version)
- CRUD management for tasks and test cases.
- User and execution log overview.
- Option to import or seed initial problems.

---

## 🧠 Future Improvements
- **Learning Paths**: curated sets of exercises (e.g., Arrays, Graphs, Recursion).
- **AI Task Generator**: automatically generate new coding challenges using AI.
- **Gamification**: leaderboards, XP, badges.
- **Company Challenges**: allow companies to post interview-style tasks.
- **Enhanced AI Reviewer**: deeper analysis (time complexity, optimization hints).
- **Custom OAuth / Keycloak integration** for enterprise-level authentication.

---

## ⚙️ Tech Stack (Proposed)
| Layer | Technology |
|-------|-------------|
| Frontend | Next.js / React + Tailwind CSS |
| Backend | Node.js (Express or Nest.js) |
| Database | PostgreSQL and MongoDB) |
| Code Execution | Dockerized Runner or Judge0 API |
| Authentication | GitHub OAuth (later Keycloak) |
| AI Integration | OpenAI / Ollama / Local LLM |
| Deployment | Docker Compose |

---

## 🧰 Example Flow
1. User signs in via GitHub OAuth.  
2. User selects a task and writes a solution in the online editor.  
3. The backend runs tests inside a secure sandbox.  
4. If all tests pass:
   - The code is committed and pushed to the user’s GitHub repo.
   - AI Reviewer provides short feedback on code quality.
5. The user can track progress via dashboard or GitHub profile.

---

## 🧱 Project Goals
- Bridge the gap between **learning** and **career growth**.
- Create a **verifiable GitHub portfolio** through real code challenges.
- Integrate **AI mentorship** into everyday coding practice.
- Provide an extendable architecture for future research and development.

---

## 🧾 License
MIT License — freely available for educational and research use.

---

## 💬 Authors
**GitCode.dev Team** — developed as part of a Bachelor’s Degree project in Computer Science.  
Contributions, feedback, and ideas for improvement are always welcome!

---
