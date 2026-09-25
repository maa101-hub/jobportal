# HireTrack — Production-Readiness & Security Audit

**Scope:** Full-stack audit of the `jobportal` monorepo — Spring Boot monolith backend (`backned/monolith`), React/Vite frontend (`frontend`), Neon PostgreSQL, Render/Vercel deployment.
**Method:** Direct reading of source (not filename inference). File paths and line-level evidence cited throughout.
**Verdict:** **NOT production-ready.** The application has *no authentication or authorization enforcement of any kind* on the backend. Every finding below is grounded in the actual code.

Severity legend: 🔴 Critical (exploitable now / data loss / auth bypass) · 🟠 High · 🟡 Medium · 🔵 Low/UX.

---

## 0. Architecture map (as-built)

```
React SPA (Vercel)
  localStorage: { user, role, companyId, token(unused) }   ← client-controlled
      │  axios baseURL=VITE_API_BASE_URL, adds "Authorization: Bearer <token>"
      ▼
Spring Boot monolith (Render)      ← NEVER reads the Authorization header
  Controllers: /users /companies /api/jobs /applications /interviews /offers
      │  no security filter chain, no role checks, no ownership checks
      ▼
Spring Data JPA  (findById / findAll — no tenant scoping)
      ▼
Neon PostgreSQL   (ddl-auto=update; FKs are plain Long columns, not relations)
```

Backend packages: `com.mphasis.jobportal.{userservice,jobservice,offer_service}` and `com.mphasis.jobpostal.application_service` (interview + application). Roles enum: `USER, ADMIN, DELIVERY, TFG, TAG`.

---

## 1. 🔴 CRITICAL — No authentication anywhere

- **Spring Security is not on the classpath.** `backned/monolith/pom.xml` declares only `data-jpa`, `web`, `actuator`, `postgresql`, `test`. No `spring-boot-starter-security`, no JWT library.
- There is **no `SecurityFilterChain`, no `WebSecurityConfig`, no JWT filter, no authentication provider** in the codebase.
- The frontend attaches `Authorization: Bearer ${localStorage.getItem("token")}` (`frontend/src/services/api.js`), but **login never returns a token** and **no endpoint ever reads the header**. The token is fiction.
- **Consequence:** every endpoint is fully open to any anonymous caller on the internet. The Render backend URL + any ID is enough to read or mutate all data.

## 2. 🔴 CRITICAL — Passwords stored and compared in plaintext

- `CandidateService.signup()` → `candidate.setPassword(request.getPassword())` (no hashing).
- `CandidateService.login()` → `if (!candidate.getPassword().equals(request.getPassword()))` — plaintext compare.
- Same pattern in `CompanyService.registerCompany/companyLogin/employeeLogin`.
- A DB breach (or the leak below) exposes every real password immediately.

## 3. 🔴 CRITICAL — Employee passwords leaked in API response

