# Phase 9 Test Plan — Manual Payment Pages

**Project:** NexaPath Academy  
**Branch:** `payment-intergration`  
**Scope:** Phase 9 pages + connected APIs  
**Purpose:** Ready-to-run checklist with commands and expected responses for later execution.

---

## 0) Prerequisites

1. Install deps
```bash
pnpm install
```

2. Run dev server
```bash
pnpm dev
```

3. Base URL
- `http://localhost:3000`

4. Test users needed
- Admin account
- Instructor account
- Student account

5. Optional seed data needed
- At least 1 course
- At least 1 enrollment
- At least 1 pending payment
- At least 1 payment method

---

## 1) Fast Build/Type/Lint Sanity

### 1.1 TypeScript
```bash
pnpm -s tsc --noEmit
```
**Expected:** exits successfully with no TypeScript errors.

### 1.2 ESLint (Phase 9 pages)
```bash
pnpm -s eslint "app/[locale]/payment/[enrollmentId]/page.tsx" "app/[locale]/dashboard/admin/payments/page.tsx" "app/[locale]/dashboard/admin/payments/analytics/page.tsx" "app/[locale]/dashboard/admin/payments/methods/page.tsx" "app/[locale]/dashboard/admin/payments/methods/new/page.tsx" "app/[locale]/dashboard/admin/payments/methods/[id]/edit/page.tsx" "app/[locale]/dashboard/admin/payments/instructors/page.tsx" "app/[locale]/dashboard/user/payments/page.tsx" "app/[locale]/dashboard/instructor/earnings/page.tsx"
```
**Expected:** no lint errors.

### 1.3 Production build
```bash
pnpm -s build
```
**Expected:** build succeeds.

---

## 2) API Tests (Curl)

> Use PowerShell with `curl.exe` to avoid alias issues.  
> Save cookies from login if your setup requires authenticated session testing from curl.

---

### 2.1 Admin payment analytics

#### Unauthenticated
```bash
curl.exe -i "http://localhost:3000/api/admin/payment-analytics"
```
**Expected:**
- `401 Unauthorized`
- JSON similar to:
```json
{ "success": false, "error": "Unauthorized" }
```

#### Authenticated as admin
```bash
curl.exe -i "http://localhost:3000/api/admin/payment-analytics" -H "Cookie: <ADMIN_SESSION_COOKIE>"
```
**Expected:**
- `200 OK`
- JSON with:
  - `success: true`
  - `data.monthlyRevenue` array
  - `data.revenueByMethod` array
  - `data.revenueByCountry` array
  - `data.revenueByCourse` array

---

### 2.2 Payments listing used by admin/user pages

#### Unauthenticated
```bash
curl.exe -i "http://localhost:3000/api/payments?limit=50"
```
**Expected:** `401 Unauthorized`

#### Authenticated student/admin
```bash
curl.exe -i "http://localhost:3000/api/payments?limit=50" -H "Cookie: <SESSION_COOKIE>"
```
**Expected:**
- `200 OK`
- `success: true`
- `data` array present
- Objects include fields such as `_id`, `status`, `amount`, `currency`, `createdAt`

---

### 2.3 Bulk approve (admin page action)

Create file `bulk-approve.json`:
```json
{
  "paymentIds": ["<PENDING_PAYMENT_ID_1>", "<PENDING_PAYMENT_ID_2>"],
  "adminNotes": "Batch approved during test"
}
```

#### Unauthenticated
```bash
curl.exe -i -X PUT "http://localhost:3000/api/payments/bulk-approve" -H "Content-Type: application/json" --data-binary "@bulk-approve.json"
```
**Expected:** `401 Unauthorized`

#### Authenticated non-admin
```bash
curl.exe -i -X PUT "http://localhost:3000/api/payments/bulk-approve" -H "Content-Type: application/json" -H "Cookie: <NON_ADMIN_COOKIE>" --data-binary "@bulk-approve.json"
```
**Expected:** `403 Forbidden`

