# Cuely API Reference

All internal API endpoints, grouped by module. Base URL is your deployed origin (e.g. `https://cuely-xxxx.vercel.app`). All routes return JSON.

## Authentication

| Scheme | Where | Header |
| --- | --- | --- |
| Admin/staff session | `/dashboard*`, `/api/dashboard*` | Supabase session cookie (`sb-<project>-auth-token`) set after `/login` |
| Patient portal | `/api/portal*` | Bearer token from `patient_sessions` (returned by OTP verify) — sent as `Authorization: Bearer <token>` |
| Push service | `/api/push*` | None (public) |

## 📱 Patient Portal

### OTP (phone login)
| Method | Path | Description |
| --- | --- | --- |
| POST | `/api/portal/otp/request` | Request OTP. Body: `{ "phone": "+91XXXXXXXXXX" }` |
| POST | `/api/portal/otp/verify` | Verify OTP, returns session. Body: `{ "phone", "code" }` |
| POST | `/api/portal/logout` | Invalidate the current patient session. |

### Session & dashboard
| Method | Path | Description |
| --- | --- | --- |
| GET | `/api/portal/me` | Current patient profile + session info. |
| GET | `/api/portal/dashboard` | Portal home summary (upcoming appointments, active visits, recent consultations). |
| PATCH | `/api/portal/profile` | Update profile. Body: `{ "name?", "email?" }` |

### Appointments
| Method | Path | Description |
| --- | --- | --- |
| GET | `/api/portal/appointments` | List patient appointments. |
| POST | `/api/portal/appointments` | Book appointment. Body: `{ "queueId", "date", "time?" }` |
| GET | `/api/portal/appointments/[id]` | Appointment detail. |
| PATCH | `/api/portal/appointments/[id]` | Update/cancel appointment. Body: `{ "status"?: "cancelled" }` |

### Slots
| Method | Path | Description |
| --- | --- | --- |
| GET | `/api/portal/slots?queueId=&date=` | Available booking slots for a queue/date. |

### Video consultations
| Method | Path | Description |
| --- | --- | --- |
| GET | `/api/portal/consultations` | List patient's consultations (upcoming + history, notes/prescriptions included). |
| POST | `/api/portal/consultations` | Book a video consultation. Body: `{ "queueId", "date", "time?" }` |
| GET | `/api/portal/consultations/doctors` | Doctors available for online booking (with fee + rating). |
| GET | `/api/portal/consultations/join?consultationId=` | Authorize joining. Returns `{ consultation, roomToken }` — only if paid, unexpired, and owned by this patient. |
| GET | `/api/portal/consultations/[id]` | Consultation detail (notes + prescription). |
| PATCH | `/api/portal/consultations/[id]` | Advance own status. Body: `{ "status": "ready" | "in_call" }` (ownership enforced server-side). |
| POST | `/api/portal/consultations/[id]/rate` | Submit rating. Body: `{ "rating": 1-5, "comment"?: string }` |
| GET | `/api/portal/consultations/[id]/chat` | Chat history for this consultation. |
| POST | `/api/portal/consultations/[id]/chat` | Send chat message. Body: `{ "message": string }` |
| GET | `/api/portal/consultations/[id]/chat/files` | List chat file attachments. |
| POST | `/api/portal/consultations/[id]/chat/files` | Upload a chat file (multipart). |

### Bills & payments
| Method | Path | Description |
| --- | --- | --- |
| GET | `/api/portal/bills` | List patient bills. |
| POST | `/api/portal/payments/create` | Create a Razorpay order. Body: `{ "billId" }` |
| POST | `/api/portal/payments/verify` | Verify a Razorpay payment. Body: `{ "razorpay_order_id", "razorpay_payment_id", "razorpay_signature" }` |
| GET | `/api/portal/payments/key` | Razorpay key ID for the client SDK. |

### Visits, ratings, messages
| Method | Path | Description |
| --- | --- | --- |
| GET | `/api/portal/visits` | In-clinic visit history (tickets + bills). |
| GET | `/api/portal/ratings` | Ratings given by this patient. |
| POST | `/api/portal/ratings` | Rate an in-clinic visit. |
| GET | `/api/portal/messages` | Patient-clinic chat history. |

## 🏥 Dashboard (admin/staff)

### Doctor
| Method | Path | Description |
| --- | --- | --- |
| GET | `/api/dashboard/doctor/summary` | Doctor daily summary (patients seen, avg wait, revenue, flags). |
| POST | `/api/dashboard/doctor/actions` | Doctor action. Body: `{ "action": "start_consult" | "complete_consult" | "request_assistance" | "clear_assistance", "ticketId" }` |

