// ==========================================
// Mock Data — Zenith CRM
// ==========================================

const TEAM = [
  { id: 'leader',  name: 'สรวิชญ์ ต.',      role: 'Team Lead',       avatar: '🦊', color: '#FFB3D9', goal: 5000000, closed: 3800000 },
  { id: 'mint',    name: 'มินต์ พิชญา',      role: 'Senior Sales',    avatar: '🌱', color: '#B8F2D8', goal: 3500000, closed: 2950000 },
  { id: 'peach',   name: 'พีช ณัฐวดี',        role: 'Sales Executive', avatar: '🍑', color: '#FFD4A8', goal: 2500000, closed: 1680000 },
  { id: 'sky',     name: 'สกาย ธนกฤต',       role: 'Junior Sales',    avatar: '☁️', color: '#BEE4FF', goal: 2000000, closed: 1250000 },
];

const STAGES = [
  { id: 'lead',        label: 'Lead',          icon: '🌸', tint: '#FFE4EC', ink: '#C2185B' },
  { id: 'qualified',   label: 'Qualified',     icon: '💫', tint: '#FFF4D6', ink: '#B8860B' },
  { id: 'proposal',    label: 'Proposal',      icon: '📮', tint: '#E4DCFF', ink: '#6D28D9' },
  { id: 'negotiation', label: 'Negotiation',   icon: '🤝', tint: '#D6ECFF', ink: '#0369A1' },
  { id: 'won',         label: 'Won',           icon: '🎉', tint: '#D4F7E0', ink: '#15803D' },
];

const COMPANIES = [
  'บริษัท ไทยเบฟ จำกัด', 'SCG Group', 'PTT Global', 'กรุงไทยประกันภัย', 'AIS Digital',
  'ธนาคารกสิกรไทย', 'Central Retail', 'CP ALL', 'โรงพยาบาลบำรุงราษฎร์', 'Thai Airways',
  'บริษัท ปูนซิเมนต์ไทย', 'True Corporation', 'Minor International', 'LINE ประเทศไทย',
  'บริษัท บ้านปู จำกัด', 'Grab Thailand', 'Shopee Express', 'Lazada TH',
  'ธนาคารไทยพาณิชย์', 'Bitkub Exchange',
];

const CONTACTS = [
  'คุณสมชาย ใจดี', 'คุณกมลชนก สว่างศรี', 'คุณณัฐพล พัฒนวงศ์', 'คุณปรียา วัฒนกิจ',
  'คุณอนันต์ ตั้งมั่น', 'คุณสุภาพร เจริญสุข', 'คุณธีรวุฒิ ศิริโชค', 'คุณพิมพ์ชนก ทองดี',
  'คุณวิชัย สุขใจ', 'คุณอรุณี บุญมี', 'คุณกิตติพงษ์ ชัยชนะ', 'คุณณัชชา พรพิพัฒน์',
];

const DEAL_TITLES = [
  'ระบบ CRM สำหรับทีมขาย',
  'โซลูชัน Cloud Infrastructure',
  'แพ็กเกจ Security + Backup',
  'ระบบจัดการคลังสินค้า',
  'Dashboard วิเคราะห์ข้อมูล',
  'อัปเกรดเซิร์ฟเวอร์องค์กร',
  'Hybrid Cloud Migration',
  'ระบบ POS รีเทล 20 สาขา',
  'Data Center ศูนย์ใหม่',
  'ยกระดับเครือข่าย Enterprise',
  'แพ็กเกจ Microsoft 365',
  'โซลูชัน Video Conference',
  'ระบบ HR สำหรับ 500 คน',
  'Cybersecurity Audit',
  'ERP สำหรับโรงงาน',
];

const daysAgo = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
};

const pick = (arr, i) => arr[i % arr.length];

