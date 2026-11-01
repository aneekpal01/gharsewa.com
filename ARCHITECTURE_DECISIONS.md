# GharSewa: Architectural Decisions Document (Baseline v1.4)

## 1. Core Architecture Baseline [APPROVED BASELINE]
* **Application Framework**: Next.js 15 (App Router) with TypeScript (`strict: true`).
* **Architecture Pattern**: Strict Modular Monolith (`src/modules/*` domain boundaries).
* **Database**: PostgreSQL with Prisma ORM and custom SQL migration scripts (`prisma/migrations`).
* **Validation**: Zod for universal runtime schema validation across client and server boundaries.
* **Testing Strategy**: Vitest for domain logic and database invariants; Playwright for cross-device end-to-end integration tests.
* **Design & UX**: Custom accessible UI using Tailwind CSS with a restrained, neutral palette conforming to Section 21 of PRODUCT.md (no generic AI SaaS templates, no neons, no glassmorphism, mobile-first responsive viewports).

---

## 2. Concurrency, Database Integrity & Slot Invariants [TECHNICAL REQUIREMENT]

### 2.1 Canonical Booking Concurrency Engine
* **Single Canonical Implementation**:
  To guarantee complete lock-key consistency across the entire codebase, all booking-capacity mutations (creation, cancellation, expiration, rescheduling, and late-payment reconciliation) must acquire the lock using a single canonical utility:
  ```typescript
  // src/lib/security/locks.ts
  export function getCanonicalSlotLockKey(
    serviceAreaId: string, 
    serviceId: string, 
    bookingDate: string, // YYYY-MM-DD
    timeSlot: string     // e.g. "09:00-11:00"
  ): bigint {
    const canonicalKey = `slot:${serviceAreaId}:${serviceId}:${bookingDate}:${timeSlot}`;
    const hash = crypto.createHash('sha256').update(canonicalKey).digest();
    return hash.readBigInt64BE(0); // Signed 64-bit integer
  }
  ```
