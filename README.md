# ProjectFlow — Company Project Management System

A full-stack SaaS application built with React + Vite (frontend) and Node.js + Express + Prisma (backend).
Designed with the Profitcast dark UI aesthetic.

## 🗂 Project Structure

```
projectflow/
  frontend/          # React + Vite + Tailwind
    src/
      pages/         # LoginPage, DashboardPage, ProjectsPage, ...
      components/    # Layout, Sidebar
      store/         # Zustand auth store
      api/           # Axios instance
  backend/           # Express API
    src/
      routes/        # auth, users, projects, tasks, timesheets, reports, dashboard
      middleware/    # JWT auth middleware
    prisma/          # Schema + seed
  .env.example
  README.md
```

## 🔐 Roles

| Role | Access |
|------|--------|
| Managing Director | Full access to all features |
| HR Manager | Manage users, projects, reports |
| Team Lead | Create/manage projects and tasks |
| Employee | View assigned tasks, log timesheets |

## 🚀 Quick Start

### 1. Setup Environment

```bash
# Copy environment files
cp .env.example backend/.env
# Edit backend/.env with your database URL and JWT secret
```

### 2. Setup Database (PostgreSQL / Supabase)

```bash
cd backend
npm install

# Push schema to database
npx prisma db push

# Seed with demo data
node prisma/seed.js
```

### 3. Start Backend

```bash
cd backend
npm run dev
# API runs at http://localhost:3001
```

### 4. Start Frontend

```bash
cd frontend
npm install
npm run dev
# UI runs at http://localhost:5173
```

## 🔑 Demo Accounts (after seeding)

| Email | Password | Role |
|-------|----------|------|
| admin@projectflow.io | password | Managing Director |
| hr@projectflow.io | password | HR Manager |
| lead@projectflow.io | password | Team Lead |
| employee@projectflow.io | password | Employee |

## 🌐 API Endpoints

```
POST   /api/auth/login
POST   /api/auth/register
GET    /api/auth/me

GET    /api/dashboard/stats

GET    /api/projects
POST   /api/projects
GET    /api/projects/:id
PUT    /api/projects/:id
DELETE /api/projects/:id
POST   /api/projects/:id/members
GET    /api/projects/:id/milestones
POST   /api/projects/:id/milestones
GET    /api/projects/:id/activities

GET    /api/tasks
POST   /api/tasks
GET    /api/tasks/:id
PUT    /api/tasks/:id
DELETE /api/tasks/:id
GET    /api/tasks/:id/comments
POST   /api/tasks/:id/comments

GET    /api/timesheets
POST   /api/timesheets
PATCH  /api/timesheets/:id/approve

GET    /api/reports
POST   /api/reports
DELETE /api/reports/:id

GET    /api/users
POST   /api/users
GET    /api/users/:id
PUT    /api/users/:id

GET    /api/notifications
PATCH  /api/notifications/:id/read
PATCH  /api/notifications/read-all
```

## 🗄️ Database Setup with Supabase

1. Create a new Supabase project at https://supabase.com
2. Go to Settings → Database → Connection String (URI)
3. Set `DATABASE_URL` in `backend/.env`
4. Run `npx prisma db push` to create tables

## 🎨 Design System

Uses the Profitcast dark design system:
- Background: `#02040A`
- Surface: `#09090B`  
- Brand Teal: `#00A1C7`
- Brand Mint: `#00FFAA`
- Font: Rubik (headings), Inter (body), JetBrains Mono (data)

## 🏗️ Tech Stack

**Frontend:** React 18, Vite, TypeScript, Tailwind CSS, Zustand, Axios, React Router v6, date-fns, Lucide React

**Backend:** Node.js, Express, Prisma ORM, PostgreSQL, JWT, bcryptjs
