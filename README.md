# ISKCON Juhu Self-Excellence

A full-stack platform for spiritual education, pilgrimage booking and community
programmes — built as one site with a public website, a student learning area, a
teacher panel and an admin panel.

## What it does

**Learning management**
Courses built from lessons, with video (YouTube or direct upload), PDFs and
attachments. Sequential lesson unlocking, free preview lessons, and watch
tracking that records which intervals of a video were actually seen, so skipping
ahead does not count as completion. Students keep notes pinned to a video
timestamp and ask questions through a doubt box.

**Assessment**
Question banks, an exam paper builder, assignment to students, timed attempts
with every response recorded, automatic scoring, and certificate requests
approved by the office.

**Enrolment and payment**
Courses can be free, require a document check, or be paid. Payment is verified
manually: the student uploads proof, an administrator approves or rejects with a
reason, and access is granted server-side on approval.

**Pilgrimages**
Trips with unlimited itinerary days, photo galleries, inclusions and exclusions,
FAQs and a trip guide PDF that unlocks only once a booking is confirmed. Seat
counts are derived from confirmed bookings. Taxes are configurable (percentage
or fixed, per booking or per traveller). Travellers pay by UPI, QR or bank
transfer and upload a receipt.

**Sunday classes**
Listing and detail pages with the running order, what to expect, a photo gallery
and a downloadable handout. Registrations land in the admin panel.

**Support desk**
A chat on every page for signed-in users, with an automatic first reply and
hand-off to a course teacher or the office. Real-time over socket.io, with file
attachments.

**Staff roles and accountability**
Five role levels from owner to read-only, with view/create/edit/delete
permissions set separately across thirty admin sections. Every change is logged
with the record before and after; deletions restore in one click. Login sessions
record device, browser and IP.

## Stack

- **Frontend** — React 18, Vite 6, React Router 7, Tailwind CSS 3
- **Backend** — Node.js, Express, Socket.IO
- **Database** — MongoDB with Mongoose
- **Auth** — JWT with bcrypt password hashing

## Running locally

Requires Node.js 22+ and a running MongoDB instance.

```bash
# Run everything from the repository root
cp backend/.env.example backend/.env     # then fill in real values
npm install
npm run dev

# Frontend: http://localhost:5173
# Backend:  http://localhost:5055
```

For an isolated local backend backed by the development database runtime, use
`npm run dev:local`. Individual services remain available through
`npm run dev:backend` and `npm run dev:frontend`.

### Root commands

| Command | Purpose |
| --- | --- |
| `npm install` | Install frontend and backend dependencies using the single root lockfile. |
| `npm run dev` | Start both development services together. |
| `npm run dev:local` | Start both services with the local-only backend runtime. |
| `npm test` | Run backend unit and integration tests. |
| `npm run build` | Build the production frontend. |
| `npm run audit` | Audit every workspace from the root. |
| `npm run verify` | Run architecture checks, tests, build, and audits. |

### Configuration

Backend settings live in `backend/.env` — see `backend/.env.example` for the
shape. `JWT_SECRET` must be a long random string in production: anyone holding
it can mint valid tokens.

## Repository layout

```
backend/
  src/
    server.js     Express app, routes, socket handlers
    models.js     Mongoose schemas
    seed.js       Sample data
frontend/
  src/
    pages.jsx     Public pages, dashboards, admin screens
    components.jsx  Navbar, footer, layouts, shared UI
    trips.jsx / tripDetail.jsx / adminTrips.jsx
    classes.jsx / adminClasses.jsx
    adminAccess.jsx   Staff roles, activity trail, sessions
scripts/
  dev.mjs             Cross-platform frontend/backend development runner
```

## Not included in this repository

User uploads (`backend/uploads/`) are excluded. They contain devotee payment
receipts, enrolment documents and chat attachments, which are private records
and do not belong in source control. `.env` files are excluded for the same
reason.

## Notes

Email delivery is not yet configured — OTP codes are generated but not sent, and
notifications are in-app only. Connecting a mail service is the main outstanding
piece before production use.
