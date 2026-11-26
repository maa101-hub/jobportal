# HireTrack — Remediation Checklist (what to change)

Companion to `AUDIT.md`. Work top-down: **P0 (security) → P1 (integrity) → P2 (scale/UX)**.
Each item lists the **file(s)**, the **problem**, and the **exact change**.

---

## P0 — SECURITY (do before any real users)

### [ ] P0-1. Add authentication (Spring Security + JWT)
**Problem:** No auth on classpath; every endpoint is public; login issues no token.
**Files:** `backned/monolith/pom.xml`, new `config/SecurityConfig.java`, new `security/JwtService.java`, new `security/JwtAuthFilter.java`, login services/DTOs.
**Change:**
1. Add dependencies to `pom.xml`:
   ```xml
   <dependency><groupId>org.springframework.boot</groupId><artifactId>spring-boot-starter-security</artifactId></dependency>
   <dependency><groupId>io.jsonwebtoken</groupId><artifactId>jjwt-api</artifactId><version>0.12.6</version></dependency>
   <dependency><groupId>io.jsonwebtoken</groupId><artifactId>jjwt-impl</artifactId><version>0.12.6</version><scope>runtime</scope></dependency>
   <dependency><groupId>io.jsonwebtoken</groupId><artifactId>jjwt-jackson</artifactId><version>0.12.6</version><scope>runtime</scope></dependency>
   ```
2. `JwtService`: sign a token containing `sub=userId`, `role`, `companyId`; expiry (e.g. 8h). Secret from env `JWT_SECRET` (never hardcode).
3. `JwtAuthFilter` (extends `OncePerRequestFilter`): read `Authorization: Bearer`, validate, set `SecurityContext` with authorities `ROLE_<role>`.
4. `SecurityConfig` (`@EnableMethodSecurity`): stateless session; permit `POST /users/login,/users/signup,/companies/register,/companies/login,/companies/employees/login`, `GET /actuator/health`; everything else `authenticated()`.
5. `LoginResponse` (`userservice/dto/LoginResponse.java`): add a `token` field; set it in `CandidateService.login` / `CompanyService.*Login`.
6. Frontend already sends `Authorization: Bearer` and stores `token` — just make login save the returned token to `localStorage`.

### [ ] P0-2. Hash passwords with BCrypt
**Problem:** Plaintext store + `.equals()` compare.
**Files:** `userservice/service/CandidateService.java`, `userservice/service/CompanyService.java`.
**Change:**
- Inject `PasswordEncoder` (define `@Bean BCryptPasswordEncoder` in `SecurityConfig`).
- Signup/register/add-employee: `entity.setPassword(encoder.encode(req.getPassword()))`.
- Login: replace `stored.equals(input)` with `encoder.matches(input, stored)`.
- **Migration:** existing rows are plaintext — force a password reset OR re-hash on next successful login. Document which.

### [ ] P0-3. Stop leaking employee passwords
**Problem:** `CompanyEmployee.password` serialized in `GET /companies/{id}/employees`.
**File:** `userservice/model/CompanyEmployee.java`.
**Change:** add above the `password` field:
```java
@com.fasterxml.jackson.annotation.JsonProperty(access = com.fasterxml.jackson.annotation.JsonProperty.Access.WRITE_ONLY)
private String password;
```
Better: return a DTO (id, name, email, role, status, department…) instead of the entity everywhere.

### [ ] P0-4. Enforce authorization (roles + ownership) on every endpoint
**Problem:** Zero backend checks; role from `localStorage`; IDOR everywhere.
**Files:** all controllers + services.
**Change:**
- Add `@PreAuthorize` per the matrix in `AUDIT.md`, e.g.:
  - `JobController.createJob` → `@PreAuthorize("hasAnyRole('DELIVERY','ADMIN')")`
  - `approveJob/rejectJob` → `hasAnyRole('TFG','ADMIN')`
  - `ApplicationController.updateStatus` / interviews / offers → `hasAnyRole('TAG','ADMIN')`
  - Team endpoints → `hasRole('ADMIN')`
- **Derive identity from the token, not the URL.** Remove `approvedBy`/`userId`/`companyId` path/body params used for authz; read them from `SecurityContext`.
- **Ownership scoping:** replace bare `findById(id)` with checks that the resource belongs to the caller's company (or the candidate's own userId). Add repo methods like `findByIdAndCompanyId(...)`; for candidate reads assert `application.userId == principal.userId`. Return 403 otherwise.

### [ ] P0-5. Lock down CORS + rotate leaked secret
**Files:** `hiringtracker/config/CorsConfig.java`, Neon dashboard, Render env.
**Change:**
- Replace `https://*.vercel.app` wildcard with the exact production origin only (keep it configurable via `CORS_ALLOWED_ORIGINS`).
- **Rotate the Neon DB password** (it was shared in chat), update `SPRING_DATASOURCE_URL` + `DB_PASSWORD` on Render.

---

## P1 — DATA INTEGRITY & WORKFLOW

### [ ] P1-1. Status enums + transition validation
**Problem:** Statuses are free-form Strings; any transition allowed.
**Files:** `application_service/entity/Application.java` (+service), `offer_service/entity/Offer.java` (+service), `Interview.java` (+service); `JobService`.
**Change:**
- Create enums: `ApplicationStatus {APPLIED, SCREENING, SHORTLISTED, INTERVIEW, SELECTED, OFFERED, HIRED, REJECTED, WITHDRAWN}`, `OfferStatus {RELEASED, ACCEPTED, REJECTED, EXPIRED, JOINED}`, `InterviewStatus {SCHEDULED, COMPLETED, CANCELLED}`. Map with `@Enumerated(STRING)`.
- Add an allowed-transition map per entity; in `updateStatus`/accept/reject/approve/close, **reject invalid transitions with 409**. E.g. block `HIRED→SCREENING`, `REJECTED→SELECTED`, re-approving a `CLOSED`/`REJECTED` job.
- `JobService.approveJob` should only work from `CREATED` (or "in review"); editing an `APPROVED` job must reset it to require re-review.

