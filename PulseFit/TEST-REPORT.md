# PulseFit test report

Date: 17 October 2026. Environment: Windows 11, Node 24, Google Chrome, local database (PGlite).

## Result

All tests pass. `npm run test:all` exits with no failures, and the browser tests passed on two runs in a row.

| Suite | Tests | Passed | Failed | Skipped |
|---|---|---|---|---|
| Backend and logic tests (Vitest + Supertest) | 97 | 97 | 0 | 0 |
| Browser tests (Playwright, desktop Chrome + iPhone 13 size) | 26 | 24 | 0 | 2 |
| **Total** | **123** | **121** | **0** | **2** |

The 2 skipped tests are the keyboard tests on the phone screen. Phones have no Tab key, so those tests only run on desktop.

`npm run build` completes with zero errors and zero warnings. The frontend bundle contains no database or password code.

## How to run

| Command | What it does |
|---|---|
| `npm run test:all` | Runs every backend test, then every browser test |
| `npm test` | Backend and logic tests only, about 40 seconds |
| `npm run test:e2e` | Browser tests only, about 5 minutes. Starts its own servers |
| `npm run lighthouse` | Builds the app and runs Lighthouse. Results go to `reports/` |

**Your data is safe.** Tests never touch your real database. Backend tests use a throwaway in-memory database for each test file. Browser tests start their own API and website on separate ports, also with an in-memory database. Every test creates its own `test-…@pulsefit.test` user and deletes it afterwards. A safety check stops the backend tests if they ever point at a real database. Before and after the full run, your real database still had 1 member and 1 completed workout.

## What is tested

**Backend (`tests/api`, `tests/unit`)**
- **Sign up:** works, sets an httpOnly cookie, never returns the password hash. Blocks duplicate emails in any capitalisation, plus empty, short, letters-only, numbers-only and all-spaces passwords. Also blocks a bad email, a missing name, out-of-range goals and broken JSON.
- **Log in and log out:** works with any email capitalisation. A wrong password and an unknown email get the same message. Logout clears both cookies.
- **/api/auth/me:** returns the user when logged in. Returns 401 when logged out, for forged tokens, for tokens signed with another key, for unsigned tokens, and for deleted accounts.
- **/api/stats:** returns three whole numbers and updates when members join or finish workouts. It reveals nothing else.
- **/api/exercises:** returns all 30. Each of the 6 muscle-group filters returns its 5 exercises, and unknown groups are rejected.
- **/api/workouts and /api/sets:** the full lifecycle, from creating today's workout to adding, removing, starting, ticking, unticking, finishing and restarting. Also: duplicates are ignored, 5 adds at the same moment create only one workout, and a finished workout is locked.
- **Security:** user B cannot see, tick, start, finish, restart or change user A's workout or sets. Every protected route returns 401 without a login. Private helper files cannot be reached as routes.
- **Streak (fixed fake dates and backdated workouts):** no workouts gives 0, and 3 days in a row gives 3. A missed day resets the current streak but keeps the best one. Today plus yesterday gives 2, and yesterday only still counts. Also covered: same-day duplicates, future dates, month, year and leap-day boundaries, and daylight-saving changes.
- **Weekly chart:** always 7 days, today last, minutes on the right days, older workouts ignored. The week-on-week change is correct, or empty instead of NaN.
- **Progress rings:** counted against the user's goals for the current Monday-to-Sunday week, including the number of goals hit. The ring fill is tested with 13 tricky inputs, including over-goal, zero goal, negative numbers, NaN, blank and Infinity. It never goes above 100% and never shows NaN.

**Browser (`tests/e2e`), on desktop Chrome and an iPhone-size screen**
- **Landing page:** "PulseFit" appears in the navbar, the headline and the tab title. The counters really animate from 0 up to the real number.
- **Start Your Workout:** takes a logged-out visitor to sign up.
- **The full journey:** sign up, land on the Dashboard, and see your name and the logout button in the navbar. Check each Library filter, then add 2 exercises. The Dashboard shows the workout, and Start opens Live Workout. The rest timer counts down from the exercise's rest time. Tick every set, and the workout finishes with confetti. The Dashboard streak, chart and rings update. Refreshing keeps everything. After logout, every protected page redirects to login. Logging back in shows the same saved data.
- **No console errors or warnings:** checked automatically in every browser test, on every page.
- **Accessibility (axe):** button and link names, image alt text, form labels and colour contrast. Checked on every page in the dark theme, and in the light theme as well.
- **No sideways scrolling at 375px:** checked on every page.
- **Keyboard:** Tab reaches "Start Your Workout", it shows a focus outline, and Enter opens it. A full keyboard-only login works, as do the "Add to today's workout" and "Set" buttons.

## Bugs found and fixed

