# 🚀 Port UI ใหม่กลับเข้าโปรเจกต์เดิม

## วิธีใช้

### 1. Copy ไฟล์เหล่านี้ไปวางในโปรเจกต์เดิม

```
crm-project/
├── src/
│   ├── index.css                 ← แทนที่ของเดิม
│   ├── styles/
│   │   └── zenith-kawaii.css     ← ไฟล์ใหม่ (สี + component styles)
│   ├── pages/
│   │   ├── CommandCenterPage.jsx ← แทนที่ของเดิม
│   │   ├── PipelinePage.jsx      ← แทนที่ของเดิม
│   │   ├── CustomersPage.jsx     ← แทนที่ของเดิม
│   │   ├── AnalyticsPage.jsx     ← แทนที่ของเดิม
│   │   └── ToolsPage.jsx         ← แทนที่ของเดิม
│   └── components/
│       └── layout/
│           └── AppLayout.jsx     ← แทนที่ของเดิม
```

### 2. ไม่ต้องเปลี่ยน

- `src/App.jsx` — route ยังเหมือนเดิม
- `src/hooks/useDeals.js` — ใช้ hook เดิม
- `src/hooks/useSettings.js` — ใช้ hook เดิม
- `supabase_schema_complete.sql` — ใช้ table เดิม
- `.env` — ใช้ Supabase credential เดิม

### 3. Install dependencies (ถ้ายังไม่มี)

```bash
npm install lucide-react framer-motion recharts
```

### 4. Run

```bash
npm run dev
```

## สิ่งที่เปลี่ยน

✅ UI ใหม่ทั้งหมด — สไตล์พาสเทล Kawaii, ภาษาไทย  
✅ ข้อมูลมาจาก Supabase จริง (ผ่าน `useDeals`, `useCustomers` hooks)  
✅ Drag & drop เปลี่ยน stage → update Supabase ทันที  
✅ Notifications, Search, Tweaks theme 3 สี  
✅ Responsive (desktop + tablet)

## ตารางที่ใช้ใน Supabase

ตาม schema เดิมใน `supabase_schema_complete.sql`:
- `deals` (id, title, company, contact, value, stage, probability, assigned_to, tags, last_activity, created_at)
- `customers` (id, name, contact, tier, lifetime_value, deal_count, assigned_to, last_contact)
- `team_members` (id, name, role, goal, color)
- `app_settings` (monthly_target, currency)

## ถ้าติดปัญหา

1. ตรวจ `.env` ว่ามี `VITE_SUPABASE_URL` และ `VITE_SUPABASE_ANON_KEY`
2. ตรวจ table ใน Supabase ว่ามีครบ (รัน `supabase_schema_complete.sql`)
3. เปิด DevTools console ดู error
