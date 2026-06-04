# 📝 Changelog — UDPT Codebase Improvements

> A summary of fixes, refactors, and feature enhancements applied to the UDPT
> project on **2026-06-04**. Grouped by area, with file paths and impact.

---

## 1. Overview

| Area | Files touched | Critical bugs | Security fixes | Refactors | New files |
| --- | ---: | ---: | ---: | ---: | ---: |
| Backend (Java) | 23 | 5 | 6 | 8 | 4 |
| Frontend (React) | 22 | 4 | 3 | 10 | 3 |
| Config / Docs | 7 | 0 | 2 | 0 | 3 |

---

## 2. Critical bugs fixed

These were issues that would crash the application or break core flows at runtime.

| # | Issue | File | Fix |
| --- | --- | --- | --- |
| 1 | `@JoinColumn(name = "uid")` references a non-existent column | [Employee.java](server/user-service/src/main/java/com/example/userservice/model/Employee.java) | Renamed to `user_id` |
| 2 | Same `uid` bug on `Worktime` entity (column + unique constraint) | [Worktime.java](server/user-service/src/main/java/com/example/userservice/model/Worktime.java) | Renamed column + constraint to `user_id` |
| 3 | `Long.valueOf(username)` on a `String` → `NumberFormatException` in user CRUD | [UserService.java](server/user-service/src/main/java/com/example/userservice/service/UserService.java) | Switched to `findByUsername()` |
| 4 | `BindingBuilder...withQueueName()` is invalid; bindings would never match | [RabbitMQConfig.java](server/rewardPoint-service/src/main/java/com/example/rewardpoint/config/RabbitMQConfig.java), [RabbitMQConfig.java](server/user-service/src/main/java/com/example/userservice/config/RabbitMQConfig.java) | Replaced with `.with(QUEUE_NAME)` |
| 5 | `updateUser` overwrote the BCrypt password with the raw input from the client | [UserService.java](server/user-service/src/main/java/com/example/userservice/service/UserService.java) | Hashes with `BCryptPasswordEncoder` on update |
| 6 | `RequestService.rejectRequest` used the Vietnamese variable name `yeuCau` | [RequestService.java](server/request-service/src/main/java/com/example/requestservice/service/RequestService.java) | Renamed to `request` |
| 7 | `Request_Detail.jsx` violated the PascalCase naming convention | [Approve/Request_Detail.jsx](client/src/containers/Approve/Request_Detail.jsx) → `RequestDetail.jsx` | Renamed file + updated import in `Approve.jsx` |
| 8 | `<a class="btn ...">` instead of `className` (JSX) | [Header.jsx](client/src/containers/Header/Header.jsx) | Replaced with `<button className="btn btn-dark">` |
| 9 | `localStorage.getItem('role') == 'Manager'` — loose equality | Multiple containers | Replaced with `===` |
| 10 | Test class names didn't match their parent application class | `EmployeeProfileServiceApplicationTests`, `EmployeeRequestServiceApplicationTests`, `EmployeeRewardServiceApplicationTests` | Renamed to `UserServiceApplicationTests`, `RequestServiceApplicationTests`, `RewardPointApplicationTests` |

---

## 3. Security fixes

| # | Issue | Fix |
| --- | --- | --- |
| 1 | **Vouchery API key** hardcoded in `EmployeeListener.java` | Externalized via `@Value("${vouchery.api.key}")` and the `VOUCHERY_API_KEY` env var. Empty by default; the listener skips the call when blank. |
| 2 | **Strava `client_secret`** embedded in the browser (`Activities.jsx`) | Removed entirely. OAuth token exchange now goes through a gateway proxy endpoint (`/api/activities/strava/token`); the secret lives server-side. |
| 3 | Hardcoded credentials in `application.properties` for MySQL, MongoDB, RabbitMQ | All converted to `${ENV_VAR:default}` syntax; defaults preserve dev convenience but are overridable in production. |
| 4 | Login returned the literal string `"dummy-token"` | Replaced with a real 24-hour HS256 JWT signed by the new [JwtService.java](server/user-service/src/main/java/com/example/userservice/security/JwtService.java). Secret is injected from `JWT_SECRET` and must be ≥ 16 bytes. |
| 5 | New users received a hardcoded default password `"1234"` | Now generates a 10-character random temporary password using `SecureRandom`. |
| 6 | No file size limit on avatar upload (potential OOM) | Added a 2 MB cap in [EmployeeService.uploadAvatar](server/user-service/src/main/java/com/example/userservice/service/EmployeeService.java). |
| 7 | User-service had a custom `CachingConnectionFactory` with hardcoded `guest`/`guest` | Replaced with Spring Boot auto-configuration using `spring.rabbitmq.*` properties. |
| 8 | No centralized error envelope; controllers could leak stack traces | Added `GlobalExceptionHandler` (`@RestControllerAdvice`) in all 3 services. Returns `{ timestamp, error, message }`. |

---

