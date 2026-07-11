// Showcase Mock Data for Guest/Sandbox Mode
// Rich, realistic Thai B2B sales data designed to make every dashboard metric look impressive

const now = Date.now();
const d = (days) => new Date(now + days * 86400000).toISOString();
const dd = (days) => new Date(now - days * 86400000).toISOString();

// ─── 15 Customers ────────────────────────────────────────────────────────────
export const mockCustomers = [
  { id: 'cust-01', company_name: 'Kasikorn Digital Ventures', contact_name: 'ณัฐพล วงศ์สุวรรณ', position: 'Chief Digital Officer', email: 'natthaphon@kdigital.co.th', phone: '081-234-5678', customer_grade: 'A', status: 'active', health_score: 96, industry: 'FinTech', tags: ['Enterprise', 'High Value'] },
  { id: 'cust-02', company_name: 'Central Retail Corporation', contact_name: 'สุภาพร ชัยวัฒน์', position: 'VP Procurement', email: 'supaporn@central.co.th', phone: '089-876-5432', customer_grade: 'A', status: 'active', health_score: 91, industry: 'Retail', tags: ['Key Account'] },
  { id: 'cust-03', company_name: 'PTTEP Digital Solutions', contact_name: 'วิรัช สมิทธิ์วงษ์', position: 'IT Director', email: 'wirat@pttep.com', phone: '082-345-6789', customer_grade: 'A', status: 'active', health_score: 88, industry: 'Energy', tags: ['Enterprise', 'Government-linked'] },
  { id: 'cust-04', company_name: 'SCG Packaging PCL', contact_name: 'พรทิพย์ นาคะสุวรรณ', position: 'Head of Digital Transformation', email: 'pornthip@scg.co.th', phone: '088-765-4321', customer_grade: 'A', status: 'active', health_score: 85, industry: 'Manufacturing', tags: ['Strategic', 'Renewal'] },
  { id: 'cust-05', company_name: 'Bumrungrad International Hospital', contact_name: 'นพ.กิตติ อริยะมงคล', position: 'CIO', email: 'kitti@bumrungrad.com', phone: '083-456-7890', customer_grade: 'B', status: 'active', health_score: 79, industry: 'Healthcare', tags: ['Mid-Market'] },
  { id: 'cust-06', company_name: 'Bangkok Airways PCL', contact_name: 'ปิยะ ศรีวิลาศ', position: 'Technology Manager', email: 'piya@bangkokair.com', phone: '091-234-5678', customer_grade: 'B', status: 'active', health_score: 74, industry: 'Aviation', tags: ['Partnership'] },
  { id: 'cust-07', company_name: 'Grab Thailand', contact_name: 'อัญชลี ธาดาวิมล', position: 'Enterprise Sales Director', email: 'anchalee@grab.com', phone: '086-543-2109', customer_grade: 'A', status: 'active', health_score: 93, industry: 'Tech/Platform', tags: ['Fast Growing', 'Regional'] },
  { id: 'cust-08', company_name: 'Chiang Mai Silicon Valley Co.', contact_name: 'ทักษิณ โชติปัญญา', position: 'Co-founder & CEO', email: 'thaksin@cmsv.io', phone: '084-321-6789', customer_grade: 'B', status: 'active', health_score: 68, industry: 'Startup', tags: ['Growing', 'Upsell Target'] },
  { id: 'cust-09', company_name: 'Minor Hotels Group', contact_name: 'ลลิตา พงษ์ประภาส', position: 'GM Operations & Technology', email: 'lalita@minorhotels.com', phone: '092-876-5432', customer_grade: 'A', status: 'active', health_score: 87, industry: 'Hospitality', tags: ['Multi-Property', 'Regional'] },
  { id: 'cust-10', company_name: 'Muang Thai Life Assurance', contact_name: 'ศักดิ์ชัย วิเศษสิงห์', position: 'Head of Digital Products', email: 'sakchai@mThai.co.th', phone: '087-654-3210', customer_grade: 'B', status: 'active', health_score: 71, industry: 'Insurance', tags: ['Regulated', 'Long Cycle'] },
  { id: 'cust-11', company_name: 'Big C Supercenter PCL', contact_name: 'กัลยา สมบูรณ์ทรัพย์', position: 'Supply Chain Technology Lead', email: 'kanlaya@bigc.co.th', phone: '098-123-4567', customer_grade: 'C', status: 'active', health_score: 55, industry: 'Retail', tags: ['Churning', 'Needs Attention'] },
  { id: 'cust-12', company_name: 'Sino-Thai Engineering', contact_name: 'วีระพงศ์ ตันติพงษ์', position: 'IT Manager', email: 'weerapong@sino-thai.co.th', phone: '093-456-7890', customer_grade: 'C', status: 'inactive', health_score: 38, industry: 'Construction', tags: ['At Risk', 'Re-engage'] },
  { id: 'cust-13', company_name: 'Line Man Wongnai', contact_name: 'ภัทรา จิรโชติ', position: 'Head of B2B Partnerships', email: 'phatra@lineman.com', phone: '096-789-0123', customer_grade: 'A', status: 'active', health_score: 90, industry: 'FoodTech', tags: ['New', 'High Potential'] },
  { id: 'cust-14', company_name: 'Thai Union Group', contact_name: 'ประสาน เนาวรัตน์', position: 'CTO', email: 'prasan@thaiunion.com', phone: '081-890-1234', customer_grade: 'B', status: 'active', health_score: 76, industry: 'Food & Beverage', tags: ['Global Accounts'] },
  { id: 'cust-15', company_name: 'AIS Business Solutions', contact_name: 'มนัสนันท์ อุดมศักดิ์', position: 'Enterprise Account Director', email: 'manas@ais.th', phone: '089-901-2345', customer_grade: 'A', status: 'active', health_score: 92, industry: 'Telecom', tags: ['Partner', 'Referral Source'] },
];

