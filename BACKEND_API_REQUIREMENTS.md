# Missing Backend Endpoints Specification

**Target:** Backend Engineering Team
**Context:** Required endpoints that were **not provided** in `Blazing_Connect_Backoffice_API_Final.md` to support Admin Post Reports and Dashboard Overview.

---

## 1. List Reported Posts (`GET /api/backoffice/content/posts/reported`)

> **Why it's needed:** The API document includes `GET /groups/reports` for groups, but has no equivalent endpoint to list reported newsfeed posts with report reasons and reporter metadata.

- **Method:** `GET`
- **Path:** `/api/backoffice/content/posts/reported`
  *(Alternative acceptable: `GET /api/backoffice/content/posts?status=REPORTED`)*
- **Auth:** `Authorization: Bearer <admin_token>`
- **Query Parameters:**
  - `page` (integer, optional, default: `1`)
  - `limit` (integer, optional, default: `20`)
- **Expected Response (`200 OK`):**
  ```json
  {
    "status": true,
    "message": "Reported posts retrieved successfully",
    "data": [
      {
        "postId": "e2b5c73a-4f18-4b10-a192-38d8102f91a1",
        "title": "Crypto Scheme Announcement",
        "body": "Guaranteed 500% returns in 2 weeks...",
        "author": {
          "userId": "user-101",
          "firstName": "Tariq",
          "lastName": "Adeleke",
          "email": "tariq@example.com",
          "profileImagePath": "https://..."
        },
        "status": "REPORTED",
        "isHidden": false,
        "isReported": true,
        "reportReason": "Spam / Fraudulent financial scheme",
        "reportedBy": "Amina Yusuf (Class of '22)",
        "reportedAt": "2026-08-31T10:45:00Z",
        "createdAt": "2026-08-31T08:15:00Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "perPage": 20,
      "totalItems": 1,
      "totalPages": 1
    }
  }
  ```

---

## 2. Hide a Post (`PATCH /api/backoffice/newsfeed/:postId/hide`)

> **Why it's needed:** The API doc allows editing post text (`PUT /newsfeed/:postId`) and deleting posts (`DELETE /newsfeed/:postId`), but provides no moderation action to hide a reported post from the public feed while preserving it in the admin audit log.

- **Method:** `PATCH`
- **Path:** `/api/backoffice/newsfeed/:postId/hide`
  *(Alternative: `PUT /api/backoffice/newsfeed/:postId` with `{ "isHidden": true, "status": "hidden" }`)*
- **Auth:** `Authorization: Bearer <admin_token>`
- **Request Body (JSON):**
  ```json
  {
    "isHidden": true,
    "status": "hidden"
  }
  ```
- **Expected Response (`200 OK`):**
  ```json
  {
    "status": true,
    "message": "Post hidden from community feed successfully"
  }
  ```

---

## 3. Unhide a Post (`PATCH /api/backoffice/newsfeed/:postId/unhide`)

> **Why it's needed:** Admins need the ability to restore a post if a report is dismissed or resolved.

- **Method:** `PATCH`
- **Path:** `/api/backoffice/newsfeed/:postId/unhide`
  *(Alternative: `PUT /api/backoffice/newsfeed/:postId` with `{ "isHidden": false, "status": "active" }`)*
- **Auth:** `Authorization: Bearer <admin_token>`
- **Request Body (JSON):**
  ```json
  {
    "isHidden": false,
    "status": "active"
  }
  ```
- **Expected Response (`200 OK`):**
  ```json
  {
    "status": true,
    "message": "Post unhidden and restored successfully"
  }
  ```

---

## 4. Dashboard Activity Stream (`GET /api/backoffice/dashboard/activity`)

> **Why it's needed:** `GET /dashboard` only returns aggregated numeric counts (`totalUsers`, `totalGroups`, etc.). There was no endpoint to populate the "Recent Activity" feed on the Overview tab with network events (new user registrations, deal room publications, resource downloads).

- **Method:** `GET`
- **Path:** `/api/backoffice/dashboard/activity`
- **Auth:** `Authorization: Bearer <admin_token>`
- **Expected Response (`200 OK`):**
  ```json
  {
    "status": true,
    "data": [
      {
        "id": "act-1",
        "type": "USER_JOINED",
        "title": "New Alumni Registered",
        "description": "Dr. Sarah Jenkins (Class of '18) joined the network",
        "timestamp": "2026-08-31T11:00:00Z"
      },
      {
        "id": "act-2",
        "type": "DEALROOM_CREATED",
        "title": "Dealroom Created",
        "description": "Tech Startup Seed Funding opened by Kofi Mensah",
        "timestamp": "2026-08-31T10:15:00Z"
      }
    ]
  }
  ```

---

## Current Frontend Fallback Strategy
- The frontend has fallback handlers in `apiContent.ts` and `apiDashboard.ts` with local state persistence, ensuring all UI actions (viewing reasons, hiding, unhiding, deleting with confirmation) work seamlessly in the interface today.
- As soon as the backend exposes these 4 endpoints, the frontend will automatically connect to live data.

