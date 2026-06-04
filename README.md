<div align="center">

# 🚀 UDPT — Distributed Application

**A microservices-based voucher & reward point management system**

[![Java](https://img.shields.io/badge/Java-21-ED8B00?logo=openjdk&logoColor=white)](https://openjdk.org/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.3.1-6DB33F?logo=springboot&logoColor=white)](https://spring.io/projects/spring-boot)
[![Spring Cloud](https://img.shields.io/badge/Spring%20Cloud-2023.0.1-6DB33F?logo=spring&logoColor=white)](https://spring.io/projects/spring-cloud)
[![React](https://img.shields.io/badge/React-18.3.1-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?logo=mysql&logoColor=white)](https://www.mysql.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-7.0-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

[Overview](#-overview) · [Architecture](#-architecture) · [Tech Stack](#-tech-stack) · [Getting Started](#-getting-started) · [API Reference](#-api-reference) · [Contributing](#-contributing)

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
  - [Quick Start with Docker](#quick-start-with-docker-recommended)
  - [Manual Setup](#manual-setup)
- [Services & Ports](#-services--ports)
- [Configuration](#-configuration)
- [API Reference](#-api-reference)
- [Development](#-development)
- [Testing](#-testing)
- [Deployment](#-deployment)
- [Troubleshooting](#-troubleshooting)
- [Roadmap](#-roadmap)
- [Contributing](#-contributing)
- [License](#-license)
- [Team](#-team)

---

## 🎯 Overview

**UDPT** (Ứng dụng Phân tán — *Distributed Application*) is a full-stack voucher, campaign, and reward-point management platform built on a microservices architecture. It demonstrates modern distributed-systems patterns including **service discovery**, **API gateway routing**, **polyglot persistence** (MySQL + MongoDB), and **polyglot frontend/backend** (React + Spring Boot).

The system allows organizations to:
- 🎟️ Create and manage **marketing campaigns** and **sub-campaigns**
- 🎁 Distribute and redeem **vouchers** with unique codes
- ⭐ Award and track **reward points** to customers/employees
- 👥 Manage **users**, **employees**, and **work schedules**

---

## ✨ Key Features

| Module | Capabilities |
|--------|-------------|
| 🧭 **API Gateway** | Single entry point, request routing, load balancing |
| 🔍 **Service Discovery (Eureka)** | Auto-registration and health-check of all services |
| 👤 **User Service** | User accounts, authentication, profile management |
| 🧑‍💼 **Employee Service** | Employee records, identity, contact info, position tracking |
| ⏰ **Worktime Service** | Shift scheduling with conflict detection (unique per user-day) |
| 📋 **Request Service** | Voucher & campaign management (MongoDB document store) |
| ⭐ **Reward Point Service** | Periodic reward calculation and ledger (scheduled jobs) |
| 🖥️ **React Frontend** | Responsive UI with Bootstrap, protected routes, JWT auth |

---

## 🏛️ Architecture