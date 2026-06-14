# 🌌 Nova Pipeline (Zenith CRM)

> **Next-Generation Sales Management System** designed for high-performance sales teams.
> Transform your sales process from chaotic spreadsheets into a streamlined, AI-assisted revenue engine.

![Nova Pipeline Banner](./public/og-image.png)

**Nova Pipeline** is a state-of-the-art Customer Relationship Management (CRM) platform built to empower sales teams. It combines a beautiful, frictionless user interface with powerful automation, AI capabilities, and enterprise-grade security.

Developed by: **Sorawit Thunthakij**

---

## ✨ Why Nova Pipeline?

Unlike traditional, clunky CRMs, Nova Pipeline is designed with the end-user in mind. We prioritize speed, clarity, and actionable insights.

*   **⚡ Lightning Fast:** Built on React 18 & Vite with optimistic UI updates for zero-latency interactions.
*   **🧠 AI-Powered:** Let Gemini AI analyze your deals, write your follow-up emails, and extract data from PDF contracts.
*   **🔒 Secure by Design:** Row-Level Security (RLS) ensures absolute data privacy across team members.
*   **🇹🇭 Localized for Thailand:** Full Thai language support, PromptPay integration, and PDPA compliance built-in.

---

## 🚀 Core Features

### 1. 🎯 Visual Sales Pipeline
*   **Kanban Board:** Drag-and-drop deals across customizable stages effortlessly.
*   **Smart Indicators:** Deals automatically flag themselves if they are at risk, stale, or overdue for follow-up.
*   **Quick Actions:** Log calls, meetings, and notes without leaving the board.

### 2. 📊 Advanced Analytics & Command Center
*   **Executive Dashboard:** Real-time pulse on monthly revenue, win rates, and team performance.
*   **Forecasting:** AI-assisted revenue projections (Worst Case, Commit, Best Case).
*   **Leaderboard:** Gamified sales tracking to motivate your team.

### 3. 🤖 AI Copilot (Sales Intelligence)
*   **PDF Deal Scanner:** Upload contracts or POs and let AI instantly create structured deals.
*   **Email Generator:** Draft perfectly-toned follow-up emails based on the deal's context.
*   **Deal Strategy:** Ask the AI for advice on how to close a specific high-value account.

### 4. 🔌 Integration Hub
*   **LINE OA & Telegram:** Get real-time push notifications straight to your phone when a new lead arrives or a deal is won.
*   **Custom Webhooks:** Connect Nova Pipeline to Zapier or Make.com to trigger thousands of external workflows.

---

## 💻 Tech Stack

We utilize a modern, scalable architecture to ensure reliability and performance.

| Category | Technology | Description |
| :--- | :--- | :--- |
| **Frontend** | React 18, Vite | For a blazing fast Single Page Application (SPA). |
| **Styling** | Tailwind CSS, Framer Motion | Providing a premium, glassmorphism UI with fluid animations. |
| **State & Fetching**| Zustand, React Query | Robust client-side state management and caching. |
| **Backend & DB** | Supabase (PostgreSQL) | Serverless backend with strict Row-Level Security (RLS). |
| **AI Engine** | Google Gemini API | Powers the natural language and document processing features. |

---

## 🛠️ Getting Started

### Prerequisites
*   Node.js (v18+)
*   A Supabase Account (Free tier works perfectly)
*   Google Gemini API Key (For AI features)

### 1. Clone & Install
```bash
git clone https://github.com/sorawittj-hue/crm-project.git
cd crm-project
npm install
```

### 2. Environment Variables
Create a `.env.local` file in the root directory:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_GEMINI_API_KEY=your-gemini-api-key 
```

### 3. Database Setup
1. Open your Supabase project dashboard.
2. Navigate to the **SQL Editor**.
3. Copy and paste the contents of `supabase_schema_complete.sql`.
4. Run the script. This will provision your tables, RLS policies, and triggers automatically.

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:7777](http://localhost:7777) in your browser.

---

## 🛡️ Enterprise Security & SaaS Readiness

Nova Pipeline isn't just a prototype; it's architected for production:
*   **Data Isolation:** Every row in the database is strictly tied to an `owner_id`. Sales reps cannot see each other's deals unless explicitly permitted.
*   **PDPA/GDPR Compliance:** Features a one-click **CSV Data Export** to fulfill user data portability requests.
*   **Protection:** `vercel.json` applies strict HTTP security headers (X-Frame-Options, X-Content-Type-Options) to prevent clickjacking and XSS.
*   **Paywall & Trials:** Built-in subscription logic supporting 3-day free trials and premium gated features.

---

## 📜 License & Copyright

**Proprietary Software.** All rights reserved.
Developed by **Sorawit Thunthakij**. 
Unauthorized copying, modification, or distribution is strictly prohibited.