// ─── 25 Deals ─────────────────────────────────────────────────────────────────
export const mockDeals = [
  // --- WON (show strong track record) ---
  { id: 'deal-01', title: 'Enterprise Data Platform Setup', company_name: 'Kasikorn Digital Ventures', contact_name: 'ณัฐพล วงศ์สุวรรณ', value: 3200000, stage: 'won', expected_close_date: dd(8), actual_close_date: dd(8), probability: 100, customer_id: 'cust-01', owner_id: null },
  { id: 'deal-02', title: 'Omnichannel POS Integration', company_name: 'Central Retail Corporation', contact_name: 'สุภาพร ชัยวัฒน์', value: 4800000, stage: 'won', expected_close_date: dd(22), actual_close_date: dd(22), probability: 100, customer_id: 'cust-02', owner_id: null },
  { id: 'deal-03', title: 'Real-time Analytics Dashboard', company_name: 'Grab Thailand', contact_name: 'อัญชลี ธาดาวิมล', value: 1750000, stage: 'won', expected_close_date: dd(5), actual_close_date: dd(5), probability: 100, customer_id: 'cust-07', owner_id: null },
  { id: 'deal-04', title: 'Multi-Property PMS Migration', company_name: 'Minor Hotels Group', contact_name: 'ลลิตา พงษ์ประภาส', value: 2900000, stage: 'won', expected_close_date: dd(35), actual_close_date: dd(35), probability: 100, customer_id: 'cust-09', owner_id: null },
  { id: 'deal-05', title: 'CRM System Annual License', company_name: 'AIS Business Solutions', contact_name: 'มนัสนันท์ อุดมศักดิ์', value: 890000, stage: 'won', expected_close_date: dd(12), actual_close_date: dd(12), probability: 100, customer_id: 'cust-15', owner_id: null },
  { id: 'deal-06', title: 'Food Safety IoT Platform', company_name: 'Thai Union Group', contact_name: 'ประสาน เนาวรัตน์', value: 1400000, stage: 'won', expected_close_date: dd(18), actual_close_date: dd(18), probability: 100, customer_id: 'cust-14', owner_id: null },

  // --- NEGOTIATION (hot deals, almost there) ---
  { id: 'deal-07', title: 'Upstream Data Management Suite', company_name: 'PTTEP Digital Solutions', contact_name: 'วิรัช สมิทธิ์วงษ์', value: 5500000, stage: 'negotiation', expected_close_date: d(4), probability: 85, is_urgent: true, customer_id: 'cust-03', owner_id: null },
  { id: 'deal-08', title: 'Smart Factory Monitoring System', company_name: 'SCG Packaging PCL', contact_name: 'พรทิพย์ นาคะสุวรรณ', value: 3800000, stage: 'negotiation', expected_close_date: d(6), probability: 80, is_urgent: true, customer_id: 'cust-04', owner_id: null },
  { id: 'deal-09', title: 'Patient Experience Platform', company_name: 'Bumrungrad International Hospital', contact_name: 'นพ.กิตติ อริยะมงคล', value: 2100000, stage: 'negotiation', expected_close_date: d(3), probability: 75, is_urgent: true, customer_id: 'cust-05', owner_id: null },

  // --- PROPOSAL (sent, awaiting decision) ---
  { id: 'deal-10', title: 'Airline Revenue Management AI', company_name: 'Bangkok Airways PCL', contact_name: 'ปิยะ ศรีวิลาศ', value: 1900000, stage: 'proposal', expected_close_date: d(14), probability: 55, customer_id: 'cust-06', owner_id: null },
  { id: 'deal-11', title: 'InsurTech Digital Claims Portal', company_name: 'Muang Thai Life Assurance', contact_name: 'ศักดิ์ชัย วิเศษสิงห์', value: 2700000, stage: 'proposal', expected_close_date: d(21), probability: 50, customer_id: 'cust-10', owner_id: null },
  { id: 'deal-12', title: 'Logistics Visibility Platform', company_name: 'SCG Packaging PCL', contact_name: 'พรทิพย์ นาคะสุวรรณ', value: 920000, stage: 'proposal', expected_close_date: d(18), probability: 60, customer_id: 'cust-04', owner_id: null },
  { id: 'deal-13', title: 'Restaurant Tech Suite (Enterprise)', company_name: 'Line Man Wongnai', contact_name: 'ภัทรา จิรโชติ', value: 1650000, stage: 'proposal', expected_close_date: d(12), probability: 65, customer_id: 'cust-13', owner_id: null },

  // --- CONTACT / PRESENTATION (in progress) ---
  { id: 'deal-14', title: 'Grocery Supply Chain Optimization', company_name: 'Big C Supercenter PCL', contact_name: 'กัลยา สมบูรณ์ทรัพย์', value: 1200000, stage: 'contact', expected_close_date: d(30), probability: 40, customer_id: 'cust-11', owner_id: null },
  { id: 'deal-15', title: 'Digital Transformation Roadmap', company_name: 'Sino-Thai Engineering', contact_name: 'วีระพงศ์ ตันติพงษ์', value: 480000, stage: 'contact', expected_close_date: d(45), probability: 30, customer_id: 'cust-12', owner_id: null },
  { id: 'deal-16', title: 'HR Tech Platform SaaS', company_name: 'Chiang Mai Silicon Valley Co.', contact_name: 'ทักษิณ โชติปัญญา', value: 720000, stage: 'contact', expected_close_date: d(28), probability: 35, customer_id: 'cust-08', owner_id: null },
  { id: 'deal-17', title: 'B2B Marketplace Integration API', company_name: 'Grab Thailand', contact_name: 'อัญชลี ธาดาวิมล', value: 2200000, stage: 'contact', expected_close_date: d(35), probability: 45, customer_id: 'cust-07', owner_id: null },

  // --- LEAD (early stage pipeline fill) ---
  { id: 'deal-18', title: 'Financial Compliance Automation', company_name: 'Kasikorn Digital Ventures', contact_name: 'ณัฐพล วงศ์สุวรรณ', value: 4100000, stage: 'lead', expected_close_date: d(60), probability: 20, customer_id: 'cust-01', owner_id: null },
  { id: 'deal-19', title: 'Carbon Tracking SaaS', company_name: 'PTTEP Digital Solutions', contact_name: 'วิรัช สมิทธิ์วงษ์', value: 1800000, stage: 'lead', expected_close_date: d(75), probability: 15, customer_id: 'cust-03', owner_id: null },
  { id: 'deal-20', title: 'Telemedicine Platform Expansion', company_name: 'Bumrungrad International Hospital', contact_name: 'นพ.กิตติ อริยะมงคล', value: 3500000, stage: 'lead', expected_close_date: d(90), probability: 20, customer_id: 'cust-05', owner_id: null },
  { id: 'deal-21', title: 'Loyalty Platform Relaunch', company_name: 'Central Retail Corporation', contact_name: 'สุภาพร ชัยวัฒน์', value: 2600000, stage: 'lead', expected_close_date: d(55), probability: 25, customer_id: 'cust-02', owner_id: null },
  { id: 'deal-22', title: 'Smart Building IoT', company_name: 'Minor Hotels Group', contact_name: 'ลลิตา พงษ์ประภาส', value: 1300000, stage: 'lead', expected_close_date: d(65), probability: 18, customer_id: 'cust-09', owner_id: null },

  // --- LOST (shows realistic pipeline churn) ---
  { id: 'deal-23', title: 'Legacy ERP Migration (Stalled)', company_name: 'Big C Supercenter PCL', contact_name: 'กัลยา สมบูรณ์ทรัพย์', value: 2200000, stage: 'lost', expected_close_date: dd(15), probability: 0, customer_id: 'cust-11', owner_id: null },
  { id: 'deal-24', title: 'Cloud Migration Q2', company_name: 'Sino-Thai Engineering', contact_name: 'วีระพงศ์ ตันติพงษ์', value: 980000, stage: 'lost', expected_close_date: dd(30), probability: 0, customer_id: 'cust-12', owner_id: null },
  { id: 'deal-25', title: 'Digital Onboarding Portal', company_name: 'Muang Thai Life Assurance', contact_name: 'ศักดิ์ชัย วิเศษสิงห์', value: 650000, stage: 'lost', expected_close_date: dd(20), probability: 0, customer_id: 'cust-10', owner_id: null },
];

