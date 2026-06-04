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
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Database Setup](#database-setup)
  - [Manual Setup](#manual-setup)
- [Services & Ports](#-services--ports)
- [API Reference](#-api-reference)
- [Troubleshooting](#-troubleshooting)
- [License](#-license)

---

## 🎯 Overview

**UDPT** (*Ứng dụng Phân tán* — Distributed Application) is a full-stack voucher, campaign, and reward-point management platform built on a **microservices architecture**. The project showcases modern distributed-systems patterns including **service discovery**, **API gateway routing**, and **polyglot persistence** (MySQL + MongoDB), paired with a React single-page application.

The system enables organizations to:

- 🎟️ Create and manage **marketing campaigns** and **sub-campaigns**
- 🎁 Distribute and redeem **vouchers** with unique codes
- ⭐ Award and track **reward points** to customers/employees
- 👤 Manage **user accounts** and **employee** records

---

## ✨ Key Features

| Module | Capabilities |
| --- | --- |
| 🧭 **API Gateway** | Single entry point, request routing, load balancing via Spring Cloud Gateway |
| 🔍 **Service Discovery (Eureka)** | Auto-registration and health-checks for all services |
| 👤 **User Service** | User accounts, employees, profile management (MySQL + JPA) |
| 📋 **Request Service** | Voucher & campaign management (MongoDB document store) |
| ⭐ **Reward Point Service** | Reward calculation and ledger (MongoDB) |
| 🖥️ **React Frontend** | Responsive UI with Bootstrap, JWT-style auth, protected routes |

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
└───────────────┘       └────────────────┘      └─────────────────────┘
                                 │
                                 ▼
                        ┌─────────────────────┐
                        │ RewardPoint Service │
                        │ (port 8084)         │
                        │ MongoDB             │
                        └─────────────────────┘
```

All services register themselves with **Eureka** at startup. The **API Gateway** resolves service names (`lb://...`) and routes HTTP traffic to the right backend.

---

## 📂 Project Structure

```
UDPT/
├── client/                       # React frontend
│   ├── package.json
│   ├── public/
│   └── src/
│       ├── App.jsx
│       ├── index.jsx
│       ├── containers/           # Feature containers (HomePage, Voucher, ...)
│       └── services/             # API clients, auth, route guards
│
└── server/                       # Spring Boot multi-module Maven project
    ├── pom.xml                   # Parent POM (Spring Boot 3.3.1, Java 21)
    ├── api-gateway/              # Spring Cloud Gateway (port 8080)
    ├── eureka-server/            # Service discovery (port 8761)
    ├── user-service/             # User & employee domain (port 8081, MySQL)
    ├── request-service/          # Vouchers & campaigns (port 8082, MongoDB)
    └── rewardPoint-service/      # Reward ledger (port 8084, MongoDB)
```

---

## 🧰 Tech Stack

### Backend

- **Java 21**
- **Spring Boot 3.3.1** — application framework
- **Spring Cloud 2023.0.1** — Gateway + Eureka
- **Spring Data JPA** + **MySQL 8** — relational store
- **Spring Data MongoDB** + **MongoDB 7** — document store
- **Maven** — multi-module build

### Frontend

- **React 18.3.1** + **React Router 6**
- **React-Bootstrap 2** + **Bootstrap 5**
- **Axios** for HTTP
- **Sass** for styles
- **JWT-based** session in `services/auth.jsx` with `ProtectedRoute` guards

---

## 🚀 Getting Started

### Prerequisites

Make sure you have these installed locally:

- **JDK 21** (`java -version`)
- **Maven 3.9+** (or use the bundled `mvnw` wrapper)
- **Node.js 18+** and **npm**
- **MySQL 8** running on `localhost:3306`
- **MongoDB 7** running on `localhost:27017`

### Database Setup

**MySQL** — create the user-service database:

```sql
CREATE DATABASE ProfileService;
-- credentials configured in user-service: root / mysql
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

### Manual Setup

Open three terminals.

**1. Start Eureka first** so other services can register:

```bash
cd server
./mvnw -pl eureka-server spring-boot:run
# → http://localhost:8761
```

**2. Start the backend services** (in any order):

```bash
cd server
./mvnw -pl api-gateway spring-boot:run          # gateway :8080
./mvnw -pl user-service spring-boot:run         # :8081
./mvnw -pl request-service spring-boot:run      # :8082
./mvnw -pl rewardPoint-service spring-boot:run  # :8084
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

**3. Start the React client:**

```bash
cd client
npm install
npm start
# → http://localhost:3000
```

Point the client at the gateway (`http://localhost:8080`) by updating the API base URL inside `src/services/auth.jsx` (and any other Axios client) so all traffic flows through the gateway.

---

## 🔌 Services & Ports

| Service | Port | Database | Notes |
| --- | --- | --- | --- |
| `eureka-server` | `8761` | — | Service registry dashboard at `/` |
| `api-gateway` | `8080` | — | Single entry point for all client traffic |
| `user-service` | `8081` | MySQL `ProfileService` | Users, employees, profiles |
| `request-service` | `8082` | MongoDB `RequestDB` | Campaigns, sub-campaigns, vouchers |
| `rewardPoint-service` | `8084` | MongoDB `RewardPointDB` | Reward points ledger |
| React client | `3000` | — | CRA dev server |

---

## 📡 API Reference

All client traffic is routed through the **API Gateway** at `http://localhost:8080`. Path prefixes below match the routes defined in `api-gateway/src/main/resources/application.properties`.

| Method | Path | Routed Service | Purpose |
| --- | --- | --- | --- |
| `*` | `/api/requests/**` | `request-service` | Vouchers, campaigns, sub-campaigns |
| `*` | `/api/activities/**` | `request-service` | Activity events |
| `*` | `/api/points/**` | `rewardPoint-service` | Reward points |
| `*` | `/api/employees/**` | `user-service` | Employee records |
| `*` | `/api/users/**` | `user-service` | User accounts, profile, auth |

Each service also exposes its endpoints directly on its own port (useful for debugging).

---

## 🛠️ Troubleshooting

- **Service won't start with `Connection refused` to Eureka** — make sure `eureka-server` is up on `8761` before launching other services.
- **MySQL `Access denied`** — verify the `root` user has the password `mysql` (or update `user-service/src/main/resources/application.properties`).
- **MongoDB auth fails** — re-run the `db.createUser(...)` command above; the user must have access to both `RequestDB` and `RewardPointDB`.
- **Gateway returns 404 for a known endpoint** — check `spring.cloud.gateway.routes` in `api-gateway` and confirm the `lb://` service name matches `spring.application.name` of the target service.
- **CORS error in the browser** — add a `CorsWebFilter` bean in `api-gateway` allowing `http://localhost:3000`.

---

## 📄 License

This project is released under the **MIT License**.