#### Authenticated admin
```bash
curl.exe -i -X PUT "http://localhost:3000/api/payments/bulk-approve" -H "Content-Type: application/json" -H "Cookie: <ADMIN_SESSION_COOKIE>" --data-binary "@bulk-approve.json"
```
**Expected:**
- `200 OK`
- `success: true`
- Count/result payload indicating approved payments
- Re-fetch `/api/payments` shows these payments moved to `approved`

---

### 2.4 Payments CSV export

#### Unauthenticated
```bash
curl.exe -i "http://localhost:3000/api/payments/export?format=csv"
```
**Expected:** `401 Unauthorized`

#### Authenticated admin
```bash
curl.exe -i "http://localhost:3000/api/payments/export?format=csv" -H "Cookie: <ADMIN_SESSION_COOKIE>"
```
**Expected:**
- `200 OK`
- `Content-Type` includes `text/csv`
- Response body starts with CSV header row

Optional save to file:
```bash
curl.exe "http://localhost:3000/api/payments/export?format=csv" -H "Cookie: <ADMIN_SESSION_COOKIE>" -o payments-export.csv
```
**Expected:** `payments-export.csv` created with rows.

---

### 2.5 Payment methods CRUD endpoints (methods pages)

#### List methods (admin)
```bash
curl.exe -i "http://localhost:3000/api/payment-methods" -H "Cookie: <ADMIN_SESSION_COOKIE>"
```
**Expected:** `200 OK`, `success: true`, array of methods.

#### Create method
Create `method-create.json`:
```json
{
  "name": { "en": "Test Bank", "de": "Test Bank", "ar": "بنك تجريبي" },
  "description": { "en": "Desc", "de": "Desc", "ar": "وصف" },
  "instructions": { "en": "Send transfer", "de": "Überweisen", "ar": "حوّل" },
  "paymentAddress": "DE89-TEST-1234",
  "isGlobal": true,
  "countries": [],
  "requiresOperationNumber": true,
  "requiresScreenshot": true,
  "isActive": true
}
```

```bash
curl.exe -i -X POST "http://localhost:3000/api/payment-methods" -H "Content-Type: application/json" -H "Cookie: <ADMIN_SESSION_COOKIE>" --data-binary "@method-create.json"
```
**Expected:** `200` or `201`, `success: true`, created method object.

#### Update method
Create `method-update.json`:
```json
{
  "name": { "en": "Test Bank Updated", "de": "Test Bank Updated", "ar": "بنك محدث" },
  "description": { "en": "Updated", "de": "Updated", "ar": "محدث" },
  "instructions": { "en": "Updated", "de": "Updated", "ar": "محدث" },
  "paymentAddress": "DE89-UPDATED-0001",
  "isGlobal": true,
  "countries": [],
  "requiresOperationNumber": true,
  "requiresScreenshot": false,
  "isActive": false
}
```

```bash
curl.exe -i -X PUT "http://localhost:3000/api/payment-methods/<METHOD_ID>" -H "Content-Type: application/json" -H "Cookie: <ADMIN_SESSION_COOKIE>" --data-binary "@method-update.json"
```
**Expected:** `200 OK`, `success: true`, updated method.

---

### 2.6 Instructor stats endpoint (instructor page)

#### As instructor
```bash
curl.exe -i "http://localhost:3000/api/instructor/payment-stats" -H "Cookie: <INSTRUCTOR_SESSION_COOKIE>"
```
**Expected:**
- `200 OK`
- `success: true`
- data fields:
  - `approvedPaymentsCount`
  - `refundedPaymentsCount`
  - `grossRevenue`
  - `refundedAmount`
  - `netRevenue`
  - enrollment counters

#### As admin (forbidden check)
```bash
curl.exe -i "http://localhost:3000/api/instructor/payment-stats" -H "Cookie: <ADMIN_SESSION_COOKIE>"
```
**Expected:** `403 Forbidden`

