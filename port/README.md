# 🚀 Port UI ใหม่กลับเข้าโปรเจกต์ React/Supabase เดิม

## ขั้นตอน

### 1. ดาวน์โหลดโฟลเดอร์ `port/` จากโปรเจกต์นี้
คลิกปุ่ม "Download" ในแถบด้านบน → เลือกโฟลเดอร์ `port/`

### 2. Copy ไฟล์เข้าโปรเจกต์เดิม

```
crm-project-เดิมของคุณ/
└── src/
    ├── styles/
    │   └── zenith-kawaii.css              ← ใหม่
    ├── components/layout/
    │   └── AppLayout.jsx                  ← แทนของเดิม
    ├── pages/
    │   ├── CommandCenterPage.jsx          ← แทน
    │   ├── PipelinePage.jsx               ← แทน
    │   ├── CustomersPage.jsx              ← แทน
    │   ├── AnalyticsPage.jsx              ← แทน
    │   └── ToolsPage.jsx                  ← แทน
    └── hooks/
        └── useTeam.js                     ← ใหม่ (ถ้ายังไม่มี)
```

### 3. แก้ `src/index.css` ให้ import theme

เปิดไฟล์ `src/index.css` แล้ว **เพิ่มบรรทัดนี้ด้านบน**:

```css
@import './styles/zenith-kawaii.css';

html, body { font-family: var(--zfont); }
body { background: var(--zbg); color: var(--ink-900); }
```

### 4. ตรวจว่ามี dependencies ครบ

```bash
npm install lucide-react recharts @tanstack/react-query
```

(โปรเจกต์เดิมของคุณน่าจะมี `@supabase/supabase-js`, `react-router-dom`, `zustand` ครบแล้ว)

### 5. Run

```bash
npm run dev
```

---

## 🎯 สิ่งที่ UI ใหม่ต้องการจาก Supabase

ถ้าใช้ `supabase_schema_complete.sql` เดิมของคุณ จะต้องมี columns เหล่านี้:

### `deals`
- `id`, `title`, `company`, `contact`, `value`, `stage`, `probability`
- `assigned_to` (FK → team_members.id)
- `tags` (text[]) — ค่าเช่น `['hot']`, `['closing']`
- `last_activity` (timestamp)
- `created_at`

### `customers`
- `id`, `name`, `contact`, `tier` (text: 'platinum'|'gold'|'silver'|'bronze')
- `lifetime_value`, `deal_count`
- `assigned_to`, `last_contact`

### `team_members`
- `id`, `name`, `role`, `avatar` (emoji string), `color` (hex/css)
- `goal`, `closed`

### `app_settings`
- `monthly_target`, `currency`

**ถ้าตารางเดิมไม่ตรง** — บอกผม schema ที่คุณใช้ ผมแก้ hooks ให้ mapping ถูกต้อง

---

## ⚡ Hooks ที่ใช้

UI ใหม่เรียก hooks เหล่านี้ (ถ้าโปรเจกต์เดิมมีอยู่แล้วจะใช้ได้ทันที):

- `useDeals()` — SELECT * FROM deals
- `useUpdateDeal()` — UPDATE deals (ใช้ตอน drag-drop เปลี่ยน stage)
- `useCustomers()` — SELECT * FROM customers
- `useTeam()` — SELECT * FROM team_members *(hook ใหม่)*
- `useSettings()` — SELECT * FROM app_settings
- `useAppStore()` — zustand (sidebar, searchTerm)

---

## 🐛 ถ้าติดปัญหา

เปิด DevTools Console แล้วส่ง screenshot มาให้ผม — บอกได้ทันทีว่าต้องแก้อะไร

พร้อมไปต่อแล้ว 🌸
