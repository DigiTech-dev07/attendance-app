# ⚡ DG Tech Offsite 2.0 — Attendance & Live Vehicle Tracking Web Application

A complete, functional, production-ready, mobile-first web application engineered for the **DG Tech Offsite 2.0**. Designed for high reliability, live GPS telemetry, strict attendance gatekeeping, fleet privacy aggregation, and seamless deployment on **Vercel** and **MongoDB Atlas**.

---

## 📸 Design Language & Visual Aesthetic

Styled with a high-energy **Gen-Z Neo-Brutalist** aesthetic:
- **Canary Sunshine (`#FEE135`)**: Energetic primary branding and hero backdrops.
- **Punchy Coral (`#FF4D30`)**: Action accents, alert badges, and Car markers.
- **Electric Blue (`#3B82F6`)**: Bus markers, route navigation lines, and selection states.
- **Mint Green (`#10B981`)**: Attendance verified stamps and active GPS indicators.
- **Solid Ink (`#111827`) & Brutalist Shadows**: `shadow-[4px_4px_0px_#000]`, rounded-2xl cards with thick 2.5px/3px borders, sticker pill tags, and dynamic confetti celebrations.

---

## 🛠️ Technology Stack

- **Frontend**: React 19, Vite, Tailwind CSS, Lucide Icons, Canvas Confetti.
- **Maps & GIS**: Leaflet, React-Leaflet, OpenStreetMap with custom DOM DivIcon markers and route polylines.
- **Backend**: Node.js, Express.js (REST APIs, CORS, body parsers, centralized error handling).
- **Real-time Engine**: Server-Sent Events (SSE) `/api/admin/stream` + high-frequency (4s) polling fallback for zero missed coordinate drops on serverless edge networks.
- **Database**:
  - **Production**: MongoDB Atlas via Mongoose with connection pooling and lambda cache.
  - **Local Development**: Built-in atomic JSON persistence (`server/data/db.json`), running out-of-the-box with zero database daemon prerequisites.
- **Authentication**: JWT tokens, bcryptjs password hashing, Google Sign-In profile sync, and isolated Admin/CTO credentials.
- **Deployment**: Vercel Serverless Functions (`api/index.js`, `vercel.json`).

---

## 🌟 Core Features & Strict Business Logic

### 1. Initial Event Configuration
- **Event Name**: DG Tech Offsite 2.0
- **Departure**: 10 October 2026 | `G Corp Tech Park` → `Anchaviyo Resort`
- **Return**: 12 October 2026 | `Anchaviyo Resort` → `G Corp Tech Park`
- **Fleet**: 2 Buses (Bus 1, Bus 2) + Private Carpools
- **Configurability**: Dates, locations, tracking duration, and return trip status are dynamically editable by administrators from the dashboard without redeploying code.

### 2. Employee Registration & Google Sign-In
- First screen: **DG Tech Offsite 2.0 — Employee Registration & Login**.
- Supports standard email/password and **"Continue with Google"**.
- Google authentication creates a unique employee identity without duplicate accounts.

### 3. Travel Mode Selection
- Large, mobile-optimized cards:
  - 🚗 **Coming by Car**: Car owner (automatically logged-in employee), mandatory vehicle plate number (e.g. `MH 04 AB 1234`), mandatory car model (e.g. `Hyundai Creta`), dynamic passenger management (add, edit, remove with live count), starting location, and travel route.
  - 🚌 **Coming by Bus**: Employee self-selection between **Bus 1** and **Bus 2** (no pre-assignment by admin).
- Pre-trip editing allowed before tracking commences.

### 4. Trip-Day Features & Strict Gatekeeper
The application strictly enforces the following validation chain:
```
Share Live Location
        ↓
Device Location Permission Granted (navigator.geolocation.watchPosition)
        ↓
Verified GPS Coordinates Received by Backend
        ↓
Mark Attendance Button Unlocked
        ↓
Attendance Recorded (Confetti Celebration & Confirmation Card)
```
- **Strict Invariant**: If location sharing is inactive, the Attendance button is disabled with:
  > *"Attendance: Disabled. Reason: Location sharing is required to mark attendance."*

### 5. 4-Hour Live GPS Tracking Limit
- Location tracking session runs with `navigator.geolocation.watchPosition()`.
- Active countdown timer (`03:59:45 remaining`).
- Automatically terminates after 4 hours (240 minutes): stops GPS watch, stops telemetry transmissions, updates status to `Tracking Expired`, and alerts user while keeping attendance marked.
- Supports manual **Stop Trip** at any time.