---

## 3) UI Test Scenarios (Manual)

## 3.1 Student payment page
Route:
- `/en/payment/<ENROLLMENT_ID>`

Checks:
1. Unauthenticated access redirects to login.
2. Enrollment owner can access page.
3. Status banner shows current status correctly.
4. Payment methods render.
5. Selecting method updates details panel.
6. Proof form accepts valid inputs and submit action runs.
7. Pending countdown/status UX appears when expected.

**Expected:** no crash, no blank screen, no console errors, proper UI transitions.

---

## 3.2 Admin payments page
Route:
- `/en/dashboard/admin/payments`

Checks:
1. Table loads from `/api/payments`.
2. Pending rows selectable.
3. Bulk approve button enables when rows selected.
4. Bulk approve action updates statuses.
5. Export CSV button triggers download/open.
6. Review modal opens/closes and displays payment details.
7. Urgency indicator colors render for pending age thresholds.

**Expected:** all controls interactive and aligned with API outcomes.

---

## 3.3 Admin analytics page
Route:
- `/en/dashboard/admin/payments/analytics`

Checks:
1. Loading state appears then charts render.
2. Empty data state handled gracefully.
3. Monthly/method/country/course charts display labels and values.
4. Export CSV button works.

**Expected:** page stable with valid and empty data.

---

## 3.4 Admin payment methods pages
Routes:
- `/en/dashboard/admin/payments/methods`
- `/en/dashboard/admin/payments/methods/new`
- `/en/dashboard/admin/payments/methods/<ID>/edit`

Checks:
1. Methods list loads.
2. Preview modal opens with method details.
3. New method form submits successfully and returns to list.
4. Edit method page loads values and updates successfully.
5. Toggle activate/deactivate updates UI and backend state.

**Expected:** CRUD flow works end-to-end.

---

## 3.5 Admin instructor earnings page
Route:
- `/en/dashboard/admin/payments/instructors`

Checks:
1. Instructor list loads.
2. Changing selected instructor updates cards/tables.
3. Revenue and payouts render without runtime errors.
4. Empty states display clearly.

**Expected:** stable rendering and correct section updates.

---

## 3.6 Student payments history page
Route:
- `/en/dashboard/user/payments`

Checks:
1. Stats cards show counts/totals.
2. History table renders statuses and references.
3. Auto-refresh (10s) updates values.
4. Empty state handled.

**Expected:** clear and consistent user payment history view.

---

## 3.7 Instructor earnings page
Route:
- `/en/dashboard/instructor/earnings`

Checks:
1. Fetches `/api/instructor/payment-stats`.
2. Cards render all expected metrics.
3. Auto-refresh every 10s works.
4. Unauthorized/forbidden role gets blocked appropriately.

**Expected:** reliable instructor earnings dashboard.

---

## 4) Suggested Test Execution Order

1. Run sanity checks (TypeScript, ESLint, build)
2. Run API auth checks (401/403)
3. Run API success checks
4. Validate UI pages in browser
5. Re-run key APIs after UI actions to verify side effects

---

## 5) Pass/Fail Criteria

Phase 9 is **PASS** when:
- All sanity commands succeed
- Auth rules match expected 401/403 behavior
- Core API endpoints return expected 200 + correct payload shapes
- All 7 Phase 9 pages render and basic interactions work
- No critical console/runtime errors in tested flows

Phase 9 is **FAIL** if:
- Any page crashes/blank screen
- Auth rules broken
- Bulk approve/export/method CRUD fail
- Instructor/user stats pages fail to load expected data

---

## 6) Notes

- Some endpoints may return `200` vs `201` depending on existing API convention; both are acceptable where applicable.
- If command output differs, capture:
  - full request
  - status code
  - response body
  - relevant server logs  
  and compare against endpoint role/validation logic.
