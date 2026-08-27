# Critical Issues for Instructor Payouts Feature

The following issues have been identified as **critical** because they impact security, data integrity, or core functionality of the payouts system. They should be addressed immediately.

---

## 1. Missing Admin Authorization in `generate_instructor_payouts()` RPC
- **Location**: `supabase/migrations/20260826042500_payout_rpcs.sql`
- **Problem**: The function can be invoked by any authenticated user (once the server‑side action is bypassed), allowing non‑admin users to generate payout records.
- **Risk**: Unauthorized users could generate false payout entries, corrupting financial data and potentially exposing the platform to fraud.
- **Recommendation**:
  ```sql
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;
  ```
  Add this check at the beginning of the function.

---

## 2. Insufficient Validation of Payment Method in `mark_payout_as_paid()` RPC
- **Location**: `supabase/migrations/20260826042500_payout_rpcs.sql`
- **Problem**: The `p_method` parameter is inserted directly into the `payments` table without validation.
- **Risk**: An attacker could inject arbitrary strings, breaking reporting, or use unexpected values to bypass downstream business rules.
- **Recommendation**:
  ```sql
  IF p_method NOT IN ('bkash','nagad','bank_transfer','manual') THEN
    RAISE EXCEPTION 'invalid payment method';
  END IF;
  ```
  Validate the method before inserting.

---

## 3. Hard‑coded `period_start` in `generate_instructor_payouts()` RPC
- **Location**: Same RPC as above.
- **Problem**: The start date for the payout period is fixed to `'2020-01-01'`.
- **Risk**: Payouts will always be calculated from 2020, potentially double‑counting historic revenue and inflating amounts.
- **Recommendation**: Replace the hard‑coded value with a dynamic calculation (e.g., start of the current month) or expose it as a parameter.

---

## 4. `payment_id` Column Allows NULL After Payout Is Marked Paid
- **Location**: `supabase/migrations/20260826042000_instructor_payouts.sql`
- **Problem**: `payment_id` is nullable, which could leave a paid payout without a linked ledger entry if the update fails.
- **Risk**: Inconsistent financial records; audit log may not be able to trace the payout back to a payment entry.
- **Recommendation**: After a successful payment insertion, set `payment_id NOT NULL` (or add a `CHECK (status = 'paid' AND payment_id IS NOT NULL)`).

---

### Next Steps
1. Update the RPC definitions with the security checks and validation.
2. Adjust the `period_start` logic to compute a proper start date.
3. Add a migration to enforce `payment_id` consistency.
4. Run the full test suite (`npm run test && npm run lint && npm run typecheck`) after changes.

These changes will close the critical security gaps and ensure accurate financial accounting.
