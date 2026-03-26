# LumiEMI — Greenhouse Gas Emissions Dashboard

## Table of Contents

- [LumiEMI — Greenhouse Gas Emissions Dashboard](#lumiemi--greenhouse-gas-emissions-dashboard)
  - [Table of Contents](#table-of-contents)
  - [Tech Stack](#tech-stack)
  - [Prerequisites](#prerequisites)
  - [Quick Start](#quick-start)
  - [Manual Setup](#manual-setup)
    - [1. Database](#1-database)
    - [2. Backend](#2-backend)
    - [3. Frontend](#3-frontend)
  - [Environment Variables](#environment-variables)
    - [Backend (`backend/.env`)](#backend-backendenv)
    - [Frontend (`frontend/.env`)](#frontend-frontendenv)
  - [API Documentation](#api-documentation)
    - [How to Authenticate](#how-to-authenticate)
  - [API Endpoints](#api-endpoints)
    - [Authentication](#authentication)
    - [Countries](#countries)
    - [Emissions](#emissions)
  - [Testing](#testing)
    - [Backend](#backend)
    - [Frontend](#frontend)
  - [Deployment](#deployment)

---


## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Vue 3, Vite, Tailwind CSS v4, ECharts, Pinia, Vue Router |
| **Backend** | Node.js, Express 5, Prisma ORM, JWT, Swagger |
| **Database** | PostgreSQL 15 (via Docker) |
| **Testing** | Vitest, Supertest, Vue Test Utils |
| **CI/CD** | GitHub Actions |

---

## Prerequisites

- [Node.js](https://nodejs.org/) v18+ and npm
- [Docker](https://www.docker.com/) (for local PostgreSQL) **or** a remote PostgreSQL instance (e.g., Supabase)

---

## Quick Start

Run the entire stack with a single command:

```bash
chmod +x run.sh
./run.sh
```

This will:
1. Start PostgreSQL via Docker Compose
2. Install backend dependencies and start the API server on `http://localhost:3001`
3. Install frontend dependencies and start the dev server on `http://localhost:5173`

Press `Ctrl+C` to stop all services.

---

## Manual Setup

### 1. Database

**Option A: Local Docker (recommended)**

```bash
docker compose up -d
```

This starts PostgreSQL 15 on port `5432` with:
- User: `admin` / Password: `password123`
- Database: `emissions_db`

**Option B: Remote PostgreSQL (e.g., Supabase)**

Set the `DATABASE_URL` in `backend/.env` to your connection string.

---

### 2. Backend

```bash
cd backend

# Install dependencies
npm install

# Copy environment template and configure
cp .env.example .env
# Edit .env with your database URL and JWT secret

# Generate Prisma client & run migrations
npx prisma generate
npx prisma db push

# Seed the database with World Bank emissions data
npx prisma db seed

# Start development server
npm run dev
```

The API will be available at `http://localhost:3001`.

---

### 3. Frontend

```bash
cd frontend

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`.

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | — (required) |
| `PORT` | API server port | `3001` |
| `JWT_SECRET` | Secret key for signing JWT tokens | `locrab_super_secret_key_2026` |
| `ADMIN_USER` | Admin login username | `admin` |
| `ADMIN_PASS` | Admin login password | `password123` |
| `BASE_URL` | Public base URL (for Swagger) | `http://localhost:3001` |

### Frontend (`frontend/.env`)

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API base URL | `http://localhost:3001/api` |

---

## API Documentation

Interactive Swagger UI is available at:

```
http://localhost:3001/api-docs
```

Use the **Authorize** button (🔒) to enter your JWT token for testing protected endpoints.

### How to Authenticate

1. Call `POST /api/auth/login` with `{ "username": "admin", "password": "password123" }`
2. Copy the returned `token`
3. Click **Authorize** in Swagger UI and enter: `<your_token>`
4. All subsequent requests will include the authentication header

---

## API Endpoints

### Authentication

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/login` | No | Login and receive JWT token |

### Countries

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/countries` | No | List all countries |
| POST | `/api/countries` | Yes | Create a new country |
| PUT | `/api/countries/:id` | Yes | Update a country |
| DELETE | `/api/countries/:id` | Yes | Delete a country (cascades to emissions) |

### Emissions

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/emissions/trend?country=THA` | No | Emissions trend by country |
| GET | `/api/emissions/map?year=2020&gas=co2` | No | World map data for a year |
| GET | `/api/emissions/sector?country=THA&year=2020&gas=co2` | No | Sector breakdown |
| GET | `/api/emissions/filter?gas=co2&country=THA,USA&year=2020` | No | Filter emissions data |
| POST | `/api/emissions` | Yes | Create emission record |
| PUT | `/api/emissions/:id` | Yes | Update emission record |
| DELETE | `/api/emissions/:id` | Yes | Delete emission record |

---

## Testing

### Backend

```bash
cd backend
npm test
```

Runs integration tests with **Vitest** and **Supertest** against the Express app.

### Frontend

```bash
cd frontend
npm test
```

Runs component tests with **Vitest**, **jsdom**, and **Vue Test Utils**.

---

## Deployment

| Service | Platform | Notes |
|---------|----------|-------|
| **Database** | [Supabase](https://supabase.com/) | Free-tier PostgreSQL, set `DATABASE_URL` |
| **Backend** | [Render](https://render.com/) | Use `npm start` as start command |
| **Frontend** | [Vercel](https://vercel.com/) | Set `VITE_API_URL` to deployed backend URL |