const DEALS = [
  // Lead
  { id: 'd1',  title: DEAL_TITLES[0], company: COMPANIES[0], contact: CONTACTS[0], value: 1250000, stage: 'lead',        probability: 15, owner: 'leader', last: daysAgo(2),  tags: ['priority'] },
  { id: 'd2',  title: DEAL_TITLES[1], company: COMPANIES[1], contact: CONTACTS[1], value: 880000,  stage: 'lead',        probability: 10, owner: 'mint',   last: daysAgo(1),  tags: [] },
  { id: 'd3',  title: DEAL_TITLES[2], company: COMPANIES[2], contact: CONTACTS[2], value: 520000,  stage: 'lead',        probability: 20, owner: 'peach',  last: daysAgo(5),  tags: ['new'] },
  { id: 'd4',  title: DEAL_TITLES[3], company: COMPANIES[3], contact: CONTACTS[3], value: 320000,  stage: 'lead',        probability: 15, owner: 'sky',    last: daysAgo(8),  tags: [] },

  // Qualified
  { id: 'd5',  title: DEAL_TITLES[4], company: COMPANIES[4], contact: CONTACTS[4], value: 2100000, stage: 'qualified',   probability: 40, owner: 'leader', last: daysAgo(3),  tags: ['hot'] },
  { id: 'd6',  title: DEAL_TITLES[5], company: COMPANIES[5], contact: CONTACTS[5], value: 1450000, stage: 'qualified',   probability: 35, owner: 'mint',   last: daysAgo(1),  tags: [] },
  { id: 'd7',  title: DEAL_TITLES[6], company: COMPANIES[6], contact: CONTACTS[6], value: 780000,  stage: 'qualified',   probability: 45, owner: 'peach',  last: daysAgo(4),  tags: [] },
  { id: 'd8',  title: DEAL_TITLES[7], company: COMPANIES[7], contact: CONTACTS[7], value: 620000,  stage: 'qualified',   probability: 30, owner: 'sky',    last: daysAgo(9),  tags: [] },

  // Proposal
  { id: 'd9',  title: DEAL_TITLES[8], company: COMPANIES[8], contact: CONTACTS[8], value: 3800000, stage: 'proposal',    probability: 60, owner: 'leader', last: daysAgo(1),  tags: ['hot','priority'] },
  { id: 'd10', title: DEAL_TITLES[9], company: COMPANIES[9], contact: CONTACTS[9], value: 1950000, stage: 'proposal',    probability: 55, owner: 'mint',   last: daysAgo(2),  tags: [] },
  { id: 'd11', title: DEAL_TITLES[10],company: COMPANIES[10],contact: CONTACTS[10],value: 1100000, stage: 'proposal',    probability: 50, owner: 'peach',  last: daysAgo(6),  tags: [] },

  // Negotiation
  { id: 'd12', title: DEAL_TITLES[11],company: COMPANIES[11],contact: CONTACTS[11],value: 2650000, stage: 'negotiation', probability: 75, owner: 'leader', last: daysAgo(1),  tags: ['hot','closing'] },
  { id: 'd13', title: DEAL_TITLES[12],company: COMPANIES[12],contact: CONTACTS[0], value: 1380000, stage: 'negotiation', probability: 70, owner: 'mint',   last: daysAgo(2),  tags: ['closing'] },
  { id: 'd14', title: DEAL_TITLES[13],company: COMPANIES[13],contact: CONTACTS[1], value: 890000,  stage: 'negotiation', probability: 65, owner: 'sky',    last: daysAgo(12), tags: [] },

  // Won
  { id: 'd15', title: DEAL_TITLES[14],company: COMPANIES[14],contact: CONTACTS[2], value: 2200000, stage: 'won',         probability: 100,owner: 'leader', last: daysAgo(3),  tags: [] },
  { id: 'd16', title: DEAL_TITLES[0], company: COMPANIES[15],contact: CONTACTS[3], value: 1600000, stage: 'won',         probability: 100,owner: 'mint',   last: daysAgo(5),  tags: [] },
  { id: 'd17', title: DEAL_TITLES[2], company: COMPANIES[16],contact: CONTACTS[4], value: 950000,  stage: 'won',         probability: 100,owner: 'peach',  last: daysAgo(7),  tags: [] },
  { id: 'd18', title: DEAL_TITLES[4], company: COMPANIES[17],contact: CONTACTS[5], value: 720000,  stage: 'won',         probability: 100,owner: 'sky',    last: daysAgo(10), tags: [] },
];

const CUSTOMERS = [
  { id: 'c1',  name: COMPANIES[0],  contact: CONTACTS[0], tier: 'platinum', ltv: 8500000, deals: 4, owner: 'leader', last: daysAgo(1) },
  { id: 'c2',  name: COMPANIES[1],  contact: CONTACTS[1], tier: 'gold',     ltv: 4200000, deals: 3, owner: 'mint',   last: daysAgo(4) },
  { id: 'c3',  name: COMPANIES[2],  contact: CONTACTS[2], tier: 'gold',     ltv: 3800000, deals: 2, owner: 'peach',  last: daysAgo(6) },
  { id: 'c4',  name: COMPANIES[4],  contact: CONTACTS[4], tier: 'platinum', ltv: 6700000, deals: 5, owner: 'leader', last: daysAgo(2) },
  { id: 'c5',  name: COMPANIES[5],  contact: CONTACTS[5], tier: 'silver',   ltv: 1850000, deals: 2, owner: 'mint',   last: daysAgo(8) },
  { id: 'c6',  name: COMPANIES[6],  contact: CONTACTS[6], tier: 'silver',   ltv: 1420000, deals: 1, owner: 'peach',  last: daysAgo(11) },
  { id: 'c7',  name: COMPANIES[8],  contact: CONTACTS[8], tier: 'platinum', ltv: 12400000,deals: 6, owner: 'leader', last: daysAgo(3) },
  { id: 'c8',  name: COMPANIES[9],  contact: CONTACTS[9], tier: 'gold',     ltv: 2900000, deals: 2, owner: 'mint',   last: daysAgo(5) },
  { id: 'c9',  name: COMPANIES[11], contact: CONTACTS[11],tier: 'gold',     ltv: 3300000, deals: 3, owner: 'peach',  last: daysAgo(7) },
  { id: 'c10', name: COMPANIES[13], contact: CONTACTS[1], tier: 'bronze',   ltv: 680000,  deals: 1, owner: 'sky',    last: daysAgo(14) },
  { id: 'c11', name: COMPANIES[14], contact: CONTACTS[2], tier: 'silver',   ltv: 1580000, deals: 2, owner: 'leader', last: daysAgo(9) },
  { id: 'c12', name: COMPANIES[18], contact: CONTACTS[5], tier: 'gold',     ltv: 3100000, deals: 2, owner: 'mint',   last: daysAgo(4) },
];