// ─── 40 Activities ─────────────────────────────────────────────────────────────
export const mockActivities = [
  // Kasikorn Digital Ventures deals
  { id: 'act-01', type: 'meeting', title: 'Executive Kickoff Meeting', description: 'นัดประชุม C-level ทีม KDigital เพื่อเสนอ roadmap ระยะ 12 เดือน ได้รับ feedback เชิงบวก CDO สนใจ AI analytics module เป็นพิเศษ', deal_id: 'deal-01', created_at: dd(40) },
  { id: 'act-02', type: 'call', title: 'Contract Negotiation Call', description: 'โทรเจรจาเงื่อนไขการชำระเงิน ขอ discount 5% สำหรับการชำระล่วงหน้า ทีม legal อยู่ระหว่างตรวจสอบ MSA', deal_id: 'deal-18', created_at: dd(3) },
  { id: 'act-03', type: 'email', title: 'Q4 Upsell Proposal', description: 'ส่ง proposal สำหรับ Financial Compliance module เพิ่มเติม มูลค่า 4.1M THB รอการตอบรับภายใน 2 สัปดาห์', deal_id: 'deal-18', created_at: dd(1) },

  // Central Retail deals
  { id: 'act-04', type: 'meeting', title: 'Technical Architecture Review', description: 'ประชุมทีม IT + Procurement ทบทวน integration architecture กับ SAP ERP ระบุ 3 จุดที่ต้องแก้ก่อน go-live', deal_id: 'deal-02', created_at: dd(30) },
  { id: 'act-05', type: 'call', title: 'Quarterly Business Review', description: 'QBR กับ VP Procurement — ยอดใช้งานระบบเพิ่ม 34% QoQ ลูกค้าพอใจมาก เปิดโอกาสพูดถึง Loyalty Platform ใหม่', deal_id: 'deal-21', created_at: dd(7) },

  // PTTEP deals
  { id: 'act-06', type: 'meeting', title: 'Security & Compliance Deep-Dive', description: 'นำเสนอ SOC2 Type II cert และ on-premise deployment option ทีม security ผ่านการตรวจสอบเบื้องต้น ผ่านไป legal review', deal_id: 'deal-07', created_at: dd(5) },
  { id: 'act-07', type: 'call', title: 'Pricing Final Discussion', description: 'สรุปโครงสร้างราคา enterprise license 5 ปี ได้รับ verbal approval จาก IT Director รอ CFO sign-off อีก 1 สัปดาห์', deal_id: 'deal-07', created_at: dd(2) },
  { id: 'act-08', type: 'note', title: 'Deal Status: Verbal YES', description: '⚡ URGENT: CFO จะกลับจากต่างประเทศ 4 วันข้างหน้า นัดสรุปสัญญาทันที อย่าปล่อยให้ซื้อเวลา', deal_id: 'deal-07', created_at: dd(1) },

  // SCG Packaging deals
  { id: 'act-09', type: 'meeting', title: 'Factory Site Visit — Rayong', description: 'เข้าเยี่ยมชมโรงงาน Rayong ดู production line จริง ระบุ 12 sensor points ที่จะ integrate กับ monitoring dashboard', deal_id: 'deal-08', created_at: dd(10) },
  { id: 'act-10', type: 'email', title: 'Revised Proposal + ROI Calculator', description: 'ส่ง proposal ฉบับปรับปรุงพร้อม ROI calculator แสดง payback period 18 เดือน ลด downtime คาดการณ์ 22%', deal_id: 'deal-08', created_at: dd(4) },
  { id: 'act-11', type: 'call', title: 'Procurement Alignment Call', description: 'ซิงก์กับทีม procurement SCG — ผ่าน vendor evaluation แล้ว รอ board approval รอบถัดไป (6 วัน)', deal_id: 'deal-08', created_at: dd(1) },

  // Bumrungrad Hospital
  { id: 'act-12', type: 'meeting', title: 'PDPA Compliance Walkthrough', description: 'นำเสนอ data handling ตาม PDPA requirements ทีม legal พอใจ นพ.กิตติ ขอ demo ระบบ patient feedback portal', deal_id: 'deal-09', created_at: dd(6) },
  { id: 'act-13', type: 'meeting', title: 'Live Product Demo — Patient Portal', description: 'Demo 2 ชั่วโมงกับทีม IT + Clinical leads ได้รับ 9/10 score ขอให้เพิ่ม LINE OA integration ก่อนตัดสินใจ', deal_id: 'deal-09', created_at: dd(3) },
  { id: 'act-14', type: 'call', title: 'LINE Integration Feasibility', description: 'ยืนยันกับทีม tech ว่า LINE OA integration พร้อมใน sprint ถัดไป แจ้งลูกค้าแล้ว รอ final decision', deal_id: 'deal-09', created_at: dd(1) },

  // Grab Thailand
  { id: 'act-15', type: 'meeting', title: 'Analytics Platform Kickoff', description: 'ประชุมเริ่มต้นโปรเจกต์ Real-time Analytics — จัดตั้ง joint team 8 คน กำหนด milestone รายเดือน', deal_id: 'deal-03', created_at: dd(55) },
  { id: 'act-16', type: 'meeting', title: 'B2B API Partnership Workshop', description: 'Workshop 1 วันเพื่อออกแบบ API integration สำหรับ merchant onboarding — scope ชัดเจน ราคา 2.2M THB', deal_id: 'deal-17', created_at: dd(8) },
  { id: 'act-17', type: 'email', title: 'MOU Draft Sent', description: 'ส่ง MOU ฉบับแรกสำหรับ B2B marketplace partnership รอ legal review ภายใน 10 วัน', deal_id: 'deal-17', created_at: dd(2) },

  // Bangkok Airways
  { id: 'act-18', type: 'meeting', title: 'Revenue Management System Demo', description: 'นำเสนอ AI pricing engine ให้ Revenue Management team เปรียบเทียบกับ current system พบว่า yield เพิ่มขึ้น 12% ใน simulation', deal_id: 'deal-10', created_at: dd(9) },
  { id: 'act-19', type: 'email', title: 'Pilot Program Proposal', description: 'เสนอ 3-month pilot บน domestic routes ก่อน ไม่มีค่าใช้จ่าย เพื่อพิสูจน์ ROI ก่อนตัดสินใจ enterprise deal', deal_id: 'deal-10', created_at: dd(3) },

  // Minor Hotels
  { id: 'act-20', type: 'meeting', title: 'Multi-Property Architecture Planning', description: 'ประชุม solution architect ออกแบบ unified PMS สำหรับ 55 properties ใน 6 ประเทศ complexity สูง แต่ ROI ชัดเจน', deal_id: 'deal-04', created_at: dd(45) },
  { id: 'act-21', type: 'meeting', title: 'IoT Smart Room Scoping', description: 'เพิ่ม IoT smart building module ใน scope หลังจาก GM ชอบ demo ที่โรงแรม Grand Hyatt ราคา 1.3M เพิ่มเติม', deal_id: 'deal-22', created_at: dd(12) },

  // Muang Thai Life
  { id: 'act-22', type: 'call', title: 'Regulatory Requirement Briefing', description: 'OIC กำหนด deadline ระบบ digital claims ภายใน Q1 ถัดไป — สร้าง urgency สูง ขยายการนำเสนอเป็น 2 module', deal_id: 'deal-11', created_at: dd(5) },
  { id: 'act-23', type: 'meeting', title: 'IT + Compliance Committee Presentation', description: 'นำเสนอต่อคณะกรรมการ 12 คน ได้รับ conditional approval รอ security audit อีกครั้ง', deal_id: 'deal-11', created_at: dd(2) },

  // Line Man Wongnai
  { id: 'act-24', type: 'meeting', title: 'Enterprise Product Roadmap Session', description: 'ประชุม CTO + Product team ออกแบบ feature roadmap ร่วมกัน — สร้าง co-development relationship', deal_id: 'deal-13', created_at: dd(6) },
  { id: 'act-25', type: 'email', title: 'Proof of Concept Delivered', description: 'ส่ง PoC ระบบ Restaurant Analytics ที่ integrate กับ Wongnai data API ผล accuracy สูงกว่า spec 15%', deal_id: 'deal-13', created_at: dd(2) },

  // AIS Business Solutions
  { id: 'act-26', type: 'call', title: 'Contract Renewal + Expansion', description: 'ต่ออายุ CRM license 3 ปีพร้อมขยาย seat จาก 50 เป็น 120 users — deal closed ทาง phone', deal_id: 'deal-05', created_at: dd(13) },

  // Thai Union
  { id: 'act-27', type: 'meeting', title: 'Supply Chain Traceability Demo', description: 'Demo ระบบ QR traceability จากกุ้งถึงชั้นวาง ตอบโจทย์ EU deforestation regulation 2025', deal_id: 'deal-06', created_at: dd(22) },

  // Big C (churning — show recovery effort)
  { id: 'act-28', type: 'call', title: 'Churn Recovery Call', description: 'ลูกค้าบ่นว่า support response ช้า — นัด executive sponsor call สัปดาห์หน้า มี risk ปัด deal ใหม่', deal_id: 'deal-14', created_at: dd(4) },
  { id: 'act-29', type: 'meeting', title: 'Executive Escalation Meeting', description: 'นำ Country Manager ไปพบ Supply Chain Director ด้วยตัวเอง — ผ่านวิกฤต ลูกค้ายังสนใจดำเนินต่อ', deal_id: 'deal-14', created_at: dd(2) },

  // Kasikorn (new deal nurture)
  { id: 'act-30', type: 'email', title: 'RegTech Regulatory Landscape Report', description: 'ส่งรายงานแนวโน้ม RegTech 2026 พร้อม case study ธนาคารในอาเซียนที่ใช้ automation ลด compliance cost', deal_id: 'deal-18', created_at: dd(5) },

  // General activities for pipeline health
  { id: 'act-31', type: 'call', title: 'Monthly Check-in — SCG Logistics', description: 'อัปเดตความคืบหน้า Logistics Visibility Platform — ลูกค้าพอใจ mockup รอ approval ภายในสิ้นเดือน', deal_id: 'deal-12', created_at: dd(3) },
  { id: 'act-32', type: 'note', title: 'Competitor Intel: Oracle Update', description: 'ทีม PTTEP บอกว่า Oracle เสนอราคาต่ำกว่า 15% แต่ implementation timeline นานกว่า 8 เดือน — โอกาสของเรา', deal_id: 'deal-07', created_at: dd(6) },
  { id: 'act-33', type: 'meeting', title: 'Chiang Mai Site Visit', description: 'เยือน startup hub ที่เชียงใหม่ พบ CEO โดยตรง สร้าง relationship ดี ส่ง proposal HR Tech ต่อสัปดาห์หน้า', deal_id: 'deal-16', created_at: dd(9) },
  { id: 'act-34', type: 'email', title: 'Carbon Credit Module Proposal', description: 'ส่ง add-on proposal สำหรับ carbon credit tracking integrate กับ upstream platform 1.8M THB', deal_id: 'deal-19', created_at: dd(2) },
  { id: 'act-35', type: 'call', title: 'Telemedicine Needs Assessment', description: 'ประชุม telehealth team ระบุ 5 use case หลัก video consult, e-prescription, remote monitoring — scope 3.5M THB', deal_id: 'deal-20', created_at: dd(4) },
  { id: 'act-36', type: 'meeting', title: 'Insurance Digital Claims Workshop', description: 'Workshop กับ Claims + IT team ออกแบบ digital claims flow ลด processing time จาก 7 วัน เป็น 4 ชั่วโมง', deal_id: 'deal-25', created_at: dd(35) },
  { id: 'act-37', type: 'call', title: 'Post-Lost Analysis Call', description: 'โทรหา Sino-Thai หลัง lose deal — เหตุผล: budget freeze ชั่วคราว แจ้งว่าจะ revisit Q1 ถัดไป — ติดตาม 90 วัน', deal_id: 'deal-24', created_at: dd(28) },
  { id: 'act-38', type: 'email', title: 'Loyalty Platform Beta Invite', description: 'เชิญ Central Retail เข้าร่วม beta program Loyalty Platform ใหม่ — exclusive 3 เดือนก่อน launch', deal_id: 'deal-21', created_at: dd(1) },
  { id: 'act-39', type: 'meeting', title: 'Smart Building Demo — Bangkok', description: 'Demo ระบบ IoT sensor กับทีม Property Management Minor Hotels ที่ Anantara Bangkok — ประทับใจมาก', deal_id: 'deal-22', created_at: dd(5) },
  { id: 'act-40', type: 'note', title: 'Referral Lead from AIS', description: '💡 AIS แนะนำ TOT PCL มาติดต่อ — อาจเป็น deal ใหม่ 2M THB ให้ติดตามสัปดาห์หน้า', deal_id: 'deal-05', created_at: dd(1) },
];
