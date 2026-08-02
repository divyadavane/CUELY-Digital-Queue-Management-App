# Cuely - Digital Queue Management Platform

![Cuely Banner](https://via.placeholder.com/1200x400/0f172a/ffffff?text=Cuely+-+Turn+Waiting+Into+an+Experience)

Cuely is a premium, digital queue management platform designed for modern clinics, retail stores, and service businesses. It eliminates the frustration of waiting in physical lines by enabling businesses to manage walk-ins effortlessly, while empowering customers to track their wait times remotely—without downloading any apps.

## ✨ Key Features & Functionalities

### 📱 Patient/Customer Experience (No-App Needed)
*   **Frictionless Onboarding:** Customers join the queue by scanning a QR code, clicking a link, or sending a WhatsApp message. No account creation required.
*   **Live Tracking Interface (`/track/[queueId]`):** A beautiful, mobile-first tracking screen that provides real-time updates on queue position and estimated wait time.
*   **Persistent Sessions:** Uses lightweight `ticket_id` browser local storage so customers can safely close and reopen their tabs without losing their place.
*   **Instant Notifications:** When a staff member calls their ticket, the customer's screen immediately flashes green with instructions to approach the desk.
*   **Opt-out:** Customers can gracefully "Leave Queue" with a single tap if their plans change, automatically updating the business dashboard.

### 🏢 Business & Admin Dashboard (`/dashboard`)
*   **Multi-Queue Management:** Create and manage multiple queues or departments (e.g., "Consultation", "Billing") under a single business account.
*   **Real-time Control Center:** One-click actions to "Call Next", "Mark as Served", or "Mark as No-Show".
*   **Live Queue Visibility:** Instantly see who is waiting, who is currently being served, and recently completed tickets.
*   **Role-based Access:** Secure authentication via Supabase Auth for staff and administrators.

### 📺 Digital Signage / TV Display (`/queue/[id]/display`)
*   **Big Screen Mode:** A dedicated, highly visible UI designed to be cast to a TV or tablet in the waiting room.
*   **Current & Upcoming:** Prominently displays the ticket currently being served alongside a clear list of who is next in line.
*   **Real-time Sync:** Updates instantly as staff interact with the dashboard, keeping everyone in the room informed.

### 💬 WhatsApp Integration
*   **Join via Chat:** Customers can text "JOIN [QUEUE_CODE]" to a designated WhatsApp number to automatically enter the queue.
*   **Smart Auto-Replies:** Instantly replies with their ticket number and a personalized link to the live tracking page.
*   **Automated Alerts:** Sends proactive WhatsApp messages when their turn is approaching and when they are called.
*   *(Powered by the Baileys library for robust WhatsApp Web API connection)*

### 🤖 AI Agent & Tool Layer
*   **Natural Language Queries:** Built-in tool layers allowing AI agents to interact with the database (e.g., checking queue lengths, fetching status) via conversational prompts.
*   **Extensible Architecture:** Designed with hooks and RPCs to easily plug in automated routing or AI-driven wait time estimations.

### 💎 Premium Enterprise-Grade UI
*   **Glassmorphism Design:** A sleek, modern interface utilizing deep shadows, blur backdrops (`backdrop-filter: blur(12px)`), and a sophisticated dark mode.
*   **Micro-interactions:** Scroll-staggered animations, infinite marquees, numeric count-ups, and tactile button feedback.
*   **Responsive:** Looks perfect on a 4K TV, a desktop dashboard, or a mobile phone.

---

## 🏗 Architecture & Tech Stack

Cuely is built on a modern, scalable, and real-time tech stack:

*   **Frontend Framework:** [Next.js 16](https://nextjs.org/) (App Router) & [React](https://react.dev/)
*   **Styling:** [Tailwind CSS](https://tailwindcss.com/) with custom CSS animations and glassmorphic utilities
*   **Backend & Database:** [Supabase](https://supabase.com/) (PostgreSQL)
*   **Real-time engine:** Supabase Realtime (WebSockets) for instant UI updates
*   **Database Logic:** Custom PostgreSQL RPCs and Triggers for atomic queue operations (e.g., `call_next_ticket`)
*   **WhatsApp Bot:** [Baileys](https://github.com/WhiskeySockets/Baileys) (Node.js WhatsApp Web API)
*   **UI Components:** Custom components inspired by shadcn/ui & Lucide Icons

---

## 🔒 Security & Privacy
*   Row Level Security (RLS) policies implemented across all Supabase tables to ensure businesses can only access their own data.
*   Customers only have access to their specific ticket data via an unguessable UUID.
*   HIPAA-ready architecture design (data isolation, secure auth).

## 🚀 Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up your Supabase project and apply migrations found in `/supabase/migrations/`
4. Create a `.env.local` file with your `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Run the development server: `npm run dev`
6. (Optional) Run the WhatsApp bot service: `npm run whatsapp`
