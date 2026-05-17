# Student Verification

Student verification controls access to the College Zone rental flow. The current implementation is a manual review workflow for KITS students, using Convex Storage for ID images and Convex mutations for request submission and admin review.

## User Upload Workflow

```text
Profile -> Verify Student
  -> user selects ID image
  -> client validates size/type
  -> verifications.generateUploadUrl
  -> client POSTs image to Convex Storage
  -> verifications.submitVerification(storageId + form fields)
  -> server validates file metadata and inserts pending request
```

Client-side entry points:

- `app/profile/verify.tsx`
- `hooks/rental/useStudentVerification.ts`

Backend entry points:

- `verifications.generateUploadUrl`
- `verifications.submitVerification`

## Request Fields

`student_verifications` stores:

- `userId`
- `studentIdNumber`
- `fullNameOnId`
- `department?`
- `year?`
- `idCardImageId`
- `status`
- `rejectionReason?`
- `verifiedAt?`
- `verifiedBy?`
- `createdAt`
- `updatedAt`

The displayed college name is currently returned from the backend as `KKR & KSR Institute of Technology and Sciences`.

## Verification Lifecycle

```text
No request
  -> pending
     -> approved -> user.isVerifiedStudent = true
     -> rejected -> user can resubmit after cooldown
```

Status meanings:

| Status | Meaning |
| --- | --- |
| `pending` | Submitted by the user and waiting for admin review. |
| `approved` | Accepted by admin; user receives College Zone access. |
| `rejected` | Rejected by admin; reason is shown to the user. |

## Submission Rules

Server-side rules in `submitVerification`:

- User must be authenticated.
- Upload URL generation is rate-limited.
- Verification submissions are limited to 3 per 24 hours.
- Image must exist in Convex Storage.
- Image size must be 1 MB or less.
- Image content type must be JPEG, PNG, or WebP.
- Student ID number and name must be non-empty and minimally valid.
- Already verified users cannot resubmit.
- Users cannot create a second pending request.
- Rejected users must wait 24 hours before resubmitting.
- Invalid or unused uploaded images are deleted where appropriate.

## Admin Review Flow

Admin UI:

- `components/admin/StudentVerificationsList.tsx`
- `hooks/admin/useVerifyStudentsScreen.ts`
- Rendered inside the admin verification/payment area.

Admin backend functions:

- `getPendingVerifications`: returns pending requests enriched with user details and ID image URLs.
- `getVerificationHistory`: returns recent approved/rejected requests.
- `approveVerification`: marks request approved, sets `users.isVerifiedStudent = true`, sends notification, writes audit log.
- `rejectVerification`: marks request rejected, stores reason, sends notification, writes audit log.
- `getPendingVerificationCount`: returns pending count for dashboard indicators.

## Access Restriction Logic

The College Zone gate exists in both frontend and backend:

- Frontend: `RentalRequestForm` disables College fields and submit action when the user is not verified.
- Backend: `rentals.requestRental` rejects `zone === "College"` unless the user is verified or admin.

Backend enforcement is the source of truth.

## File Storage Strategy

Student ID images are stored in Convex Storage and referenced by `student_verifications.idCardImageId`.

Security-sensitive handling:

- Upload URLs require auth and are rate-limited.
- Submission validates storage metadata after upload.
- Oversized or wrong-type uploads are deleted.
- Admin queries resolve temporary accessible URLs with `ctx.storage.getUrl`.
- Account deletion removes verification records and attempts to delete associated ID images.

## Security Considerations

- Treat ID images as sensitive personal data.
- Keep image URLs off logs and analytics.
- Only admins should be able to fetch pending/history verification queues.
- Maintain the 1 MB size cap to reduce storage abuse and review friction.
- Do not store OCR output or extra extracted identity data unless a privacy review is completed.
- Keep audit logs focused on event metadata; avoid storing full ID numbers or image URLs in logs when not needed.

## Operational Notes

- Manual review is suitable for early-stage operations and high trust.
- If verification volume grows, add paginated admin queues before increasing reviewer count.
- Consider automatic duplicate detection only after documenting privacy implications.
- If a user is rejected, the 24-hour cooldown reduces repeated low-quality submissions without permanently blocking access.
