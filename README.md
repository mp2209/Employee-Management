<div align="center">

# 🚀 UDPT — Distributed Application

**A microservices-based voucher, campaign & reward-point management system**

[![Java](https://img.shields.io/badge/Java-21-ED8B00?logo=openjdk&logoColor=white)](https://openjdk.org/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.3.1-6DB33F?logo=springboot&logoColor=white)](https://spring.io/projects/spring-boot)
[![Spring Cloud](https://img.shields.io/badge/Spring%20Cloud-2023.0.1-6DB33F?logo=spring&logoColor=white)](https://spring.io/projects/spring-cloud)
[![React](https://img.shields.io/badge/React-18.3.1-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?logo=mysql&logoColor=white)](https://www.mysql.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-7.0-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/)

[Overview](#-overview) · [Architecture](#-architecture) · [Tech Stack](#-tech-stack) · [Getting Started](#-getting-started) · [API Reference](#-api-reference)

</div>

---

## 📑 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Architecture](#-architecture)
- [Project Structure](#-project-structure)
- [Tech Stack](#-tech-stack)
- [Configuration](#-configuration)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Database Setup](#database-setup)
  - [Running the Backend](#running-the-backend)
  - [Running the Frontend](#running-the-frontend)
- [Services & Ports](#-services--ports)
- [API Reference](#-api-reference)
- [Frontend Service Layer](#-frontend-service-layer)
- [Security Model](#-security-model)
- [Troubleshooting](#-troubleshooting)
- [License](#-license)

---

## 🎯 Overview

**UDPT** (*Ứng dụng Phân tán* — Distributed Application) is a full-stack voucher, campaign, and reward-point management platform built on a **microservices architecture**. The project demonstrates modern distributed-systems patterns including **service discovery**, **API gateway routing**, **polyglot persistence** (MySQL + MongoDB), and **asynchronous messaging** (RabbitMQ), paired with a React single-page application.

The system enables organizations to:

- 🎟️ Create and manage **marketing campaigns** and **sub-campaigns**
- 🎁 Distribute and redeem **vouchers** with unique codes
- ⭐ Award and track **reward points** between users
- 👤 Manage **user accounts**, **employees**, and **work schedules**

---

## ✨ Key Features

| Module | Capabilities |
| --- | --- |
| 🧭 **API Gateway** | Single entry point, request routing, load balancing via Spring Cloud Gateway |
| 🔍 **Service Discovery (Eureka)** | Auto-registration and health-checks for all services |
| 👤 **User Service** | User accounts, employees, profiles, worktimes, JWT auth (MySQL + JPA) |
| 📋 **Request Service** | Voucher & campaign request workflow (MongoDB) |
| ⭐ **Reward Point Service** | Reward ledger + scheduled monthly bonus (MongoDB) |
| 🐇 **RabbitMQ** | Async employee-created event between user-service and rewardPoint-service |
| 🖥️ **React Frontend** | Responsive UI, centralized API client, JWT auth, error boundaries, role-based routing |

---

## 🏛️ Architecture

```
┌─────────────────┐     ┌──────────────────┐
│  React Client   │────▶│   API Gateway    │  (port 8080)
│   (port 3000)   │     │  Spring Cloud GW │
└─────────────────┘     └────────┬─────────┘
                                 │
        ┌────────────────────────┼────────────────────────┐
        │                        │                        │
        ▼                        ▼                        ▼
┌───────────────┐       ┌────────────────┐      ┌─────────────────────┐
│  Eureka       │       │  User Service  │      │  Request Service    │
│  Server       │       │  (port 8081)   │      │  (port 8082)        │
│  (port 8761)  │       │  MySQL/JPA     │      │  MongoDB            │
└───────────────┘       └────────┬───────┘      └─────────────────────┘
                                 │
                                 │  RabbitMQ (employeeCreated)
                                 ▼
                        ┌─────────────────────┐
                        │ RewardPoint Service │
                        │ (port 8084)         │
                        │ MongoDB             │
                        └─────────────────────┘
```

All services register with **Eureka** at startup. The **API Gateway** resolves service names (`lb://...`) and routes HTTP traffic to the right backend. **User-service** publishes an `employeeCreated` event over **RabbitMQ** when a new employee is registered; **rewardPoint-service** consumes it to provision the matching point ledger and Vouchery profile.

---

## 📂 Project Structure

```
UDPT/
├── README.md
├── .gitignore
│
├── client/                       # React frontend
│   ├── package.json
│   ├── .env.example              # Template for client env vars
│   ├── public/
│   └── src/
│       ├── App.jsx               # Routes + ErrorBoundary
│       ├── index.jsx             # React root + providers
│       ├── containers/           # Feature pages
│       │   ├── Activities/       # (Manager) Strava club activities
│       │   ├── Approve/          # (Manager) Approve/reject requests
│       │   ├── CreateAccount/    # (Manager) Create user + employee
│       │   ├── EditProfile/      # Edit own profile
│       │   ├── Footer/
│       │   ├── GivePoint/        # (Manager) Award points to employees
│       │   ├── Header/
│       │   ├── HomePages/
│       │   ├── Leave/            # (Employee) Submit/view leave
│       │   ├── Profile/          # View own profile
│       │   ├── RightSidebar/     # Daily check-in / check-out
│       │   ├── UpdateTimeSheet/  # (Employee) Submit timesheet updates
│       │   ├── Voucher/          # Browse & redeem vouchers
│       │   └── WorkFromHome/     # (Employee) Submit WFH request
│       └── services/
│           ├── apiClient.js      # Centralized axios instances
│           ├── auth.jsx          # AuthProvider + useAuth hook
│           ├── ProtectedRoute.jsx
│           ├── ErrorBoundary.jsx
│           ├── CheckInProvider.jsx
│           └── CheckOutProvider.jsx
│
└── server/                       # Spring Boot multi-module Maven project
    ├── pom.xml                   # Parent POM (Spring Boot 3.3.1, Java 21)
    ├── .env.example              # Template for server env vars
    ├── api-gateway/              # Spring Cloud Gateway (port 8080)
    ├── eureka-server/            # Service discovery (port 8761)
    ├── user-service/             # User & employee domain (port 8081, MySQL)
    │   └── security/             # JwtService
    ├── request-service/          # Vouchers & campaigns (port 8082, MongoDB)
    └── rewardPoint-service/      # Reward ledger (port 8084, MongoDB)
```

---

## 🧰 Tech Stack

### Backend

- **Java 21**
- **Spring Boot 3.3.1** + **Spring Cloud 2023.0.1** (Gateway, Eureka)
- **Spring Data JPA** + **MySQL 8** — relational store for user-service
- **Spring Data MongoDB** + **MongoDB 7** — document stores for request/reward services
- **Spring AMQP / RabbitMQ** — async employee-created events
- **Spring Scheduling** — monthly reward bonus cron job
- **jjwt-style HMAC-SHA256** — built-in lightweight JWT signer
- **Maven** — multi-module build

### Frontend

- **React 18.3.1** + **React Router 6**
- **React-Bootstrap 2** + **Bootstrap 5**
- **Axios** — single shared client per service, with JWT interceptor
- **Sass** — component styles
- **React Context** — auth, check-in, check-out

---

## ⚙️ Configuration

All secrets are externalized through environment variables. See `.env.example` in both [`client/`](client/.env.example) and [`server/`](server/.env.example).

| Variable | Default | Where used |
| --- | --- | --- |
| `DB_URL` / `DB_USERNAME` / `DB_PASSWORD` | `jdbc:mysql://localhost:3306/ProfileService` / `root` / `mysql` | user-service |
| `MONGO_*` | localhost / 27017 / `mongo`/`mongo` / `RequestDB` or `RewardPointDB` | request-service, rewardPoint-service |
| `RABBITMQ_*` | localhost / 5672 / `guest`/`guest` | user-service |
| `JWT_SECRET` | dev placeholder | user-service |
| `VOUCHERY_API_URL` / `VOUCHERY_API_KEY` | sandbox URL / empty | rewardPoint-service |
| `REACT_APP_API_GATEWAY_URL` | `http://localhost:8080` | client (axios base) |
| `REACT_APP_VOUCHERY_*` | sandbox URL / empty | client (voucherApi) |
| `REACT_APP_STRAVA_*` | none | client (Activities) |

The `JwtService` automatically signs a 24-hour HS256 token at login. Secrets of 16+ bytes are required; 32+ bytes are recommended for production.

---

## 🚀 Getting Started

### Prerequisites

Make sure these are installed locally:

- **JDK 21** (`java -version`)
- **Maven 3.9+** (or use the bundled `mvnw` wrapper)
- **Node.js 18+** and **npm**
- **MySQL 8** running on `localhost:3306`
- **MongoDB 7** running on `localhost:27017`
- **RabbitMQ 3.x** running on `localhost:5672` (for the employee-created event flow)

### Database Setup

**MySQL** — create the user-service database:

```sql
CREATE DATABASE ProfileService;
```

**MongoDB** — create the auth user (databases are auto-created on first write):

```js
// in mongosh
use admin
db.createUser({
  user: "mongo",
  pwd:  "mongo",
  roles: [
    { role: "readWrite", db: "RequestDB" },
    { role: "readWrite", db: "RewardPointDB" }
  ]
})
```

**RabbitMQ** — defaults (`guest` / `guest`) are fine for local development.

### Running the Backend

Open three terminals. **Eureka must be first** so other services can register.

```bash
cd server

# 1. Eureka
./mvnw -pl eureka-server spring-boot:run         # → http://localhost:8761

# 2. Backend services
./mvnw -pl api-gateway spring-boot:run           # gateway :8080
./mvnw -pl user-service spring-boot:run          # :8081 (MySQL)
./mvnw -pl request-service spring-boot:run       # :8082 (MongoDB)
./mvnw -pl rewardPoint-service spring-boot:run   # :8084 (MongoDB)
```

Or build & run all at once:

```bash
cd server
./mvnw clean package -DskipTests
java -jar api-gateway/target/*.jar
java -jar user-service/target/*.jar
java -jar request-service/target/*.jar
java -jar rewardPoint-service/target/*.jar
```

### Running the Frontend

```bash
cd client
cp .env.example .env          # then edit values
npm install
npm start                     # → http://localhost:3000
```

All traffic from the React app should go through the gateway at `http://localhost:8080`. Configure it via `REACT_APP_API_GATEWAY_URL` in `client/.env`.

---

## 🔌 Services & Ports

| Service | Port | Database | Notes |
| --- | --- | --- | --- |
| `eureka-server` | `8761` | — | Service registry dashboard at `/` |
| `api-gateway` | `8080` | — | Single entry point for all client traffic |
| `user-service` | `8081` | MySQL `ProfileService` | Users, employees, profiles, worktimes, JWT login |
| `request-service` | `8082` | MongoDB `RequestDB` | Campaigns, sub-campaigns, vouchers, requests |
| `rewardPoint-service` | `8084` | MongoDB `RewardPointDB` | Reward points ledger, monthly cron |
| React client | `3000` | — | CRA dev server |

---

## 📡 API Reference

All client traffic is routed through the **API Gateway** at `http://localhost:8080`. Path prefixes below match the routes in `api-gateway/src/main/resources/application.properties`.

| Method | Path | Routed Service | Purpose |
| --- | --- | --- | --- |
| `POST` | `/api/users/login` | `user-service` | Authenticate and return JWT |
| `*` | `/api/users/**` | `user-service` | User CRUD |
| `*` | `/api/employees/**` | `user-service` | Employee CRUD, avatar, check-in/out |
| `*` | `/api/requests/**` | `request-service` | Vouchers, campaigns, sub-campaigns |
| `*` | `/api/activities/**` | `request-service` | Activity events |
| `*` | `/api/points/**` | `rewardPoint-service` | Reward points, redeem, monthly bonus |

Each service also exposes its endpoints directly on its own port — useful for debugging.

### Example: login

```bash
curl -X POST http://localhost:8080/api/users/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"alice","password":"secret"}'
```

Response:

```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "role": "Employee",
  "id": 1
}
```

---

## 🧩 Frontend Service Layer

`client/src/services/apiClient.js` exports one axios instance per backend service, all routed through the gateway. JWT is automatically attached via an interceptor; responses surface a clean `Error` with the server's `message` field.

```js
import { userApi, employeeApi, pointApi, requestApi, voucherApi } from 'services/apiClient';

await userApi.post('/login', { username, password });
await employeeApi.get(`/${userId}`);
await pointApi.post('/send', null, { params: { managerId, employeeId, points, message } });
```

`useAuth()` exposes the current user, role, and JWT and persists them to `localStorage` for the duration of the session. `ProtectedRoute` enforces role-based access for any route.

---

## 🔐 Security Model

- **Authentication** — Username + password against `user-service`. Successful login returns a 24-hour HS256-signed JWT.
- **Transport** — All backend traffic flows through the gateway. CORS is configured for `http://localhost:3000` in each service's `WebConfig`.
- **Secrets** — No credentials are committed. All secrets are externalized via environment variables (see [Configuration](#-configuration)).
- **Validation** — `application.properties` externalizes DB and AMQP credentials. `JwtService` enforces a 16-byte minimum secret length at startup.
- **Error envelope** — `GlobalExceptionHandler` returns a consistent `{ timestamp, error, message }` JSON shape across all services instead of leaking stack traces.

> **Note:** The Strava `client_secret` is intentionally **not** embedded in the browser. Activities.jsx expects a `/api/activities/strava/token` proxy endpoint exposed by the gateway; the secret must live server-side.

---

## 🛠️ Troubleshooting

- **Service won't start with `Connection refused` to Eureka** — make sure `eureka-server` is up on `8761` before launching other services.
- **MySQL `Access denied`** — verify credentials or update `user-service/src/main/resources/application.properties` (defaults to `root` / `mysql`).
- **MongoDB auth fails** — re-run the `db.createUser(...)` command above; the user must have access to both `RequestDB` and `RewardPointDB`.
- **Gateway returns 404 for a known endpoint** — check `spring.cloud.gateway.routes` in `api-gateway` and confirm the `lb://` service name matches `spring.application.name` of the target service.
- **CORS error in the browser** — `WebConfig.java` in each service whitelists `http://localhost:3000`.
- **`Invalid JWT secret`** — `JWT_SECRET` must be at least 16 bytes; the JwtService refuses to start otherwise.

---

## 📄 License

This project is released under the **MIT License**.
