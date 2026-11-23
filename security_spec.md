# Security Specification & Payload-First TDD (`security_spec.md`)

## 1. Core Data Invariants
1. **Default-Deny Catch-All**: Any collection not explicitly matched is unconditionally denied (`allow read, write: if false;`).
2. **Verified Admin Gate**: Only verified admins (`request.auth.token.email_verified == true` matching either the bootstrapped owner email or an existing `/admins/{uid}` record) can mutate `site_config`, `portfolio_series`, `cv_dossier`, `theme_backups`, `client_sessions`, or read/manage `booking_inquiries` and `admins`.
3. **Zero Privilege Escalation**: Non-admins cannot create or edit `/admins/{uid}` documents or inject `role`/`isAdmin` shadow keys.
4. **PII Isolation**: `booking_inquiries` (contains visitor email/phone/message) forbids `get`, `list`, `update`, and `delete` for non-admins. `client_sessions` forbids `list` for non-admins so clients cannot enumerate other organizations' PINs.
5. **Relational Integrity (Master Gate)**: `client_sessions/{sessionId}/proof_feedback/{photoId}` requires the parent `client_sessions/{sessionId}` document to exist on single-doc `get`/`create`/`update`, and binds `data.sessionId == sessionId` and `data.photoId == photoId`.
6. **Temporal Integrity**: All `createdAt` / `updatedAt` timestamps must equal `request.time` (server timestamp), and `createdAt` is immutable on update.
7. **Denial-of-Wallet Protection**: Every document ID is checked via `isValidId()`, every string has a strict `.size()` upper bound, and every array has a bounded `.size() <= MAX` cap.

## 2. The "Dirty Dozen" Adversarial Payloads (Must All Return `PERMISSION_DENIED`)
1. **Self-Admin Escalation**: Unprivileged signed-in user creates `/admins/{theirUid}` with `{ uid, email, role: 'owner', createdAt }`.
2. **Unverified Email Spoofing**: User with `email: 'mohsentiben@gmail.com'` but `email_verified: false` attempts to write `/site_config/theme`.
3. **Shadow Field Injection on Booking**: Visitor creates `/booking_inquiries/inq1` with valid fields plus ghost field `isApproved: true`.
4. **Status Forgery on Booking**: Visitor creates `/booking_inquiries/inq2` with `status: 'booked'` instead of `'new'`.
5. **PII Blanket Read Attack**: Non-admin signed-in user attempts `get` or `list` on `/booking_inquiries`.
6. **Client Session Enumeration Attack**: Non-admin user attempts `list` on `/client_sessions` to discover other clients' PINs.
7. **Orphaned Proof Feedback**: User attempts to create `/client_sessions/FAKE_PIN/proof_feedback/p1` when parent session `FAKE_PIN` does not exist.
8. **Cross-Session Proof Injection**: User writes `/client_sessions/2026/proof_feedback/p1` with mismatched `sessionId: '7788'`.
9. **ID Poisoning Attack**: Attacker sends a 200-character junk ID `/site_config/aaaa...` or ID with spaces/slashes.
10. **Payload Size Exhaustion (DoW)**: Visitor submits a 50KB `message` in `/booking_inquiries/inq3`.
11. **Timestamp Forgery**: Admin or visitor sends a client-fabricated `createdAt` timestamp instead of `request.time`.
12. **Terminal State Violation**: Non-admin attempts to update an existing `booking_inquiries` record or mutate an immutable `createdAt` field.