| # | Bug | How it was found | Fix |
|---|---|---|---|
| 1 | Sign-up accepted weak passwords such as `abcdefghij`, `1234567890` or 10 spaces | Backend test | Passwords now need 8+ characters with at least one letter and one number. The sign-up form hint says so |
| 2 | Logged-out visitors caused a "401" console error on every page load, which also cost Lighthouse points | Code review, then confirmed by Lighthouse | Login now also sets a harmless readable `pulsefit_logged_in` cookie. The app only asks the server who you are when that cookie exists. The real session cookie stays httpOnly |
| 3 | Logging out from an app page landed on the Login page instead of the landing page | Browser test | The app now leaves the protected page before clearing the session |
| 4 | On phones the navbar showed no user name | Requirement check | The phone top bar now shows your first name |
| 5 | Live Workout could flash "No workout yet today" for a moment before your workout appeared | Code review | It shows the loading skeleton until the workout is ready |
| 6 | Logged-in users briefly saw a "Log in" button in the sidebar, and the sidebar jumped | Lighthouse layout-shift audit | Same-size placeholders show while the session loads |
| 7 | Pages jumped sideways when they became tall enough to scroll | Lighthouse layout-shift audit | The scrollbar space is now reserved |
| 8 | The "15s" rest button and the mobile "Train" tab had screen-reader names that didn't match their visible text | Accessibility test | Their labels now include the visible text |
| 9 | In the light theme, lime, cyan and coral text and the difficulty labels were too faint to read | Accessibility contrast test | Light theme only: slightly darker shades of the same colours. The dark theme is unchanged |
| 10 | The landing page had no main landmark and skipped a heading level | Lighthouse | Added a main landmark. The decorative card title is no longer a heading, and it looks identical |
| 11 | robots.txt was invalid because the app's HTML was served in its place | Lighthouse SEO | Added a real robots.txt |
| 12 | The Dashboard "Start" link wasn't descriptive for search engines and screen readers | Lighthouse SEO | Added hidden text so it reads "Start today's workout". It still shows "Start" |
| 13 | The landing page downloaded the 385 KB chart library and every app page up front | Lighthouse performance | Pages now load on demand. The page being opened starts downloading immediately |
| 14 | The Google Fonts stylesheet blocked the first paint | Lighthouse performance | Fonts now load without blocking. Text shows immediately and swaps to the brand fonts |
| 15 | The animated counters re-rendered the whole component on every frame, and the dashboard flame pulse ran in JavaScript | Lighthouse main-thread audit | Counters write the number directly. The flame uses a CSS animation with the same motion |
| 16 | React Router printed "future flag" warnings in the console | Code review | Turned on the two future flags it asks for |
| 17 | Broken JSON sent to the local API got an HTML error page back instead of a JSON error | Found while building the test setup | Added a JSON error handler, which matches Vercel's behaviour |
| 18 | If the server crashed without a JSON reply, the app showed a vague "Request failed" message | Code review | It now shows the clear "Can't reach the server" message |
| 19 | The local dev server could reload the page during the first visit while it re-bundled libraries | Browser test, on the very first run | All libraries are pre-bundled at startup |

Three test mistakes were also fixed along the way. They were problems in the tests, not the app. One test sent two cookies at once. One read the cards before the filter animation finished. One read a counter before it was scrolled into view.

## Lighthouse scores

These scores come from production builds served locally. Mobile uses Lighthouse's default simulated slow 4G connection and 4x slower CPU, and each mobile score is the median of 3 runs. The dashboard was audited while logged in, with a workout planned.

**Before** (the build from before this testing round, one run each):

| Page | Performance | Accessibility | Best Practices | SEO |
|---|---|---|---|---|
| Mobile · Landing | **80** | 96 | 96 | 92 |
| Mobile · Login | **87** | 100 | 96 | 91 |
| Mobile · Dashboard | **86** | 100 | 100 | **82** |
| Desktop · Landing | 98 | 96 | 96 | 92 |
| Desktop · Login | 99 | 100 | 96 | 91 |
| Desktop · Dashboard | 96 | 100 | 100 | **82** |

**After** (the final build that is being shipped):

| Page | Performance | Accessibility | Best Practices | SEO |
|---|---|---|---|---|
| Mobile · Landing | 93 | 100 | 100 | 100 |
| Mobile · Login | 99 | 100 | 100 | 100 |
| Mobile · Dashboard | 91 | 100 | 100 | 100 |
| Desktop · Landing | 99 | 100 | 100 | 100 |
| Desktop · Login | 100 | 100 | 100 | 100 |
| Desktop · Dashboard | 100 | 100 | 100 | 100 |

Accessibility, Best Practices and SEO are 100 on every page.

Mobile Performance varies with how busy the laptop is. Earlier runs of this same code scored 88 to 89 on the mobile landing and dashboard pages. The last few points are limited by the design itself: the full-page fade-in, the large glowing blurs and the constant animations. I kept all of those as you asked.

## Please check by hand

1. **The live Neon database.** No Neon connection string was available, so everything was tested on the local database, which runs the same Postgres SQL. After you add `DATABASE_URL` and `JWT_SECRET` in Vercel, run `npm run db:setup` once with the Neon `DATABASE_URL` in your .env. Then sign up and finish one workout on the deployed site.
2. **A real iPhone in Safari.** The "iPhone" tests used Chrome at iPhone size. Safari's engine wasn't tested, so check the glass blur, the rest timer and the confetti on a real phone.
3. **The light theme colours.** Lime, cyan and coral text and the difficulty labels are now a little darker in the light theme only. Check you're happy with them.
4. **Midnight behaviour.** "Today" follows the time zone of your browser. A workout finished just after midnight counts for the new day.
5. **Login rate limiting.** Nothing currently limits repeated login attempts. Consider turning on Vercel's firewall rate limiting for `/api/auth/login` after deploying.
6. **Mobile speed after deploy.** Re-check with PageSpeed Insights on the real Vercel address. Vercel's network usually scores the same or better than this laptop.
7. **Screen reader spot check.** The automated checks pass, but a quick try with Windows Narrator or iPhone VoiceOver is worth a few minutes.