### Consultations
| Method | Path | Description |
| --- | --- | --- |
| GET | `/api/dashboard/consultations?queueId=` | Video consultations for a queue (with bill status). |
| GET | `/api/dashboard/consultations/join?consultationId=` | Doctor join — returns `{ consultation, roomToken }` (same token as patient). |
| POST | `/api/dashboard/consultations/[id]/notes` | Save SOAP notes. Body: `{ "subjective", "objective", "assessment", "plan" }` |
| GET | `/api/dashboard/consultations/[id]/notes` | Read SOAP notes. |
| POST | `/api/dashboard/consultations/[id]/prescription` | Save prescription. Body: `{ "diagnosis"?, "medicine_items"?, "lab_tests"?, "follow_up_date"?, "notes"? }` |
| GET | `/api/dashboard/consultations/[id]/prescription` | Read prescription. |
| POST | `/api/dashboard/consultations/[id]/status` | Update consultation status. Body: `{ "status" }` |
| GET | `/api/dashboard/consultations/[id]/chat` | Chat history. |
| POST | `/api/dashboard/consultations/[id]/chat` | Send message. Body: `{ "message" }` |
| GET | `/api/dashboard/consultations/[id]/chat/files` | List chat files. |
| POST | `/api/dashboard/consultations/[id]/chat/files` | Upload chat file (multipart). |

### Schedule & availability
| Method | Path | Description |
| --- | --- | --- |
| GET | `/api/dashboard/schedules` | List schedules. |
| POST | `/api/dashboard/schedules` | Create schedule. |
| GET | `/api/dashboard/schedules/[id]` | Schedule detail. |
| PUT | `/api/dashboard/schedules/[id]` | Update schedule. |
| DELETE | `/api/dashboard/schedules/[id]` | Delete schedule. |
| GET | `/api/dashboard/availability?date=` | Availability for a date (respects schedules + leave blocks). |
| GET | `/api/dashboard/leave-blocks` | List leave blocks. |
| POST | `/api/dashboard/leave-blocks` | Create leave block. Body: `{ "date", "reason"?, "all_day"?, "start_time"?, "end_time"? }` |
| GET | `/api/dashboard/leave-blocks/[id]` | Leave block detail. |
| PATCH | `/api/dashboard/leave-blocks/[id]` | Update leave block. |
| DELETE | `/api/dashboard/leave-blocks/[id]` | Delete leave block. |
| GET | `/api/dashboard/slot-configs` | List slot configs. |
| POST | `/api/dashboard/slot-configs` | Create/update slot config. |
| GET | `/api/dashboard/slots?queueId=&date=` | Computed slots for a queue/date. |

### Billing & settings
| Method | Path | Description |
| --- | --- | --- |
| GET | `/api/dashboard/bills` | List bills. |
| PATCH | `/api/dashboard/bills` | Update bill status. Body: `{ "id", "status" }` |
| GET | `/api/dashboard/business-settings` | Get business settings. |
| PATCH | `/api/dashboard/business-settings` | Update business settings (name, SMS templates, etc.). |
| GET | `/api/dashboard/messages` | Clinic chat history. |

## 🤖 AI Agent

| Method | Path | Description |
| --- | --- | --- |
| POST | `/api/agent/chat` | Conversational agent query with database tool layer. Body: `{ "message" }` |
| POST | `/api/agent/landing` | Landing-page assistant query. Body: `{ "message" }` |

## 🔔 Push Notifications

| Method | Path | Description |
| --- | --- | --- |
| POST | `/api/push/subscribe` | Register a web-push subscription. Body: `{ "subscription", "ticketId"? }` |

## 🎫 Queue (public/customer)

| Method | Path | Description |
| --- | --- | --- |
| GET | `/api/slots?queueId=` | Public slot availability. |
| POST | `/api/ratings` | Public rating submission. Body: `{ "ticketId", "rating", "comment"? }` |

---

## Notes
- **`[id]`** = dynamic segment (UUID), e.g. `/api/dashboard/consultations/62729a31-6659-4430-9d1a-bbd688072e46/notes`.
- Room joining is double-gated: the UI route must exist **and** the join endpoint must return a `roomToken`; both sides receive the **same** token, which names the Supabase Realtime channel `video:<roomToken>`.
- All mutations re-check ownership/RLS server-side; never trust the client alone.