### [ ] P1-2. Bean Validation on DTOs + correct types
**Files:** `pom.xml`, `jobservice/dto/CreateJobRequest.java`, signup DTOs, controllers.
**Change:**
- Add `spring-boot-starter-validation`.
- Annotate: `@NotBlank title`, `@Positive salary`, `@Min(1) openings`, `@Future deadline`, `@Email email`, `@Size(min=8) password`.
- Change `deadline` from `String` → `LocalDate` (DTO and `Job` entity).
- Add `@Valid` to controller `@RequestBody` params.

### [ ] P1-3. Prevent duplicate applications / offers + apply-time guards
**Files:** `Application.java`, `ApplicationService.apply`, `OfferService.createOffer`.
**Change:**
- `@Table(uniqueConstraints=@UniqueConstraint(columnNames={"userId","jobId"}))` on Application.
- In `apply()`: verify job exists, status `OPEN`, `deadline` not passed, candidate hasn't already applied.
- In `createOffer()`: verify application is `SELECTED` and has no active offer.

### [ ] P1-4. Concurrency: locking + transactions
**Files:** mutable entities + their services.
**Change:** add `@Version private Long version;` to Job/Application/Offer/Interview; annotate mutating service methods `@Transactional`; rely on DB unique constraints as the authoritative guard.

### [ ] P1-5. Proper error handling
**File:** `offer_service/exception/GlobalExceptionHandler.java` (move to a shared `common` package).
**Change:**
- Define `NotFoundException`→404, `ConflictException`→409, handle `MethodArgumentNotValidException`→422.
- Replace bare `throw new RuntimeException("... not found")` in all services with `NotFoundException`.
- Return structured body `{timestamp,status,error,message,path}`; never echo raw exception text; log stack server-side only.

### [ ] P1-6. Interview scheduling validity
**Files:** `Interview.java`, `InterviewService`.
**Change:** reject past `scheduledAt`; detect interviewer/candidate overlap; store times as UTC `Instant`; validate the application is interviewable.

---

## P2 — SCALE, DATA MODEL, UX

### [ ] P2-1. Foreign keys, indexes, soft-delete, migrations
**Files:** entities; `application.properties`; add Flyway.
**Change:**
- Convert `Long companyId/createdBy/userId/jobId/applicationId` to real `@ManyToOne` relations, **or** add DB FK constraints + indexes on those columns.
- Add indexes: `applications(user_id)`, `applications(job_id)`, `jobs(company_id)`, `interviews(application_id)`, `offers(application_id)`.
- Add `boolean deleted` (soft-delete) on Company/Job/Application/Candidate; never hard-delete historical records. Review `Company.employees cascade=ALL`.
- Replace `spring.jpa.hibernate.ddl-auto=update` with **Flyway** migrations; set `ddl-auto=validate` in prod.

### [ ] P2-2. Server-side pagination
**Files:** `JobService.getAllJobs`, `ApplicationController`, repos.
**Change:** accept `Pageable`; return `Page<>`; default+max page size; add sorting/filtering. Frontend consumes `content`/`totalPages`.

### [ ] P2-3. Fix frontend/backend contract mismatches
**File:** `frontend/src/services/api.js` (+ backend if endpoints are wanted).
**Change:** these frontend calls hit non-existent endpoints (404): `GET /users`, `GET /users/{id}`, `PUT /api/jobs/{id}`, `DELETE /api/jobs/{id}`, `GET /applications`. Either implement them or remove/replace the calls.

### [ ] P2-4. File upload validation (if resumes go live)
**Files:** new upload endpoint, `Application.resumeUrl` flow.
**Change:** validate content-type (pdf/doc), size cap (e.g. 5 MB), store outside webroot / object storage, sanitize filenames (no path traversal), scan if possible.

### [ ] P2-5. Frontend states + UX
**Files:** page components under `frontend/src/pages/**`.
**Change:** every async view handles LOADING / EMPTY / ERROR distinctly ("No applications yet" vs "Couldn't load — Retry"); disable submit buttons while requests are in flight; show a "waking up" state for Render cold starts; token expiry → redirect to login.

### [ ] P2-6. Audit log
**Files:** new `AuditLog` entity + interceptor/service.
**Change:** record `{actorId, action, resourceType, resourceId, before, after, timestamp}` for approve/reject/status-change/offer actions.

---

## Housekeeping (quick wins, do anytime)

- [ ] **Remove committed build artifacts:** `git rm -r --cached backned/monolith/target && echo "target/" >> backned/monolith/.gitignore`.
- [ ] **Disable SQL logging in prod:** set `spring.jpa.show-sql=false` (or profile-scoped).
- [ ] **Fix the typo dir name** `backned` → `backend` (optional; touches Dockerfile `rootDir`, render.yaml).
- [ ] **Add tests** — especially authorization tests (each role hitting each endpoint), workflow transition tests, IDOR tests (user A cannot touch user B's resources).

---

### Suggested PR grouping
1. **PR: P0 security bundle** (P0-1..P0-5) — auth, hashing, password-leak, authorization, CORS.
2. **PR: P1 integrity** (P1-1..P1-6) — enums/transitions, validation, dup-protection, locking, errors.
3. **PR: P2 scale/model** (P2-1..P2-2) — FKs/indexes/soft-delete/Flyway, pagination.
4. **PR: P2 UX + contract + audit log** (P2-3..P2-6).
5. Housekeeping can ride along in PR 1.
