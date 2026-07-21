# 🚀 Real-Time Enterprise Reverse Auction & Bidding App

An enterprise-grade, high-performance **Reverse Auction & Sourcing Platform** built for real-time competitive procurement bidding. In a reverse auction, suppliers bid lower prices for items, where the **lowest price gets Rank #1**.

---

## 📌 About the Project

This platform allows enterprise procurement teams (Creators) to host sourcing events with custom or uploaded Excel datasets (containing up to 1,800+ item rows). Suppliers (Participants) compete live in real-time to offer the lowest competitive prices. 

Key Highlights:
- **Sub-millisecond ($<1\text{ms}$) Rank Calculations**: Powered by Redis Sorted Sets and atomic Lua scripts.
- **Search-Bar Style 1-Second Auto-Debounced Bidding**: Type a bid, and it automatically syncs in 1 second.
- **Role-Based Privacy**: Participants see ONLY their own bids and ranks; competitor prices and identities are masked. Creators see a full live observation dashboard.
- **Fault Tolerance**: Automatic fallback to PostgreSQL and auto-rehydration on Redis reconnects.
- **AI Analytics Chatbot**: Post-event analytics powered by Google Gemini 2.5 Flash (`gemini-2.5-flash`).

---

## 🛠️ Tech Stack

### **Frontend (`site/`)**
- **Framework**: Next.js 14 (App Router) & React 18
- **Language**: TypeScript
- **Styling**: Vanilla CSS, Tailwind CSS, Lucide Icons
- **Real-Time Communication**: Socket.io Client
- **Performance**: `react-window` DOM virtualization for 60 FPS rendering on 1,800+ item rows
- **State & HTTP**: Axios, Zustand, JS-Cookie

### **Backend (`api/`)**
- **Runtime**: Node.js & Express.js with TypeScript
- **Database**: PostgreSQL (Relational persistence, DDL schemas, and SQL window functions)
- **In-Memory Cache**: Redis Sorted Sets (`ZADD`, `ZRANK`) & Lua Scripts
- **Queue Workers**: BullMQ Write-Behind Queue for async database persistence
- **WebSockets**: Socket.io Server for real-time room broadcasts
- **AI Engine**: Google Gen AI SDK (`gemini-2.5-flash`)

---

## 📁 Project Structure

### **Backend Directory Structure (`api/`)**
```text
api/
├── src/
│   ├── app/                # Express App Setup & Routes Mapping
│   ├── connection/         # Database Connections (PostgreSQL Pool & Redis Client)
│   ├── controllers/        # HTTP Request Handlers (Auth, Events, Bids)
│   ├── interface/          # TypeScript Interfaces & Types
│   ├── middleware/         # Auth (JWT), Cron Authorization & Error Handlers
│   ├── routes/             # Express Router Definitions (Users, Events, Bids, Cron)
│   ├── scripts/            # Database Seeding & Testing Automation Scripts
│   ├── services/           # Business Logic (Bid Calculation, AI Integration, Event Creation)
│   ├── sockets/            # Real-Time WebSocket Event Handlers (Room Join, Throttled Broadcasts)
│   ├── utils/              # Redis Lua Scripts, Gemini Config, Auto-Rehydration
│   └── workers/            # BullMQ Asynchronous Write-Behind Workers
├── package.json
└── tsconfig.json
```

### **Frontend Directory Structure (`site/`)**
```text
site/
├── src/
│   ├── app/                # Next.js Pages & Routes (Dashboard, Live Event, Past Event)
│   ├── components/         # Reusable UI Components & Live Event Tables
│   │   ├── create-event-components/    # Excel Virtualized Row/Column Builder
│   │   ├── event-component/            # Dashboard & My Event Cards
│   │   ├── live-event-components/      # Participant & Creator Live Tables
│   │   └── reusable-components/        # Navbar, Event Cards, Badges
│   ├── hooks/              # Custom Hooks (useLiveBiddingRoom)
│   ├── lib/                # Socket Client Services & Utilities
│   └── types/              # Frontend TypeScript Definitions
├── package.json
└── tsconfig.json
```

---

## 🔌 API Endpoints Reference

### **1. Authentication APIs (`/api/users`)**
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/users/register` | Register a new user | No |
| `POST` | `/api/users/login` | Authenticate user & issue JWT token | No |
| `POST` | `/api/users/logout` | Clear user session cookies | Yes |

### **2. Event Sourcing APIs (`/api/event`)**
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/event/create-event` | Create sourcing event with dynamic item rows | Yes |
| `GET` | `/api/event/events` | Fetch all public events grouped by status | No |
| `GET` | `/api/event/user-event` | Fetch events created by the logged-in user | Yes |
| `GET` | `/api/event/user-event/:id` | Fetch event details & item rows by Event ID | Yes |
| `POST` | `/api/event/getEntireEvent/:eventid` | Query Gemini 2.5 Flash AI Chatbot for past event analytics | Yes |

