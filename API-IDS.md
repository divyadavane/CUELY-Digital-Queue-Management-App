# Cuely — API / RPC Identifiers Used in the Project

All backend identifiers the code calls. These are the **PostgreSQL RPC function names** invoked via `supabase.rpc(...)` plus the small set of HTTP route IDs. Grouped by domain.

## 🎫 Queue operations

| RPC | Used in | Notes |
| --- | --- | --- |
| `join_queue` | `src/actions/queue.ts` | Customer joins a queue. |
| `leave_queue` | `src/components/track/LeaveQueueButton.tsx` | Customer leaves the queue (`p_ticket_id`). |
| `call_next` | `useTickets.ts`, `useKeyboardShortcuts.ts`, `actions/queue.ts` | Call next ticket (`p_queue_id`). |
| `recall_ticket` | `actions/queue.ts`, `useKeyboardShortcuts.ts` | Recall an already-called ticket (`p_ticket_id`). |
| `mark_served` | `useTickets.ts`, `useKeyboardShortcuts.ts`, `TicketRow.tsx` | Mark served (`p_ticket_id`). |
| `mark_no_show` | `useTickets.ts`, `useKeyboardShortcuts.ts`, `TicketRow.tsx` | Mark no-show (`p_ticket_id`). |
| `undo_ticket_action` | `src/hooks/useUndoableAction.tsx` | Undo last ticket action. |
| `add_manual_ticket` | `src/components/dashboard/ManualTicketForm.tsx` | Staff adds a ticket manually. |
| `bump_priority` | `src/components/dashboard/PriorityControl.tsx` | Priority bump. |
| `toggle_queue_pause` | `src/components/dashboard/PauseToggle.tsx` | Pause/resume a queue. |
| `get_queue_status` | `useTicketRealtime.ts`, `DashboardClient.tsx`, patient widgets | Read queue status (`p_queue_id`). |

## 🗓 Appointments

| Function name | Used in |
| --- | --- |
| `book_appointment` | `src/actions/queue.ts`, `api/portal/appointments/route.ts` |
| `check_in_appointment` | `src/actions/queue.ts` |
| `cancel_appointment` | `src/actions/queue.ts`, `api/portal/appointments/[id]/route.ts` |
| `reschedule_appointment` | `api/portal/appointments/[id]/route.ts` |

## 🩺 Doctor dashboard (migration `00019`)

| Function name | Used in | Arg |
| --- | --- | --- |
| `start_consult` | `api/dashboard/doctor/actions/route.ts` | `p_ticket_id` |
| `complete_consult` | `api/dashboard/doctor/actions/route.ts` | `p_ticket_id` |
| `request_assistance` | `api/dashboard/doctor/actions/route.ts` | `p_queue_id` |
| `clear_assistance` | `api/dashboard/doctor/actions/route.ts` | `p_queue_id` |

> These four are defined in `supabase/migrations/00019_doctor_dashboard.sql`. If it's not applied, calls return the schema-cache error `Could not find the function public.<name>(...) in the schema cache`.

## 🎥 Video consultations

| Function name | Used in | Purpose |
| --- | --- | --- |
| `book_video_consultation` | `api/portal/consultations/route.ts` | Book + create bill (`p_queue_id`, `p_phone`, `p_patient_id`, `p_date`, `p_time`). |
| `set_consultation_status` | `api/portal/consultations/[id]/route.ts`, `api/dashboard/consultations/[id]/status/route.ts` | Advance status; `p_patient_phone` enforces ownership. |
| `save_consultation_notes` | `api/dashboard/consultations/[id]/notes/route.ts` | Save SOAP notes. |
| `save_prescription` | `api/dashboard/consultations/[id]/prescription/route.ts` | Save e-prescription. |
| `submit_consultation_rating` | `api/portal/consultations/[id]/rate/route.ts` | Rate a consultation. |

## 👤 Patient portal (phone-OTP)

| Function name | Used in | Purpose |
| --- | --- | --- |
| `request_patient_otp` | `api/portal/otp/request/route.ts` | Request OTP (`p_phone`). |
| `verify_patient_otp` | `api/portal/otp/verify/route.ts` | Verify OTP, returns session. |
| `revoke_patient_session` | `api/portal/logout/route.ts` | Invalidate session (`p_token`). |

## ⭐ Ratings (in-clinic)

| Function name | Used in | Purpose |
| --- | --- | --- |
| `submit_rating` | `api/ratings/route.ts`, `api/portal/ratings/route.ts` | Public/patient rating submission. |

## 🔐 Auth guards

| Function name | Used in | Purpose |
| --- | --- | --- |
| `is_admin_of_business` | `lib/admin/guard.ts`, dashboard bills/messages/business-settings routes | Verify admin permissions. |

## 🤖 AI agent tool layer (allow-listed RPCs)

Invoked via dynamic `supabase.rpc(toolName, input)` in `src/lib/agent/tools.ts`:

`get_queue_status`, `get_estimated_wait`, `join_queue`, `call_next`, `mark_no_show`, `mark_served`, `switch_queue`, `get_daily_stats`, `suggest_rebalance`

> `switch_queue`, `get_daily_stats`, `suggest_rebalance` are referenced as agent tools; confirm they exist as functions in the DB for the agent to use them.

---

## HTTP routes used by the client

These are the Next.js route handlers (documented in `API.md`) that the front-end calls. Key non-obvious IDs:

| Route ID | Purpose |
| --- | --- |
| `/api/portal/consultations/join` | Returns `{ consultation, roomToken }` — both patient & doctor share the **same** `roomToken`, which names the Realtime channel `video:<roomToken>`. |
| `/api/dashboard/consultations/join` | Doctor join — same room token as the patient. |
| `/api/push/subscribe` | Register web-push subscription. |

---

## External service IDs / keys (from `.env`)

| ID | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key. |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (server-only). |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` | Razorpay (DBA). |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` | Web-push VAPID keys. |
| `WHATSAPP_PORT` / `PUSH_PORT` | Service ports. |