- `Candidate` and `Company` mark `password` `@JsonProperty(access = WRITE_ONLY)`, but **`CompanyEmployee.password` has no such annotation**.
- `GET /companies/{companyId}/employees` returns full `CompanyEmployee` objects → **plaintext passwords serialized to any caller** (compounded by #1: no auth needed, and #5: any companyId works).

## 4. 🔴 CRITICAL — No authorization; roles are advisory only

- The only role gate is **frontend-side** (`frontend/src/routes/Guard.jsx`), driven by `localStorage` role (`utils/helpers.js: getRole()`), which the user can edit in DevTools (`localStorage.setItem('role','ADMIN')`).
- Backend performs **zero** role checks. `JobController.approveJob(jobId, approvedBy)` takes `approvedBy` from the URL and stores it with no verification the caller is TFG/ADMIN — any anonymous user can approve/publish jobs.
- **Vertical escalation** (become ADMIN) and **role tampering** are trivial.

## 5. 🔴 CRITICAL — IDOR / no tenant isolation (horizontal escalation)

Every mutation loads by primary key only, with no owner/company check:
- `ApplicationService.updateStatus(id, status)`, `getByUser(userId)`, `getByJob(jobId)` — any user reads/updates any application.
- `OfferService.accept/reject/markJoined(id)` — any user changes any offer.
- `InterviewService.*(id)`, `JobService.approve/close/reject(jobId)` — same.
- `CompanyController.getEmployees/{companyId}`, `deleteEmployee/{employeeId}` — Company A can enumerate/delete Company B's team.
- **Company A can read/modify/delete Company B's jobs, applications, interviews, offers, and team** just by changing the ID. `findByCompanyId` exists but is used only for *listing*, never as an authorization boundary, and `companyId` is caller-supplied.

## 6. 🔴 CRITICAL — Arbitrary state transitions (no workflow enforcement)

- `ApplicationService.updateStatus` sets **any string** from `@RequestParam String status` — no whitelist, no transition rules. A `HIRED` application can be forced back to `SCREENING`; a `REJECTED` one to `SELECTED`; or to `"banana"`.
- `JobService.approve/close/reject` unconditionally overwrite status — a `CLOSED` or `REJECTED` job can be re-`APPROVED`; a rejected job re-published. No re-review after edit.
- `OfferService` — an already `JOINED` offer can be flipped to `REJECTED`.
- Application/Interview/Offer statuses are **free-form Strings** (no enum, no DB constraint) — the DB cannot protect integrity.

## 7. 🟠 HIGH — No input validation (backend)

- `CreateJobRequest` has no `@NotNull/@Positive/@Future` constraints; `JobService.createJob` copies fields blindly.
- Accepts: missing title, negative/zero salary, negative/zero openings, past or non-date `deadline` (it's a `String`), missing company/owner.
- Signup does not validate email format, password strength, or name.

## 8. 🟠 HIGH — No duplicate-application / duplicate-offer protection

- `ApplicationService.apply` always inserts a new row — a candidate can apply to the same job unlimited times. No unique constraint on `(userId, jobId)`.
- `OfferService.createOffer` allows multiple active offers per application.
- No check that the target job is `OPEN` / before `deadline`, or that the application reached `SELECTED` before an offer is created.

## 9. 🟠 HIGH — Race conditions

With no locking, unique constraints, or transactions around read-modify-write, two callers approving the same job, updating the same application, or creating offers concurrently → lost updates / duplicates.

## 10. 🟠 HIGH — Interview scheduling has no conflict/validity checks

- No double-booking detection (interviewer or candidate), no past-date rejection, no meeting-link validation, no check that the application is interviewable. `Interview.scheduledAt` stored without timezone normalization.

## 11. 🟠 HIGH — Global exception handler leaks internals & wrong status codes

- `GlobalExceptionHandler` catches **`RuntimeException`** and returns `ex.getMessage()` as **`400 BAD_REQUEST`**.
- Services throw bare `new RuntimeException("Job not found with ID: 5")` → "not found" returns **400 not 404**; unexpected NPEs surface their messages to clients. No structured body; no `401/403/404/409`.

## 12. 🟠 HIGH — CORS effectively wide-open for `*.vercel.app`

- `CorsConfig` allows `https://*.vercel.app` with `allowCredentials(true)`. Any Vercel-hosted site is an allowed origin. Becomes dangerous the moment real auth/cookies are added.

## 13. 🟡 MEDIUM — Frontend/backend contract mismatches (dead calls → 404)

`frontend/src/services/api.js` calls endpoints the backend does not implement: `GET /users`, `GET /users/{id}`, `PUT /api/jobs/{id}` (update), `DELETE /api/jobs/{id}`, `GET /applications` (list all). These 404 at runtime.

## 14. 🟡 MEDIUM — Data model integrity

- FKs are plain `Long` columns (`Job.companyId/createdBy/approvedBy`, `Application.userId/jobId`, `Offer.applicationId`, `Interview.applicationId`) — **no referential integrity**. Deleting a job/candidate/company orphans applications, interviews, offers.
- No `@Version`, no soft-delete → hard deletes destroy historical hiring records. `Company.employees` cascades `ALL`.
- No indexes on frequently queried columns.
- `ddl-auto=update` in production is risky.

## 15. 🟡 MEDIUM — No pagination anywhere

- `JobService.getAllJobs()` = `findAll()`; controllers return full lists. At 10k–100k rows this returns everything in one payload.

## 16. 🟡 MEDIUM — Resume / file upload

- `Application.resumeUrl` is a free string; no upload endpoint, no type/size validation, no path-traversal handling.

## 17. 🔵 UX / Frontend robustness

- Auth state in `localStorage` only → no expiry, no server invalidation; a deleted account keeps access.
- `Guard` protects rendering but not data.
- Need explicit LOADING / EMPTY / ERROR states, double-submit prevention, consistent terminology, cold-start UX.

## 18. 🔵 Deployment / secrets

- ✅ Actuator `health` with `show-details=never`.
- ⚠️ A **real Neon password was shared in chat/screenshots** — rotate it and update Render env.
- Build artifacts (`backned/monolith/target/**`) are committed to git.
- `spring.jpa.show-sql=true` in production is noisy.

---

## Permission matrix (INTENDED vs ENFORCED)

| Resource        | ADMIN | DELIVERY | TFG | TAG | CANDIDATE | **Enforced on backend?** |
|-----------------|:-----:|:--------:|:---:|:---:|:---------:|:------------------------:|
| Team Members    |  ✓    |  –       | –   | –   | –         | ❌ none (open to anyone) |
| Job Requests    |  ✓    |  ✓       | ✓   | –   | –         | ❌ none |
| Create Job      |  ✓    |  ✓       | –   | –   | –         | ❌ none |
| Review/Approve  |  ✓    |  –       | ✓   | –   | –         | ❌ none |
| Applications    |  ✓    |  –       | –   | ✓   | Own       | ❌ none (IDOR) |
| Interviews      |  ✓    |  –       | –   | ✓   | Own       | ❌ none (IDOR) |
| Offers          |  ✓    |  –       | –   | ✓   | Own       | ❌ none (IDOR) |

Every "Enforced" cell is ❌ — authorization exists only in the frontend `Guard`.

---

*This document is an assessment only; no application code was modified to produce it. See `CHANGES-TODO.md` for the actionable remediation checklist.*
