# University Peer-to-Peer Lending Platform 🎓🔄

A decentralized, real-time matchmaking platform designed for university environments where students can borrow and lend items among themselves seamlessly.

> **Why?** Frictionless sharing! Need a Mac Charger for an exam? Post an urgent request and let the platform's Smart Matching engine instantly notify nearby students who can lend it to you.

---

## 🏗️ Architecture Stack

This project is built using a modern, scalable, modular architecture:

*   **Backend Engine:** Java 21 & Spring Boot 3.4.0
*   **Database:** PostgreSQL (with H2 in-memory configured for local dev)
*   **Frontend UI:** React (TypeScript) + Vite
*   **Styling:** Tailwind CSS with minimal, glassmorphic UI elements
*   **Real-time Layer:** STOMP over WebSockets for instant matchmaking notifications

---

## 🔥 Core Features (MVP)

1.  **Demand Generation (Requests):** Students can post exactly what they need, tagged with an urgency level and location.
2.  **Supply Bidding (Offers):** Lenders nearby browse the live feed and can submit an offer to fulfill the request.
3.  **Real-Time Notifications:** As soon as an offer is made or a request is created nearby, the frontend instantly renders the alert without refreshing the page (WebSockets).
4.  **Transaction Handshake:** The requester chooses the best offer, and the system atomically processes the transaction, declining all other competing offers.

---

## 🛠️ How to Run Locally

### 1. Start the Spring Boot Backend

The backend is configured to use an in-memory database out of the box so you don't need to spin up Postgres immediately.

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Run the Gradle bootRun task:
   ```bash
   # On Windows
   .\gradlew.bat bootRun

   # On Mac/Linux
   ./gradlew bootRun
   ```
3. The server will start on `http://localhost:8080`.
4. *Optional:* Access the database console at `http://localhost:8080/h2-console` (URL: `jdbc:h2:mem:unilendingdb`, username: `sa`, no password).

### 2. Start the Vite React Frontend

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install Node dependencies:
   ```bash
   npm install
   ```
3. Boot the development server:
   ```bash
   npm run dev
   ```
4. Open the UI at `http://localhost:5173`.

---

## 📁 System Design Documentation

If you are looking to evolve or construct upon this architecture, check out the detailed system design plans included in the root directory:

*   `1_SYSTEM_ARCHITECTURE.md`: High-Level component design.
*   `2_DATABASE_SCHEMA.md`: ER Diagram & Indexing strategies.
*   `3_API_DESIGN.md`: HTTP REST & WebSocket endpoint contracts.
*   `4_CORE_BACKEND_LOGIC.md`: Snippets for transaction racing & smart routing.
*   `5_STARTUP_EVOLUTION.md`: Phase 3 scale & AI integration roadmap.
