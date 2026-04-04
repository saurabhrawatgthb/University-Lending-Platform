# University Peer-to-Peer Lending Platform

A real-time campus lending platform where students can request and lend items quickly using request-offer matching.

## Project Snapshot

- Purpose: Reduce friction in short-term student borrowing and lending.
- Core flow: Request -> Offer -> Accept -> Complete transaction.
- Delivery model: Monorepo with separate backend and frontend modules.

## Tech Stack

- Backend: Java 21, Spring Boot 3.4.0
- Database: PostgreSQL (H2 in-memory for local development)
- Frontend: React + TypeScript + Vite
- Styling: Tailwind CSS
- Realtime: STOMP over WebSockets

## Core MVP Features

1. Request posting with urgency and location context.
2. Offer submission against open requests.
3. Instant notification updates for request/offer events.
4. Atomic acceptance flow that declines competing offers.

## Local Development

### Backend

1. Open a terminal in [backend](backend).
2. Run:

```bash
# Windows
.\gradlew.bat bootRun

# macOS/Linux
./gradlew bootRun
```

3. Service URL: http://localhost:8080
4. Optional H2 console: http://localhost:8080/h2-console
   - JDBC URL: jdbc:h2:mem:unilendingdb
   - User: sa
   - Password: (empty)

### Frontend

1. Open a terminal in [frontend](frontend).
2. Install dependencies and start the dev server:

```bash
npm install
npm run dev
```

3. UI URL: http://localhost:5173

## Repository Documentation

- [1_SYSTEM_ARCHITECTURE.md](1_SYSTEM_ARCHITECTURE.md): High-level component architecture.
- [2_DATABASE_SCHEMA.md](2_DATABASE_SCHEMA.md): Entity model and indexing strategy.
- [3_API_DESIGN.md](3_API_DESIGN.md): REST and WebSocket contracts.
- [4_CORE_BACKEND_LOGIC.md](4_CORE_BACKEND_LOGIC.md): Core backend behavior and flow.
- [5_STARTUP_EVOLUTION.md](5_STARTUP_EVOLUTION.md): Product evolution roadmap.

## Contribution and Change Tracking

- Contribution guide: [CONTRIBUTING.md](CONTRIBUTING.md)
- Changelog: [CHANGELOG.md](CHANGELOG.md)

## Scope Note

This update keeps backend and frontend implementation files untouched and applies only repository-level documentation/process improvements.