const TIER_META = {
  platinum: { label: 'Platinum', color: '#E4DCFF', ink: '#6D28D9', emoji: '💎' },
  gold:     { label: 'Gold',     color: '#FFF4D6', ink: '#B8860B', emoji: '👑' },
  silver:   { label: 'Silver',   color: '#E9EDF2', ink: '#475569', emoji: '⭐' },
  bronze:   { label: 'Bronze',   color: '#FFE8D6', ink: '#9A5B1C', emoji: '🥉' },
};

// Revenue trend (last 6 months) in THB millions
const REVENUE_TREND = [
  { month: 'พ.ย.', value: 4.2, target: 5.0 },
  { month: 'ธ.ค.', value: 5.8, target: 5.0 },
  { month: 'ม.ค.', value: 4.9, target: 5.0 },
  { month: 'ก.พ.', value: 6.3, target: 5.5 },
  { month: 'มี.ค.', value: 7.1, target: 6.0 },
  { month: 'เม.ย.', value: 5.7, target: 6.0 },
];

const ACTIVITY_FEED = [
  { id: 'a1', who: 'มินต์ พิชญา',  what: 'ปิดดีล',      obj: 'Grab Thailand — 1.6M ฿',         when: '2 ชม.ก่อน', kind: 'won',     emoji: '🎉' },
  { id: 'a2', who: 'สรวิชญ์ ต.',    what: 'ส่งข้อเสนอ',   obj: 'โรงพยาบาลบำรุงราษฎร์ — 3.8M ฿',   when: '3 ชม.ก่อน', kind: 'proposal',emoji: '📮' },
  { id: 'a3', who: 'พีช ณัฐวดี',    what: 'บันทึกการโทร', obj: 'CP ALL — นัดประชุม 25 เม.ย.',     when: '5 ชม.ก่อน', kind: 'call',    emoji: '📞' },
  { id: 'a4', who: 'สกาย ธนกฤต',  what: 'เพิ่มลีดใหม่', obj: 'LINE ประเทศไทย',                  when: '6 ชม.ก่อน', kind: 'lead',    emoji: '🌸' },
  { id: 'a5', who: 'สรวิชญ์ ต.',    what: 'นัดประชุม',    obj: 'Minor International — 26 เม.ย.',  when: '8 ชม.ก่อน', kind: 'meeting', emoji: '🤝' },
];

const NOTIFICATIONS = [
  { id: 'n1', kind: 'closing',  title: 'ดีลใกล้ปิด',        body: 'บ้านปู — 2.65M ฿ ต่อรองราคามาแล้ว 5 วัน',     when: '10 นาที',  emoji: '🔥' },
  { id: 'n2', kind: 'stale',    title: 'ดีลเงียบ 12 วัน',    body: 'LINE ประเทศไทย — ยังไม่มีกิจกรรม',             when: '1 ชม.',   emoji: '⏰' },
  { id: 'n3', kind: 'win',      title: 'ปิดดีลสำเร็จ! 🎉',   body: 'มินต์ปิด Grab Thailand — 1.6M ฿',               when: '2 ชม.',   emoji: '🎉' },
  { id: 'n4', kind: 'meeting',  title: 'ประชุมพรุ่งนี้',     body: 'Minor International — 14:00 น.',                when: '3 ชม.',   emoji: '📅' },
  { id: 'n5', kind: 'milestone',title: 'ยอดทะลุ 80%!',       body: 'เดือนนี้ทำได้ 5.7M ฿ จากเป้า 7M ฿',              when: '1 วัน',  emoji: '🚀' },
];

const STRATEGIC_MANDATES = [
  { id: 'm1', priority: 'high',   title: 'ติดตามดีล Negotiation 3 รายการ', subtitle: 'มูลค่ารวม 4.92M ฿ — คาดปิดสัปดาห์นี้',    emoji: '🎯' },
  { id: 'm2', priority: 'medium', title: 'รีวิว Proposal ที่ส่งไปแล้ว',     subtitle: '3 ดีลใน Proposal รอการตอบกลับ',            emoji: '📮' },
  { id: 'm3', priority: 'low',    title: 'ติดต่อ Lead เก่า 4 ราย',         subtitle: 'ยังไม่ได้คุยกันมากกว่า 5 วัน',             emoji: '🌸' },
];

// Export to window
Object.assign(window, {
  TEAM, STAGES, DEALS, CUSTOMERS, TIER_META, REVENUE_TREND,
  ACTIVITY_FEED, NOTIFICATIONS, STRATEGIC_MANDATES,
  COMPANIES, CONTACTS, DEAL_TITLES,
});
