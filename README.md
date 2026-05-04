# Signflow Frontend

A modern React application for managing digital document signatures. Built with Vite, React 18, TailwindCSS, and TanStack Query.

## Tech Stack

- **React 18** — UI framework
- **Vite** — Build tool and dev server
- **React Router v6** — Client-side routing
- **TailwindCSS** — Utility-first styling with dark mode support
- **TanStack Query** — Server state management and caching
- **React Hook Form + Zod** — Form handling and validation
- **Axios** — HTTP client with interceptors
- **react-pdf** — PDF rendering and preview
- **react-signature-canvas** — Digital signature capture
- **Lucide React** — Icon library

## Getting Started

### Prerequisites

- Node.js 18+
- Backend API running on `http://localhost:8000`

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

The app runs on `http://localhost:3000` and proxies API requests to the backend.

### Build

```bash
npm run build
```

### Lint

```bash
npm run lint
```

## Project Structure

```
src/
├── api/            # API clients (axios instance + resource modules)
├── components/     # Reusable UI components
│   ├── document/   # Document-specific components
│   ├── shared/     # Shared layout components
│   └── ui/         # Base UI primitives (Button, Input, Modal, etc.)
├── context/        # React context providers (Auth, Theme)
├── hooks/          # Custom React Query hooks
├── layouts/        # Page layouts (Auth, Dashboard, Public)
├── pages/          # Route-level page components
├── utils/          # Helpers and constants
└── main.jsx        # App entry point
```

## Environment Variables

Create a `.env` file:

```
VITE_API_URL=http://localhost:8000/api
```

## Features

- User authentication with email/password and Google OAuth
- Document upload, signing field placement, and sending
- Contact and company management
- Real-time document status tracking
- Audit log history
- Dark mode with system preference detection
- Responsive design (mobile + desktop)
