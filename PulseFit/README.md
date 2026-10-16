# PulseFit

**Train smarter. Get stronger.** PulseFit is a gym and fitness web app with a dark, neon-lime glass design. You plan today's workout from an exercise library, train in a live workout mode with a rest timer, and watch your streak, weekly chart and goal rings update on your dashboard.

![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-38BDF8?logo=tailwindcss&logoColor=white)
![Postgres](https://img.shields.io/badge/Postgres-Neon%20%7C%20PGlite-336791?logo=postgresql&logoColor=white)
![Tests](https://img.shields.io/badge/tests-121%20passing-C6FF3D)

---

## Features

- **Landing page** with live community counters for members, workouts completed and classes this week.
- **Sign up and log in** with weekly goals for workouts and minutes. Passwords are hashed with bcrypt, and sessions use a signed JWT in an httpOnly cookie.
- **Dashboard** showing today's workout, your streak of days in a row, active minutes for the last 7 days, and progress rings for this week's goals.
- **Workout Library** of 30 exercises across Chest, Back, Legs, Arms, Core and Cardio. Filter, search, and add any exercise to today's workout in one tap.
- **Live Workout Mode** with tap-to-tick sets that save instantly, a rest timer based on each exercise's rest time, and a confetti finish.
- **Privacy built in.** Every API route only ever returns the logged-in user's own data.
- **Polish:** glass loading skeletons, friendly empty states, toast messages, light and dark themes, and a mobile-first layout.

## Tech stack

| Layer | Tools |
|---|---|
| Frontend | React 18, React Router, Vite, Tailwind CSS, Framer Motion, Recharts, Lucide icons, canvas-confetti |
| Backend | Serverless functions in `/api`, written in the Vercel format |
| Database | [Neon](https://neon.tech) serverless Postgres in production. [PGlite](https://pglite.dev), an embedded Postgres, for local development with nothing to install |
| Auth | bcryptjs for passwords and jose for JWTs, in httpOnly cookies |
| Testing | Vitest and Supertest for the API, Playwright for the browser, axe-core for accessibility, Lighthouse |

The database connection string is only ever used by the backend functions. The browser never talks to the database directly.

## Getting started

You need [Node.js](https://nodejs.org) 20 or newer.

```bash
git clone https://github.com/Mihika-hub/Agentic-AI.git
cd Agentic-AI/PulseFit
npm install
npm run dev
```

Open **http://localhost:5173**.

That's all you need to try it locally. `npm run dev` starts the website and the API together. On the first run it also:

- creates a `.env` file with a strong random `JWT_SECRET`
- creates a local database in `.data/pulsefit`, with the 30 exercises and 10 classes already loaded

### Using Neon instead of the local database (optional)

1. Create a free project at [neon.tech](https://neon.tech).
2. In the Neon dashboard, open your project and click **Connect**. Copy the connection string, which starts with `postgresql://`.
3. Paste it into `.env` after `DATABASE_URL=`.
4. Run `npm run db:setup` to create the tables and sample data. It is safe to run again.

When `DATABASE_URL` is empty, PulseFit uses the local database. When it is set, PulseFit uses Neon. No code changes are needed either way.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Starts the website on port 5173 and the API on port 3001 |
| `npm run db:setup` | Creates the tables and loads the sample data. Stop `npm run dev` first when using the local database |
| `npm run build` | Builds the production site into `dist/` |
| `npm test` | Runs the backend and logic tests |
| `npm run test:e2e` | Runs the browser tests in Chrome, at desktop size and iPhone size |
| `npm run test:all` | Runs every test |
| `npm run lighthouse` | Builds the app and runs a Lighthouse audit. Results go to `reports/` |

## Environment variables

| Name | Purpose |
|---|---|
| `DATABASE_URL` | Neon Postgres connection string. Leave it empty to use the local database |
| `JWT_SECRET` | Secret used to sign login sessions. It is generated for you locally |

See `.env.example`. The `.env` file is ignored by git, so never commit it.

## Project structure

```
PulseFit/
├── api/                  Backend functions. Each file is one route, same as on Vercel
│   ├── auth/             signup, login, logout, me
│   ├── dashboard.js      Streak, weekly chart, rings and today's workout
│   ├── exercises.js      Exercise library, with an optional muscle-group filter
│   ├── workouts.js       Today's workout: add, remove, start, finish, restart
│   ├── sets.js           Tick or untick one set
│   ├── stats.js          Public community counters
│   └── _lib/             Private helpers for the database, auth, errors and streaks. Not routes
├── db/
│   ├── schema.sql        Tables, foreign keys and indexes
│   └── seed.sql          30 exercises and 10 classes for this week
├── server/               Small Express server that runs /api locally
├── scripts/              Database setup, .env helper, Lighthouse runner
├── src/
│   ├── pages/            Landing, Dashboard, Library, Live Workout, Login and Sign up, and more
│   ├── components/       Glass cards, progress rings, skeletons, navbar
│   ├── context/          Auth, theme and toast providers
│   └── lib/              API client and helpers
├── tests/
│   ├── api/              API tests, including security
│   ├── unit/             Streak and progress-ring logic
│   └── e2e/              Playwright browser journeys and quality checks
├── TEST-REPORT.md        Latest test results, bugs fixed and Lighthouse scores
└── vercel.json           Single-page app routing for Vercel
```

## API

| Method and route | Login needed | Description |
|---|---|---|
| `POST /api/auth/signup` | No | Create an account: name, email, password and weekly goals |
| `POST /api/auth/login` | No | Log in |
| `POST /api/auth/logout` | No | Log out |
| `GET /api/auth/me` | Yes | The current user and their streak |
| `GET /api/stats` | No | Members, workouts completed, classes this week |
| `GET /api/dashboard` | Yes | Everything the dashboard shows |
| `GET /api/exercises?muscleGroup=Chest` | Yes | Exercise library. The filter is optional |
| `GET /api/workouts` | Yes | Today's workout with exercises and sets |
| `POST /api/workouts` | Yes | Add an exercise: `{ "exerciseId": 1 }` |
| `DELETE /api/workouts?exerciseId=1` | Yes | Remove an exercise from today's workout |
| `PATCH /api/workouts` | Yes | `{ "id": 1, "action": "start" }`. Actions are `start`, `finish` and `restart` |
| `PATCH /api/sets` | Yes | `{ "id": 1, "completed": true }` |

## Testing

121 automated tests pass, and 2 more are skipped on purpose: they are keyboard tests that only run on desktop. The tests cover:

- every API route, for both success and failure
- security, meaning one user can never see or change another user's data
- streak logic with fixed dates
- full browser journeys on desktop and phone sizes
- accessibility, no console errors, and no sideways scrolling at 375px

Tests run against throwaway in-memory databases, so your real data is never touched. See [TEST-REPORT.md](TEST-REPORT.md) for the full results.

## Deploying to Vercel

1. Import the repo into Vercel and set the **Root Directory** to `PulseFit`.
2. Add the environment variables `DATABASE_URL`, your Neon connection string, and `JWT_SECRET`, a long random string.
3. Deploy. Vercel builds the site with `npm run build` and serves the `/api` files as serverless functions automatically.
4. Run `npm run db:setup` once from your computer, with the Neon `DATABASE_URL` in `.env`, to create the tables.