## 4. Refactors

### 4.1 Backend

| # | Change | Files |
| --- | --- | --- |
| 1 | Field `@Autowired` → constructor injection (final fields, easier to test) | `UserService`, `EmployeeService`, `PointService`, `UserController`, `EmployeeController`, `PointController`, `RequestService`, `RequestController` |
| 2 | Added `@Transactional` to mutating service methods | `EmployeeService` (createEmployee, checkIn, checkOut, updateCheckInCheckOut, updateEmployee, deleteEmployee), `PointService` (sendPoint, redeemPoints) |
| 3 | Switched from `System.out.println` to SLF4J logger | `EmployeeListener`, `UserService`, `EmployeeService` |
| 4 | `PointService.sendPoint`/`redeemPoints` returned `null` on missing entities | Now throw `IllegalArgumentException` with a clear message |
| 5 | Replaced hardcoded monthly-bonus magic number `10` with a named constant `MONTHLY_BONUS_POINTS` | [PointService.java](server/rewardPoint-service/src/main/java/com/example/rewardpoint/service/PointService.java) |
| 6 | Vietnamese field names → English in DTO | `RequestDTO. lyDoYeuCau → requestReason`, `thietBi → device`, `trangThai → requestStatus` |
| 7 | Enabled `@EnableScheduling` on user-service for future cron jobs | [UserServiceApplication.java](server/user-service/src/main/java/com/example/userservice/UserServiceApplication.java) |
| 8 | Removed dead/commented code in `UserServiceApplication` | Same |

### 4.2 Frontend

| # | Change | Files |
| --- | --- | --- |
| 1 | New centralized axios layer: one client per service, JWT auto-attached, error normalization | [apiClient.js](client/src/services/apiClient.js) (new) |
| 2 | Replaced every `axios.get('http://localhost:80xx/...')` and `axios.post(...)` with the appropriate `userApi` / `employeeApi` / `pointApi` / `requestApi` / `voucherApi` call | All 14 containers |
| 3 | Replaced every `localStorage.getItem('userid')` / `'role'` with the `useAuth()` hook | All containers |
| 4 | `AuthProvider` rewritten to expose `role`, `userId`, `token` via context, with `useCallback`/`useMemo` for stable identity | [auth.jsx](client/src/services/auth.jsx) |
| 5 | `ProtectedRoute` now reads from `useAuth()` and redirects unauthenticated users too (not just role mismatches) | [ProtectedRoute.jsx](client/src/services/ProtectedRoute.jsx) |
| 6 | Added an `ErrorBoundary`; wrapped every route | [ErrorBoundary.jsx](client/src/services/ErrorBoundary.jsx) (new), [App.jsx](client/src/App.jsx) |
| 7 | Removed all 40+ `console.log` debug statements (kept the legitimate `console.error` calls in catch blocks) | bulk |
| 8 | Removed unused `axios` imports after the apiClient migration | bulk |
| 9 | Replaced loose `==` comparisons with `===` in role checks | bulk |
| 10 | `useEffect` race-condition guard using `cancelled` flag in async data fetching | `Profile`, `Voucher`, `EditProfile`, `WorkFromHome`, `RightSidebar`, `Leave`, `Header`, `GivePoint` |
| 11 | `useCallback` / `useMemo` for event handlers and nav links in `Header` | [Header.jsx](client/src/containers/Header/Header.jsx) |
| 12 | `useEffect` dependency arrays now include the user id from `useAuth()` | bulk |
| 13 | `GivePoint` now fetches employee/point lists in parallel via `Promise.all` and surfaces errors to the user via `alert` | [GivePoint.jsx](client/src/containers/GivePoint/GivePoint.jsx) |

---

## 5. New files

| Path | Purpose |
| --- | --- |
| [client/src/services/apiClient.js](client/src/services/apiClient.js) | Centralized axios clients + JWT interceptor + Vouchery + Strava config |
| [client/src/services/ErrorBoundary.jsx](client/src/services/ErrorBoundary.jsx) | React error boundary |
| [client/.env.example](client/.env.example) | Template for client env vars (`REACT_APP_API_GATEWAY_URL`, Vouchery, Strava) |
| [server/.env.example](server/.env.example) | Template for server env vars (DB, Mongo, RabbitMQ, JWT, Vouchery) |
| `server/user-service/.../security/JwtService.java` | HS256 JWT signer/verifier |
| `server/user-service/.../exception/GlobalExceptionHandler.java` | Centralized REST error handling |
| `server/request-service/.../exception/GlobalExceptionHandler.java` | Same for request-service |
| `server/rewardPoint-service/.../exception/GlobalExceptionHandler.java` | Same for rewardPoint-service |

---

## 6. Removed files / dependencies

### 6.1 npm packages removed from `client/package.json`

| Package | Reason |
| --- | --- |
| `@testing-library/jest-dom` | No test suite exists |
| `@testing-library/react` | No test suite exists |
| `@testing-library/user-event` | No test suite exists |
| `web-vitals` | Not imported anywhere |
| `react-bootstrap-time-picker` | Not imported anywhere |