### 6. Fleet Privacy & Aggregation (Admin Map)
- **Strict Privacy Invariant**: The Admin map displays **VEHICLES ONLY** (🚌 Bus 1, 🚌 Bus 2, 🚗 Car plate).
- **Never** shows individual employee dots or passenger locations on the live map.
- Multiple passengers in a car or bus aggregate their status under the vehicle entity.
- Map features: Interactive popups, route polyline, vehicle status filters (`All`, `Buses Only`, `Cars Only`, `Bus 1`, `Bus 2`).

### 7. Organizer & CTO Admin Panel
- Secure admin authentication via server environment variables (`ADMIN_EMAIL`, `ADMIN_PASSWORD`).
- Real database statistics (Total registered employees, Present count, Not marked, Active GPS vehicles, Buses, Cars).
- **Zero Dummy Data**: Clean empty states when database is fresh.
- Bus View: Tabbed roster for Bus 1 and Bus 2 employees with attendance and trip status.
- Car View: List of registered cars, owner, passengers list, and tracking status.
- Master Employee Roster: Searchable employee table.

### 8. Dynamic Return Trip Workflow
- Controlled directly by the administrator via the **Return Trip Flow** toggle.
- When disabled: Employees see a clean *"Return Trip: Coming Soon"* card.
- When enabled: Unlocks the full return trip workflow (`Anchaviyo Resort` → `G Corp Tech Park`) with location sharing, gatekept attendance, 4-hour countdown, and return map visualization.

---

## 🚀 Deployment Guide (Vercel)

### Step 1: Push Code to GitHub / Git Repository
```bash
git init
git add .
git commit -m "feat: DG Tech Offsite 2.0 production release"
git remote add origin <your-repo-url>
git push -u origin main
```

### Step 2: Import Project in Vercel
1. Go to [vercel.com](https://vercel.com) and click **"Add New Project"**.
2. Select your repository.
3. Framework Preset: **Vite** (Root Directory: `./`).
4. Build Command: `npm run build` (outputs to `dist`).

### Step 3: Configure Environment Variables in Vercel
In the Vercel Project Dashboard, navigate to **Settings** → **Environment Variables** and add:

| Variable | Description | Example / Default |
| :--- | :--- | :--- |
| `MONGODB_URI` | MongoDB Atlas Connection String | `mongodb+srv://<user>:<password>@cluster.mongodb.net/dg_offsite?retryWrites=true&w=majority` |
| `JWT_SECRET` | Secret key for signing JWT tokens | `super_secure_random_production_secret_key_2026` |
| `ADMIN_EMAIL` | Organizer / CTO admin email | `admin@dgtech.com` |
| `ADMIN_PASSWORD` | Organizer / CTO admin password | `DGTech@2026!Admin` |
| `GOOGLE_CLIENT_ID` | Optional Google OAuth Client ID | `your-google-client-id.apps.googleusercontent.com` |
| `CLIENT_URL` | Production application URL | `https://your-app.vercel.app` |

### Step 4: Deploy!
Click **Deploy**. Vercel will build the frontend assets and deploy the backend serverless function (`api/index.js`) automatically via `vercel.json`.

---

## 💻 Local Development Quickstart

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
*(By default, `.env` runs out-of-the-box using the local file store if `MONGODB_URI` is left blank).*

### 3. Start Development Server
```bash
npm run dev
```
- Client runs on: `http://localhost:5173`
- Backend API runs on: `http://localhost:5000`
- API Proxy: `/api` automatically proxies to `http://localhost:5000/api`

### 4. Admin Credentials
- **Email**: `admin@dgtech.com`
- **Password**: `DGTech@2026!Admin`
- **Admin Portal**: `http://localhost:5173/admin/login`

---

## 🧪 Testing & Verification

A test script is included in `scratch/testApi.mjs` verifying all 10 core endpoints:
- Health check
- Admin authentication
- Clean empty database metrics (0 dummy users)
- Employee registration & login
- Car travel registration with passengers
- Gatekeeper validation (rejects marking attendance when GPS is inactive with HTTP 400)
- GPS activation (`/api/trip/location/start`)
- Attendance marking with active GPS
- Vehicle-only admin map aggregation (verifies employee locations are not exposed)
- Return-trip toggle enable and disable

Run the automated test suite with:
```bash
node server/server.js   # in one terminal
node scratch/testApi.mjs # in another terminal
```

---

## 📄 License
Built for **DG Tech Offsite 2.0**.
