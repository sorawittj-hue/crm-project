# Zenith CRM

**Modern Sales Management System** — built for high-performance sales teams.

Zenith CRM helps you manage your entire sales pipeline, track customer relationships, and close more deals with AI-powered insights.

---

## Features

| Category | Capabilities |
|---|---|
| **Pipeline** | Kanban board, list view, deal filtering, stage management |
| **Customers** | CRM database, health scoring, grade system (A–D), deal history |
| **Command Center** | Daily action plan, revenue forecast, team performance |
| **Analytics** | Monthly revenue trends, win rates, stage conversion |
| **Settings** | Sales targets, team member management, company profile |
| **AI Tools** | PDF deal scanner, AI email generator, strategic analysis |

---

## Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS, Framer Motion
- **Backend**: Supabase (PostgreSQL + Auth + RLS)
- **State**: Zustand + React Query
- **Charts**: Recharts
- **AI**: Google Gemini API

---

## Getting Started

### 1. Clone & Install

```bash
git clone <repository-url>
cd crm-project
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env`:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_KEY=your-supabase-anon-key
VITE_GEMINI_API_KEY=your-gemini-api-key   # optional — for AI features
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

Open [http://localhost:5173](http://localhost:5173)

### 5. Build for Production

```bash
npm run build
```

---

## Deployment

### Vercel

```bash
npm install -g vercel
vercel
```

Add environment variables in Vercel Dashboard → Project Settings → Environment Variables.

### Netlify

```bash
npm run build
# Deploy the dist/ folder
```

---

## Configuration

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

## Security

- **Authentication required** — all CRM data is protected by Supabase RLS
- **Audit log** — customer, deal, and activity mutations are tracked
- **Environment variables** — never commit `.env` to version control

---

## Troubleshooting

**"Failed to load deals"**
→ Check Supabase credentials in `.env` and verify the database schema is complete.

**AI features not working**
→ Verify `VITE_GEMINI_API_KEY` is set. AI features are optional — the app works without them.

**Build errors**
```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

---

## License

Proprietary. All rights reserved.
