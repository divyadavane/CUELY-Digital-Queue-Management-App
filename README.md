# Cuely - Digital Queue Management & Telemedicine Platform

![Cuely Banner](https://via.placeholder.com/1200x400/0f172a/ffffff?text=Cuely+-+Turn+Waiting+Into+an+Experience)

Cuely is a premium, real-time queue management platform for modern clinics, retail stores, and service businesses. It eliminates the frustration of physical waiting lines with multi-queue dashboards, live tracking, digital signage, and proactive notifications — and extends into a full **patient portal with video telemedicine**, online appointments, billing, and e-prescriptions.

## ✨ Key Features & Functionalities

### 📱 Patient/Customer Experience (No-App Needed)
*   **Frictionless Onboarding:** Customers join the queue by scanning a QR code, clicking a link, sending a WhatsApp message, or using the on-site **kiosk** (`/kiosk/[queueId]`). No account creation required.
*   **Live Tracking Interface (`/track/[queueId]`):** A mobile-first tracking screen with real-time queue position, estimated wait time, and live progress.
*   **Persistent Sessions:** Lightweight `ticket_id` browser storage lets customers close and reopen tabs without losing their place.
*   **Instant Notifications:** When a staff member calls their ticket, the screen flashes green with instructions to approach the desk.
*   **Opt-out:** One-tap "Leave Queue" automatically updates the business dashboard.

### 🏥 Patient Portal (`/portal`, phone-OTP login)
*   **No-Password Login:** Phone-number OTP via SMS (Supabase `patient_sessions`), so every patient has their own secure session.
*   **Online Appointments:** Book, reschedule, and cancel appointments with doctors, backed by availability/schedule checks.
*   **Video Consultations:** Book and pay for online visits, join the room, view SOAP notes, prescriptions, and medical history.
*   **Billing & Payments:** View bills and pay online via Razorpay.
*   **Secure Chat:** Message your doctor/clinic with image file uploads.
*   **Ratings & Reviews:** Rate your visit and give feedback.
*   **Multi-Language:** Full English / हिन्दी / मराठी UI with one-click language switching.

### 🩺 Doctor Dashboard (`/dashboard/doctor`)
*   **Doctor Queue View:** Live patient list with `C` call-next, `T` transfer, `A` assistance-request shortcuts (N = next consultation).
*   **Video Consultations Panel:** See booked online visits, join the call, write SOAP notes, issue e-prescriptions, and mark visits complete.
*   **Schedule & Availability:** Manage weekly schedules, slot configs, and leave blocks so patients only book open slots.
*   **Realtime Assistance Banner:** Requests from staff appear instantly; doctor can acknowledge/dismiss.
*   **Daily Summary:** Key metrics for the day (patients seen, avg wait, revenue).

### 📺 Digital Signage / TV Display (`/queue/[id]/display`)
*   **Big Screen Mode:** A dedicated UI for TVs/tablets in the waiting room showing the ticket being served plus who's next.
*   **Real-time Sync:** Updates instantly as staff interact with the dashboard.

### 🏢 Business & Admin Dashboard (`/dashboard`)
*   **Multi-Queue Management:** Create and manage multiple queues/departments (e.g., "Consultation", "Billing") under one business.
*   **Real-time Control Center:** Call Next, Mark Served, No-Show, transfer tickets, priority control, and queue pause/resume.
*   **Appointments & Billing:** Manage appointments, track bills with status badges, and generate invoices.
*   **Urgency Analytics:** Priority-aware queue analytics to surface urgent tickets.
*   **Reports & Activity Log:** Detailed reporting and a full audit trail.
*   **Business Settings & SMS Templates:** Configure business details and customize notification templates.
*   **Role-based Access:** Secure auth via Supabase Auth (email/password or Google) for staff and admins.

### 📞 Notifications & Messaging
*   **WhatsApp:** Join by texting `JOIN [QUEUE_CODE]`, plus auto-replies and proactive turn/being-called alerts (`server/whatsapp-service.js`).
*   **Push Notifications:** Web Push (VAPID) subscriptions for instant updates (`server/push-service.js`).
*   **SMS:** OTP and transactional SMS via the provider configured in the dashboard.

### 🎥 Video Telemedicine (P2P WebRTC)
*   **Zero-infrastructure calls:** Pure peer-to-peer WebRTC over Supabase Realtime signaling — no Twilio/Livekit/agora dependencies. STUN by default, optional TURN via env vars.
*   **Waiting Room + Pre-join Device Check:** Camera/mic preview, busy-device detection, and audio-only fallback if the camera can't start.
*   **In-Call Tooling:** Camera/mic toggles, camera flip, fullscreen, picture-in-picture, screen share (doctor), quality indicator, and **in-call chat** for both roles.
*   **Doctor Panel:** In-call SOAP notes + e-prescription sidebar.
*   **Secure joining:** Only a paid, unexpired consultation owned by the patient (or the assigned doctor) yields the room token.

### 🤖 AI & Machine Learning Layer
*   **Natural Language Queries:** Tool layer letting AI agents query the database (queue lengths, status, etc.) via conversational prompts.
*   **ML Wait-Time Prediction:** `onnxruntime-node` predictor (`src/lib/ml/predictor.ts`) for estimated wait times.
*   **Extensible Architecture:** Hooks and RPCs to plug in automated routing and AI-driven wait estimation.

### 💎 Premium Enterprise-Grade UI
*   **Glassmorphism Design:** Sleek dark-mode interface with blur backdrops, deep shadows, and micro-interactions.
*   **Responsive:** Looks great on a 4K TV, desktop dashboard, or mobile phone.
*   **Multi-language:** `en`, `hi`, `mr` locale files with full parity.

---

## 🏗 Architecture & Tech Stack

*   **Frontend:** [Next.js 16](https://nextjs.org/) (App Router) + [React 19](https://react.dev/)
*   **Styling:** [Tailwind CSS 4](https://tailwindcss.com/), custom glassmorphic utilities, [Framer Motion](https://www.framer.com/motion/)
*   **Backend & Database:** [Supabase](https://supabase.com/) (PostgreSQL) with RLS policies
*   **Real-time:** Supabase Realtime (WebSockets) for queue, chat, and video signaling
*   **Database Logic:** PostgreSQL RPCs and triggers for atomic operations (`call_next_ticket`, `book_video_consultation`, etc.)
*   **Video:** P2P WebRTC (`RTCPeerConnection`) over Realtime broadcast; optional TURN
*   **Payments:** [Razorpay](https://razorpay.com/) (bill creation + payment verification)
*   **WhatsApp:** [`whatsapp-web.js`](https://github.com/pedroslopez/whatsapp-web.js) service (`server/whatsapp-service.js`)
*   **Push:** `web-push` (VAPID) service (`server/push-service.js`)
*   **SMS:** Provider via dashboard settings (`src/lib/sms.ts`)
*   **AI:** AI SDK (`@ai-sdk/anthropic`, `@ai-sdk/google`, `@ai-sdk/groq`, `@ai-sdk/openai`) + ONNX Runtime for wait prediction
*   **i18n:** `i18next` / `react-i18next`
*   **Icons:** [Lucide](https://lucide.dev/); Charts: [Recharts](https://recharts.org/)

---

## 🚀 Getting Started

1. **Clone** the repository
2. **Install dependencies:** `npm install`
3. **Set up Supabase:** create a project and apply every migration in `supabase/migrations/` (in order) via the Supabase SQL Editor. The CLI `db push` is not required.
4. **Create `.env.local`** (see `.env.example` or below):

```
NEXT_PUBLIC_SUPABASE_URL=<project url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
SUPABASE_SERVICE_ROLE_KEY=<service role key>

# Optional: Razorpay billing
RAZORPAY_KEY_ID=<key id>
RAZORPAY_KEY_SECRET=<key secret>

# Optional: Web Push (VAPID)
NEXT_PUBLIC_VAPID_PUBLIC_KEY=<vapid public key>
VAPID_PRIVATE_KEY=<vapid private key>

# Optional: WhatsApp service
WHATSAPP_PORT=3001

# Optional: TURN server for video calls behind strict NATs
NEXT_PUBLIC_TURN_URL=turn:turn.example.com:3478
NEXT_PUBLIC_TURN_USERNAME=<username>
NEXT_PUBLIC_TURN_CREDENTIAL=<credential>

# Optional: AI models
GROQ_API_KEY=<groq key>
GEMINI_API_KEY=<gemini key>
```

5. **Run the development server:** `npm run dev` → http://localhost:3000
6. **(Optional) Start the WhatsApp bot service:** `npm run whatsapp`
7. **(Optional) Start the push notification service:** `npm run push`

## 📁 Migrations

| File | Purpose |
| --- | --- |
| `00000_complete_setup.sql` | Core schema: queues, tickets, users, RLS |
| `00001` – `00004` | Patient features, extended phase 3, name details, SMS |
| `00005_sms_notification_system.sql` | SMS notification system |
| `00006_push_subscriptions.sql` | Web Push subscriptions |
| `00007_department_doctor_metadata.sql` | Department/doctor metadata |
| `00008_agent_tool_layer.sql` | AI agent tools |
| `00009_ml_wait_predictor.sql` | ML wait-time predictor |
| `00010_agent_conversations.sql` | Agent conversation history |
| `00011_fix_function_overloads.sql` | RPC overload fixes |
| `00012_doctor_ratings.sql` | Doctor ratings |
| `00013_patient_portal.sql` | Patient portal (appointments, sessions) |
| `00014_billing_flow.sql` | Bills & Razorpay flow |
| `00015_multilanguage.sql` | Multi-language support |
| `00016_video_consult.sql` | Video consultations, notes, prescriptions, ratings |
| `00017_consult_chat_files.sql` | Consultation chat + file uploads |
| `00018_availability_schedule.sql` | Schedule availability & leave blocks |
| `00019_doctor_dashboard.sql` | Doctor dashboard RPCs (start/complete consult, assistance) |

---

## 🔒 Security & Privacy
*   Row Level Security (RLS) policies across all Supabase tables ensure businesses only access their own data.
*   Patients access only their own records via phone-OTP sessions; consultation rooms are gated by ownership, payment, and expiry.
*   Customers only see their specific ticket data via an unguessable UUID.
*   HIPAA-ready architecture (data isolation, secure auth).
