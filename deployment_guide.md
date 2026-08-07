# Free Hosting Deployment Guide - CUELY App

Deploying this specific application entirely for free is a bit tricky because the WhatsApp background service uses Puppeteer (a headless browser). Puppeteer requires at least 1-2GB of RAM to run without crashing, and most free hosting providers (like Render or Railway's free tier) only give you 512MB of RAM and shut your server down after 15 minutes of inactivity.

However, it **is** possible to host this for free using a combination of services, specifically leveraging **Oracle Cloud's Always Free** tier, which is incredibly generous.

Here is the best strategy for 100% free hosting.

---

## 1. Database & Auth: Supabase (Free Tier)

Supabase offers a generous free tier that is perfect for this app.
1. Create a new project on [Supabase](https://supabase.com).
2. Go to **Settings > API** to find your `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY`.
3. Set up the database schema: Go to the SQL Editor in your Supabase dashboard and paste/run the contents of your `supabase/migrations/00000_complete_setup.sql` file.

---

## 2. Frontend & API Routes: Vercel (Free Tier)

Since Vercel created Next.js, their free tier is the absolute best place to host the Next.js part of your app.

1. Push your code to a GitHub repository.
2. Go to [Vercel](https://vercel.com) and click **Add New > Project**.
3. Import your GitHub repository.
4. Add all of your Environment Variables (from your `.env.local` file).
5. Click **Deploy**. Vercel will build and host your web app for free. 
*(Note: Vercel will host your web app, but it cannot run your WhatsApp or Push background services).*

---

## 3. Background Services: Oracle Cloud (Always Free VPS)

To run the WhatsApp and Push services 24/7 for free, we need a VPS. **Oracle Cloud** offers an "Always Free" ARM instance with up to **4 vCPUs and 24GB of RAM**, which is more than enough.

### Step A: Claim your Free Server
1. Sign up for [Oracle Cloud Free Tier](https://www.oracle.com/cloud/free/). *(Note: Registration can sometimes be finicky depending on your region and card).*
2. Go to **Instances** > **Create Instance**.
3. **Image**: Change image to **Ubuntu 22.04 or 24.04**.
4. **Shape**: Click **Change Shape** > **Virtual Machine** > **Ampere (ARM)**. Select `VM.Standard.A1.Flex`. Drag the slider to **1 or 2 OCPUs** and **6GB or 12GB RAM** (The free tier allows up to 4 OCPUs and 24GB RAM total, so this is well within the free limits).
5. **Networking**: Ensure you assign a Public IP.
6. **SSH Keys**: Download the automatically generated SSH keys—you need these to log in!
7. Click **Create**.

### Step B: Connect and Setup
Open your terminal and SSH into your new free server using the key you downloaded:
```bash
ssh -i path/to/your/ssh-key.key ubuntu@YOUR_SERVER_IP
```

Run these commands to install Node.js and PM2:
```bash
sudo apt update && sudo apt upgrade -y
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
# Install PM2
sudo npm install -g pm2
# Install Puppeteer system dependencies
sudo apt install -y libnss3 libatk-bridge2.0-0 libx11-xcb1 libxcb-dri3-0 libdrm2 libgbm1 libasound2 chromium-browser
```
*(Because Oracle uses ARM processors, we install the native `chromium-browser` to ensure WhatsApp web works).*

### Step C: Run the Background Services
1. Clone your GitHub repository to the server:
   ```bash
   git clone https://github.com/YOUR_GITHUB_USERNAME/YOUR_REPO_NAME.git cuely
   cd cuely
   ```
2. Create your `.env.local` file and paste in your Supabase and API credentials:
   ```bash
   nano .env.local
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the services using PM2:
   ```bash
   pm2 start npm --name "cuely-whatsapp" -- run whatsapp
   pm2 start npm --name "cuely-push" -- run push
   pm2 save
   pm2 startup
   ```

> **IMPORTANT - WhatsApp QR Code:**
> You must scan the QR code to link your WhatsApp. View the logs to see the code:
> ```bash
> pm2 logs cuely-whatsapp
> ```
> Scan the QR code printed in the terminal with your phone.

---

### Summary of Free Architecture
*   **Next.js Web App**: Hosted on Vercel (Free forever, scales automatically).
*   **Database**: Hosted on Supabase (Free tier up to 500MB DB size / 50k MAU).
*   **Background Workers**: Hosted on Oracle Cloud Always Free ARM Server (Runs 24/7 without sleeping).
