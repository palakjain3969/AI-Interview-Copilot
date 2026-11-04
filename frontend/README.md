# AI Interview Copilot — Frontend v1

React + Vite frontend for your existing Express/MongoDB/Gemini backend.

## 1. Requirements
- Node.js 18 or newer
- Your backend running locally on port 5000

## 2. Install and run
Open a terminal in this folder:

```bash
npm install
```

Copy `.env.example` to `.env` (Windows PowerShell):

```powershell
Copy-Item .env.example .env
```

Then start the frontend:

```bash
npm run dev
```

Open http://localhost:5173

Build check:

```bash
npm run build
```

## 3. Backend API assumptions

The frontend is configured for these common routes:

| Purpose | Method | Default path |
|---|---|---|
| Login | POST | `/api/auth/login` |
| Register | POST | `/api/auth/register` |
| List/create interviews | GET/POST | `/api/interviews` |
| Get interview (including questions) | GET | `/api/interviews/:id` |
| List questions fallback | GET | `/api/questions?interviewId=:id` |
| Submit answer | POST | `/api/answers` |
| Interview result | GET | `/api/interviews/:id/result` |

Your known result endpoint is `/api/interviews/:id/result`, and the answer submission body is `{ "questionId": "...", "answer": "..." }`.

**Important:** I have not received your backend source ZIP, so I cannot honestly guarantee that every route name and response shape above exactly matches your local backend. Route paths can be changed in `.env`; request/response field names may need a small adapter adjustment in `src/` if your backend differs.

### Environment variables

```env
VITE_API_BASE_URL=http://localhost:5000
VITE_AUTH_LOGIN_PATH=/api/auth/login
VITE_AUTH_REGISTER_PATH=/api/auth/register
VITE_INTERVIEWS_PATH=/api/interviews
VITE_QUESTIONS_PATH=/api/questions
VITE_ANSWERS_PATH=/api/answers
```

If your backend uses different route paths, change them in `.env` and restart Vite.

## 4. CORS

Your Express server must allow the Vite origin `http://localhost:5173`. If requests fail with a browser CORS error, enable CORS in the backend, for example:

```js
const cors = require("cors");
app.use(cors({ origin: "http://localhost:5173" }));
```

Install `cors` in the backend if it is not already installed:

```bash
npm install cors
```

## 5. Security
- Do not put MongoDB credentials, Gemini API keys, or JWT secrets in this frontend.
- The browser stores the JWT in localStorage for this first version. For production, consider secure, httpOnly cookies and stronger session protections.

## 6. Included screens
- Login and registration
- Dashboard and interview history
- Interview setup
- Question answering flow
- Results, strengths, weaknesses and AI feedback
