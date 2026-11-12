# Operationalyst — Firestore Security Specification (`security_spec.md`)

## 1. Data Invariants

1. **Global Default-Deny Safety Net**: Every unmatched path under `/databases/{database}/documents/{document=**}` is unconditionally denied (`allow read, write: if false;`).
2. **Verified Identity Mandate**: Every write operation (`create`, `update`, `delete`) across all collections requires an authenticated user with a verified email (`request.auth != null && request.auth.token.email_verified == true`).
3. **Bootstrapped Founder Admin & Trusted Lookup**: Administrative access (`isAdmin()`) is granted only when `request.auth != null && request.auth.token.email_verified == true` and either `exists(/databases/$(database)/documents/admins/$(request.auth.uid))` or `request.auth.token.email == 'joneszz2004@gmail.com'`. Clients can never self-assign admin privileges or write to `/admins/{adminUid}`.
4. **PII Split-Collection Isolation**: User profiles are split into `/users/{userId}` (`UserPublicProfile` — non-PII) and `/users/{userId}/private/{docId}` (`UserPrivateInfo` — email, phone/WhatsApp, plant location). Only the document owner (`request.auth.uid == userId`) or `isAdmin()` may read or write `/users/{userId}/private/{docId}`.
5. **Master Gate (Relational Sync)**: Sub-collection documents in `/plant_workspaces/{workspaceId}/audit_notes/{noteId}` cannot be read, created, updated, or deleted unless the parent document `/plant_workspaces/{workspaceId}` exists and `get(/databases/$(database)/documents/plant_workspaces/$(workspaceId)).data.ownerId == request.auth.uid` (or `isAdmin()`).
6. **Terminal State Locking**:
   - Once a `PilotRequestDoc` reaches `status == 'CLOSED'`, non-admin updates are permanently blocked.
   - Once a `PlantWorkspaceCloudSnapshot` reaches `status == 'LOCKED_FINAL'`, non-admin updates are permanently blocked.
   - Once a `WorkspaceAuditNote` reaches `actionStatus == 'RESOLVED'`, non-admin updates are permanently blocked.
7. **Temporal & Immortal Field Integrity**:
   - `createdAt` must equal `request.time` on `create` and is strictly immutable (`incoming().createdAt == existing().createdAt`) on `update`.
   - `updatedAt` must equal `request.time` on both `create` and `update`.
   - Ownership and primary identifiers (`uid`, `leadId`, `workspaceId`, `noteId`, `ownerId`, `authorId`) are immutable after creation.
8. **Secure List Queries (Query Enforcer)**: Every `allow list` rule enforces ownership directly on `resource.data` (e.g., `resource.data.ownerId == request.auth.uid || isAdmin()`) without performing per-document `get()` calls inside list rules.

---

## 2. The "Dirty Dozen" Adversarial Payloads

| # | Attack Vector | Target Path | Malicious Payload / Context | Expected Outcome |
|---|---------------|-------------|-----------------------------|------------------|
| 1 | **Unauthenticated Write** | `/pilot_requests/PILOT-001` | `auth = null`, valid payload | `PERMISSION_DENIED` |
| 2 | **Email Spoofing (Unverified Admin Email)** | `/pilot_requests/PILOT-001` | `auth = { uid: 'attacker', email: 'joneszz2004@gmail.com', email_verified: false }` | `PERMISSION_DENIED` |
| 3 | **Shadow Field Injection (Anti-Update-Gap)** | `/users/user_1` | Valid `UserPublicProfile` + `"isAdmin": true` ghost field | `PERMISSION_DENIED` |
| 4 | **Privilege Escalation Role Assignment** | `/users/user_1` | `role: "super_admin"` (not in `['owner', 'ops_head', 'auditor', 'viewer']`) | `PERMISSION_DENIED` |
| 5 | **PII Cross-User Read (Split Collection Leak)** | `/users/victim_uid/private/info` | `GET` by `auth.uid = 'other_user'` | `PERMISSION_DENIED` |
| 6 | **Identity Spoofing on Create** | `/plant_workspaces/ws_1` | `auth.uid = 'user_a'`, payload `ownerId: 'user_b'` | `PERMISSION_DENIED` |
| 7 | **Immortal Field Mutation (`ownerId` / `createdAt`)** | `/plant_workspaces/ws_1` | `UPDATE` changing `ownerId` or `createdAt` | `PERMISSION_DENIED` |
| 8 | **Terminal State Bypass** | `/plant_workspaces/ws_1` | `UPDATE` on workspace where `existing().status == 'LOCKED_FINAL'` by non-admin | `PERMISSION_DENIED` |
| 9 | **Client Timestamp Forgery** | `/pilot_requests/PILOT-001` | `CREATE` where `createdAt != request.time` | `PERMISSION_DENIED` |
| 10 | **Master Gate Orphan Subcollection Write** | `/plant_workspaces/ws_orphan/audit_notes/note_1` | `CREATE` note when `/plant_workspaces/ws_orphan` does not exist or belongs to another owner | `PERMISSION_DENIED` |
| 11 | **Path Variable / ID Poisoning (>128 chars or illegal chars)** | `/plant_workspaces/bad$id!@#` | `CREATE` with non-matching ID regex | `PERMISSION_DENIED` |
| 12 | **Value Poisoning on Whitelisted Update Key** | `/plant_workspaces/ws_1` | `UPDATE` modifying allowed key `otifPercent` to `999` (>100 boundary) or string `"100%"` | `PERMISSION_DENIED` |

---

## 3. Phase 5: Red Team Conflict Report

- **Collection `/users/{userId}`**:
  - *Identity Spoofing*: Blocked (`incoming().uid == userId && userId == request.auth.uid`).
  - *Shadow Update*: Blocked (`hasOnly(['uid', 'displayName', 'companyName', 'role', 'createdAt', 'updatedAt'])` + `affectedKeys().hasOnly(['displayName', 'companyName', 'role', 'updatedAt'])`).
  - *Value Poisoning*: Blocked (`isValidUserPublicProfile(incoming())` wraps the entire `allow update` statement).
- **Collection `/users/{userId}/private/{docId}`**:
  - *PII Blanket Test*: Passed (`allow get, list: if isSignedIn() && (request.auth.uid == userId || isAdmin());`). Non-owners are strictly rejected.
- **Collection `/pilot_requests/{leadId}`**:
  - *Terminal State Shortcut*: Blocked (`existing().status != 'CLOSED' || isAdmin()`).
  - *Query Trust Test*: Passed (`allow list: if isSignedIn() && (resource.data.ownerId == request.auth.uid || isAdmin());`).
- **Collection `/plant_workspaces/{workspaceId}`**:
  - *Terminal State Shortcut*: Blocked (`existing().status != 'LOCKED_FINAL' || isAdmin()`).
  - *Value Poisoning*: Blocked (`isValidPlantWorkspace(incoming(), workspaceId)` validates numeric bounds and string sizes on both `create` and `update`).
- **Subcollection `/plant_workspaces/{workspaceId}/audit_notes/{noteId}`**:
  - *Master Gate Invariant*: Enforced via `isWorkspaceOwner(workspaceId)` which checks `exists(...)` and `get(...).data.ownerId == request.auth.uid`.