### **3. Live Bidding APIs (`/api/bid`)**
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/bid/place` | Place a bid on an item (REST Fallback) | Yes |
| `GET` | `/api/bid/leaderboard` | Get item leaderboard (Role-filtered & PII masked) | Yes |
| `GET` | `/api/bid/user-rank` | Fetch current user's ranks across all event items | Yes |

### **4. System & Cron APIs**
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | System health check (Redis & PostgreSQL status) | No |
| `POST` | `/update-event` | Auto-transition active events to ended when end_time passes | Cron Secret |
| `GET/POST` | `/api/event/eventEnd` | Finalize ended events and archive snapshot | Cron Secret |

---

## ⚙️ Functional Working

1. **Event Creation & Excel Upload**:
   - Creators define sourcing event parameters (Event Name, Description, Start & End Times) and upload Excel rows or use the dynamic item builder.
   - Items are stored in PostgreSQL via 500-item multi-row bulk SQL batch inserts.

2. **Live Bidding Room**:
   - Suppliers join the room (`event:{eventId}`) over WebSockets.
   - **Search-Bar Style Auto-Debounced Input**: Typing a lower price starts a 1-second auto-debounce timer. The bid auto-syncs without requiring button clicks.
   - **Reverse Auction Rule**: The lowest price receives **Rank #1** (Yellow Badge). Higher bids receive **Rank #2+** (Gray Badges).
   - **"Always Improve" Rule**: Redis Lua script rejects bids that do not strictly lower the supplier's previous bid amount.

3. **Role-Based Privacy Views**:
   - **Participant View**: Private view showing only the supplier's own bid and rank (`Rank #1` in Yellow, `Rank #2+` in Gray). Competitor bid prices, names, and emails are anonymized (`userName: "Competitor"`, `amount: null`).
   - **Creator View**: Observation Mode Dashboard with fixed row height (`h-14`), displaying Rank #1 leading bidder name, lowest price, and a compact **Popover Drawer** (`👥 Bidders`) showing all live participant ranks.

4. **Event Conclusion & Gemini AI Chatbot**:
   - When `NOW() >= end_time`, event cards automatically display **"Ended"**, input cells lock (`🔒 Bidding Closed`), and a red **"EVENT ENDED & BIDDING CLOSED"** banner is rendered.
   - Ended events archive a snapshot into PostgreSQL. Users can query the **Gemini 2.5 Flash AI Chatbot** (`/past-event/[id]`) for savings summaries, top suppliers, and procurement recommendations.

---

## 🛡️ Non-Functional Working

### **1. Performance & Scalability**
- **In-Memory Speed Engine**: Redis Sorted Sets calculate ranks in **$<1\text{ms}$** $O(\log N)$ time.
- **Write-Behind Queue**: BullMQ asynchronously persists bids to PostgreSQL in background worker threads without blocking HTTP responses.
- **Frontend DOM Virtualization**: `react-window` keeps memory footprint minimal, rendering 1,800+ item rows at 60 FPS smooth scrolling.
- **WebSocket Broadcast Throttled Window**: 200ms room broadcast batching prevents WebSocket fan-out storms during burst bidding.

### **2. Fault Tolerance & Recovery**
- **Fail-Closed Outage Handling**: If Redis experiences an outage, `placeBidService` catches the failure and returns a clean `503 Service Unavailable`: *"Bidding is temporarily paused — please try again shortly"*.
- **Automatic Cache Re-Hydration**: When Redis reconnects, `rehydrateRedisCacheFromPostgres()` queries PostgreSQL (`DISTINCT ON (user_id)`) and repopulates Redis ZSETs automatically in seconds.
- **HTTP Polling Fallback**: 3-second REST API polling fallback ensures rankings stay updated even if WebSockets are disconnected.

### **3. Security & Data Protection**
- **JWT Authentication**: Tokens stored in httpOnly/secure cookies.
- **PII & Price Masking**: Centralized helper (`maskLeaderboardForViewer`) masks competitor identities and bid amounts across all HTTP REST responses and WebSocket emissions.
- **Database Trigger Enforcement**: PostgreSQL trigger `trg_check_creator_bidding_bids` prevents event creators from placing bids at the database engine level.

---

## 🚦 How to Run Locally

### **Prerequisites**
- Node.js (v18+)
- PostgreSQL Database (running on port `5436` or configured via `DATABASE_URL`)
- Redis Server (running on port `6782` or configured via `REDIS_HOST`/`REDIS_PORT`)

### **1. Backend Setup (`api/`)**
```bash
cd api
npm install
npm test            # Run automated Jest test suite
npm run dev         # Start API backend server on http://localhost:5000
```

### **2. Frontend Setup (`site/`)**
```bash
cd site
npm install
npm test            # Run frontend component test suite
npm run dev         # Start Next.js frontend server on http://localhost:3000
```
