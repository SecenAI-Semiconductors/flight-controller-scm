# Flight Controller SCM

Internal Supply Chain Management dashboard for tracking flight controller units through design, manufacturing, QC, stock, orders, delivery, customer issues and warranty.

## Requirements

- **Node.js** 20+
- **MongoDB Atlas** (replica set required — standalone MongoDB will not work; the app uses Mongoose transactions for multi-document actions and will fail to start without replica set support)

## Project Structure

```
flight-controller-scm/
├── server/   # Express 5 API (CommonJS)
├── client/   # React 19 + Vite (JSX)
└── README.md
```

`client/` and `server/` are independent applications, each with their own `package.json`.

## Setup

### 1. Server

```bash
cd server
cp .env.example .env   # Edit with your values
npm install
npm run seed            # Creates admin + sample data (idempotent)
npm run dev             # Starts on PORT (default 4000)
```

### 2. Client

```bash
cd client
cp .env.example .env   # Edit with your values
npm install
npm run dev             # Starts on http://localhost:5173
```

## Environment Variables

### Server (`server/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | No | Server port (default: 4000) |
| `MONGO_URI` | Yes | MongoDB Atlas connection string |
| `JWT_SECRET` | Yes | JWT signing secret (min 32 characters) |
| `CLIENT_URL` | Yes | Client origin for CORS (e.g. `http://localhost:5173`) |
| `ADMIN_EMAIL` | Yes | Admin account email (used by seed script) |
| `ADMIN_PASSWORD` | Yes | Admin account password (used by seed script) |
| `WARRANTY_MONTHS` | Yes | Warranty duration in months from delivery date |
| `NODE_ENV` | No | `development` or `production` |

### Client (`client/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_BASE_URL` | Yes | Server API base URL (e.g. `http://localhost:4000/api`) |

## Important Notes

- **MongoDB Atlas (replica set) is required.** The application uses Mongoose transactions for atomic multi-document operations. A standalone MongoDB instance does not support transactions and the server will refuse to start.
- Only `.env.example` files are committed; `.env` files are gitignored.
- Single admin account only; no role-based access.
- All monetary values are in INR.
- Dates are stored in UTC.