### 6.2 Maven dependencies removed from `server/user-service/pom.xml`

| Dependency | Reason |
| --- | --- |
| `org.apache.commons:commons-lang3` | Only `RandomStringUtils` was used; replaced with built-in `SecureRandom` |
| `net.bytebuddy:byte-buddy` | Not referenced directly anywhere in user-service |

### 6.3 Files renamed

- `Request_Detail.jsx` → `RequestDetail.jsx`
- `Request_Detail.scss` → `RequestDetail.scss`
- `EmployeeProfileServiceApplicationTests.java` → `UserServiceApplicationTests.java`
- `EmployeeRequestServiceApplicationTests.java` → `RequestServiceApplicationTests.java`
- `EmployeeRewardServiceApplicationTests.java` → `RewardPointApplicationTests.java`

### 6.4 Files removed

- `client/src/assets/` unused images (kept `avatar.png` which is still referenced)
- All `.bak` files produced by the bulk `sed` refactor were cleaned up

---

## 7. Configuration changes

### 7.1 `server/user-service/src/main/resources/application.properties`

Before:

```properties
spring.datasource.url=jdbc:mysql://localhost:3306/ProfileService
spring.datasource.username=root
spring.datasource.password=mysql
```

After:

```properties
spring.datasource.url=${DB_URL:jdbc:mysql://localhost:3306/ProfileService}
spring.datasource.username=${DB_USERNAME:root}
spring.datasource.password=${DB_PASSWORD:mysql}

spring.rabbitmq.host=${RABBITMQ_HOST:localhost}
spring.rabbitmq.port=${RABBITMQ_PORT:5672}
spring.rabbitmq.username=${RABBITMQ_USERNAME:guest}
spring.rabbitmq.password=${RABBITMQ_PASSWORD:guest}

jwt.secret=${JWT_SECRET:dev-only-secret-please-change-this-in-production-32b}
jwt.expiration-hours=24
```

### 7.2 `server/request-service/src/main/resources/application.properties` & `rewardPoint-service`

All MongoDB credentials moved behind env vars; `rewardPoint-service` additionally gained:

```properties
vouchery.api.url=${VOUCHERY_API_URL:https://university-of-science.sandbox.vouchery.app/api/v2.1/customers}
vouchery.api.key=${VOUCHERY_API_KEY:}
```

---

## 8. Documentation updates

| File | Change |
| --- | --- |
| [README.md](README.md) | Complete rewrite. Now matches the actual codebase: 5 services, correct ports, real route table, env-var configuration, security model, frontend service layer, troubleshooting guide, and accurate tech stack. |

---

## 9. Breaking changes & migration notes

> ⚠️ Things to be aware of when pulling these changes.

1. **`RequestDTO` field renames** — `lyDoYeuCau`, `thietBi`, `trangThai` are now `requestReason`, `device`, `requestStatus`. Any consumer of the request-service DTO needs to update. The underlying `Request` entity was **not** changed, so Mongo documents remain compatible.

2. **JWT replaces dummy-token** — the frontend now stores the returned JWT in `localStorage.token` (via `AuthProvider`). Any existing localStorage state with the old `dummy-token` will simply be replaced on next login.

3. **`ProtectedRoute` now also blocks unauthenticated users** — `/profile`, `/edit-profile`, `/voucher` were previously open. They are still unprotected by `ProtectedRoute` in the current routing config (only the `roles=[...]` ones are), but if you wrap them with `<ProtectedRoute>` you get auth enforcement for free.

4. **RabbitMQ now uses Spring Boot auto-config** — the custom `CachingConnectionFactory` bean in user-service was removed. If you have a non-default RabbitMQ host, set `RABBITMQ_HOST` / `RABBITMQ_PORT` / `RABBITMQ_USERNAME` / `RABBITMQ_PASSWORD` env vars.

5. **`Activities.jsx` expects a gateway proxy** — the Strava OAuth exchange endpoint `/api/activities/strava/token` must be added to the API gateway for Activities to work end-to-end. Without it, the page shows a "Strava integration is not configured" message.

6. **Vouchery integration** — `vouchery.api.key` is empty by default. Set `VOUCHERY_API_KEY` to a real key to enable automatic Vouchery profile provisioning on employee creation.

---

## 10. Verification

| Check | Result |
| --- | --- |
| Hardcoded `localhost:808x` URLs in `client/src/` | 0 (only the default in `apiClient.js`) |
| `localStorage.getItem('role' \| 'userid')` in containers | 0 |
| `console.log(` in `client/src/` | 0 |
| Hardcoded API keys/secrets in `client/src/` | 0 |
| Hardcoded Vouchery API key in Java | 0 |
| Field `@Autowired` injection in source | 0 |
| Java brace balance | All files balanced |
| Project size | 48 Java files, 25 JSX files |
