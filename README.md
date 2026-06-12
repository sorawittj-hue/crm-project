# Zenith CRM (Nova Pipeline)

**Modern Sales Management System** — Built for high-performance sales teams.
**Developed by:** Sorawit Thunthakij

Zenith CRM helps you manage your entire sales pipeline, track customer relationships, and close more deals with AI-powered insights. This platform has been hardened for production SaaS use.

---

## 🚀 Features

| Category | Capabilities |
|---|---|
| **Pipeline** | Kanban board, list view, smooth drag-and-drop, deal filtering, stage management |
| **Customers** | CRM database, health scoring, grade system (A–D), deal history |
| **Command Center** | Daily action plan, revenue forecast, team performance, hot deals |
| **Analytics** | Monthly revenue trends, win rates, stage conversion, detailed reporting |
| **Settings** | Sales targets, team member management, company profile, automated backups |
| **AI Tools** | PDF deal scanner, AI email generator, strategic analysis |
| **Legal & Compliance** | Terms of Service, Privacy Policy, PDPA-compliant CSV Data Export |

---

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS, Framer Motion
- **Backend**: Supabase (PostgreSQL + Auth + RLS)
- **State Management**: Zustand + React Query
- **Charts**: Recharts
- **AI Integration**: Google Gemini API

---

## 🏁 Getting Started

### 1. Clone & Install

```bash
git clone <repository-url>
cd crm-project
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_GEMINI_API_KEY=your-gemini-api-key   # Optional — for AI features
```

Get your keys from:
- **Supabase**: Project Settings → API
- **Gemini**: [Google AI Studio](https://makersuite.google.com/app/apikey)

### 3. Set Up Database

In your Supabase project, go to **SQL Editor** and run `supabase_schema_complete.sql`.

This creates:
- `deals` — opportunity tracking
- `customers` — contact database
- `activities` — calls, emails, meetings, notes
- `team_members` — sales team configuration
- `app_settings` — targets and company profile
- `notifications` — in-app alerts
- `email_templates` — reusable email templates

### 4. Run Locally

```bash
npm run dev
```

Open [http://localhost:7777](http://localhost:7777)

### 5. Build for Production

```bash
npm run build
```

---

## 🔒 Security & SaaS Readiness

This application has been hardened for production:
- **Authentication Required** — all CRM data is protected by Supabase RLS. Data is strictly isolated by `owner_id`.
- **API Scalability** — API queries implement `limit(2000)` to prevent browser memory crashes on massive datasets while retaining analytics capabilities.
- **PDPA Compliance** — Built-in `Privacy Policy`, `Terms of Service`, and one-click **CSV Data Export** to fulfill the "Right to Portability" for users.
- **Vercel Security Headers** — Configured in `vercel.json` to prevent Clickjacking (X-Frame-Options) and XSS attacks.
- **Audit Logging** — Customer, deal, and activity mutations are automatically tracked via database triggers.

---

## ⚙️ Deployment

### Vercel (Recommended)

The project includes a `vercel.json` configuration for strict security headers and Vite-compatible routing.

```bash
npm install -g vercel
vercel
```

Add your environment variables in Vercel Dashboard → Project Settings → Environment Variables.

---

## 📝 Configuration

### Sales Targets
Go to **Settings → เป้าหมายยอดขาย** to set monthly, leader, and member targets.

### Team Members
Go to **Settings → ทีมงาน** to add/edit/delete sales team members and their individual goals.

### Pipeline Stages
Default stages (in order):

| Stage | Thai | Description |
|---|---|---|
| `lead` | ลูกค้าใหม่ | New lead |
| `contact` | นัดเจอ | In contact |
| `proposal` | เสนอราคา | Proposal sent |
| `negotiation` | กำลังปิด | Closing |
| `won` | ปิดได้ | Deal won |
| `lost` | ปิดไม่ได้ | Deal lost |

---

## 🐛 Troubleshooting

**"Failed to load deals"**
→ Check Supabase credentials in `.env.local` and verify the database schema is complete.

**AI features not working**
→ Verify `VITE_GEMINI_API_KEY` is set. AI features are optional — the app works without them.

**Recharts `width(-1)` Warnings**
→ This has been patched using a custom `SafeResponsiveContainer`. If modifying the codebase, ensure charts are wrapped in this container to prevent dimension warnings during `framer-motion` page transitions.

---

## 📜 License

Proprietary. All rights reserved.
Developed by Sorawit Thunthakij.
