# Youth Outreach CRM

## Existing-system mapping

The module reuses the existing `User` records for authenticated staff and volunteers, JWT authentication, section-level permissions, and `ActivityLog`. Outreach contacts remain separate from login accounts and are never linked automatically. Existing `UpcomingClass`, course, book, pilgrimage, and LMS records are unchanged.

New additive collections are: `outreachcontacts`, `outreachassignments`, `outreachfollowups`, `outreachprograms`, `outreachsessions`, `outreachinvitations`, `outreachattendancesheets`, `outreachattendanceentries`, and `outreachsettings`.

## Permissions

- Main and full administrators have organization-wide access.
- Other staff require an `outreach` section grant. View/create/edit grants are checked by the API.
- Devotee/teacher volunteers can use `/my-follow-ups` and the API limits them to contacts whose `currentVolunteer` is their own user ID.
- Attendance creation/finalization requires outreach create/edit permission.
- Contact numbers are returned only within an authorized team or assignment scope.

## Data rules

- Interest has exactly three values: `interested`, `not_interested`, and `follow_up_required`.
- Non-response never produces `not_interested`. An opt-out disables routine invitations and follow-ups.
- Follow-ups are separate records; saving a new remark never overwrites an older one.
- Invitations and confirmations are distinct from attendance.
- Attendance has `present`, `absent`, `excused`, and `unmarked`. Only finalized sheets feed attendance reporting, and unmarked is never counted as absent.
- Regular/returning/inactive labels are derived from finalized attendance using configurable thresholds.

## Migration and recovery

No destructive migration is required. Mongoose creates the new collections and indexes when the feature is first used. Before production release:

1. Take a verified MongoDB snapshot (`mongodump`) and record the restore location.
2. Run the application against an isolated staging copy and inspect index creation.
3. Exercise registration, assignment, follow-up, opt-out, attendance finalization, corrections, and record-level access with synthetic data.
4. Deploy the application without importing historical spreadsheets.
5. If rollback is required, deploy the prior application version. The additive outreach collections can remain untouched for later recovery; do not drop them. Restore from the snapshot only if a broader database issue is confirmed.

Historical imports should be implemented as a separate dry-run command that validates rows, reports duplicates, and requires explicit approval before writing. No production contacts are messaged by this module.
# Operations and security

Specialized staff roles are intentionally narrow:

- `outreach_coordinator` manages contacts, assignments, follow-ups, programs, sessions, and attendance.
- `attendance_operator` can manage programs, sessions, and attendance sheets but cannot browse or edit the general follow-up directory.
- Assigned devotees can only access contacts assigned to them.

Before deploying an older database, preview the outreach normalization:

```powershell
cd backend
npm run migrate:outreach
```

The preview reports affected records and missing email/occupation values without writing. After reviewing the report and taking a database backup, apply it explicitly:

```powershell
npm run migrate:outreach -- --apply
```

The backfill assigns missing continuous sequence numbers, derives strike counts from follow-up history, normalizes list/status fields, advances the sequence counter, and records the applied migration. It never fabricates missing email or occupation values.

Production startup now requires `MONGO_URI`, an explicit HTTPS `CLIENT_URL`, and JWT/OTP secrets of at least 32 characters. Legacy PrettyVision cleanup is disabled by default; it runs only with `RUN_LEGACY_DATA_CLEANUP=true`.