* **SQL Lock Invocation**:
  Inside `prisma.$transaction(async (tx) => { ... })`:
  ```typescript
  const lockKey = getCanonicalSlotLockKey(serviceAreaId, serviceId, bookingDate, timeSlot);
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(${lockKey}::bigint);`;
  ```
* **Mutual Exclusion & Collision Safety**:
  The advisory lock acts strictly as an execution mutex for the target slot. Even in the theoretical event of a 64-bit hash collision ($p \approx 2.7 \times 10^{-14}$ for $k = 1,000$ active concurrent slot locks), PostgreSQL merely serializes the two independent transactions. Real capacity is counted via exact relational foreign keys; collisions **never** produce false capacity deductions or corrupted state. PostgreSQL automatically releases the lock upon `COMMIT` or `ROLLBACK`.

### 2.2 Worker Slot Consistency & Conflict Prevention
* **Composite Foreign Key Synchronization**:
  To eliminate data drift between a booking and its worker assignment, `WorkerAssignment` enforces date and slot consistency at the database engine level via a composite foreign key:
  ```sql
  -- Invariant: Worker assignment slot must mathematically match parent booking slot
  ALTER TABLE "Booking" 
  ADD CONSTRAINT uq_booking_slot UNIQUE (id, booking_date, time_slot);

  ALTER TABLE "WorkerAssignment" 
  ADD CONSTRAINT fk_assignment_booking_slot 
  FOREIGN KEY (booking_id, booking_date, time_slot) 
  REFERENCES "Booking" (id, booking_date, time_slot) 
  ON DELETE CASCADE;
  ```
* **Discrete Time Slot Invariant**:
  The platform strictly mandates discrete, non-overlapping operational time slots. Overlapping arbitrary duration bookings are prohibited.
* **Partial Unique Indexes (Mutual Exclusion)**:
  ```sql
  -- Worker can hold at most ONE active assignment per slot
  CREATE UNIQUE INDEX idx_worker_single_active_assignment 
  ON "WorkerAssignment" (worker_id, booking_date, time_slot) 
  WHERE assignment_status IN ('PENDING_ACCEPTANCE', 'ACCEPTED', 'IN_PROGRESS');

  -- Booking can hold at most ONE active assignment at any time
  CREATE UNIQUE INDEX idx_booking_single_active_assignment 
  ON "WorkerAssignment" (booking_id) 
  WHERE assignment_status IN ('PENDING_ACCEPTANCE', 'ACCEPTED', 'IN_PROGRESS');
  ```

### 2.3 Assignment State Machine Integrity
* **Permitted Transitions**:
  `PENDING_ACCEPTANCE` &rarr; `ACCEPTED` | `REJECTED` | `CANCELLED`  
  `ACCEPTED` &rarr; `IN_PROGRESS` | `CANCELLED`  
  `IN_PROGRESS` &rarr; `COMPLETED` | `CANCELLED`  
* **Terminal Immutability**:
  `COMPLETED`, `REJECTED`, and `CANCELLED` are terminal. A database trigger (`trg_assignment_state_transition`) aborts any update to a row currently in a terminal state. Reassignment must insert a new `WorkerAssignment` row.

---

## 3. Durable Financial Architecture & Webhook Reconciliation [TECHNICAL REQUIREMENT]

### 3.1 Strict Separation of State Machines
* **`PaymentStatus`**: `PENDING`, `PROCESSING`, `PAID`, `FAILED`, `REFUND_PENDING`, `REFUNDED`, `PARTIALLY_REFUNDED`.
* **`RefundStatus`**: `PENDING`, `PROCESSING`, `SUCCEEDED`, `FAILED`, `MANUAL_REVIEW`.

### 3.2 Two-Phase Safe Execution Rule
External payment gateway APIs (charge capture, refund dispatch) must **never** be invoked inside an open database transaction. Doing so risks database connection pool exhaustion and transaction timeouts during external gateway latency.

### 3.3 Durable Refund Processing & Crash-Resilient Dispatcher
* **Schema Design**:
  ```sql
  CREATE TABLE "Refund" (
      "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      "payment_id" UUID NOT NULL REFERENCES "Payment"("id"),
      "amount" INT NOT NULL,
      "status" VARCHAR(30) NOT NULL DEFAULT 'PENDING',
      "idempotency_key" UUID NOT NULL UNIQUE,
      "attempt_count" INT NOT NULL DEFAULT 0,
      "max_attempts" INT NOT NULL DEFAULT 5,
      "next_retry_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      "locked_until" TIMESTAMP WITH TIME ZONE,
      "last_error" TEXT,
      "gateway_refund_id" VARCHAR(100),
      "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
  );
  CREATE INDEX idx_refund_dispatch ON "Refund"("status", "next_retry_at", "locked_until");
  ```
* **Execution & Crash Recovery Lifecycle**:
  1. Record `Payment.status = 'REFUND_PENDING'` and insert `Refund` row inside DB transaction.
  2. Background dispatcher claims pending refund via lease:
     `UPDATE "Refund" SET status = 'PROCESSING', locked_until = NOW() + INTERVAL '2 minutes', attempt_count = attempt_count + 1 WHERE id = (...) FOR UPDATE SKIP LOCKED RETURNING *;`
  3. External Gateway Call executed outside DB transaction reusing `idempotency_key`.
  4. On success: `Refund.status = 'SUCCEEDED'`, `Payment.status = 'REFUNDED'`.
  5. On failure: `locked_until` expires in 2 minutes; next cron retries with exponential backoff.
  6. On retry exhaustion (`attempt_count >= max_attempts`): Update `Refund.status = 'MANUAL_REVIEW'`.

---

## 4. Session Architecture & Safe Token Rotation [TECHNICAL REQUIREMENT]

### 4.1 Dual-Expiration Schema
```sql
CREATE TABLE "Session" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
    "token_hash" VARCHAR(64) NOT NULL UNIQUE,
    "idle_expires_at" TIMESTAMP WITH TIME ZONE NOT NULL,
    "absolute_expires_at" TIMESTAMP WITH TIME ZONE NOT NULL,
    "last_authenticated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "rotated_at" TIMESTAMP WITH TIME ZONE,
    "replaced_by_hash" VARCHAR(64),
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "ip_address" VARCHAR(45),
    "user_agent" TEXT
);
CREATE INDEX idx_session_token_hash ON "Session"("token_hash");
CREATE INDEX idx_session_lookup ON "Session"("token_hash", "idle_expires_at", "absolute_expires_at");
```
* **Parameters**:
  * *Customer*: Idle = 7 days, Absolute = 30 days.
  * *Worker*: Idle = 24 hours, Absolute = 7 days.
  * *Admin*: Idle = 4 hours, Absolute = 12 hours.

### 4.2 Grace-Period Token Rotation Recovery
1. Inside a database transaction:
   * Insert new session row carrying inherited `absolute_expires_at` and fresh `idle_expires_at`.
   * Mark old session: `UPDATE "Session" SET rotated_at = NOW(), replaced_by_hash = newTokenHash WHERE token_hash = oldTokenHash`.
   * Commit transaction.
2. Emit updated `__Host-gharsewa_session` cookie (`HttpOnly; Secure; SameSite=Lax; Path=/`).
3. If client request arrives with `oldTokenHash` within **60 seconds** of `rotated_at`, authenticate and re-issue the new cookie. After 60 seconds, old token is permanently rejected.

---

## 5. Security Guards & Sliding-Window Rate Limiting [TECHNICAL REQUIREMENT]

### 5.1 Reusable Mutation Guard with In-Transaction TOCTOU Defense
* Schema validation with Zod `.strict()` **rejects** unrecognised keys.
* Coarse pre-check fails fast on missing session.
* Inside database transaction: re-queries `User` status and role under lock to prevent TOCTOU race conditions where permissions change during request execution.

### 5.2 Concurrency-Safe Sliding-Window Rate Limiting
* Privacy-preserving keys via HMAC-SHA256 (`RATE_LIMIT_SALT`).
* Concurrency-safe check-and-insert serialized via advisory lock on rate-limit key.
* Sliding-window events recorded in `RateLimitEvent` table.

### 5.3 Database-Level Audit Log Immutability
* Enforced via PostgreSQL trigger (`trg_audit_log_immutable`) aborting `UPDATE` and `DELETE`.
* Application role `app_user` has `UPDATE, DELETE, TRUNCATE` revoked.

---

## 6. Pinned Dependency Manifest & Runtime Verification [TECHNICAL REQUIREMENT]

```json
{
  "engines": {
    "node": ">=22.11.0",
    "npm": ">=10.9.0"
  },
  "dependencies": {
    "@prisma/client": "6.2.1",
    "next": "15.5.28",
    "react": "19.0.0",
    "react-dom": "19.0.0",
    "server-only": "0.0.1",
    "zod": "3.24.1"
  },
  "devDependencies": {
    "@playwright/test": "1.51.1",
    "@types/node": "22.10.5",
    "@types/react": "19.0.4",
    "@types/react-dom": "19.0.2",
    "prisma": "6.2.1",
    "typescript": "5.7.2",
    "vitest": "2.1.8"
  }
}
```

---

## 7. Automated CI Invariant Test Suite [TECHNICAL REQUIREMENT]

1. **Concurrent Rate-Limit Test**: 50 parallel requests; verifies exact limit adherence.
2. **Refund Dispatcher Crash Recovery**: Expired lease recovery with idempotency key reuse.
3. **Late-Payment Webhook Concurrency Race**: Competing webhooks for final slot capacity.
4. **Session Rotation Grace-Period Recovery**: Old token within 60s recovers replacement cookie.
5. **Mid-Flight Authorization Revocation**: Role revocation mid-flight caught inside transaction.
6. **Worker Assignment Slot Consistency**: Mismatched date/slot rejected by composite FK.
7. **Assignment State Trigger Enforcement**: Transition from terminal state rejected by trigger.

---

## 8. Architecture Proposals [PROPOSAL]

### 8.1 Native Database-Linked Session Engine
* Native session engine using `crypto.randomBytes`, SHA-256 storage, Arctic for Google OAuth, and Otplib for TOTP MFA, rather than Auth.js.

### 8.2 Early Phase Catalog Strategy
* Align Phase 2 (Public Customer Experience) directly with Phase 3 (Database Setup) so public service discovery reads from seeded PostgreSQL catalog tables.

---

## 9. Deferred Architecture Features [DEFERRED (POST-MVP)]
* Redis & BullMQ
* Microservices
* Automated Worker Dispatch
* Real-Time GPS Tracking
* Native Mobile Apps
* Automated Worker Payouts
* Off-Database WORM Storage

---

## 10. Unresolved Business Decisions Requiring User Approval [UNRESOLVED BUSINESS DECISION]
1. Payment Provider Selection (Razorpay recommended).
2. Cash Settlement Support (COD authorization for pay-after-work).
3. Operating Hours & Slot Windows (08:00–19:00 IST and 2-hour arrival windows proposed).
4. Initial Launch Localities (MG Marg, Lal Bazaar, Deorali, Tadong, Development Area, Arithang proposed).
5. Worker Verification & Rejection Policy (Govt ID + reference check; 3 rejections threshold proposed).
