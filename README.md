# University Complaint and Issue Tracking Platform

A web platform where students and faculty report campus issues, and the responsible department tracks and resolves them. Complaints are routed to the right department automatically, prioritized automatically, and every change is recorded in an audit trail.

**Live app:** https://university-issue-tracker.vercel.app

**Project board:** https://github.com/users/DanialZahid/projects/2

> Sign-in is limited to university Google accounts (`@iqra.edu.pk`). Other accounts are shown an "Access restricted" page.

---

## Contents

- [Problem](#problem)
- [Features](#features)
- [Smart features](#smart-features)
- [Roles](#roles)
- [Pages](#pages)
- [Business flow](#business-flow)
- [Complaint lifecycle](#complaint-lifecycle)
- [Database schema (ERD)](#database-schema-erd)
- [Technology stack](#technology-stack)
- [Project structure](#project-structure)
- [Running locally](#running-locally)
- [Sprints](#sprints)
- [Roadmap](#roadmap)
- [License](#license)

---

## Problem

Campus issues (a broken AC, a projector that doesn't work, a timetable clash) are usually reported verbally or on paper. Nobody knows who is responsible, whether the issue was already reported, or whether anything happened after reporting it. This platform gives every complaint a ticket, sends it to the department that handles it, and lets the submitter follow its progress.

## Features

### For students and faculty
- Sign in with the university Google account.
- Submit a complaint with a title, description, category, location, and room. Category, location, room, and priority are filled in from the text while typing.
- Ticket number for every complaint (for example `CMP-00042`).
- "My complaints" list with status and priority badges.
- Complaint detail page with a status history.

### For department heads and the superuser
- Department dashboard scoped to the head's own department (the superuser sees all departments).
- Stat cards (Pending, In progress, Resolved, and Critical and open) that double as filters.
- Live search (ticket number included), filters for status, priority, category, department, and date range, active filter chips, sortable columns, and pagination. All filter state lives in the URL, so a filtered view can be bookmarked or shared.
- Complaint management page: change status and priority, forward to another department with an internal reason, add internal notes, and archive resolved complaints or restore them.
- Full audit trail: who changed what, when, and from which value to which.
- Conflict check: if two managers act on the same complaint, the second change is rejected with a "refresh and try again" message instead of silently overwriting the first.

## Smart features

The platform reads what the submitter writes and fills in the rest. Suggestions appear live while typing, and the submitter can still adjust category, location, and room.

| Feature | What it does |
|---|---|
| Category | Suggested from the title and description. The title counts more than the description. |
| Emergency detection | Reports describing an emergency (fire, smoke, a gas leak, an injury) are flagged as Safety automatically. |
| Department routing | The department comes from the category. Submitters never pick a department. |
| Priority | Set from how urgent the report reads and its category. Submitters don't choose it; department heads can change it. |
| Room | Recognized in campus formats and normalized, so `ac103` or `room 103` becomes `AC-103`, and `lab 4` becomes `C-Lab 04`. |
| Location | Recognized from building names and common nicknames (canteen, gate, admin building, computer lab). |

The same logic runs in the browser for live suggestions and on the server for the final values, so department and priority can't be changed from the browser.

## Roles

| Role | Access |
|---|---|
| Student | Submit and track own complaints |
| Faculty | Same as Student |
| Department head | Manage complaints of their own department |
| Superuser | Manage all complaints and departments |

Identity comes from the university's Google accounts. Roles are assigned inside the platform: department heads are matched by the head email stored on each department, and the superuser is set in server configuration.

## Pages

| # | Page | Route | Status |
|---|---|---|---|
| 1 | Sign in | `/sign-in` | Done |
| 2 | Access restricted | `/access-denied` | Done |
| 3 | My complaints | `/complaints` | Done |
| 4 | Submit a complaint | `/complaints/new` | Done |
| 5 | Complaint detail | `/complaints/CMP-xxxxx` | Done |
| 6 | Department dashboard | `/manage` | Done |
| 7 | Complaint management | `/manage/complaints/CMP-xxxxx` | Done |
| 8 | Departments and staff | `/manage/departments` | Planned |
| 9 | Reports | `/manage/reports` | Planned |

## Business flow

```mermaid
flowchart TD
    A["User opens the platform"] --> B["Sign in with Google"]
    B --> C{"University email?"}
    C -- No --> D["Access restricted page"]
    C -- Yes --> E["Role assigned: Student, Faculty, Department head, or Superuser"]
    E --> F["Submit a complaint"]
    F --> G["Smart features suggest category, location, room, and priority while typing"]
    G --> H["Server validates input and recomputes department and priority"]
    H --> I["Ticket created and routed to the department, audit log written"]
    I --> J["Submitter tracks status and history"]
    I --> K["Department head sees it on the dashboard"]
    K --> L{"Right department?"}
    L -- No --> M["Forward to another department with a reason"]
    M --> K
    L -- Yes --> N["Set In progress, adjust priority, add internal notes"]
    N --> O["Resolved"]
    O --> P["Archived"]
```

## Complaint lifecycle

```mermaid
stateDiagram-v2
    [*] --> Pending: Submitted
    Pending --> InProgress: Head starts work
    InProgress --> Resolved: Issue fixed
    Pending --> Resolved: Fixed directly
    Resolved --> InProgress: Reopened
    Resolved --> Archived: Archived by head
    Archived --> Resolved: Restored
```

## Database schema (ERD)

PostgreSQL, managed with Prisma. Schema files are in `prisma/`.

```mermaid
erDiagram
    User {
        string id PK
        string clerkId UK
        string name
        string email UK
        UserRole role
        string departmentId FK "set for department heads"
        datetime createdAt
        datetime updatedAt
    }
    Department {
        string id PK
        string name UK
        string headName
        string headEmail UK
    }
    Category {
        string id PK
        string name UK
        string description
        int baseEffortMinutes
        string departmentId FK
    }
    Location {
        string id PK
        string name UK
    }
    StaffMember {
        string id PK
        string name
        string email UK
        boolean isActive
        string departmentId FK
        datetime createdAt
    }
    Complaint {
        string id PK
        int ticketNumber UK
        string title
        string description
        Priority priority
        ComplaintStatus status
        string locationDetail "room"
        int estimatedEffortMinutes
        string categoryId FK
        string locationId FK
        string submittedById FK
        string departmentId FK
        string assignedStaffId FK
        string duplicateOfId FK
        datetime assignedAt
        datetime resolvedAt
        datetime archivedAt
        datetime createdAt
        datetime updatedAt
    }
    Attachment {
        string id PK
        string url
        string fileName
        string mimeType
        int sizeBytes
        string sha256
        boolean hasCameraExif
        string complaintId FK
        datetime createdAt
    }
    AuditLog {
        string id PK
        AuditAction action
        string fromValue
        string toValue
        string note
        string complaintId FK
        string performedById FK
        datetime createdAt
    }

    Department ||--o{ Category : "owns"
    Department ||--o{ StaffMember : "employs"
    Department |o--o{ User : "headed by"
    Department |o--o{ Complaint : "handles"
    Category ||--o{ Complaint : "classifies"
    Location ||--o{ Complaint : "located at"
    User ||--o{ Complaint : "submits"
    StaffMember |o--o{ Complaint : "assigned to"
    Complaint |o--o{ Complaint : "possible duplicate of"
    Complaint ||--o{ Attachment : "has"
    Complaint ||--o{ AuditLog : "history"
    User ||--o{ AuditLog : "performs"
```

### Fixed values

| Type | Values |
|---|---|
| User role | Student, Faculty, Department head, Superuser |
| Complaint status | Pending, In progress, Resolved |
| Priority | Low, Medium, High, Critical |
| Audit action | Created, Status changed, Priority changed, Assigned, Note added, Archived, Unarchived |

## Technology stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router), React 19, TypeScript |
| Styling and UI | Tailwind CSS v4, shadcn/ui (Radix), Lucide icons |
| Database | PostgreSQL on Neon |
| ORM | Prisma 7 |
| Authentication | Clerk (Google sign-in, university accounts only) |
| Validation | Zod |
| Hosting | Vercel |

## Project structure

| Folder | Contents |
|---|---|
| `prisma/` | Database schema (split into files) and migrations |
| `scripts/` | Reference data, synthetic demo data, and cleanup scripts |
| `src/actions/` | Server actions for submitting and managing complaints |
| `src/app/` | Pages and routes (App Router) |
| `src/automation/` | Smart features: category, priority, room, location, and department routing |
| `src/db/` | Database queries |
| `src/schemas/` | Input validation |
| `src/ui/common/` | Base UI components |
| `src/ui/shared/` | Complaint, department, and layout components |
| `src/ui/manage/` | Department dashboard and management components |
| `src/utils/` | Helpers for dates, tickets, roles, and sign-in rules |
| `src/proxy.ts` | Authentication middleware |

## Running locally

Requirements: Node.js 24, a PostgreSQL database (Neon works), and a Clerk application with Google sign-in.

1. Clone the repository and install dependencies:
   ```bash
   npm install
   ```
2. Create a `.env` file with these variables:

   | Variable | Purpose |
   |---|---|
   | `DATABASE_URL` | Direct database connection (Prisma CLI and scripts) |
   | `DATABASE_URL_POOLED` | Pooled database connection (app) |
   | `CHECKPOINT_DISABLE` | `1` (turns off Prisma CLI telemetry) |
   | `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk publishable key |
   | `CLERK_SECRET_KEY` | Clerk secret key |
   | `NEXT_PUBLIC_CLERK_TELEMETRY_DISABLED` | `1` (turns off Clerk telemetry) |
   | `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | `/sign-in` |
   | `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | `/sign-in` |
   | `NEXT_PUBLIC_CLERK_SIGN_IN_FORCE_REDIRECT_URL` | `/auth/continue` |
   | `NEXT_PUBLIC_CLERK_SIGN_UP_FORCE_REDIRECT_URL` | `/auth/continue` |
   | `UNIVERSITY_EMAIL_DOMAIN` | Allowed email domain, for example `iqra.edu.pk` |
   | `SUPERUSER_EMAILS` | Comma-separated superuser emails |

3. Apply migrations, generate the client, and load reference data:
   ```bash
   npm run db:migrate
   npm run db:generate
   npm run db:seed
   ```
4. Optional: load synthetic demo data (default 10,000 complaints over 180 days):
   ```bash
   npm run db:seed:demo -- --count 5000
   ```
   Remove it again with `npm run db:seed:clear` (only synthetic rows are deleted).
5. Start the app:
   ```bash
   npm run dev
   ```

## Sprints

Work is planned in eight two-week sprints. Live progress, issues, and dates are on the [project board](https://github.com/users/DanialZahid/projects/2).

| Sprint | Weeks | Goal |
|---|---|---|
| 1 | 1 to 2 | Project setup and authentication |
| 2 | 3 to 4 | Complaint submission and tracking |
| 3 | 5 to 6 | Department dashboard |
| 4 | 7 to 8 | Notifications and smart assignment |
| 5 | 9 to 10 | Image checks and insights |
| 6 | 11 to 12 | AI-assisted features |
| 7 | 13 to 14 | Testing and refinement |
| 8 | 15 to 16 | Documentation and final delivery |

## Roadmap

| Feature | Status |
|---|---|
| Campus issue board: open issues visible to everyone signed in | Planned |
| "Affected too" votes with automatic priority escalation | Planned |
| Similar open issues shown while typing a complaint | Planned |
| Submitter updates, withdrawal, and replies visible to the submitter | Planned |
| Departments, staff, categories, and roles management (superuser) | Planned |
| Image attachments with automated checks | Planned |
| Email notifications | Planned |
| Staff workload and least-loaded assignment | Planned |
| AI-assisted description drafting and category and priority suggestion | Planned |
| Reports and summaries | Planned |

## License

© 2026 Danial Zahid. All rights reserved. The code is public for academic review only. See [LICENSE](LICENSE).
